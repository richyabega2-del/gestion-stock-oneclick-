const pool = require('../config/db')

const getParametres = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parametres_system')
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateParametre = async (req, res) => {
  const { valeur } = req.body
  try {
    const result = await pool.query(
      'UPDATE parametres_system SET valeur=$1 WHERE cle=$2 RETURNING *',
      [valeur, req.params.cle]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Paramètre non trouvé' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getParametres, updateParametre }