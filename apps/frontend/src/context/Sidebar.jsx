import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSite } from '../context/SiteContext'
import axios from 'axios'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { siteActifId, siteActifNom, changerSite, utilisateur } = useSite()
  const [sites, setSites] = useState([])
  const [showSiteMenu, setShowSiteMenu] = useState(false)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (utilisateur?.role === 'ADMIN') {
      axios.get('/api/stocks/sites', { headers }).then(r => setSites(r.data)).catch(() => {})
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const navItems = [
    {
      section: 'PRINCIPAL',
      items: [
        { icone: '🏠', nom: 'Tableau de bord', path: '/dashboard' },
        { icone: '📋', nom: 'Inventaire', path: '/stocks' },
        { icone: '🧾', nom: 'Ventes', path: '/ventes' },
        { icone: '📦', nom: 'Produits', path: '/produits' },
        { icone: '💳', nom: 'Cartes prépayées', path: '/cartes' },
      ]
    },
    {
      section: 'OPÉRATIONS',
      items: [
        { icone: '🔄', nom: 'Transferts inter-sites', path: '/transferts' },
        { icone: '🔔', nom: 'Alertes', path: '/alertes' },
      ]
    },
    {
      section: 'GESTION',
      items: [
        { icone: '📊', nom: 'Rapports', path: '/rapports' },
        ...(utilisateur?.role === 'ADMIN' ? [{ icone: '👥', nom: 'Utilisateurs', path: '/utilisateurs' }] : [])
      ]
    },
  ]

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoZone}>
        <img src="/logo.png" alt="ONECLICK" style={{ width: '120px', objectFit: 'contain' }}
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
        />
        <div style={{ display:'none', alignItems:'center', gap:'8px' }}>
          <div style={styles.logoFallback}>OC</div>
          <span style={{ color:'white', fontWeight:'700', fontSize:'16px' }}>ONECLICK</span>
        </div>
      </div>

      {/* Sélecteur de site */}
      <div style={styles.siteBox} onClick={() => utilisateur?.role === 'ADMIN' && setShowSiteMenu(!showSiteMenu)}>
        <div style={styles.siteLabel}>SITE ACTIF</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={styles.siteNom}>{siteActifNom}</div>
          {utilisateur?.role === 'ADMIN' && <span style={{ color:'#ff6b00', fontSize:'10px' }}>▼</span>}
        </div>

        {/* Dropdown sites */}
        {showSiteMenu && utilisateur?.role === 'ADMIN' && (
          <div style={styles.siteDropdown}>
            <div style={styles.siteOption} onClick={() => { changerSite(null, 'Tous les sites'); setShowSiteMenu(false) }}>
              🌐 Tous les sites
            </div>
            {sites.map(s => (
              <div key={s.id} style={styles.siteOption} onClick={() => { changerSite(s.id, s.nom); setShowSiteMenu(false) }}>
                📍 {s.nom}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      {navItems.map((groupe, gi) => (
        <div key={gi} style={styles.navSection}>
          <div style={styles.navLabel}>{groupe.section}</div>
          {groupe.items.map((item, i) => {
            const actif = location.pathname === item.path
            return (
              <div key={i}
                style={{ ...styles.navItem, ...(actif ? styles.navItemActif : {}) }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize:'16px' }}>{item.icone}</span>
                <span style={styles.navNom}>{item.nom}</span>
              </div>
            )
          })}
        </div>
      ))}

      {/* Profil + Déconnexion */}
      <div style={styles.profil}>
        <div style={styles.profilAvatar}>
          {utilisateur?.nom?.charAt(0)}{utilisateur?.prenom?.charAt(0)}
        </div>
        <div style={styles.profilInfo}>
          <div style={styles.profilNom}>{utilisateur?.nom} {utilisateur?.prenom}</div>
          <div style={styles.profilRole}>{utilisateur?.role}</div>
        </div>
        <button style={styles.btnLogout} onClick={handleLogout} title="Se déconnecter">
          ⏏
        </button>
      </div>
    </div>
  )
}

const styles = {
  sidebar: { width:'240px', backgroundColor:'#1a1d27', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'24px 0', flexShrink:0, height:'100vh', position:'sticky', top:0, overflowY:'auto' },
  logoZone: { display:'flex', alignItems:'center', justifyContent:'center', padding:'0 20px', marginBottom:'20px' },
  logoFallback: { width:'42px', height:'42px', backgroundColor:'#ff6b00', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'14px' },
  siteBox: { margin:'0 12px 24px', backgroundColor:'#ff6b0022', border:'1px solid #ff6b0044', borderRadius:'8px', padding:'10px 14px', cursor:'pointer', position:'relative' },
  siteLabel: { color:'#ff6b00', fontSize:'10px', fontWeight:'600', letterSpacing:'1px', marginBottom:'4px' },
  siteNom: { color:'white', fontSize:'13px', fontWeight:'600' },
  siteDropdown: { position:'absolute', top:'100%', left:0, right:0, backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', zIndex:1000, marginTop:'4px', overflow:'hidden' },
  siteOption: { padding:'10px 14px', color:'white', fontSize:'13px', cursor:'pointer', transition:'background 0.15s' },
  navSection: { marginBottom:'24px', padding:'0 12px' },
  navLabel: { color:'#8b8fa8', fontSize:'10px', fontWeight:'600', letterSpacing:'1px', marginBottom:'8px', padding:'0 8px' },
  navItem: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', cursor:'pointer', marginBottom:'2px', color:'#8b8fa8', fontSize:'13px', transition:'all 0.15s' },
  navItemActif: { backgroundColor:'#ff6b0022', color:'white' },
  navNom: { flex:1 },
  profil: { marginTop:'auto', padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'10px' },
  profilAvatar: { width:'36px', height:'36px', backgroundColor:'#ff6b00', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'white', flexShrink:0 },
  profilInfo: { flex:1, minWidth:0 },
  profilNom: { color:'white', fontSize:'12px', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  profilRole: { color:'#8b8fa8', fontSize:'11px' },
  btnLogout: { background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
}

export default Sidebar
