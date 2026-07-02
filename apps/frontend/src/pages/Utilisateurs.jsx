import { useLocation } from 'react-router-dom'
import { getPagePrecedente, getPageSuivante } from '../utils/navigationHelper'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const couleurs = ['#ff6b00', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']

const getInitiales = (u) => {
  const n = u.nom?.charAt(0) || ''
  const p = u.prenom?.charAt(0) || ''
  return (n + p).toUpperCase()
}

const getRoleBadge = (role) => {
  if (role === 'ADMIN') return { label: 'Administrateur', bg: '#ff6b0022', color: '#ff6b00' }
  if (role === 'GESTIONNAIRE') return { label: 'Gestionnaire', bg: '#3b82f622', color: '#3b82f6' }
  return { label: role, bg: '#ffffff11', color: '#8b8fa8' }
}

function Utilisateurs() {
  const navigate = useNavigate()
  const location = useLocation()
  const pagePrec = getPagePrecedente(location.pathname)
  const pageSuiv = getPageSuivante(location.pathname)
  const [utilisateurs, setUtilisateurs] = useState([])
  const [sites, setSites] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'GESTIONNAIRE', site_id: '' })

  const token = localStorage.getItem('token')
  const moi = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchUtilisateurs = async () => {
    try { const res = await axios.get('/api/utilisateurs', { headers }); setUtilisateurs(res.data) }
    catch (err) { console.error(err) }
  }
  const fetchSites = async () => {
    try { const res = await axios.get('/api/stocks/sites', { headers }); setSites(res.data) }
    catch (err) { console.error(err) }
  }

  useEffect(() => { fetchUtilisateurs(); fetchSites() }, [])

  const openCreate = () => {
    setEditUser(null)
    setForm({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'GESTIONNAIRE', site_id: '' })
    setMessage('')
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ nom: u.nom || '', prenom: u.prenom || '', email: u.email || '', mot_de_passe: '', role: u.role || 'GESTIONNAIRE', site_id: u.site_id || '' })
    setMessage('')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditUser(null); setMessage('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const payload = { ...form }
      if (editUser && !payload.mot_de_passe) delete payload.mot_de_passe
      if (editUser) {
        await axios.put(`/api/utilisateurs/${editUser.id}`, payload, { headers })
        setMessage('OK modifie')
      } else {
        await axios.post('/api/utilisateurs', payload, { headers })
        setMessage('OK cree')
      }
      fetchUtilisateurs()
      setTimeout(closeModal, 1200)
    } catch (err) {
      setMessage('Erreur: ' + (err.response?.data?.error || 'serveur'))
    } finally { setLoading(false) }
  }

  const handleDesactiver = async (id) => {
    if (!confirm('Desactiver ?')) return
    try { await axios.put(`/api/utilisateurs/${id}`, { actif: false }, { headers }); fetchUtilisateurs() }
    catch (err) { console.error(err) }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titre}>Utilisateurs</h1>
          <p style={styles.sousTitre}>Gestion des utilisateurs — {utilisateurs.length} comptes</p>
        </div>
        {moi?.role === 'ADMIN' && (
          <button style={styles.btnPrimaire} onClick={openCreate}>+ Nouvel utilisateur</button>
        )}
      </div>
      <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
        <button style={{ padding:'6px 12px', backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white', fontSize:'12px', cursor:'pointer' }} onClick={() => navigate(pagePrec.path)}>← {pagePrec.nom}</button>
        <button style={{ padding:'6px 12px', backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white', fontSize:'12px', cursor:'pointer' }} onClick={() => navigate('/dashboard')}>🏠</button>
        <button style={{ padding:'6px 12px', backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', color:'white', fontSize:'12px', cursor:'pointer' }} onClick={() => navigate(pageSuiv.path)}>{pageSuiv.nom} →</button>
    </div>
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>{['Utilisateur','Role','Site','Statut','Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {utilisateurs.map((u, i) => {
              const role = getRoleBadge(u.role)
              const couleur = couleurs[i % couleurs.length]
              const isMe = moi?.id === u.id
              return (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ ...styles.avatar, backgroundColor: couleur+'33', color: couleur }}>{getInitiales(u)||'?'}</div>
                      <div>
                        <div style={{ fontWeight:'600', fontSize:'14px' }}>{u.nom} {u.prenom} {isMe && <span style={styles.meBadge}>Vous</span>}</div>
                        <div style={{ color:'#8b8fa8', fontSize:'12px' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}><span style={{ ...styles.roleBadge, backgroundColor:role.bg, color:role.color }}>{role.label}</span></td>
                  <td style={styles.td}><span style={{ color:'#8b8fa8', fontSize:'13px' }}>📍 {u.site_nom||'Tous les sites'}</span></td>
                  <td style={styles.td}><span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', backgroundColor: u.actif!==false?'#22c55e22':'#ef444422', color: u.actif!==false?'#22c55e':'#ef4444' }}>● {u.actif!==false?'Actif':'Inactif'}</span></td>
                  <td style={styles.td}>
                    {moi?.role === 'ADMIN' && (
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button style={styles.btnEdit} onClick={() => openEdit(u)}>✏️ Modifier</button>
                        {!isMe && u.actif!==false && <button style={styles.btnDesac} onClick={() => handleDesactiver(u.id)}>🚫 Desactiver</button>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={e => e.target===e.currentTarget && closeModal()}>
          <div style={styles.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'18px', fontWeight:'700' }}>{editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</h2>
              <button style={{ background:'none', border:'none', color:'#8b8fa8', fontSize:'20px', cursor:'pointer' }} onClick={closeModal}>✕</button>
            </div>
            {message && <div style={{ padding:'12px', borderRadius:'8px', marginBottom:'16px', backgroundColor: message.includes('OK')?'#22c55e22':'#ef444422', color: message.includes('OK')?'#22c55e':'#ef4444', border:'1px solid', borderColor: message.includes('OK')?'#22c55e44':'#ef444444' }}>{message}</div>}
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.champ}><label style={styles.label}>NOM *</label><input style={styles.input} value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} placeholder="Nom" required /></div>
                <div style={styles.champ}><label style={styles.label}>PRENOM</label><input style={styles.input} value={form.prenom} onChange={e => setForm({...form, prenom:e.target.value})} placeholder="Prenom" /></div>
                <div style={{...styles.champ, gridColumn:'1/-1'}}><label style={styles.label}>EMAIL</label><input style={styles.input} type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="email@oneclick.cm" /></div>
                <div style={{...styles.champ, gridColumn:'1/-1'}}><label style={styles.label}>{editUser?'MOT DE PASSE (vide = inchange)':'MOT DE PASSE *'}</label><input style={styles.input} type="password" value={form.mot_de_passe} onChange={e => setForm({...form, mot_de_passe:e.target.value})} placeholder="••••••••" required={!editUser} /></div>
                <div style={styles.champ}><label style={styles.label}>ROLE *</label><select style={styles.input} value={form.role} onChange={e => setForm({...form, role:e.target.value})}><option value="GESTIONNAIRE">Gestionnaire</option><option value="ADMIN">Administrateur</option></select></div>
                <div style={styles.champ}><label style={styles.label}>SITE</label><select style={styles.input} value={form.site_id} onChange={e => setForm({...form, site_id:e.target.value})}><option value="">Tous les sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px' }}>
                <button type="button" style={styles.btnSecondaire} onClick={closeModal}>Annuler</button>
                <button type="submit" style={styles.btnPrimaire} disabled={loading}>{loading?'En cours...':editUser?'Enregistrer':'Creer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding:'32px', backgroundColor:'#0f1117', minHeight:'100vh', color:'white', fontFamily:"'Inter', sans-serif" },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' },
  titre: { fontSize:'24px', fontWeight:'700', marginBottom:'4px' },
  sousTitre: { color:'#8b8fa8', fontSize:'14px' },
  btnPrimaire: { padding:'10px 20px', backgroundColor:'#ff6b00', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  btnSecondaire: { padding:'10px 20px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  tableCard: { backgroundColor:'#1a1d27', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'14px 16px', fontSize:'14px', verticalAlign:'middle' },
  avatar: { width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', flexShrink:0 },
  meBadge: { backgroundColor:'#ff6b0022', color:'#ff6b00', fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'20px' },
  roleBadge: { padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600' },
  btnEdit: { padding:'6px 12px', backgroundColor:'#ffffff11', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  btnDesac: { padding:'6px 12px', backgroundColor:'#ef444411', border:'1px solid #ef444433', color:'#ef4444', borderRadius:'6px', cursor:'pointer', fontSize:'12px' },
  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' },
  modal: { backgroundColor:'#1a1d27', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' },
  champ: { display:'flex', flexDirection:'column', gap:'8px' },
  label: { color:'#8b8fa8', fontSize:'11px', fontWeight:'600', letterSpacing:'1px' },
  input: { padding:'10px 14px', backgroundColor:'#0f1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' },
}

export default Utilisateurs
