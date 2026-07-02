const express = require('express')
const router = express.Router()
const produitController = require('../controllers/produitController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/', authMiddleware, produitController.getProduits)
router.get('/:id', authMiddleware, produitController.getProduitById)
router.post('/', authMiddleware, produitController.createProduit)
router.put('/:id', authMiddleware, produitController.updateProduit)
router.delete('/:id', authMiddleware, produitController.deleteProduit)

module.exports = router