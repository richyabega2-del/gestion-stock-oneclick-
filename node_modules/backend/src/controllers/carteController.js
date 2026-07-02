const pool = require('../config/db')

// ─── LISTE TOUTES LES CARTES ─────────────────────────
const getCartes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        s.nom AS site_nom,
        s.ville AS site_ville
      FROM cartes_prepayees c
      LEFT JOIN sites s ON c.site_id = s.id
      ORDER BY c.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ─── CRÉER UNE CARTE ─────────────────────────────────
const creerCarte = async (req, res) => {
  const { numeroCarte, codePIN, montant, banque, dateExpiration, numeroLot, siteId, statut, notes } = req.body

  if (!numeroCarte || !codePIN || !montant || !banque || !dateExpiration) {
    return res.status(400).json({ message: 'Champs obligatoires manquants' })
  }

  try {
    // Vérifier si le numéro existe déjà
    const existe = await pool.query(
      'SELECT id FROM cartes_prepayees WHERE numero_carte = $1',
      [numeroCarte]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'Ce numéro de carte existe déjà' })
    }

    const result = await pool.query(`
      INSERT INTO cartes_prepayees 
        (numero_carte, code_pin, montant, banque, date_expiration, numero_lot, site_id, statut, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      numeroCarte,
      codePIN,
      parseFloat(montant),
      banque,
      dateExpiration,
      numeroLot || null,
      siteId ? parseInt(siteId) : null,
      statut || 'DISPONIBLE',
      notes || null
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de la création' })
  }
}

// ─── MODIFIER UNE CARTE ───────────────────────────────
const modifierCarte = async (req, res) => {
  const { id } = req.params
  const { numeroCarte, codePIN, montant, banque, dateExpiration, numeroLot, siteId, statut, notes } = req.body

  try {
    const result = await pool.query(`
      UPDATE cartes_prepayees SET
        numero_carte    = $1,
        code_pin        = $2,
        montant         = $3,
        banque          = $4,
        date_expiration = $5,
        numero_lot      = $6,
        site_id         = $7,
        statut          = $8,
        notes           = $9,
        updated_at      = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      numeroCarte,
      codePIN,
      parseFloat(montant),
      banque,
      dateExpiration,
      numeroLot || null,
      siteId ? parseInt(siteId) : null,
      statut || 'DISPONIBLE',
      notes || null,
      parseInt(id)
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de la modification' })
  }
}

// ─── CHANGER STATUT ───────────────────────────────────
const changerStatut = async (req, res) => {
  const { id } = req.params
  const { statut } = req.body

  const statutsValides = ['DISPONIBLE', 'VENDUE', 'EXPIREE', 'RESERVEE']
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' })
  }

  try {
    const result = await pool.query(
      'UPDATE cartes_prepayees SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [statut, parseInt(id)]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' })
    }

    res.json({ message: `Statut mis à jour : ${statut}`, carte: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors du changement de statut' })
  }
}

// ─── SUPPRIMER UNE CARTE ─────────────────────────────
const supprimerCarte = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'DELETE FROM cartes_prepayees WHERE id = $1 RETURNING *',
      [parseInt(id)]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Carte non trouvée' })
    }

    res.json({ message: 'Carte supprimée avec succès' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de la suppression' })
  }
}

// ─── STATS CARTES ─────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE statut = 'DISPONIBLE')    AS disponibles,
        COUNT(*) FILTER (WHERE statut = 'VENDUE')        AS vendues,
        COUNT(*) FILTER (WHERE statut = 'EXPIREE')       AS expirees,
        COALESCE(SUM(montant) FILTER (WHERE statut = 'DISPONIBLE'), 0) AS valeur_stock
      FROM cartes_prepayees
    `)
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { getCartes, creerCarte, modifierCarte, changerStatut, supprimerCarte, getStats }
