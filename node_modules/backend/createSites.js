const pool = require('./src/config/db')

async function createSites() {
  await pool.query(`
    INSERT INTO sites (nom, ville) VALUES
    ('Elig-Essono', 'Yaoundé'),
    ('Mimboman', 'Yaoundé'),
    ('Ange Raphaël', 'Douala')
    ON CONFLICT DO NOTHING
  `)
  console.log('✅ Sites créés !')
  process.exit(0)
}

createSites().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})