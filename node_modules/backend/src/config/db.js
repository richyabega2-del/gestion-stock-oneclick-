const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'gestion_stock',
  user: 'postgres',
  password: '2909',
});

module.exports = pool;