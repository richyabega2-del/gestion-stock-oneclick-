const express = require('express')
const router = express.Router()
const stockController = require('../controllers/stockController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/', authMiddleware, stockController.getStocks)
router.get('/sites', stockController.getSites)
router.get('/alertes', authMiddleware, stockController.getAlertes)   // ✅ AJOUTÉ
router.get('/site/:siteId', stockController.getStocksBySite)
router.post('/entree', authMiddleware, stockController.entreeStock)
router.post('/alertes/:id/notifier', authMiddleware, stockController.notifierAlerte)
module.exports = router
