import { useState, useEffect } from 'react'
import axios from 'axios'

function CartesPrepayees() {
  const [cartes, setCartes] = useState([])
  const [sites, setSites] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editCarte, setEditCarte] = useState(null)
  const [message, setMessage] = useState('')
  const [onglet, setOnglet] = useState('toutes') // toutes | disponibles | vendues | expirees
  const [searchTerm, setSearchTerm] = useState('')
  const [filtreBank, setFiltreBank] = useState('tous')
  const [showPin, setShowPin] = useState({})
  const [form, setForm] = useState({
    numeroCarte: '',
    codePIN: '',
    montant: '',
    banque: 'UBA',
    dateExpiration: '',
    numeroLot: '',
    siteId: '',
    statut: 'DISPONIBLE',
    notes: ''
  })

  const token = localStorage.getItem('token')
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur'))
  const headers = { Authorization: `Bearer ${token}` }

  const fetchCartes = async () => {
    try {
      const res = await axios.get('/api/cartes', { headers })
      setCartes(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSites = async () => {
    try {
      const res = await axios.get('/api/stocks/sites', { headers })
      setSites(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchCartes()
    fetchSites()
  }, [])

  const resetForm = () => {
    setForm({
      numeroCarte: '', codePIN: '', montant: '', banque: 'UBA',
      dateExpiration: '', numeroLot: '', siteId: '', statut: 'DISPONIBLE', notes: ''
    })
    setEditCarte(null)
    setShowForm(false)
  }

  const handleEdit = (carte) => {
    setEditCarte(carte)
    setForm({
      numeroCarte: carte.numero_carte || '',
      codePIN: carte.code_pin || '',
      montant: carte.montant || '',
      banque: carte.banque || 'UBA',
      dateExpiration: carte.date_expiration ? carte.date_expiration.split('T')[0] : '',
      numeroLot: carte.numero_lot || '',
      siteId: carte.site_id || '',
      statut: carte.statut || 'DISPONIBLE',
      notes: carte.notes || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editCarte) {
        await axios.put(`/api/cartes/${editCarte.id}`, form, { headers })
        setMessage('✅ Carte modifiée avec succès !')
      } else {
        await axios.post('/api/cartes', form, { headers })
        setMessage('✅ Carte enregistrée avec succès !')
      }
      resetForm()
      fetchCartes()
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Erreur lors de l\'enregistrement'))
    }
  }

  const handleSupprimer = async (id) => {
    if (!window.confirm('Confirmer la suppression de cette carte ?')) return
    try {
      await axios.delete(`/api/cartes/${id}`, { headers })
      setMessage('✅ Carte supprimée.')
      fetchCartes()
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Erreur'))
    }
  }

  const handleChangerStatut = async (id, statut) => {
    try {
      await axios.put(`/api/cartes/${id}/statut`, { statut }, { headers })
      setMessage(`✅ Statut mis à jour : ${statut}`)
      fetchCartes()
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Erreur'))
    }
  }

  const togglePin = (id) => {
    setShowPin(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filtres
  const cartesFiltrees = cartes
    .filter(c => onglet === 'toutes'      ? true :
                 onglet === 'disponibles' ? c.statut === 'DISPONIBLE' :
                 onglet === 'vendues'     ? c.statut === 'VENDUE' :
                 onglet === 'expirees'    ? c.statut === 'EXPIREE' : true)
    .filter(c => filtreBank === 'tous' || c.banque === filtreBank)
    .filter(c => {
      if (!searchTerm) return true
      return (
        c.numero_carte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numero_lot?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.banque?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })

  // Stats
  const disponibles = cartes.filter(c => c.statut === 'DISPONIBLE').length
  const vendues     = cartes.filter(c => c.statut === 'VENDUE').length
  const expirees    = cartes.filter(c => c.statut === 'EXPIREE').length
  const valeurStock = cartes.filter(c => c.statut === 'DISPONIBLE').reduce((a, c) => a + (parseInt(c.montant) || 0), 0)

  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'DISPONIBLE': return { bg: '#22c55e22', color: '#22c55e', label: '✅ Disponible' }
      case 'VENDUE':     return { bg: '#3b82f622', color: '#3b82f6', label: '🧾 Vendue' }
      case 'EXPIREE':    return { bg: '#ef444422', color: '#ef4444', label: '⛔ Expirée' }
      case 'RESERVEE':   return { bg: '#f59e0b22', color: '#f59e0b', label: '🔒 Réservée' }
      default:           return { bg: '#ffffff11', color: '#8b8fa8', label: statut }
    }
  }

  const getBanqueStyle = (banque) => {
    switch (banque) {
      case 'UBA':    return { bg: '#ff6b0022', color: '#ff6b00' }
      case 'ACCESS': return { bg: '#3b82f622', color: '#3b82f6' }
      case 'ECOBANK':return { bg: '#22c55e22', color: '#22c55e' }
      case 'AFRILAND':return { bg: '#a855f722', color: '#a855f7' }
      default:       return { bg: '#ffffff11', color: '#8b8fa8' }
    }
  }

  const masquerNumero = (num) => {
    if (!num) return '—'
    return num.replace(/(.{4})/g, '$1 ').trim()
  }

  const masquerPin = (pin, id) => {
    if (!pin) return '—'
    return showPin[id] ? pin : '••••••••'
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titre}>💳 Cartes Prépayées</h1>
          <p style={styles.sousTitre}>
            {disponibles} disponibles · {vendues} vendues · {expirees} expirées
          </p>
        </div>
        <button style={styles.btnPrimaire} onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm && !editCarte ? '✕ Annuler' : '+ Nouvelle carte'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          ...styles.messageBox,
          backgroundColor: message.includes('✅') ? '#22c55e22' : '#ef444422',
          borderColor: message.includes('✅') ? '#22c55e' : '#ef4444',
          color: message.includes('✅') ? '#22c55e' : '#ef4444'
        }}>
          {message}
          <span style={{ cursor: 'pointer', marginLeft: '12px', opacity: .6 }} onClick={() => setMessage('')}>✕</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={styles.statsGrid}>
        {[
          { icone: '💳', valeur: cartes.length,  label: 'Total cartes',       couleur: '#ff6b00' },
          { icone: '✅', valeur: disponibles,     label: 'Disponibles',        couleur: '#22c55e' },
          { icone: '🧾', valeur: vendues,         label: 'Vendues',            couleur: '#3b82f6' },
          { icone: '💰', valeur: valeurStock.toLocaleString('fr-FR') + ' FCFA', label: 'Valeur en stock', couleur: '#a855f7' },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcone, backgroundColor: s.couleur + '22' }}>
              <span style={{ fontSize: '20px' }}>{s.icone}</span>
            </div>
            <div style={{ ...styles.statValeur, color: s.couleur }}>{s.valeur}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitre}>
            {editCarte ? '✏️ Modifier la carte' : '💳 Enregistrer une nouvelle carte prépayée'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>

              <div style={styles.champ}>
                <label style={styles.label}>NUMÉRO DE CARTE</label>
                <input style={styles.input}
                  value={form.numeroCarte}
                  onChange={e => setForm({ ...form, numeroCarte: e.target.value })}
                  placeholder="Ex : 4111 1111 1111 1111"
                  required />
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>CODE PIN / SECRET</label>
                <input style={styles.input} type="password"
                  value={form.codePIN}
                  onChange={e => setForm({ ...form, codePIN: e.target.value })}
                  placeholder="Code confidentiel"
                  required />
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>MONTANT (FCFA)</label>
                <select style={styles.input} value={form.montant}
                  onChange={e => setForm({ ...form, montant: e.target.value })} required>
                  <option value="">Sélectionner le montant</option>
                  <option value="5000">5 000 FCFA</option>
                  <option value="10000">10 000 FCFA</option>
                  <option value="25000">25 000 FCFA</option>
                  <option value="50000">50 000 FCFA</option>
                  <option value="100000">100 000 FCFA</option>
                  <option value="200000">200 000 FCFA</option>
                  <option value="500000">500 000 FCFA</option>
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>BANQUE / ÉMETTEUR</label>
                <select style={styles.input} value={form.banque}
                  onChange={e => setForm({ ...form, banque: e.target.value })} required>
                  <option value="UBA">UBA</option>
                  <option value="ACCESS">ACCESS Bank</option>
                  <option value="ECOBANK">Ecobank</option>
                  <option value="AFRILAND">Afriland First Bank</option>
                  <option value="BICEC">BICEC</option>
                  <option value="SGC">Société Générale Cameroun</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>DATE D'EXPIRATION</label>
                <input style={styles.input} type="date"
                  value={form.dateExpiration}
                  onChange={e => setForm({ ...form, dateExpiration: e.target.value })}
                  required />
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>NUMÉRO DE LOT / SÉRIE</label>
                <input style={styles.input}
                  value={form.numeroLot}
                  onChange={e => setForm({ ...form, numeroLot: e.target.value })}
                  placeholder="Ex : LOT-2025-001" />
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>SITE DE STOCKAGE</label>
                <select style={styles.input} value={form.siteId}
                  onChange={e => setForm({ ...form, siteId: e.target.value })} required>
                  <option value="">Sélectionner le site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.nom} — {s.ville}</option>
                  ))}
                </select>
              </div>

              <div style={styles.champ}>
                <label style={styles.label}>STATUT</label>
                <select style={styles.input} value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="DISPONIBLE">✅ Disponible</option>
                  <option value="RESERVEE">🔒 Réservée</option>
                  <option value="VENDUE">🧾 Vendue</option>
                  <option value="EXPIREE">⛔ Expirée</option>
                </select>
              </div>

              <div style={{ ...styles.champ, gridColumn: '1 / -1' }}>
                <label style={styles.label}>NOTES / OBSERVATIONS</label>
                <input style={styles.input}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observations supplémentaires..." />
              </div>

            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" style={styles.btnPrimaire}>
                {editCarte ? '✅ Enregistrer les modifications' : '✅ Enregistrer la carte'}
              </button>
              <button type="button" style={styles.btnSecondaire} onClick={resetForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={styles.onglets}>
          {[
            { key: 'toutes',      label: `Toutes (${cartes.length})` },
            { key: 'disponibles', label: `✅ Disponibles (${disponibles})` },
            { key: 'vendues',     label: `🧾 Vendues (${vendues})` },
            { key: 'expirees',    label: `⛔ Expirées (${expirees})` },
          ].map(o => (
            <button key={o.key}
              style={{ ...styles.ongletBtn, ...(onglet === o.key ? styles.ongletActif : {}) }}
              onClick={() => setOnglet(o.key)}>
              {o.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input style={{ ...styles.input, width: '200px' }}
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} />
          <select style={{ ...styles.input, width: '150px' }}
            value={filtreBank}
            onChange={e => setFiltreBank(e.target.value)}>
            <option value="tous">Toutes banques</option>
            <option value="UBA">UBA</option>
            <option value="ACCESS">ACCESS</option>
            <option value="ECOBANK">Ecobank</option>
            <option value="AFRILAND">Afriland</option>
          </select>
        </div>
      </div>

      {/* Tableau des cartes */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <span style={styles.graphTitre}>
            {cartesFiltrees.length} carte(s) trouvée(s)
          </span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {['N°', 'NUMÉRO DE CARTE', 'CODE PIN', 'MONTANT', 'BANQUE', 'EXPIRATION', 'LOT', 'SITE', 'STATUT', 'ACTIONS'].map((h, i) => (
                <th key={i} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cartesFiltrees.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ ...styles.td, textAlign: 'center', color: '#8b8fa8', padding: '40px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                  Aucune carte trouvée — cliquez sur "Nouvelle carte" pour commencer
                </td>
              </tr>
            ) : (
              cartesFiltrees.map((c, i) => {
                const statut  = getStatutStyle(c.statut)
                const banque  = getBanqueStyle(c.banque)
                const expDate = c.date_expiration ? new Date(c.date_expiration) : null
                const isExpireSoon = expDate && (expDate - new Date()) < 30 * 24 * 3600 * 1000 && expDate > new Date()
                const isAdmin = utilisateur?.role === 'admin'

                return (
                  <tr key={i} style={styles.tr}>
                    <td style={{ ...styles.td, color: '#8b8fa8', fontSize: '12px' }}>{i + 1}</td>

                    {/* Numéro de carte */}
                    <td style={styles.td}>
                      <span style={styles.numeroCarte}>
                        {masquerNumero(c.numero_carte)}
                      </span>
                    </td>

                    {/* Code PIN */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.pinCode}>
                          {masquerPin(c.code_pin, c.id)}
                        </span>
                        <button
                          style={styles.btnPin}
                          onClick={() => togglePin(c.id)}
                          title={showPin[c.id] ? 'Masquer' : 'Afficher'}>
                          {showPin[c.id] ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </td>

                    {/* Montant */}
                    <td style={{ ...styles.td, fontWeight: '700', color: '#ff6b00' }}>
                      {parseInt(c.montant || 0).toLocaleString('fr-FR')} FCFA
                    </td>

                    {/* Banque */}
                    <td style={styles.td}>
                      <span style={{ ...styles.banqueBadge, backgroundColor: banque.bg, color: banque.color }}>
                        {c.banque}
                      </span>
                    </td>

                    {/* Expiration */}
                    <td style={styles.td}>
                      <span style={{ color: isExpireSoon ? '#f59e0b' : expDate && expDate < new Date() ? '#ef4444' : '#d1d5db' }}>
                        {expDate ? expDate.toLocaleDateString('fr-FR') : '—'}
                        {isExpireSoon && ' ⚠️'}
                      </span>
                    </td>

                    {/* Lot */}
                    <td style={styles.td}>
                      {c.numero_lot
                        ? <span style={styles.skuBadge}>{c.numero_lot}</span>
                        : <span style={{ color: '#8b8fa8' }}>—</span>
                      }
                    </td>

                    {/* Site */}
                    <td style={styles.td}>{c.site_nom || '—'}</td>

                    {/* Statut */}
                    <td style={styles.td}>
                      <span style={{ ...styles.statutBadge, backgroundColor: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button style={styles.btnAction} onClick={() => handleEdit(c)}>✏️</button>

                        {c.statut === 'DISPONIBLE' && (
                          <button
                            style={{ ...styles.btnAction, backgroundColor: '#3b82f622', color: '#3b82f6', borderColor: '#3b82f644' }}
                            onClick={() => handleChangerStatut(c.id, 'VENDUE')}
                            title="Marquer comme vendue">
                            🧾
                          </button>
                        )}

                        {c.statut !== 'EXPIREE' && (
                          <button
                            style={{ ...styles.btnAction, backgroundColor: '#ef444422', color: '#ef4444', borderColor: '#ef444444' }}
                            onClick={() => handleChangerStatut(c.id, 'EXPIREE')}
                            title="Marquer comme expirée">
                            ⛔
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            style={{ ...styles.btnAction, backgroundColor: '#ef444422', color: '#ef4444', borderColor: '#ef444444' }}
                            onClick={() => handleSupprimer(c.id)}
                            title="Supprimer">
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Total de la valeur filtrée */}
        {cartesFiltrees.length > 0 && (
          <div style={styles.totalBox}>
            <span style={{ color: '#8b8fa8', fontSize: '13px' }}>
              Valeur totale des {cartesFiltrees.length} carte(s) affichée(s)
            </span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#ff6b00' }}>
              {cartesFiltrees.reduce((a, c) => a + (parseInt(c.montant) || 0), 0).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page:         { padding: '32px', backgroundColor: '#0f1117', minHeight: '100vh', color: 'white', fontFamily: "'Inter', sans-serif" },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titre:        { fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  sousTitre:    { color: '#8b8fa8', fontSize: '14px' },
  btnPrimaire:  { padding: '10px 20px', backgroundColor: '#ff6b00', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnSecondaire:{ padding: '10px 20px', backgroundColor: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  messageBox:   { padding: '12px 16px', borderRadius: '8px', border: '1px solid', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard:     { backgroundColor: '#1a1d27', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' },
  statIcone:    { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
  statValeur:   { fontSize: '26px', fontWeight: '700', marginBottom: '4px' },
  statLabel:    { color: '#8b8fa8', fontSize: '12px' },
  formCard:     { backgroundColor: '#1a1d27', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' },
  formTitre:    { fontSize: '16px', fontWeight: '600', marginBottom: '20px' },
  formGrid:     { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' },
  champ:        { display: 'flex', flexDirection: 'column', gap: '8px' },
  label:        { color: '#8b8fa8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px' },
  input:        { padding: '10px 14px', backgroundColor: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' },
  onglets:      { display: 'flex', gap: '4px', backgroundColor: '#1a1d27', borderRadius: '10px', padding: '4px' },
  ongletBtn:    { padding: '8px 16px', borderRadius: '7px', border: 'none', backgroundColor: 'transparent', color: '#8b8fa8', cursor: 'pointer', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' },
  ongletActif:  { backgroundColor: '#0f1117', color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' },
  tableCard:    { backgroundColor: '#1a1d27', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' },
  tableHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  graphTitre:   { fontSize: '15px', fontWeight: '600' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { color: '#8b8fa8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' },
  tr:           { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:           { padding: '14px 12px', fontSize: '13px', color: '#d1d5db' },
  numeroCarte:  { fontFamily: 'monospace', backgroundColor: '#ffffff11', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', letterSpacing: '1px' },
  pinCode:      { fontFamily: 'monospace', backgroundColor: '#ff6b0011', color: '#ff6b00', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', letterSpacing: '2px' },
  btnPin:       { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px' },
  banqueBadge:  { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  skuBadge:     { backgroundColor: '#ffffff11', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' },
  statutBadge:  { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  btnAction:    { padding: '6px 10px', backgroundColor: '#ffffff11', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  totalBox:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '14px 18px', backgroundColor: '#ff6b0011', border: '1px solid #ff6b0033', borderRadius: '8px' },
}

export default CartesPrepayees
