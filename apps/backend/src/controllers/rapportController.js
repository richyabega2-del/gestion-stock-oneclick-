const pool = require('../config/db')

const getInventaire = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.nom, p.sku, p.type, p.prix_achat, p.prix_vente,
       SUM(s.quantite) as quantite_totale,
       SUM(s.quantite * p.prix_achat) as valeur_achat,
       SUM(s.quantite * p.prix_vente) as valeur_vente
       FROM produits p
       LEFT JOIN stocks s ON p.id = s.produit_id
       WHERE p.actif = true
       GROUP BY p.id ORDER BY p.nom`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { getInventaire }