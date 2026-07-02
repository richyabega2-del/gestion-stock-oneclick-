const express = require('express')
const router = express.Router()
const venteController = require('../controllers/VenteController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',                authMiddleware, venteController.getVentes)
router.get('/:id',             authMiddleware, venteController.getVenteById)
router.get('/site/:site_id',   authMiddleware, venteController.getVentesBySite)
router.post('/',               authMiddleware, venteController.createVente)

module.exports = router