import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getPagePrecedente, getPageSuivante } from '../utils/navigationHelper'
import axios from 'axios'

function Ventes() {
  const navigate = useNavigate()
  const location = useLocation()
  const pagePrec = getPagePrecedente(location.pathname)
  const pageSuiv = getPageSuivante(location.pathname)
  const [ventes, setVentes] = useState([])
  const [sites, setSites] = useState([])
  const [produits, setProduits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [siteFiltre, setSiteFiltre] = useState('tous')
  const [form, setForm] = useState({
    produitId: '', siteId: '', quantite: '',
    prixUnitaire: '', modePaiement: 'MOBILE_MONEY', client: ''
  })

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'

  useEffect(() => {
    fetchVentes()
    fetchSites()
    fetchProduits()
    if (isGestionnaire && utilisateur?.site_id) {
      setSiteFiltre(String(utilisateur.site_id))
      setForm(f => ({ ...f, siteId: String(utilisateur.site_id) }))
    }
  }, [])

  const fetchVentes = async () => {
    try {
      const res = await axios.get('/api/ventes', { headers })
      setVentes(res.data)
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

  const handleProduitChange = (e) => {
    const id = e.target.value
    const produit = produits.find(p => String(p.id) === String(id))
    setForm({ ...form, produitId: id, prixUnitaire: produit?.prix_vente || '' })
  }

  const handleVente = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/ventes', {
        site_id: form.siteId,
        utilisateur_id: utilisateur?.id,
        lignes: [{ produit_id: form.produitId, quantite: parseInt(form.quantite), prix_unitaire: parseFloat(form.prixUnitaire) }],
        client: form.client || null,
        modePaiement: form.modePaiement || null,
      }, { headers })
      setMessage('Vente enregistree avec succes !')
      setShowForm(false)
      setForm({ produitId: '', siteId: isGestionnaire ? String(utilisateur.site_id) : '', quantite: '', prixUnitaire: '', modePaiement: 'MOBILE_MONEY', client: '' })
      fetchVentes()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.error || 'Erreur serveur'))
    }
  }

  const ventesFiltrees = ventes.filter(v => {
    if (isGestionnaire) return v.site_id === utilisateur.site_id || String(v.site_id) === String(utilisateur.site_id)
    if (siteFiltre === 'tous') return true
    return String(v.site_id) === String(siteFiltre)
  })

  const totalCA = ventesFiltrees.reduce((acc, v) => acc + (v.montant_total || 0), 0)
  const totalQte = ventesFiltrees.reduce((acc, v) => acc + (parseInt(v.quantite) || 0), 0)
  const total = parseInt(form.quantite || 0) * parseFloat(form.prixUnitaire || 0)

  const paiementLabel = {
    'MOBILE_MONEY': 'Mobile Money',
    'ESPECES': 'Especes',
    'CARTE_BANCAIRE': 'Carte bancaire',
    'VIREMENT': 'Virement',
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerGauche}>
          <div style={styles.navBtns}>
            <button style={styles.btnNav} onClick={() => navigate(pagePrec.path)}>{'<- '}{pagePrec.nom}</button>
            <button style={styles.btnNav} onClick={() => navigate('/dashboard')}>Accueil</button>
            <button style={styles.btnNav} onClick={() => navigate(pageSuiv.path)}>{pageSuiv.nom}{' ->'}</button>
          </div>
          <div>
            <h1 style={styles.titre}>Ventes</h1>
            <p style={styles.sousTitre}>
              {ventesFiltrees.length} vente(s) - CA : {totalCA.toLocaleString('fr-FR')} FCFA - {totalQte} unites vendues
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
          <button style={styles.btnPrimaire} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : 'Nouvelle vente'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ ...styles.messageBox, borderColor: message.includes('succes') ? '#22c55e44' : '#ef444444', backgroundColor: message.includes('succes') ? '#22c55e11' : '#ef444411', color: message.includes('succes') ? '#22c55e' : '#ef4444' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:'16px' }}>X</button>
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitre}>Nouvelle vente</h3>
          <form onSubmit={handleVente}>
            <div style={styles.formGrid}>
              <div style={styles.champ}>
                <label style={styles.label}>PRODUIT *</label>
                <select style={styles.input} value={form.produitId} onChange={handleProduitChange} required>
                  <option value="">Selectionner un produit</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.sku})</option>)}
                </select>
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>SITE *</label>
                <select style={styles.input} value={form.siteId} onChange={e => setForm({...form, siteId: e.target.value})} required disabled={isGestionnaire}>
                  <option value="">Selectionner un site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>QUANTITE *</label>
                <input style={styles.input} type="number" min="1" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} placeholder="1" required />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>PRIX UNITAIRE (FCFA)</label>
                <input style={styles.input} type="number" value={form.prixUnitaire} onChange={e => setForm({...form, prixUnitaire: e.target.value})} placeholder="0" />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>CLIENT</label>
                <input style={styles.input} value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="Nom du client (optionnel)" />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>MODE DE PAIEMENT</label>
                <select style={styles.input} value={form.modePaiement} onChange={e => setForm({...form, modePaiement: e.target.value})}>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="ESPECES">Especes</option>
                  <option value="CARTE_BANCAIRE">Carte bancaire</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>
            </div>
            {form.quantite && form.prixUnitaire && (
              <div style={styles.totalBox}>
                <span style={{ color:'#8b8fa8', fontSize:'14px' }}>Total de la vente</span>
                <span style={{ fontSize:'24px', fontWeight:'700', color:'#22c55e' }}>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="submit" style={styles.btnPrimaire}>Enregistrer la vente</button>
              <button type="button" style={styles.btnSecondaire} onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.statsRow}>
        {[
          { valeur: ventesFiltrees.length, label:'Ventes', couleur:'#3b82f6' },
          { valeur: totalCA.toLocaleString('fr-FR') + ' FCFA', label:"Chiffre d'affaires", couleur:'#22c55e' },
          { valeur: totalQte, label:'Unites vendues', couleur:'#ff6b00' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ fontSize:'22px', fontWeight:'700', color: s.couleur }}>{s.valeur}</div>
            <div style={{ color:'#8b8fa8', fontSize:'12px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['N RECU', 'PRODUIT', 'SITE', 'QTE', 'PRIX UNIT.', 'TOTAL', 'PAIEMENT', 'CLIENT', 'VENDEUR', 'DATE'].map((h, i) => (
                <th key={i} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ventesFiltrees.length === 0 ? (
              <tr><td colSpan={10} style={{ ...styles.td, textAlign:'center', color:'#8b8fa8', padding:'40px' }}>Aucune vente enregistree</td></tr>
            ) : ventesFiltrees.map((v, i) => (
              <tr key={i} style={styles.tr}>
                <td style={styles.td}><span style={styles.skuBadge}>#VNT-{v.id}</span></td>
                <td style={styles.td}>{v.produits_noms || v.reference || '-'}</td>
                <td style={styles.td}>{v.site_nom}</td>
                <td style={{ ...styles.td, fontWeight:'700' }}>{v.quantite || 0}</td>
                <td style={styles.td}>{(v.prix_unitaire || 0).toLocaleString('fr-FR')}</td>
                <td style={{ ...styles.td, color:'#22c55e', fontWeight:'700' }}>{(v.montant_total || 0).toLocaleString('fr-FR')} FCFA</td>
                <td style={styles.td}>{paiementLabel[v.mode_paiement] || v.mode_paiement || '-'}</td>
                <td style={{ ...styles.td, color:'#8b8fa8' }}>{v.client || '-'}</td>
                <td style={styles.td}>{v.vendeur_nom || 'Admin'}</td>
                <td style={{ ...styles.td, color:'#8b8fa8' }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  page: { padding:'0', backgroundColor:'#0f1117', minHeight:'100vh', color:'white', fontFamily:"'Inter', sans-serif" },
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
  formTitre: { fontSize:'16px', fontWeight:'600', marginBottom:'20px', color:'white' },
  formGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'20px' },
  champ: { display:'flex', flexDirection:'column', gap:'8px' },
  label: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px' },
  input: { padding:'10px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'14px', outline:'none' },
  totalBox: { backgroundColor:'#22c55e11', border:'1px solid #22c55e33', borderRadius:'8px', padding:'16px', marginBottom:'20px', display:'flex', flexDirection:'column', gap:'4px' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', padding:'16px 24px' },
  statCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:'8px' },
  tableCard: { margin:'0 24px 24px', backgroundColor:'#1a1d27', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f', whiteSpace:'nowrap' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 16px', fontSize:'13px', color:'#d1d5db' },
  skuBadge: { backgroundColor:'#ff6b0022', color:'#ff6b00', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700' },
}

export default Ventes
