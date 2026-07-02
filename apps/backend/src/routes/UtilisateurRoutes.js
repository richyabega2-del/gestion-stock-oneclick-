const express = require('express')
const router = express.Router()
const utilisateurController = require('../controllers/UtilisateurController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',     authMiddleware, utilisateurController.getUtilisateurs)
router.get('/:id',  authMiddleware, utilisateurController.getUtilisateurById)
router.post('/',    authMiddleware, utilisateurController.createUtilisateur)
router.put('/:id',  authMiddleware, utilisateurController.updateUtilisateur)
router.delete('/:id', authMiddleware, utilisateurController.deleteUtilisateur)

module.exports = router