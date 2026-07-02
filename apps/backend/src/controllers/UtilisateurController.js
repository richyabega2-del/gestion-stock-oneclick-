const pool = require('../config/db')
const bcrypt = require('bcryptjs')

const getUtilisateurs = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.nom, u.prenom, u.email, u.role, u.site_id, u.actif, s.nom AS site_nom FROM utilisateurs u LEFT JOIN sites s ON u.site_id = s.id ORDER BY u.id'
    )
    res.json(result.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getUtilisateurById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, site_id FROM utilisateurs WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createUtilisateur = async (req, res) => {
  const { nom, email, mot_de_passe, role, site_id } = req.body
  try {
    const hash = await bcrypt.hash(mot_de_passe, 10)
    const result = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, site_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nom, email, role, site_id',
      [nom, email, hash, role, site_id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const updateUtilisateur = async (req, res) => {
  const { nom, prenom, email, mot_de_passe, role, site_id, actif } = req.body
  try {
    let query, params
    if (mot_de_passe) {
      const hash = await bcrypt.hash(mot_de_passe, 10)
      query = 'UPDATE utilisateurs SET nom=$1, prenom=$2, email=$3, mot_de_passe=$4, role=$5, site_id=$6, actif=COALESCE($7,actif) WHERE id=$8 RETURNING id, nom, prenom, email, role, site_id, actif'
      params = [nom, prenom||null, email, hash, role, site_id||null, actif??null, req.params.id]
    } else {
      query = 'UPDATE utilisateurs SET nom=$1, prenom=$2, email=$3, role=$4, site_id=$5, actif=COALESCE($6,actif) WHERE id=$7 RETURNING id, nom, prenom, email, role, site_id, actif'
      params = [nom, prenom||null, email, role, site_id||null, actif??null, req.params.id]
    }
    const result = await pool.query(query, params)
    res.json(result.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
}
const deleteUtilisateur = async (req, res) => {
  try {
    await pool.query('DELETE FROM utilisateurs WHERE id = $1', [req.params.id])
    res.json({ message: 'Utilisateur supprimé' })
  } catch (err) { res.status(500).json({ error: err.message }) }
}
module.exports = { getUtilisateurs, getUtilisateurById, createUtilisateur, updateUtilisateur, deleteUtilisateur }

