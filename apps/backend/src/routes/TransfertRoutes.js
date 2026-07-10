const express = require('express')
const router = express.Router()
const transfertController = require('../controllers/TransfertController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',              authMiddleware, transfertController.getTransferts)
router.get('/:id',           authMiddleware, transfertController.getTransfertById)
router.post('/',             authMiddleware, transfertController.createTransfert)
router.put('/:id/statut',    authMiddleware, transfertController.updateStatut)
router.get('/:id/lignes',    authMiddleware, transfertController.getLignes)
router.post('/:id/lignes',   authMiddleware, transfertController.addLigne)

module.exports = router
