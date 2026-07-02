const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Rapports - à venir' })
})

module.exports = router