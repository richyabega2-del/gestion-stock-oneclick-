import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import logo from '../assets/logo.png'

function Dashboard() {
  const navigate = useNavigate()
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  // Gestion du site actif
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'
  const [siteActifId, setSiteActifId] = useState(isGestionnaire ? utilisateur?.site_id : null)
  const [siteActifNom, setSiteActifNom] = useState(isGestionnaire ? (utilisateur?.site_nom || 'Mon site') : 'Tous les sites')
  const [sites, setSites] = useState([])
  const [showSiteMenu, setShowSiteMenu] = useState(false)

  // Données réelles
  const [stats, setStats] = useState({ articles: 0, ventes: 0, ca: '0', alertes: 0 })
  const [semaines, setSemaines] = useState([0,0,0,0,0,0,0,0])
  const [stockParSite, setStockParSite] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [siteActifId])

  const fetchSites = async () => {
    try {
      const res = await axios.get('/api/stocks/sites', { headers })
      setSites(res.data)
      // Si gestionnaire, trouver le nom de son site
      if (isGestionnaire && utilisateur?.site_id) {
        const monSite = res.data.find(s => s.id === utilisateur.site_id)
        if (monSite) setSiteActifNom(monSite.nom)
      }
    } catch (err) { console.error(err) }
  }

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const siteParam = siteActifId ? `?site_id=${siteActifId}` : ''

      // Stocks
      const stocksRes = await axios.get('/api/stocks', { headers })
      const stocksFiltres = siteActifId
        ? stocksRes.data.filter(s => s.site_id === siteActifId || s.site_id === parseInt(siteActifId))
        : stocksRes.data
      const totalArticles = stocksFiltres.reduce((s, r) => s + (parseInt(r.quantite) || 0), 0)

      // Ventes
      const ventesRes = await axios.get('/api/ventes', { headers })
      const ventesFiltrees = siteActifId
        ? ventesRes.data.filter(v => v.site_id === siteActifId || v.site_id === parseInt(siteActifId))
        : ventesRes.data
      const maintenant = new Date()
      const ventesMonth = ventesFiltrees.filter(v => {
        const d = new Date(v.created_at || v.date_vente)
        const diffJours = (maintenant - d) / (1000*60*60*24)
            return diffJours <= 30
      })
      const ca = ventesMonth.reduce((s, v) => s + (parseFloat(v.montant_total) || 0), 0)
      const caFormate = ca >= 1000000 ? (ca/1000000).toFixed(1)+'M' : ca >= 1000 ? Math.round(ca/1000)+'K' : ca.toString()

      // Alertes
      const alertesRes = await axios.get('/api/alertes', { headers }).catch(() => ({ data: [] }))
      const alertesFiltrees = siteActifId
        ? alertesRes.data.filter(a => a.site_id === siteActifId || a.site_id === parseInt(siteActifId))
        : alertesRes.data

      setStats({
        articles: totalArticles,
        ventes: ventesMonth.length,
        ca: caFormate,
        alertes: alertesFiltrees.length
      })

      // Graphique semaines
      const data = [0,0,0,0,0,0,0,0]
      ventesFiltrees.forEach(v => {
        const d = new Date(v.created_at || v.date_vente)
        const diffDays = Math.floor((maintenant - d) / (1000*60*60*24))
        const semaine = Math.floor(diffDays / 7)
        if (semaine < 8) data[7 - semaine] += parseFloat(v.montant_total) || 0
      })
      const max = Math.max(...data, 1)
      setSemaines(data.map(v => Math.round((v / max) * 100)))

      // Stock par site
      const sitesRes = await axios.get('/api/stocks/sites', { headers })
      const sitesToShow = siteActifId
        ? sitesRes.data.filter(s => s.id === siteActifId || s.id === parseInt(siteActifId))
        : sitesRes.data
      const couleursParDefaut = ['#ff6b00', '#3b82f6', '#22c55e', '#a855f7']
    const stockSite = sitesToShow.map((site, i) => {
    const total = stocksRes.data
    .filter(s => s.site_id === site.id)
    .reduce((sum, s) => sum + (parseInt(s.quantite) || 0), 0)
  return { nom: site.nom, valeur: total, couleur: site.couleur || couleursParDefaut[i % couleursParDefaut.length] }
 })
      setStockParSite(stockSite)

      // Mouvements récents
      const recent = ventesFiltrees.slice(0, 5).map(v => ({
        type: 'VENTE',
        produit: v.produits_noms || v.reference || '-',
        site: v.site_nom || '-',
        qte: `-${v.quantite || 1}`,
        user: v.vendeur_nom || 'Admin',
        date: new Date(v.created_at || v.date_vente).toLocaleDateString('fr-FR')
      }))
      setMouvements(recent)

    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const changerSite = (id, nom) => {
    if (isGestionnaire) return
    setSiteActifId(id)
    setSiteActifNom(id ? nom : 'Tous les sites')
    setShowSiteMenu(false)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const statsCards = [
    { icone: '📦', valeur: stats.articles.toLocaleString('fr-FR'), label: 'Total articles en stock', variation: 'Mis à jour', couleur: '#ff6b00' },
    { icone: '🧾', valeur: stats.ventes, label: 'Ventes ce mois', variation: 'En temps réel', couleur: '#22c55e' },
    { icone: '💰', valeur: stats.ca + ' FCFA', label: 'CA mensuel (FCFA)', variation: 'Calculé en direct', couleur: '#3b82f6' },
    { icone: '🔔', valeur: stats.alertes, label: 'Alertes stock bas', variation: 'Nécessite action', couleur: '#ef4444' },
  ]

  const navItems = [
    {
      section: 'PRINCIPAL',
      items: [
        { icone: '🏠', nom: 'Tableau de bord', path: '/dashboard', actif: true },
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
        { icone: '🔔', nom: 'Alertes', path: '/alertes', badge: stats.alertes, badgeRouge: true },
      ]
    },
    {
      section: 'GESTION',
      items: [
        { icone: '📊', nom: 'Rapports', path: '/rapports' },
        ...(!isGestionnaire ? [{ icone: '👥', nom: 'Utilisateurs', path: '/utilisateurs' }] : [])
      ]
    },
  ]

  const totalStock = stockParSite.reduce((s, r) => s + r.valeur, 0)

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoZone}>
          <img src={logo} alt="Oneclick" style={styles.logoImg}
            onError={e => { e.target.style.display='none' }}
          />
        </div>

        {/* Sélecteur de site */}
        <div style={styles.siteBox} onClick={() => !isGestionnaire && setShowSiteMenu(!showSiteMenu)}>
          <div style={styles.siteLabel}>SITE ACTIF</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={styles.siteNom}>{siteActifNom}</div>
            {!isGestionnaire && <span style={{ color:'#ff6b00', fontSize:'10px' }}>▼</span>}
          </div>
          {showSiteMenu && !isGestionnaire && (
            <div style={styles.siteDropdown}>
              <div style={styles.siteOption} onClick={e => { e.stopPropagation(); changerSite(null, 'Tous les sites') }}>
                🌐 Tous les sites
              </div>
              {sites.map(s => (
          <div key={s.id} style={styles.siteOption}
        onClick={e => { e.stopPropagation(); changerSite(s.id, s.nom) }}>
        <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', backgroundColor: s.couleur || '#ff6b00', marginRight:'6px' }}></span>
        {s.nom}
  </div>
))}
              
            </div>
          )}
        </div>

        {/* Navigation */}
        {navItems.map((groupe, gi) => (
          <div key={gi} style={styles.navSection}>
            <div style={styles.navLabel}>{groupe.section}</div>
            {groupe.items.map((item, i) => (
              <div key={i}
                style={{ ...styles.navItem, ...(item.actif ? styles.navItemActif : {}) }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize:'16px' }}>{item.icone}</span>
                <span style={styles.navNom}>{item.nom}</span>
                {item.badge > 0 && (
                  <span style={{ ...styles.badge, backgroundColor: item.badgeRouge ? '#ef4444' : '#ff6b00' }}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Profil */}
        <div style={styles.profil}>
          <div style={styles.profilAvatar}>
            {utilisateur?.nom?.charAt(0)}{utilisateur?.prenom?.charAt(0)}
          </div>
          <div style={styles.profilInfo}>
            <div style={styles.profilNom}>{utilisateur?.nom} {utilisateur?.prenom}</div>
            <div style={styles.profilRole}>{utilisateur?.role}</div>
          </div>
          <button style={styles.btnLogout} onClick={handleLogout} title="Déconnexion">⏏</button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={styles.main}>
        {/* Header avec boutons navigation */}
        <div style={styles.header}>
          <h1 style={styles.headerTitre}>Tableau de bord</h1>
          <div style={styles.headerActions}>
            <input style={styles.recherche} placeholder="Rechercher produit, référence..." />
            <button style={styles.btnSecondaire} onClick={() => navigate('/stocks')}>+ Entrée stock</button>
            <button style={styles.btnPrimaire} onClick={() => navigate('/ventes')}>🛒 Nouvelle vente</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#8b8fa8', fontSize:'16px' }}>
            Chargement des données...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={styles.statsGrid}>
              {statsCards.map((s, i) => (
                <div key={i} style={styles.statCard}>
                  <div style={{ ...styles.statIcone, backgroundColor: s.couleur + '22' }}>
                    <span style={{ fontSize: '20px' }}>{s.icone}</span>
                  </div>
                  <div style={styles.statValeur}>{s.valeur}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                  <div style={{ ...styles.statVariation, color: s.couleur }}>↑ {s.variation}</div>
                </div>
              ))}
            </div>

            {/* Graphiques */}
            <div style={styles.graphRow}>
              {/* Ventes par semaine */}
              <div style={styles.graphCard}>
                <div style={styles.graphHeader}>
                  <span style={styles.graphTitre}>Ventes par semaine</span>
                  <span style={styles.graphSub}>— 8 dernières semaines {siteActifNom !== 'Tous les sites' ? `· ${siteActifNom}` : ''}</span>
                </div>
                <div style={styles.barChart}>
                  {semaines.map((val, i) => (
                    <div key={i} style={styles.barCol}>
                      <div style={{
                        ...styles.bar,
                        height: val > 0 ? `${Math.max(val, 4)}%` : '4%',
                        backgroundColor: i === 7 ? '#ff6b00' : '#ff6b0055',
                        opacity: val === 0 ? 0.3 : 1
                      }}></div>
                      <span style={styles.barLabel}>S{i + 1}</span>
                    </div>
                  ))}
                </div>
                {semaines.every(v => v === 0) && (
                  <div style={{ textAlign:'center', color:'#8b8fa8', fontSize:'13px', marginTop:'8px' }}>
                    Aucune vente sur cette période
                  </div>
                )}
              </div>

              {/* Stock par site */}
              <div style={styles.graphCard}>
                <div style={styles.graphHeader}>
                  <span style={styles.graphTitre}>Stock par site</span>
                </div>
                <div style={styles.donutZone}>
                  <div style={styles.donutCercle}>
                    <span style={styles.donutValeur}>{totalStock.toLocaleString('fr-FR')}</span>
                    <span style={styles.donutSub}>articles</span>
                  </div>
                </div>
                <div style={styles.legende}>
                  {stockParSite.map((s, i) => (
                    <div key={i} style={styles.legendeItem}>
                      <div style={{ ...styles.legendePuce, backgroundColor: s.couleur }}></div>
                      <span style={styles.legendeNom}>{s.nom}</span>
                      <span style={styles.legendeVal}>{s.valeur.toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mouvements récents */}
            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <span style={styles.graphTitre}>Mouvements récents</span>
                <button style={styles.voirTout} onClick={() => navigate('/rapports')}>Voir tout</button>
              </div>
              {mouvements.length === 0 ? (
                <div style={{ textAlign:'center', padding:'32px', color:'#8b8fa8' }}>
                  Aucun mouvement récent
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['TYPE', 'PRODUIT', 'SITE', 'QTÉ', 'UTILISATEUR', 'DATE'].map((h, i) => (
                        <th key={i} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mouvements.map((m, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', backgroundColor:'#3b82f622', color:'#3b82f6' }}>{m.type}</span>
                        </td>
                        <td style={styles.td}>{m.produit}</td>
                        <td style={styles.td}>{m.site}</td>
                        <td style={{ ...styles.td, color:'#ef4444' }}>{m.qte}</td>
                        <td style={styles.td}>{m.user}</td>
                        <td style={styles.td}>{m.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { display:'flex', minHeight:'100vh', backgroundColor:'#0f1117', fontFamily:"'Inter', sans-serif", color:'white' },
  sidebar: { width:'240px', backgroundColor:'#1a1d27', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'24px 0', flexShrink:0, height:'100vh', position:'sticky', top:0, overflowY:'auto' },
  logoZone: { display:'flex', alignItems:'center', justifyContent:'center', padding:'0 20px', marginBottom:'20px' },
  logoImg: { width:'120px', objectFit:'contain' },
  siteBox: { margin:'0 12px 24px', backgroundColor:'#ff6b0022', border:'1px solid #ff6b0044', borderRadius:'8px', padding:'10px 14px', cursor:'pointer', position:'relative' },
  siteLabel: { color:'#ff6b00', fontSize:'10px', fontWeight:'600', letterSpacing:'1px', marginBottom:'4px' },
  siteNom: { color:'white', fontSize:'13px', fontWeight:'600' },
  siteDropdown: { position:'absolute', top:'100%', left:0, right:0, backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', zIndex:1000, marginTop:'4px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' },
  siteOption: { padding:'10px 14px', color:'white', fontSize:'13px', cursor:'pointer' },
  navSection: { marginBottom:'24px', padding:'0 12px' },
  navLabel: { color:'#8b8fa8', fontSize:'10px', fontWeight:'600', letterSpacing:'1px', marginBottom:'8px', padding:'0 8px' },
  navItem: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', cursor:'pointer', marginBottom:'2px', color:'#8b8fa8', fontSize:'13px' },
  navItemActif: { backgroundColor:'#ff6b0022', color:'white' },
  navNom: { flex:1 },
  badge: { color:'white', borderRadius:'10px', padding:'2px 7px', fontSize:'10px', fontWeight:'700' },
  profil: { marginTop:'auto', padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'10px' },
  profilAvatar: { width:'36px', height:'36px', backgroundColor:'#ff6b00', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0 },
  profilInfo: { flex:1, minWidth:0 },
  profilNom: { color:'white', fontSize:'12px', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  profilRole: { color:'#8b8fa8', fontSize:'11px' },
  btnLogout: { background:'rgba(255,255,255,0.1)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', flexShrink:0 },
  main: { flex:1, padding:'32px', overflowY:'auto' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' },
  headerTitre: { fontSize:'24px', fontWeight:'700' },
  headerActions: { display:'flex', gap:'12px', alignItems:'center' },
  recherche: { padding:'10px 16px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px', width:'240px', outline:'none' },
  btnSecondaire: { padding:'10px 16px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px', cursor:'pointer' },
  btnPrimaire: { padding:'10px 16px', backgroundColor:'#ff6b00', border:'none', borderRadius:'8px', color:'white', fontSize:'13px', cursor:'pointer', fontWeight:'600' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'24px' },
  statCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)' },
  statIcone: { width:'40px', height:'40px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' },
  statValeur: { fontSize:'28px', fontWeight:'700', marginBottom:'4px' },
  statLabel: { color:'#8b8fa8', fontSize:'12px', marginBottom:'8px' },
  statVariation: { fontSize:'11px', fontWeight:'600' },
  graphRow: { display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'24px' },
  graphCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'24px', border:'1px solid rgba(255,255,255,0.06)' },
  graphHeader: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px' },
  graphTitre: { fontSize:'15px', fontWeight:'600' },
  graphSub: { color:'#8b8fa8', fontSize:'12px' },
  barChart: { display:'flex', alignItems:'flex-end', gap:'8px', height:'120px' },
  barCol: { display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flex:1 },
  bar: { width:'100%', borderRadius:'4px 4px 0 0', transition:'height 0.5s ease' },
  barLabel: { color:'#8b8fa8', fontSize:'10px' },
  donutZone: { display:'flex', justifyContent:'center', marginBottom:'20px' },
  donutCercle: { width:'120px', height:'120px', borderRadius:'50%', border:'12px solid #ff6b00', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  donutValeur: { fontSize:'20px', fontWeight:'700' },
  donutSub: { color:'#8b8fa8', fontSize:'11px' },
  legende: { display:'flex', flexDirection:'column', gap:'10px' },
  legendeItem: { display:'flex', alignItems:'center', gap:'10px' },
  legendePuce: { width:'10px', height:'10px', borderRadius:'50%' },
  legendeNom: { flex:1, fontSize:'13px', color:'#8b8fa8' },
  legendeVal: { fontSize:'13px', fontWeight:'600' },
  tableCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'24px', border:'1px solid rgba(255,255,255,0.06)' },
  tableHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  voirTout: { backgroundColor:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#8b8fa8', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px', textAlign:'left', padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 12px', fontSize:'13px', color:'#d1d5db' },
}

export default Dashboard
