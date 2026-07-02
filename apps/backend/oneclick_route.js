// ============================================================
//  ONECLICK — Routes Node.js + PostgreSQL
//  Fichier : oneclick_routes.js
//  Connexion : host=localhost | port=5432 | db=gestion_stock
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('./db'); // Assure-toi que db.js existe avec Pool pg

// ==========================
// 1. SITES
// ==========================
router.get('/sites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sites/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sites', async (req, res) => {
  const { nom, adresse, telephone, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO sites (nom, adresse, telephone, email) VALUES ($1,$2,$3,$4) RETURNING *',
      [nom, adresse, telephone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sites/:id', async (req, res) => {
  const { nom, adresse, telephone, email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE sites SET nom=$1, adresse=$2, telephone=$3, email=$4 WHERE id=$5 RETURNING *',
      [nom, adresse, telephone, email, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sites/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = $1', [req.params.id]);
    res.json({ message: 'Site supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 2. PRODUITS
// ==========================
router.get('/produits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produits ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/produits/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produits WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/produits', async (req, res) => {
  const { nom, description, prix, categorie, code_barre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produits (nom, description, prix, categorie, code_barre) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nom, description, prix, categorie, code_barre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/produits/:id', async (req, res) => {
  const { nom, description, prix, categorie, code_barre } = req.body;
  try {
    const result = await pool.query(
      'UPDATE produits SET nom=$1, description=$2, prix=$3, categorie=$4, code_barre=$5 WHERE id=$6 RETURNING *',
      [nom, description, prix, categorie, code_barre, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/produits/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM produits WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 3. STOCKS
// ==========================
router.get('/stocks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.nom AS produit_nom, si.nom AS site_nom
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN sites si ON s.site_id = si.id
      ORDER BY s.id
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stocks/site/:site_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stocks WHERE site_id = $1', [req.params.site_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/stocks/:id', async (req, res) => {
  const { quantite } = req.body;
  try {
    const result = await pool.query(
      'UPDATE stocks SET quantite=$1 WHERE id=$2 RETURNING *',
      [quantite, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 4. UTILISATEURS
// ==========================
router.get('/utilisateurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom, email, role, site_id FROM utilisateurs ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/utilisateurs', async (req, res) => {
  const { nom, email, mot_de_passe, role, site_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, site_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nom, email, role',
      [nom, email, mot_de_passe, role, site_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/utilisateurs/:id', async (req, res) => {
  const { nom, email, role, site_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE utilisateurs SET nom=$1, email=$2, role=$3, site_id=$4 WHERE id=$5 RETURNING *',
      [nom, email, role, site_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/utilisateurs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM utilisateurs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 5. VENTES
// ==========================
router.get('/ventes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ventes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/ventes/site/:site_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ventes WHERE site_id = $1 ORDER BY created_at DESC', [req.params.site_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ventes', async (req, res) => {
  const { site_id, utilisateur_id, total, mode_paiement } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO ventes (site_id, utilisateur_id, total, mode_paiement) VALUES ($1,$2,$3,$4) RETURNING *',
      [site_id, utilisateur_id, total, mode_paiement]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 6. LIGNES_VENTE
// ==========================
router.get('/lignes_vente/vente/:vente_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lv.*, p.nom AS produit_nom 
       FROM lignes_vente lv 
       JOIN produits p ON lv.produit_id = p.id 
       WHERE lv.vente_id = $1`,
      [req.params.vente_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/lignes_vente', async (req, res) => {
  const { vente_id, produit_id, quantite, prix_unitaire } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO lignes_vente (vente_id, produit_id, quantite, prix_unitaire) VALUES ($1,$2,$3,$4) RETURNING *',
      [vente_id, produit_id, quantite, prix_unitaire]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 7. TRANSFERTS
// ==========================
router.get('/transferts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transferts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/transferts', async (req, res) => {
  const { site_source_id, site_destination_id, utilisateur_id, statut } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO transferts (site_source_id, site_destination_id, utilisateur_id, statut) VALUES ($1,$2,$3,$4) RETURNING *',
      [site_source_id, site_destination_id, utilisateur_id, statut]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/transferts/:id/statut', async (req, res) => {
  const { statut } = req.body;
  try {
    const result = await pool.query(
      'UPDATE transferts SET statut=$1 WHERE id=$2 RETURNING *',
      [statut, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 8. LIGNES_TRANSFERT
// ==========================
router.get('/lignes_transfert/transfert/:transfert_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, p.nom AS produit_nom 
       FROM lignes_transfert lt 
       JOIN produits p ON lt.produit_id = p.id 
       WHERE lt.transfert_id = $1`,
      [req.params.transfert_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/lignes_transfert', async (req, res) => {
  const { transfert_id, produit_id, quantite } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO lignes_transfert (transfert_id, produit_id, quantite) VALUES ($1,$2,$3) RETURNING *',
      [transfert_id, produit_id, quantite]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 9. MOUVEMENTS_STOCK
// ==========================
router.get('/mouvements_stock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mouvements_stock ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/mouvements_stock/produit/:produit_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mouvements_stock WHERE produit_id = $1 ORDER BY created_at DESC',
      [req.params.produit_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mouvements_stock', async (req, res) => {
  const { produit_id, site_id, type_mouvement, quantite, reference_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO mouvements_stock (produit_id, site_id, type_mouvement, quantite, reference_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [produit_id, site_id, type_mouvement, quantite, reference_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 10. CARTES_PREPAYE
// ==========================
router.get('/cartes_prepaye', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cartes_prepaye ORDER BY id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cartes_prepaye', async (req, res) => {
  const { code, montant, statut, site_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO cartes_prepaye (code, montant, statut, site_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [code, montant, statut, site_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cartes_prepaye/:id/utiliser', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE cartes_prepaye SET statut='utilisee' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 11. LOGS_CONNEXION
// ==========================
router.get('/logs_connexion', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs_connexion ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/logs_connexion', async (req, res) => {
  const { utilisateur_id, action, ip_address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO logs_connexion (utilisateur_id, action, ip_address) VALUES ($1,$2,$3) RETURNING *',
      [utilisateur_id, action, ip_address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================
// 12. PARAMETRES_SYSTEM
// ==========================
router.get('/parametres_system', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parametres_system');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/parametres_system/:cle', async (req, res) => {
  const { valeur } = req.body;
  try {
    const result = await pool.query(
      'UPDATE parametres_system SET valeur=$1 WHERE cle=$2 RETURNING *',
      [valeur, req.params.cle]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;