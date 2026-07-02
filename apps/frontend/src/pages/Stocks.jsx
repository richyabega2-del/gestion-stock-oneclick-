import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Stocks() {
  const navigate = useNavigate()
  const [stocks, setStocks] = useState([])
  const [sites, setSites] = useState([])
  const [produits, setProduits] = useState([])
  const [siteFiltre, setSiteFiltre] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ produitId: '', siteId: '', quantite: '', motif: '' })

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'

  useEffect(() => {
    fetchStocks()
    fetchSites()
    fetchProduits()
    if (isGestionnaire && utilisateur?.site_id) {
      setSiteFiltre(String(utilisateur.site_id))
      setForm(f => ({ ...f, siteId: String(utilisateur.site_id) }))
    }
  }, [])

  const fetchStocks = async () => {
    try {
      const res = await axios.get('/api/stocks', { headers })
      setStocks(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchSites = async () => {
    try {
      const res = await axios.get('/api/stocks/sites', { headers })
      setSites(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchProduits = async () => {
    try {
      const res = await axios.get('/api/produits', { headers })
      setProduits(res.data)
    } catch (err) { console.error(err) }
  }

  const handleEntree = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/stocks/entree', form, { headers })
      setMessage('✅ Entrée de stock enregistrée !')
      setShowForm(false)
      setForm({ produitId: '', siteId: isGestionnaire ? String(utilisateur.site_id) : '', quantite: '', motif: '' })
      fetchStocks()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ Erreur: ' + (err.response?.data?.error || 'Erreur serveur'))
    }
  }

  // Filtrage selon le rôle
  const stocksFiltres = stocks.filter(s => {
    if (isGestionnaire) return String(s.site_id) === String(utilisateur.site_id)
    if (siteFiltre === 'tous') return true
    return String(s.site_id) === String(siteFiltre)
  })

  const totalArticles = stocksFiltres.reduce((acc, s) => acc + (parseInt(s.quantite) || 0), 0)
  const alertes = stocksFiltres.filter(s => s.quantite <= (s.seuil_alerte || 5)).length

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
            <h1 style={styles.titre}>Inventaire 📋</h1>
            <p style={styles.sousTitre}>{stocksFiltres.length} produits · {totalArticles.toLocaleString('fr-FR')} articles · {alertes} alertes</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          {!isGestionnaire && (
            <select style={styles.selectFiltre} value={siteFiltre} onChange={e => setSiteFiltre(e.target.value)}>
              <option value="tous">Tous les sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          )}
          <button style={styles.btnPrimaire} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Annuler' : '+ Entrée stock'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ ...styles.messageBox, borderColor: message.includes('✅') ? '#22c55e44' : '#ef444444', backgroundColor: message.includes('✅') ? '#22c55e11' : '#ef444411', color: message.includes('✅') ? '#22c55e' : '#ef4444' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Formulaire entrée stock */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitre}>Entrée de stock</h3>
          <form onSubmit={handleEntree}>
            <div style={styles.formGrid}>
              <div style={styles.champ}>
                <label style={styles.label}>PRODUIT *</label>
                <select style={styles.input} value={form.produitId} onChange={e => setForm({...form, produitId: e.target.value})} required>
                  <option value="">Sélectionner un produit</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.sku})</option>)}
                </select>
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>SITE *</label>
                <select style={styles.input} value={form.siteId} onChange={e => setForm({...form, siteId: e.target.value})} required disabled={isGestionnaire}>
                  <option value="">Sélectionner un site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>QUANTITÉ *</label>
                <input style={styles.input} type="number" min="1" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} placeholder="0" required />
              </div>
              <div style={{ ...styles.champ, gridColumn:'1 / -1' }}>
                <label style={styles.label}>MOTIF</label>
                <input style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} placeholder="Réapprovisionnement, livraison..." />
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="submit" style={styles.btnPrimaire}>✅ Enregistrer</button>
              <button type="button" style={styles.btnSecondaire} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { icone:'📦', valeur: totalArticles.toLocaleString('fr-FR'), label:'Total articles', couleur:'#ff6b00' },
          { icone:'📋', valeur: stocksFiltres.length, label:'Références', couleur:'#3b82f6' },
          { icone:'⚠️', valeur: alertes, label:'Stock bas', couleur:'#ef4444' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <span style={{ fontSize:'24px' }}>{s.icone}</span>
            <div style={{ fontSize:'22px', fontWeight:'700', color: s.couleur }}>{s.valeur}</div>
            <div style={{ color:'#8b8fa8', fontSize:'12px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau stocks */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['PRODUIT', 'SKU', 'SITE', 'QUANTITÉ', 'SEUIL ALERTE', 'STATUT'].map((h, i) => (
                <th key={i} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocksFiltres.length === 0 ? (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign:'center', color:'#8b8fa8', padding:'40px' }}>Aucun stock disponible</td></tr>
            ) : stocksFiltres.map((s, i) => {
              const isAlerte = s.quantite <= (s.seuil_alerte || 5)
              return (
                <tr key={i} style={{ ...styles.tr, ...(isAlerte ? { backgroundColor:'#ef444408' } : {}) }}>
                  <td style={styles.td}><span style={{ fontWeight:'600' }}>{s.produit_nom}</span></td>
                  <td style={styles.td}><span style={styles.skuBadge}>{s.sku}</span></td>
                  <td style={styles.td}>📍 {s.site_nom}</td>
                  <td style={{ ...styles.td, fontWeight:'700', fontSize:'16px', color: isAlerte ? '#ef4444' : '#22c55e' }}>{s.quantite}</td>
                  <td style={{ ...styles.td, color:'#8b8fa8' }}>{s.seuil_alerte || 5}</td>
                  <td style={styles.td}>
                    <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', backgroundColor: isAlerte ? '#ef444422' : '#22c55e22', color: isAlerte ? '#ef4444' : '#22c55e' }}>
                      {isAlerte ? '⚠️ Stock bas' : '✅ Normal'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
  btnPrimaire: { padding:'10px 20px', backgroundColor:'#ff6b00', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  btnSecondaire: { padding:'10px 20px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  messageBox: { margin:'16px 24px', padding:'12px 16px', borderRadius:'8px', border:'1px solid', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  formCard: { margin:'16px 24px', backgroundColor:'#1a1d27', borderRadius:'12px', padding:'24px', border:'1px solid rgba(255,255,255,0.06)' },
  formTitre: { fontSize:'16px', fontWeight:'600', marginBottom:'20px' },
  formGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'20px' },
  champ: { display:'flex', flexDirection:'column', gap:'8px' },
  label: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px' },
  input: { padding:'10px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'14px', outline:'none' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', padding:'16px 24px' },
  statCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:'8px' },
  tableCard: { margin:'0 24px 24px', backgroundColor:'#1a1d27', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 16px', fontSize:'13px', color:'#d1d5db' },
  skuBadge: { backgroundColor:'#3b82f622', color:'#3b82f6', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700' },
}

export default Stocks
