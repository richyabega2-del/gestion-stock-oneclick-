const pool = require('./src/config/db')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 10)
  await pool.query(
    'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4, $5)',
    ['Admin', 'ONECLICK', 'admin@oneclick.cm', hash, 'ADMIN']
  )
  console.log('✅ Admin créé avec succès !')
  process.exit(0)
}

createAdmin().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})