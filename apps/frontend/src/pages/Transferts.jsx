import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getPagePrecedente, getPageSuivante } from '../utils/navigationHelper'
import axios from 'axios'

function Transferts() {
  const navigate = useNavigate()
  const location = useLocation()
  const pagePrec = getPagePrecedente(location.pathname)
  const pageSuiv = getPageSuivante(location.pathname)

  const [transferts, setTransferts] = useState([])
  const [sites, setSites] = useState([])
  const [produits, setProduits] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [onglet, setOnglet] = useState('en_cours')
  const [message, setMessage] = useState('')
  const [siteSourceId, setSiteSourceId] = useState('')
  const [siteDestId, setSiteDestId] = useState('')
  const [produitId, setProduitId] = useState('')
  const [quantite, setQuantite] = useState('')
  const [motif, setMotif] = useState('')

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'

  useEffect(() => {
    fetchTransferts()
    fetchSites()
    if (isGestionnaire && utilisateur?.site_id) {
      setSiteSourceId(String(utilisateur.site_id))
    }
  }, [])

  useEffect(() => {
    if (siteSourceId) {
      fetchProduitsBySite(siteSourceId)
    } else {
      setProduits([])
    }
    setProduitId('')
  }, [siteSourceId])

  const fetchTransferts = async () => {
    try {
      const res = await axios.get('/api/transferts', { headers })
      setTransferts(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchSites = async () => {
    try {
      const res = await axios.get('/api/stocks/sites', { headers })
      setSites(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchProduitsBySite = async (siteId) => {
    try {
      const res = await axios.get(`/api/stocks/site/${siteId}`, { headers })
      if (Array.isArray(res.data) && res.data.length > 0) {
        setProduits(res.data)
      } else {
        const res2 = await axios.get('/api/produits', { headers })
        setProduits(res2.data || [])
      }
    } catch (err) {
      try {
        const res2 = await axios.get('/api/produits', { headers })
        setProduits(res2.data || [])
      } catch (e) {
        setProduits([])
      }
    }
  }

  const resetForm = () => {
    setSiteSourceId(isGestionnaire ? String(utilisateur.site_id) : '')
    setSiteDestId('')
    setProduitId('')
    setQuantite('')
    setMotif('')
  }

  const handleSoumettre = async () => {
    if (!siteSourceId || !siteDestId || !produitId || !quantite) {
      setMessage('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (siteSourceId === siteDestId) {
      setMessage('Le site source et destination doivent etre differents')
      return
    }
    try {
      const res = await axios.post('/api/transferts', {
        site_depart_id: siteSourceId,
        site_arrivee_id: siteDestId,
        utilisateur_id: utilisateur?.id,
      }, { headers })

      const transfertId = res.data.id
      const produitSelectionne = produits.find(p => String(p.produit_id || p.id) === String(produitId))

      await axios.post(`/api/transferts/${transfertId}/lignes`, {
        produit_id: produitSelectionne?.produit_id || produitId,
        quantite: parseInt(quantite)
      }, { headers })

      setMessage('Transfert soumis avec succes !')
      setShowModal(false)
      resetForm()
      fetchTransferts()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.error || 'Erreur serveur'))
    }
  }

  const handleValider = async (id, statut) => {
    try {
      await axios.put(`/api/transferts/${id}/statut`, { statut }, { headers })
      setMessage(statut === 'APPROUVE' ? 'Transfert approuve' : 'Transfert refuse')
      fetchTransferts()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.error || 'Erreur serveur'))
    }
  }

  const transfertsFiltres = transferts.filter(t => {
    if (isGestionnaire) {
      return String(t.site_depart_id) === String(utilisateur.site_id) ||
             String(t.site_arrivee_id) === String(utilisateur.site_id)
    }
    return true
  })

  const enCours = transfertsFiltres.filter(t => t.statut === 'EN_ATTENTE')
  const termines = transfertsFiltres.filter(t => t.statut !== 'EN_ATTENTE')

  const statutStyle = {
    'EN_ATTENTE': { bg:'#ff6b0022', color:'#ff6b00', label:'En attente' },
    'APPROUVE': { bg:'#22c55e22', color:'#22c55e', label:'Approuve' },
    'REFUSE': { bg:'#ef444422', color:'#ef4444', label:'Refuse' },
    'TERMINE': { bg:'#3b82f622', color:'#3b82f6', label:'Termine' },
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
            <h1 style={styles.titre}>Transferts inter-sites</h1>
            <p style={styles.sousTitre}>{enCours.length} en cours - {termines.length} termine(s)</p>
          </div>
        </div>
        <button style={styles.btnPrimaire} onClick={() => { resetForm(); setShowModal(true) }}>
          + Demander un transfert
        </button>
      </div>

      {message && (
        <div style={{ ...styles.messageBox, borderColor: message.includes('succes') ? '#22c55e44' : '#ef444444', backgroundColor: message.includes('succes') ? '#22c55e11' : '#ef444411', color: message.includes('succes') ? '#22c55e' : '#ef4444' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>X</button>
        </div>
      )}

      <div style={styles.onglets}>
        <button style={{ ...styles.onglet, ...(onglet === 'en_cours' ? styles.ongletActif : {}) }} onClick={() => setOnglet('en_cours')}>
          En cours ({enCours.length})
        </button>
        <button style={{ ...styles.onglet, ...(onglet === 'historique' ? styles.ongletActif : {}) }} onClick={() => setOnglet('historique')}>
          Historique ({termines.length})
        </button>
      </div>

      <div style={styles.content}>
        {(onglet === 'en_cours' ? enCours : termines).length === 0 ? (
          <div style={styles.vide}>
            <div style={{ fontSize:'16px', fontWeight:'600', color:'white' }}>
              {onglet === 'en_cours' ? 'Aucun transfert en cours' : 'Aucun transfert termine'}
            </div>
            <div style={{ color:'#8b8fa8', fontSize:'14px', marginTop:'8px' }}>
              Cliquez sur "Demander un transfert" pour initier un mouvement de stock
            </div>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['REFERENCE', 'SITE DEPART', 'SITE ARRIVEE', 'DATE', 'STATUT', ...(utilisateur?.role === 'ADMIN' ? ['ACTIONS'] : [])].map((h, i) => (
                    <th key={i} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(onglet === 'en_cours' ? enCours : termines).map((t, i) => {
                  const st = statutStyle[t.statut] || { bg:'#ffffff11', color:'#8b8fa8', label: t.statut }
                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><span style={styles.refBadge}>{t.reference}</span></td>
                      <td style={styles.td}>{t.site_depart_nom || t.site_depart_id}</td>
                      <td style={styles.td}>{t.site_arrivee_nom || t.site_arrivee_id}</td>
                      <td style={{ ...styles.td, color:'#8b8fa8' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={styles.td}>
                        <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      {utilisateur?.role === 'ADMIN' && (
                        <td style={styles.td}>
                          {t.statut === 'EN_ATTENTE' && (
                            <div style={{ display:'flex', gap:'8px' }}>
                              <button style={styles.btnApprouver} onClick={() => handleValider(t.id, 'APPROUVE')}>Approuver</button>
                              <button style={styles.btnRefuser} onClick={() => handleValider(t.id, 'REFUSE')}>Refuser</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize:'18px', fontWeight:'700' }}>Demander un transfert</h2>
              <button style={styles.btnClose} onClick={() => setShowModal(false)}>X</button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.champ}>
                <label style={styles.label}>SITE SOURCE *</label>
                <select
                  style={styles.input}
                  value={siteSourceId}
                  onChange={e => setSiteSourceId(e.target.value)}
                  disabled={isGestionnaire}
                >
                  <option value="">Selectionner</option>
                  {sites.map(s => <option key={s.id} value={String(s.id)}>{s.nom}</option>)}
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>SITE DESTINATION *</label>
                <select
                  style={styles.input}
                  value={siteDestId}
                  onChange={e => setSiteDestId(e.target.value)}
                >
                  <option value="">Selectionner</option>
                  {sites.filter(s => String(s.id) !== String(siteSourceId)).map(s => (
                    <option key={s.id} value={String(s.id)}>{s.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>PRODUIT * {produits.length > 0 ? `(${produits.length} disponible(s))` : siteSourceId ? '(chargement...)' : '(choisir un site source)'}</label>
                <select
                  style={styles.input}
                  value={produitId}
                  onChange={e => setProduitId(e.target.value)}
                  disabled={!siteSourceId}
                >
                  <option value="">Selectionner un produit</option>
                  {produits.map((p, idx) => {
                    const pid = p.produit_id !== undefined ? p.produit_id : p.id
                    const pnom = p.produit_nom || p.nom || 'Produit'
                    return (
                      <option key={idx} value={String(pid)}>
                        {pnom}{p.quantite !== undefined ? ` (${p.quantite} en stock)` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>QUANTITE *</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={e => setQuantite(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div style={{ ...styles.champ, gridColumn:'1 / -1' }}>
                <label style={styles.label}>MOTIF</label>
                <input
                  style={styles.input}
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  placeholder="Raison du transfert..."
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.btnSecondaire} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={styles.btnPrimaire} onClick={handleSoumettre}>Soumettre</button>
            </div>
          </div>
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
  btnPrimaire: { padding:'10px 20px', backgroundColor:'#ff6b00', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  btnSecondaire: { padding:'10px 20px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  messageBox: { margin:'16px 24px', padding:'12px 16px', borderRadius:'8px', border:'1px solid', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  onglets: { display:'flex', gap:'4px', padding:'16px 24px 0' },
  onglet: { padding:'10px 20px', backgroundColor:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px 8px 0 0', color:'#8b8fa8', cursor:'pointer', fontSize:'13px' },
  ongletActif: { backgroundColor:'#1a1d27', color:'white', borderBottomColor:'#1a1d27' },
  content: { padding:'0 24px 24px' },
  vide: { textAlign:'center', padding:'80px 20px', color:'#8b8fa8' },
  tableCard: { backgroundColor:'#1a1d27', borderRadius:'0 8px 8px 8px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 16px', fontSize:'13px', color:'#d1d5db' },
  refBadge: { backgroundColor:'#ff6b0022', color:'#ff6b00', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700' },
  btnApprouver: { padding:'6px 12px', backgroundColor:'#22c55e22', border:'1px solid #22c55e44', color:'#22c55e', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  btnRefuser: { padding:'6px 12px', backgroundColor:'#ef444422', border:'1px solid #ef444444', color:'#ef4444', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' },
  modal: { backgroundColor:'#1a1d27', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'560px', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' },
  btnClose: { background:'none', border:'none', color:'#8b8fa8', fontSize:'20px', cursor:'pointer' },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' },
  champ: { display:'flex', flexDirection:'column', gap:'8px' },
  label: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px' },
  input: { padding:'10px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:'12px' },
}

export default Transferts
