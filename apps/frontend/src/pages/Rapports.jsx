import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Rapports() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [ventes, setVentes] = useState([])
  const [stocks, setStocks] = useState([])
  const [transferts, setTransferts] = useState([])
  const [onglet, setOnglet] = useState('apercu')
  const [filtres, setFiltres] = useState({ dateDebut: '', dateFin: '', site: 'tous' })
  const [sites, setSites] = useState([])
  const [message, setMessage] = useState('')

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  const headers = { Authorization: `Bearer ${token}` }
  const isGestionnaire = utilisateur?.role === 'GESTIONNAIRE'

  useEffect(() => {
    fetchAll()
    if (isGestionnaire && utilisateur?.site_id) {
      setFiltres(f => ({ ...f, site: String(utilisateur.site_id) }))
    }
  }, [])

  const fetchAll = async () => {
    try {
      const [ventesRes, stocksRes, transRes, sitesRes] = await Promise.all([
        axios.get('/api/ventes', { headers }),
        axios.get('/api/stocks', { headers }),
        axios.get('/api/transferts', { headers }),
        axios.get('/api/stocks/sites', { headers }),
      ])
      setVentes(ventesRes.data)
      setStocks(stocksRes.data)
      setTransferts(transRes.data)
      setSites(sitesRes.data)

      // Calculer stats
      const totalCA = ventesRes.data.reduce((s, v) => s + (parseFloat(v.montant_total) || 0), 0)
      const totalStock = stocksRes.data.reduce((s, st) => s + (parseInt(st.quantite) || 0), 0)
      setStats({ totalCA, totalVentes: ventesRes.data.length, totalStock, totalTransferts: transRes.data.length })
    } catch (err) { console.error(err) }
  }

  // Filtrage
  const ventesFiltrees = ventes.filter(v => {
    if (isGestionnaire && String(v.site_id) !== String(utilisateur.site_id)) return false
    if (!isGestionnaire && filtres.site !== 'tous' && String(v.site_id) !== String(filtres.site)) return false
    if (filtres.dateDebut && new Date(v.created_at) < new Date(filtres.dateDebut)) return false
    if (filtres.dateFin && new Date(v.created_at) > new Date(filtres.dateFin + 'T23:59:59')) return false
    return true
  })

  const stocksFiltres = stocks.filter(s => {
    if (isGestionnaire) return String(s.site_id) === String(utilisateur.site_id)
    if (filtres.site !== 'tous') return String(s.site_id) === String(filtres.site)
    return true
  })

  const totalCAFiltre = ventesFiltrees.reduce((s, v) => s + (parseFloat(v.montant_total) || 0), 0)
  const totalQteFiltre = ventesFiltrees.reduce((s, v) => s + (parseInt(v.quantite) || 0), 0)

  const imprimer = () => {
    const dateImp = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
    const sitenom = filtres.site === 'tous' ? 'Tous les sites' : sites.find(s => String(s.id) === String(filtres.site))?.nom || ''

    let contenu = ''
    if (onglet === 'apercu' || onglet === 'ventes') {
      contenu += `<h2 style="color:#ff6b00;margin-bottom:12px">Rapport des ventes</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#ff6b00;color:white">
          <th style="padding:8px;text-align:left">N° Reçu</th>
          <th style="padding:8px;text-align:left">Produit</th>
          <th style="padding:8px;text-align:left">Site</th>
          <th style="padding:8px;text-align:left">Qté</th>
          <th style="padding:8px;text-align:left">Total</th>
          <th style="padding:8px;text-align:left">Date</th>
        </tr></thead>
        <tbody>${ventesFiltrees.map((v, i) => `
          <tr style="background:${i%2===0?'#f9f9f9':'white'}">
            <td style="padding:8px">#VNT-${v.id}</td>
            <td style="padding:8px">${v.produits_noms || v.reference || '-'}</td>
            <td style="padding:8px">${v.site_nom || '-'}</td>
            <td style="padding:8px">${v.quantite || 0}</td>
            <td style="padding:8px">${Number(v.montant_total).toLocaleString('fr-FR')} FCFA</td>
            <td style="padding:8px">${new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr style="background:#1a1a2e;color:white;font-weight:bold">
          <td colspan="3" style="padding:8px">TOTAL</td>
          <td style="padding:8px">${totalQteFiltre}</td>
          <td style="padding:8px">${totalCAFiltre.toLocaleString('fr-FR')} FCFA</td>
          <td style="padding:8px"></td>
        </tr></tfoot>
      </table>`
    }

    if (onglet === 'apercu' || onglet === 'inventaire') {
      contenu += `<h2 style="color:#ff6b00;margin-bottom:12px">Inventaire des stocks</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#ff6b00;color:white">
          <th style="padding:8px;text-align:left">Produit</th>
          <th style="padding:8px;text-align:left">SKU</th>
          <th style="padding:8px;text-align:left">Site</th>
          <th style="padding:8px;text-align:left">Quantité</th>
          <th style="padding:8px;text-align:left">Statut</th>
        </tr></thead>
        <tbody>${stocksFiltres.map((s, i) => `
          <tr style="background:${i%2===0?'#f9f9f9':'white'}">
            <td style="padding:8px">${s.produit_nom}</td>
            <td style="padding:8px">${s.sku}</td>
            <td style="padding:8px">${s.site_nom}</td>
            <td style="padding:8px;font-weight:bold;color:${s.quantite <= 5 ? '#ef4444' : '#22c55e'}">${s.quantite}</td>
            <td style="padding:8px">${s.quantite <= 5 ? 'Stock bas' : 'Normal'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Rapport ONECLICK</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#1a1a2e} h1{color:#ff6b00} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px}</style>
    </head><body>
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #ff6b00;padding-bottom:16px;margin-bottom:24px">
      <div>
        <h1 style="margin:0;color:#ff6b00">ONECLICK</h1>
        <p style="margin:0;color:#666">Simplifiez-vous la vie !</p>
      </div>
      <div style="text-align:right;color:#666;font-size:13px">
        <div>Rapport généré le ${dateImp}</div>
        <div>Site: ${sitenom}</div>
        <div>Par: ${utilisateur?.nom} ${utilisateur?.prenom}</div>
      </div>
    </div>
    ${contenu}
    </body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.print()
  }

  const onglets = [
    { id:'apercu', label:'📊 Aperçu' },
    { id:'ventes', label:'🧾 Ventes' },
    { id:'inventaire', label:'📦 Inventaire' },
    { id:'transferts', label:'🔄 Transferts' },
  ]

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
            <h1 style={styles.titre}>Rapports 📊</h1>
            <p style={styles.sousTitre}>Analyse et statistiques ONECLICK</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <button style={styles.btnPrimaire} onClick={imprimer}>🖨️ Imprimer</button>
        </div>
      </div>

      {/* Filtres */}
      <div style={styles.filtresBar}>
        {!isGestionnaire && (
          <select style={styles.selectFiltre} value={filtres.site} onChange={e => setFiltres({...filtres, site: e.target.value})}>
            <option value="tous">Tous les sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        )}
        <input style={styles.dateInput} type="date" value={filtres.dateDebut} onChange={e => setFiltres({...filtres, dateDebut: e.target.value})} />
        <span style={{ color:'#8b8fa8' }}>au</span>
        <input style={styles.dateInput} type="date" value={filtres.dateFin} onChange={e => setFiltres({...filtres, dateFin: e.target.value})} />
        <button style={styles.btnSecondaire} onClick={() => setFiltres({ dateDebut:'', dateFin:'', site: isGestionnaire ? String(utilisateur.site_id) : 'tous' })}>
          🔄 Réinitialiser
        </button>
      </div>

      {/* Stats globales */}
      <div style={styles.statsRow}>
        {[
          { icone:'💰', valeur: totalCAFiltre.toLocaleString('fr-FR') + ' FCFA', label:'CA période', couleur:'#22c55e' },
          { icone:'🧾', valeur: ventesFiltrees.length, label:'Ventes', couleur:'#3b82f6' },
          { icone:'📦', valeur: totalQteFiltre, label:'Unités vendues', couleur:'#ff6b00' },
          { icone:'📋', valeur: stocksFiltres.reduce((s, st) => s + (parseInt(st.quantite)||0), 0).toLocaleString('fr-FR'), label:'Articles en stock', couleur:'#a855f7' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <span style={{ fontSize:'24px' }}>{s.icone}</span>
            <div style={{ fontSize:'18px', fontWeight:'700', color: s.couleur }}>{s.valeur}</div>
            <div style={{ color:'#8b8fa8', fontSize:'12px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={styles.ongletsBar}>
        {onglets.map(o => (
          <button key={o.id} style={{ ...styles.onglet, ...(onglet === o.id ? styles.ongletActif : {}) }} onClick={() => setOnglet(o.id)}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      <div style={styles.content}>

        {/* APERCU */}
        {onglet === 'apercu' && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitre}>Top 5 ventes</h3>
              {ventesFiltrees.slice(0, 5).map((v, i) => (
                <div key={i} style={styles.listItem}>
                  <span style={{ color:'#8b8fa8', fontSize:'12px' }}>#{i+1}</span>
                  <span style={{ flex:1, fontSize:'13px' }}>{v.produits_noms || v.reference}</span>
                  <span style={{ color:'#22c55e', fontWeight:'700', fontSize:'13px' }}>{Number(v.montant_total).toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              {ventesFiltrees.length === 0 && <div style={{ color:'#8b8fa8', fontSize:'13px', textAlign:'center', padding:'20px' }}>Aucune vente</div>}
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitre}>Stock par site</h3>
              {sites.map((s, i) => {
                const total = stocks.filter(st => st.site_id === s.id).reduce((sum, st) => sum + (parseInt(st.quantite)||0), 0)
                const couleurs = ['#ff6b00', '#3b82f6', '#22c55e']
                return (
                  <div key={i} style={styles.listItem}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor: couleurs[i % couleurs.length] }}></div>
                    <span style={{ flex:1, fontSize:'13px' }}>{s.nom}</span>
                    <span style={{ fontWeight:'700', fontSize:'13px' }}>{total.toLocaleString('fr-FR')} articles</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VENTES */}
        {onglet === 'ventes' && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>{['N° REÇU', 'PRODUIT', 'SITE', 'QTÉ', 'TOTAL', 'PAIEMENT', 'CLIENT', 'DATE'].map((h, i) => <th key={i} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ventesFiltrees.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...styles.td, textAlign:'center', color:'#8b8fa8', padding:'40px' }}>Aucune vente sur cette période</td></tr>
                ) : ventesFiltrees.map((v, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><span style={styles.badge}>#VNT-{v.id}</span></td>
                    <td style={styles.td}>{v.produits_noms || v.reference || '-'}</td>
                    <td style={styles.td}>{v.site_nom}</td>
                    <td style={{ ...styles.td, fontWeight:'700' }}>{v.quantite || 0}</td>
                    <td style={{ ...styles.td, color:'#22c55e', fontWeight:'700' }}>{Number(v.montant_total).toLocaleString('fr-FR')} FCFA</td>
                    <td style={styles.td}>{v.mode_paiement || '—'}</td>
                    <td style={{ ...styles.td, color:'#8b8fa8' }}>{v.client || '—'}</td>
                    <td style={{ ...styles.td, color:'#8b8fa8' }}>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVENTAIRE */}
        {onglet === 'inventaire' && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>{['PRODUIT', 'SKU', 'SITE', 'QUANTITÉ', 'SEUIL', 'STATUT'].map((h, i) => <th key={i} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {stocksFiltres.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...styles.td, textAlign:'center', color:'#8b8fa8', padding:'40px' }}>Aucun stock</td></tr>
                ) : stocksFiltres.map((s, i) => {
                  const isAlerte = s.quantite <= (s.seuil_alerte || 5)
                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}>{s.produit_nom}</td>
                      <td style={styles.td}><span style={styles.badge}>{s.sku}</span></td>
                      <td style={styles.td}>{s.site_nom}</td>
                      <td style={{ ...styles.td, fontWeight:'700', color: isAlerte ? '#ef4444' : '#22c55e' }}>{s.quantite}</td>
                      <td style={{ ...styles.td, color:'#8b8fa8' }}>{s.seuil_alerte || 5}</td>
                      <td style={styles.td}>
                        <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', backgroundColor: isAlerte ? '#ef444422' : '#22c55e22', color: isAlerte ? '#ef4444' : '#22c55e' }}>
                          {isAlerte ? '⚠️ Stock bas' : '✅ Normal'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TRANSFERTS */}
        {onglet === 'transferts' && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>{['RÉFÉRENCE', 'DÉPART', 'ARRIVÉE', 'STATUT', 'DATE'].map((h, i) => <th key={i} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {transferts.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...styles.td, textAlign:'center', color:'#8b8fa8', padding:'40px' }}>Aucun transfert</td></tr>
                ) : transferts.map((t, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><span style={styles.badge}>{t.reference}</span></td>
                    <td style={styles.td}>📍 {t.site_depart_nom || t.site_depart_id}</td>
                    <td style={styles.td}>📍 {t.site_arrivee_nom || t.site_arrivee_id}</td>
                    <td style={styles.td}>
                      <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                        backgroundColor: t.statut === 'APPROUVE' ? '#22c55e22' : t.statut === 'EN_ATTENTE' ? '#ff6b0022' : '#ef444422',
                        color: t.statut === 'APPROUVE' ? '#22c55e' : t.statut === 'EN_ATTENTE' ? '#ff6b00' : '#ef4444' }}>
                        {t.statut}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color:'#8b8fa8' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  btnPrimaire: { padding:'10px 20px', backgroundColor:'#ff6b00', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  btnSecondaire: { padding:'8px 14px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'13px' },
  filtresBar: { display:'flex', gap:'12px', alignItems:'center', padding:'12px 24px', backgroundColor:'#13161f', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  selectFiltre: { padding:'8px 12px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px', cursor:'pointer' },
  dateInput: { padding:'8px 12px', backgroundColor:'#1a1d27', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'13px' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', padding:'16px 24px' },
  statCard: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'16px', border:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:'6px' },
  ongletsBar: { display:'flex', gap:'4px', padding:'0 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  onglet: { padding:'10px 20px', backgroundColor:'transparent', border:'none', borderBottom:'2px solid transparent', color:'#8b8fa8', cursor:'pointer', fontSize:'13px', fontFamily:"'Inter', sans-serif" },
  ongletActif: { color:'white', borderBottomColor:'#ff6b00' },
  content: { padding:'16px 24px 24px' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  card: { backgroundColor:'#1a1d27', borderRadius:'12px', padding:'20px', border:'1px solid rgba(255,255,255,0.06)' },
  cardTitre: { fontSize:'14px', fontWeight:'600', marginBottom:'16px', color:'#8b8fa8', textTransform:'uppercase', letterSpacing:'1px' },
  listItem: { display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  tableCard: { backgroundColor:'#1a1d27', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#8b8fa8', letterSpacing:'1px', borderBottom:'1px solid rgba(255,255,255,0.06)', backgroundColor:'#13161f' },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'12px 16px', fontSize:'13px', color:'#d1d5db' },
  badge: { backgroundColor:'#ff6b0022', color:'#ff6b00', padding:'3px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'700' },
}

export default Rapports
