import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Produits() {
  const navigate = useNavigate()
  const [produits, setProduits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState('')
  const [editProduit, setEditProduit] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [form, setForm] = useState({
    nom: '', sku: '', description: '',
    type: 'CARTE_VISA', prixAchat: '',
    prixVente: '', seuilAlerte: 5
  })

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isAdmin = utilisateur?.role === 'ADMIN'

  const fetchProduits = async () => {
    try {
      const res = await axios.get('/api/produits', { headers })
      setProduits(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchProduits() }, [])

  const resetForm = () => {
    setForm({ nom: '', sku: '', description: '', type: 'CARTE_VISA', prixAchat: '', prixVente: '', seuilAlerte: 5 })
    setEditProduit(null)
    setShowForm(false)
  }

  const handleEdit = (p) => {
    setEditProduit(p)
    setForm({ nom: p.nom, sku: p.sku, description: p.description || '', type: p.type, prixAchat: p.prix_achat, prixVente: p.prix_vente, seuilAlerte: p.seuil_alerte })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChargement(true)
    try {
      if (editProduit) {
        await axios.put(`/api/produits/${editProduit.id}`, form, { headers })
        setMessage('✅ Produit modifié avec succès !')
      } else {
        await axios.post('/api/produits', form, { headers })
        setMessage('✅ Produit ajouté avec succès !')
      }
      resetForm()
      fetchProduits()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ Erreur: ' + (err.response?.data?.error || 'Erreur serveur'))
    } finally {
      setChargement(false)
    }
  }

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return
    try {
      await axios.delete(`/api/produits/${id}`, { headers })
      setMessage('✅ Produit supprimé')
      fetchProduits()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ Erreur suppression')
    }
  }

  const produitsFiltres = produits.filter(p =>
    p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    p.sku?.toLowerCase().includes(recherche.toLowerCase())
  )

  const typeLabel = {
    'CARTE_VISA': '💳 Carte VISA',
    'LICENCE': '💿 Licence',
    'ANTIVIRUS': '🛡️ Antivirus',
    'AUTRE': '📦 Autre',
  }

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
            <h1 style={styles.titre}>Produits 📦</h1>
            <p style={styles.sousTitre}>{produits.length} produit(s) au catalogue</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <input style={styles.recherche} placeholder="🔍 Rechercher..." value={recherche} onChange={e => setRecherche(e.target.value)} />
          {isAdmin && (
            <button style={styles.btnPrimaire} onClick={() => { resetForm(); setShowForm(!showForm) }}>
              {showForm ? '✕ Annuler' : '+ Nouveau produit'}
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ ...styles.messageBox, borderColor: message.includes('✅') ? '#22c55e44' : '#ef444444', backgroundColor: message.includes('✅') ? '#22c55e11' : '#ef444411', color: message.includes('✅') ? '#22c55e' : '#ef4444' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Formulaire */}
      {showForm && isAdmin && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitre}>{editProduit ? '✏️ Modifier le produit' : '➕ Nouveau produit'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.champ}>
                <label style={styles.label}>NOM *</label>
                <input style={styles.input} value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Carte VISA UBA 25 000" required />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>SKU *</label>
                <input style={styles.input} value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="VISA-UBA-25K" required />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>TYPE</label>
                <select style={styles.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="CARTE_VISA">💳 Carte VISA</option>
                  <option value="LICENCE">💿 Licence</option>
                  <option value="ANTIVIRUS">🛡️ Antivirus</option>
                  <option value="AUTRE">📦 Autre</option>
                </select>
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>PRIX D'ACHAT (FCFA)</label>
                <input style={styles.input} type="number" value={form.prixAchat} onChange={e => setForm({...form, prixAchat: e.target.value})} placeholder="0" />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>PRIX DE VENTE (FCFA) *</label>
                <input style={styles.input} type="number" value={form.prixVente} onChange={e => setForm({...form, prixVente: e.target.value})} placeholder="0" required />
              </div>
              <div style={styles.champ}>
                <label style={styles.label}>SEUIL ALERTE</label>
                <input style={styles.input} type="number" min="0" value={form.seuilAlerte} onChange={e => setForm({...form, seuilAlerte: e.target.value})} placeholder="5" />
              </div>
              <div style={{ ...styles.champ, gridColumn:'1 / -1' }}>
                <label style={styles.label}>DESCRIPTION</label>
                <input style={styles.input} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description du produit..." />
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button type="submit" style={styles.btnPrimaire} disabled={chargement}>
                {chargement ? '⏳ En cours...' : editProduit ? '✅ Enregistrer' : '✅ Ajouter'}
              </button>
              <button type="button" style={styles.btnSecondaire} onClick={resetForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Grille produits */}
      <div style={styles.content}>
        {produitsFiltres.length === 0 ? (
          <div style={styles.vide}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📦</div>
            <div style={{ fontSize:'16px', fontWeight:'600', color:'white' }}>Aucun produit trouvé</div>
          </div>
        ) : (
          <div style={styles.grid}>
            {produitsFiltres.map((p, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.typeBadge}>{typeLabel[p.type] || p.type}</span>
                  <span style={styles.skuBadge}>{p.sku}</span>
                </div>
                <div style={styles.cardNom}>{p.nom}</div>
                {p.description && <div style={styles.cardDesc}>{p.description}</div>}
                <div style={styles.cardPrix}>
                  <div>
                    <div style={{ color:'#8b8fa8', fontSize:'11px' }}>PRIX VENTE</div>
                    <div style={{ color:'#22c55e', fontWeight:'700', fontSize:'16px' }}>{Number(p.prix_vente).toLocaleString('fr-FR')} FCFA</div>
                  </div>
                  <div>
                    <div style={{ color:'#8b8fa8', fontSize:'11px' }}>PRIX ACHAT</div>
                    <div style={{ fontWeight:'600', fontSize:'14px' }}>{Number(p.prix_achat || 0).toLocaleString('fr-FR')} FCFA</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px' }}>
                  <span style={{ color:'#8b8fa8', fontSize:'12px' }}>Seuil alerte: {p.seuil_alerte || 5}</span>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button style={styles.btnEdit} onClick={() => handleEdit(p)}>✏️ Modifier</button>
                      <button style={styles.btnDelete} onClick={() => handleDelete(p.id, p.nom)}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  recherche: { padding:'8px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px', outline:'none', width:'200px' },
  btnPrimaire: { padding:'10px 20px', backgroundColor:'#ff6b00', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  btnSecondaire: { padding:'10px 20px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  messageBox: { margin:'16px 24px', padding:'12px 16px', borderRadius:'8px', border:'1px solid', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  formCard: { margin:'16px 24px', backgroundColor:'#1a1d27', borderRadius:'12px', padding:'24px', border:'1px solid rgba(255,255,255,0.06)' },
  formTitre: { fontSize:'16px', fontWeight:'600', marginBottom:'20px' },
  formGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'20px' },
  champ: { display:'flex', flexDirection:'column', gap:'8px' },
  label: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px' },
  input: { padding:'10px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'14px', outline:'none' },
  content: { padding:'16px 24px 24px' },
  vide: { textAlign:'center', padding:'80px 20px', color:'#8b8fa8' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'16px' },
  card: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  typeBadge: { backgroundColor:'#ff6b0022', color:'#ff6b00', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600' },
  skuBadge: { backgroundColor:'#3b82f622', color:'#3b82f6', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' },
  cardNom: { fontSize:'15px', fontWeight:'700', marginBottom:'6px' },
  cardDesc: { color:'#8b8fa8', fontSize:'12px', marginBottom:'12px' },
  cardPrix: { display:'flex', justifyContent:'space-between', backgroundColor:'#0f1117', borderRadius:'8px', padding:'12px', marginTop:'8px' },
  btnEdit: { padding:'6px 12px', backgroundColor:'#ffffff11', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  btnDelete: { padding:'6px 10px', backgroundColor:'#ef444411', border:'1px solid #ef444433', color:'#ef4444', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
}

export default Produits
