const pool = require('../config/db')

const getTransferts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        s1.nom AS site_depart_nom,
        s2.nom AS site_arrivee_nom,
        u.nom AS utilisateur_nom
      FROM transferts t
      LEFT JOIN sites s1 ON t.site_depart_id = s1.id
      LEFT JOIN sites s2 ON t.site_arrivee_id = s2.id
      LEFT JOIN utilisateurs u ON t.utilisateur_id = u.id
      ORDER BY t.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getTransfertById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transferts WHERE id = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'Transfert non trouvé' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createTransfert = async (req, res) => {
  const { site_depart_id, site_arrivee_id, utilisateur_id } = req.body
  try {
   const result = await pool.query(
      `INSERT INTO transferts (site_depart_id, site_arrivee_id, utilisateur_id, statut, reference)
        VALUES ($1, $2, $3, 'EN_ATTENTE', $4) RETURNING *`,
      [site_depart_id, site_arrivee_id, utilisateur_id, `TRF-${Date.now()}`]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateStatut = async (req, res) => {
  const { statut } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      'UPDATE transferts SET statut=$1 WHERE id=$2 RETURNING *',
      [statut, req.params.id]
    )
    const transfert = result.rows[0]

    // Si validé → déplacer le stock
    if (statut === 'APPROUVE') {
      const lignes = await client.query(
        'SELECT * FROM lignes_transfert WHERE transfert_id = $1', [req.params.id]
      )
      for (const ligne of lignes.rows) {
        await client.query(
          'UPDATE stocks SET quantite = quantite - $1 WHERE produit_id = $2 AND site_id = $3',
          [ligne.quantite, ligne.produit_id, transfert.site_depart_id]
        )
        await client.query(
          `INSERT INTO stocks (produit_id, site_id, quantite)
           VALUES ($1,$2,$3)
           ON CONFLICT (produit_id, site_id)
           DO UPDATE SET quantite = stocks.quantite + $3`,
          [ligne.produit_id, transfert.site_arrivee_id, ligne.quantite]
        )
      }
    }

    await client.query('COMMIT')
    res.json(transfert)
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

const getLignes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lt.*, p.nom AS produit_nom
      FROM lignes_transfert lt
      JOIN produits p ON lt.produit_id = p.id
      WHERE lt.transfert_id = $1
    `, [req.params.id])
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const addLigne = async (req, res) => {
  const { produit_id, quantite } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO lignes_transfert (transfert_id, produit_id, quantite) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, produit_id, quantite]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getTransferts, getTransfertById, createTransfert, updateStatut, getLignes, addLigne }

