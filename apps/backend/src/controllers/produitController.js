const pool = require('../config/db')

// Lister tous les produits
const getProduits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM produits WHERE actif = true ORDER BY nom ASC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Obtenir un produit par ID
const getProduitById = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT * FROM produits WHERE id = $1 AND actif = true`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Créer un produit
const createProduit = async (req, res) => {
  try {
    const { nom, sku, description, type, prixAchat, prixVente, seuilAlerte } = req.body
    const existe = await pool.query('SELECT id FROM produits WHERE sku = $1', [sku])
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Ce SKU existe déjà' })
    }
    const result = await pool.query(
      `INSERT INTO produits (nom, sku, description, type, prix_achat, prix_vente, seuil_alerte)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nom, sku, description || null, type, prixAchat, prixVente, seuilAlerte || 5]
    )
    res.status(201).json({ message: '✅ Produit créé', produit: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Modifier un produit
const updateProduit = async (req, res) => {
  try {
    const { id } = req.params
    const { nom, description, prixAchat, prixVente, seuilAlerte } = req.body
    const result = await pool.query(
      `UPDATE produits SET nom=$1, description=$2, prix_achat=$3, prix_vente=$4,
       seuil_alerte=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [nom, description, prixAchat, prixVente, seuilAlerte, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' })
    }
    res.json({ message: '✅ Produit modifié', produit: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// Supprimer un produit
const deleteProduit = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE produits SET actif=false WHERE id=$1', [id])
    res.json({ message: '✅ Produit supprimé' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { getProduits, getProduitById, createProduit, updateProduit, deleteProduit }