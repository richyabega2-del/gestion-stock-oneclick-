const express = require('express')
const router = express.Router()
const logController = require('../controllers/LogController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',                        authMiddleware, logController.getLogs)
router.get('/utilisateur/:user_id',    authMiddleware, logController.getByUtilisateur)
router.post('/',                       authMiddleware, logController.createLog)

module.exports = router