const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// ✅ Middlewares EN PREMIER
app.use(cors())
app.use(express.json())

// ✅ Routes
const authRoutes        = require('./routes/authRoutes')
const produitRoutes     = require('./routes/produitRoutes')
const carteRoutes       = require('./routes/carteRoutes')
const stockRoutes       = require('./routes/stockRoutes')
const transfertRoutes   = require('./routes/TransfertRoutes')
const siteRoutes        = require('./routes/SiteRoutes')
const utilisateurRoutes = require('./routes/UtilisateurRoutes')
const venteRoutes       = require('./routes/VenteRoutes')
const mouvementRoutes = require('./routes/mouvementRoutes')
const rapportRoutes     = require('./routes/rapportRoutes')
const logRoutes         = require('./routes/LogRoutes')
const parametreRoutes   = require('./routes/ParametreRoutes')
const chatRoutes = require('./routes/chatRoutes')
app.use('/api/auth',         authRoutes)
app.use('/api/produits',     produitRoutes)
app.use('/api/cartes',       carteRoutes)
app.use('/api/stocks',       stockRoutes)
app.use('/api/transferts',   transfertRoutes)
app.use('/api/sites',        siteRoutes)
app.use('/api/utilisateurs', utilisateurRoutes)
app.use('/api/ventes',       venteRoutes)
app.use('/api/mouvements',   mouvementRoutes)
app.use('/api/rapports',     rapportRoutes)
app.use('/api/logs',         logRoutes)
app.use('/api/parametres',   parametreRoutes)
app.use('/api/chat', chatRoutes)
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend Gestion Stock ONECLICK opérationnel' })
})

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
})