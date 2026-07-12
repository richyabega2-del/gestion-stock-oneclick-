const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, siteId } = req.body
    const existe = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [email])
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' })
    }
    const hash = await bcrypt.hash(motDePasse, 10)
    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, site_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, email, role`,
      [nom, prenom, email, hash, role || 'GESTIONNAIRE', siteId || null]
    )
    res.status(201).json({ message: '✅ Utilisateur créé', utilisateur: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body
    const result = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = $1 AND actif = true', [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }
    const utilisateur = result.rows[0]
    const valide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe)
    if (!valide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }
    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role, siteId: utilisateur.site_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )
    await pool.query(
      'INSERT INTO logs_connexion (action, utilisateur_id) VALUES ($1, $2)',
      ['CONNEXION', utilisateur.id]
    )
    res.json({
      message: '✅ Connexion réussie',
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        site_id: utilisateur.site_id
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

const me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.role, u.site_id, s.nom as site_nom
       FROM utilisateurs u LEFT JOIN sites s ON u.site_id = s.id WHERE u.id = $1`,
      [req.utilisateur.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { register, login, me }