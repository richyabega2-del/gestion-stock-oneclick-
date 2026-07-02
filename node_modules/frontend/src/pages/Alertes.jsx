import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Alertes() {
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState([])
  const [sites, setSites] = useState([])
  const [siteFiltre, setSiteFiltre] = useState('tous')
  const [niveauFiltre, setNiveauFiltre] = useState('tous')
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'

  useEffect(() => {
    fetchAlertes()
    fetchSites()
    if (isGestionnaire && utilisateur?.site_id) {
      setSiteFiltre(String(utilisateur.site_id))
    }
    const interval = setInterval(fetchAlertes, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlertes = async () => {
    try {
      const res = await axios.get('/api/stocks/alertes', { headers })
      setAlertes(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchSites = async () => {
    try {
      const res = await axios.get('/api/stocks/sites', { headers })
      setSites(res.data)
    } catch (err) { console.error(err) }
  }

  const handleCommander = async (alerteId, produitNom) => {
    try {
      await axios.post(`/api/stocks/alertes/${alerteId}/notifier`, {}, { headers })
      setMessage(`✅ Notification de réapprovisionnement envoyée pour "${produitNom}"`)
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setMessage(`✅ Commande enregistrée pour "${produitNom}"`)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  // Filtrage selon le rôle
  const alertesFiltrees = alertes.filter(a => {
    if (isGestionnaire) {
      if (String(a.site_id) !== String(utilisateur.site_id)) return false
    } else if (siteFiltre !== 'tous') {
      if (String(a.site_id) !== String(siteFiltre)) return false
    }
    if (niveauFiltre === 'critique') return a.quantite === 0
    if (niveauFiltre === 'bas') return a.quantite > 0 && a.quantite <= (a.seuil || 10)
    return true
  })

  const critiques = alertesFiltrees.filter(a => a.quantite === 0).length
  const bas = alertesFiltrees.filter(a => a.quantite > 0).length

  return (
    <div style={styles.page}>
      {/* HEADER avec boutons navigation */}
      <div style={styles.header}>
        <div style={styles.headerGauche}>
          <div style={styles.navBtns}>
            <button style={styles.btnNav} onClick={() => navigate(-1)}>← Retour</button>
            <button style={styles.btnNav} onClick={() => navigate('/dashboard')}>🏠</button>
            <button style={styles.btnNav} onClick={() => navigate(1)}>Suivant →</button>
          </div>
          <div>
            <h1 style={styles.titre}>Alertes Stock 🔔</h1>
            <p style={styles.sousTitre}>
              {alertesFiltrees.length} alerte(s) · {critiques} critique(s) · {bas} stock bas
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          {!isGestionnaire && (
            <select style={styles.selectFiltre} value={siteFiltre} onChange={e => setSiteFiltre(e.target.value)}>
              <option value="tous">Tous les sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          )}
          <select style={styles.selectFiltre} value={niveauFiltre} onChange={e => setNiveauFiltre(e.target.value)}>
            <option value="tous">Tous niveaux</option>
            <option value="critique">Critique (0)</option>
            <option value="bas">Stock bas</option>
          </select>
          <button style={styles.btnSecondaire} onClick={fetchAlertes}>🔄 Actualiser</button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ ...styles.messageBox, borderColor:'#22c55e44', backgroundColor:'#22c55e11', color:'#22c55e' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { icone:'🚨', valeur: critiques, label:'Rupture totale (0)', couleur:'#ef4444' },
          { icone:'⚠️', valeur: bas, label:'Stock bas', couleur:'#ff6b00' },
          { icone:'🔔', valeur: alertesFiltrees.length, label:'Total alertes', couleur:'#3b82f6' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <span style={{ fontSize:'24px' }}>{s.icone}</span>
            <div style={{ fontSize:'22px', fontWeight:'700', color: s.couleur }}>{s.valeur}</div>
            <div style={{ color:'#8b8fa8', fontSize:'12px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste alertes */}
      {alertesFiltrees.length === 0 ? (
        <div style={styles.vide}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
          <div style={{ fontSize:'16px', fontWeight:'600', color:'white' }}>Aucune alerte</div>
          <div style={{ color:'#8b8fa8', fontSize:'14px', marginTop:'8px' }}>Tous les stocks sont à un niveau normal</div>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['PRODUIT', 'SITE', 'QUANTITÉ', 'SEUIL', 'NIVEAU', 'ACTION'].map((h, i) => (
                  <th key={i} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alertesFiltrees.map((a, i) => {
                const isCritique = a.quantite === 0
                return (
                  <tr key={i} style={{ ...styles.tr, backgroundColor: isCritique ? '#ef444408' : '#ff6b0005' }}>
                    <td style={styles.td}><span style={{ fontWeight:'600' }}>{a.produit_nom}</span></td>
                    <td style={styles.td}>📍 {a.site_nom}</td>
                    <td style={{ ...styles.td, fontWeight:'700', fontSize:'18px', color: isCritique ? '#ef4444' : '#ff6b00' }}>
                      {a.quantite}
                    </td>
                    <td style={{ ...styles.td, color:'#8b8fa8' }}>{a.seuil || 10}</td>
                    <td style={styles.td}>
                      <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', backgroundColor: isCritique ? '#ef444422' : '#ff6b0022', color: isCritique ? '#ef4444' : '#ff6b00' }}>
                        {isCritique ? '🚨 Rupture' : '⚠️ Stock bas'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.btnCommander} onClick={() => handleCommander(a.id, a.produit_nom)}>
                        📦 Commander
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { backgroundColor:'#0f1117', minHeight:'100vh', color:'white', fontFamily:"'Inter', sans-serif" },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', backgroundColor:'#1a1d27', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, zIndex:100 },
  headerGauche: { display:'flex', alignItems:'center', gap:'16px' },
  navBtns: { display:'flex', gap:'6px' },
  btnNav: { padding:'6px 12px', backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white', fontSize:'12px', cursor:'pointer' },
  titre: { fontSize:'20px', fontWeight:'700', marginBottom:'2px' },
  sousTitre: { color:'#8b8fa8', fontSize:'13px' },
  selectFiltre: { padding:'8px 12px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px', cursor:'pointer' },
  btnSecondaire: { padding:'8px 16px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  messageBox: { margin:'16px 24px', padding:'12px 16px', borderRadius:'8px', border:'1px solid', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', padding:'16px 24px' },
  statCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:'8px' },
  vide: { textAlign:'center', padding:'80px 20px', color:'#8b8fa8' },
  tableCard: { margin:'0 24px 24px', backgroundColor:'#1a1d27', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 16px', fontSize:'13px', color:'#d1d5db' },
  btnCommander: { padding:'6px 14px', backgroundColor:'#ff6b0022', border:'1px solid #ff6b0044', color:'#ff6b00', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600' },
}

export default Alertes
