const pool = require('../config/db')

const getMouvements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.nom AS produit_nom, s.nom AS site_nom
      FROM mouvements_stock m
      LEFT JOIN produits p ON m.produit_id = p.id
      LEFT JOIN sites s ON m.site_id = s.id
      ORDER BY m.created_at DESC
      LIMIT 200
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getByProduit = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mouvements_stock WHERE produit_id = $1 ORDER BY created_at DESC',
      [req.params.produit_id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getBySite = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mouvements_stock WHERE site_id = $1 ORDER BY created_at DESC',
      [req.params.site_id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createMouvement = async (req, res) => {
  const { produit_id, site_id, type_mouvement, quantite, reference_id } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO mouvements_stock (produit_id, site_id, type_mouvement, quantite, reference_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [produit_id, site_id, type_mouvement, quantite, reference_id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getMouvements, getByProduit, getBySite, createMouvement }