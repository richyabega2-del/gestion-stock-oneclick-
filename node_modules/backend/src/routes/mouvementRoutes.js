const express = require('express')
const router = express.Router()
const mouvementController = require('../controllers/MouvementController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',                      authMiddleware, mouvementController.getMouvements)
router.get('/produit/:produit_id',   authMiddleware, mouvementController.getByProduit)
router.get('/site/:site_id',         authMiddleware, mouvementController.getBySite)
router.post('/',                     authMiddleware, mouvementController.createMouvement)

module.exports = router