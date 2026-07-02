CREATE TABLE IF NOT EXISTS cartes_prepayees (
  id               SERIAL PRIMARY KEY,
  numero_carte     VARCHAR(50) UNIQUE NOT NULL,
  code_pin         VARCHAR(20) NOT NULL,
  montant          NUMERIC(12,2) NOT NULL,
  banque           VARCHAR(50) NOT NULL,
  date_expiration  DATE NOT NULL,
  numero_lot       VARCHAR(50),
  site_id          INT REFERENCES sites(id),
  statut           VARCHAR(20) DEFAULT 'DISPONIBLE',
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);