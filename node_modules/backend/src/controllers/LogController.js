const pool = require('../config/db')

const getLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.nom AS utilisateur_nom
      FROM logs_connexion l
      LEFT JOIN utilisateurs u ON l.utilisateur_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `)
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getByUtilisateur = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM logs_connexion WHERE utilisateur_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createLog = async (req, res) => {
  const { utilisateur_id, action, ip_address } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO logs_connexion (utilisateur_id, action, ip_address) VALUES ($1,$2,$3) RETURNING *',
      [utilisateur_id, action, ip_address]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getLogs, getByUtilisateur, createLog }