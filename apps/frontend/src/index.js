const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Route de test
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend Gestion Stock ONECLICK' })
})

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
})