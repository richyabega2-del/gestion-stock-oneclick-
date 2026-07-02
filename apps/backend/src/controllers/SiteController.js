const pool = require('../config/db')

const getSites = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites ORDER BY id')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getSiteById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites WHERE id = $1', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'Site non trouvé' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createSite = async (req, res) => {
  const { nom, adresse, telephone, email } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO sites (nom, adresse, telephone, email) VALUES ($1,$2,$3,$4) RETURNING *',
      [nom, adresse, telephone, email]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateSite = async (req, res) => {
  const { nom, adresse, telephone, email } = req.body
  try {
    const result = await pool.query(
      'UPDATE sites SET nom=$1, adresse=$2, telephone=$3, email=$4 WHERE id=$5 RETURNING *',
      [nom, adresse, telephone, email, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const deleteSite = async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = $1', [req.params.id])
    res.json({ message: 'Site supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getSites, getSiteById, createSite, updateSite, deleteSite }