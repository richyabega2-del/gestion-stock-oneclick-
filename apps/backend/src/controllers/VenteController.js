const pool = require('../config/db')

const getVentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        s.nom AS site_nom,
        u.nom AS vendeur_nom,
        COALESCE(SUM(lv.quantite), 0) AS quantite,
        COALESCE(SUM(lv.sous_total), 0) AS total_verifie,
        COUNT(lv.id) AS nb_articles
      FROM ventes v
      LEFT JOIN sites s ON v.site_id = s.id
      LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
      LEFT JOIN lignes_vente lv ON lv.vente_id = v.id
      GROUP BY v.id, s.nom, u.nom
      ORDER BY v.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getVenteById = async (req, res) => {
  try {
    const vente = await pool.query('SELECT * FROM ventes WHERE id = $1', [req.params.id])
    if (!vente.rows[0]) return res.status(404).json({ error: 'Vente non trouvée' })

    const lignes = await pool.query(`
      SELECT lv.*, p.nom AS produit_nom
      FROM lignes_vente lv
      JOIN produits p ON lv.produit_id = p.id
      WHERE lv.vente_id = $1
    `, [req.params.id])

    res.json({ ...vente.rows[0], lignes: lignes.rows })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getVentesBySite = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ventes WHERE site_id = $1 ORDER BY created_at DESC',
      [req.params.site_id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createVente = async (req, res) => {
  // ✅ Récupérer tous les champs du frontend
  const { site_id, utilisateur_id, lignes, client, modePaiement } = req.body

  if (!site_id || !utilisateur_id || !lignes || lignes.length === 0) {
    return res.status(400).json({ error: 'Données manquantes' })
  }

  const clientPool = await pool.connect()
  try {
    await clientPool.query('BEGIN')

    // 1. Calculer le montant total
    const montant_total = lignes.reduce((sum, ligne) => {
      return sum + (ligne.quantite * ligne.prix_unitaire)
    }, 0)

    // 2. Générer une référence
    const reference = `VTE-${Date.now()}`

    // 3. Insérer la vente avec client et mode_paiement
    const result = await clientPool.query(
      `INSERT INTO ventes (site_id, utilisateur_id, montant_total, statut, reference, client, mode_paiement)
       VALUES ($1, $2, $3, 'VALIDEE', $4, $5, $6)
       RETURNING id`,
      [site_id, utilisateur_id, montant_total, reference, client || null, modePaiement || null]
    )
    const venteId = result.rows[0].id

    // 4. Insérer les lignes de vente
    for (const ligne of lignes) {
      await clientPool.query(
        `INSERT INTO lignes_vente (vente_id, produit_id, quantite, prix_unitaire, sous_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [venteId, ligne.produit_id, ligne.quantite, ligne.prix_unitaire, ligne.quantite * ligne.prix_unitaire]
      )

      // 5. Décrémenter le stock
      await clientPool.query(
        `UPDATE stocks SET quantite = quantite - $1
         WHERE produit_id = $2 AND site_id = $3`,
        [ligne.quantite, ligne.produit_id, site_id]
      )
    }

    await clientPool.query('COMMIT')
    res.status(201).json({ id: venteId, reference, montant_total })

  } catch (error) {
    await clientPool.query('ROLLBACK')
    console.error('ERREUR CREATION VENTE:', error)
    res.status(500).json({ error: error.message })
  } finally {
    clientPool.release()
  }
}

module.exports = { getVentes, getVenteById, getVentesBySite, createVente }


