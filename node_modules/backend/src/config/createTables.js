const pool = require('./db')

const createTables = async () => {
  await pool.query(`

    CREATE TYPE role_enum AS ENUM ('ADMIN', 'GESTIONNAIRE');
    CREATE TYPE type_produit_enum AS ENUM ('CARTE_VISA', 'LICENCE_LOGICIEL');
    CREATE TYPE type_mouvement_enum AS ENUM ('ENTREE', 'SORTIE', 'TRANSFERT_ENTRANT', 'TRANSFERT_SORTANT');
    CREATE TYPE statut_vente_enum AS ENUM ('EN_COURS', 'VALIDEE', 'ANNULEE');
    CREATE TYPE statut_transfert_enum AS ENUM ('EN_ATTENTE', 'APPROUVE', 'EN_TRANSIT', 'RECEPTIONNE', 'REJETE');
    CREATE TYPE type_alerte_enum AS ENUM ('STOCK_BAS', 'STOCK_EPUISE', 'SEUIL_CRITIQUE');

    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      ville VARCHAR(100) NOT NULL,
      adresse TEXT,
      actif BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS utilisateurs (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      mot_de_passe TEXT NOT NULL,
      role role_enum DEFAULT 'GESTIONNAIRE',
      actif BOOLEAN DEFAULT true,
      site_id INTEGER REFERENCES sites(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS produits (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(150) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      type type_produit_enum NOT NULL,
      prix_achat FLOAT NOT NULL,
      prix_vente FLOAT NOT NULL,
      seuil_alerte INTEGER DEFAULT 5,
      actif BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      quantite INTEGER DEFAULT 0,
      produit_id INTEGER REFERENCES produits(id),
      site_id INTEGER REFERENCES sites(id),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(produit_id, site_id)
    );

    CREATE TABLE IF NOT EXISTS mouvements_stock (
      id SERIAL PRIMARY KEY,
      type type_mouvement_enum NOT NULL,
      quantite INTEGER NOT NULL,
      quantite_avant INTEGER NOT NULL,
      quantite_apres INTEGER NOT NULL,
      motif TEXT,
      stock_id INTEGER REFERENCES stocks(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ventes (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(100) UNIQUE NOT NULL,
      statut statut_vente_enum DEFAULT 'EN_COURS',
      montant_total FLOAT DEFAULT 0,
      site_id INTEGER REFERENCES sites(id),
      utilisateur_id INTEGER REFERENCES utilisateurs(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lignes_vente (
      id SERIAL PRIMARY KEY,
      quantite INTEGER NOT NULL,
      prix_unitaire FLOAT NOT NULL,
      sous_total FLOAT NOT NULL,
      vente_id INTEGER REFERENCES ventes(id),
      produit_id INTEGER REFERENCES produits(id)
    );

    CREATE TABLE IF NOT EXISTS transferts (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(100) UNIQUE NOT NULL,
      statut statut_transfert_enum DEFAULT 'EN_ATTENTE',
      motif TEXT,
      site_depart_id INTEGER REFERENCES sites(id),
      site_arrivee_id INTEGER REFERENCES sites(id),
      utilisateur_id INTEGER REFERENCES utilisateurs(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lignes_transfert (
      id SERIAL PRIMARY KEY,
      quantite INTEGER NOT NULL,
      transfert_id INTEGER REFERENCES transferts(id),
      produit_id INTEGER REFERENCES produits(id)
    );

    CREATE TABLE IF NOT EXISTS alertes_stock (
      id SERIAL PRIMARY KEY,
      type type_alerte_enum DEFAULT 'STOCK_BAS',
      message TEXT NOT NULL,
      lu BOOLEAN DEFAULT false,
      produit_id INTEGER REFERENCES produits(id),
      site_id INTEGER REFERENCES sites(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS logs_connexion (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      ip_adresse VARCHAR(50),
      utilisateur_id INTEGER REFERENCES utilisateurs(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parametres_systeme (
      id SERIAL PRIMARY KEY,
      cle VARCHAR(100) UNIQUE NOT NULL,
      valeur TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );

  `)
  console.log('✅ Toutes les tables créées avec succès !')
  process.exit(0)
}

createTables().catch(err => {
  console.error('❌ Erreur création tables:', err)
  process.exit(1)
})