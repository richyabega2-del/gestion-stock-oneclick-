const express = require('express')
const router = express.Router()
const parametreController = require('../controllers/ParametreController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',        authMiddleware, parametreController.getParametres)
router.put('/:cle',    authMiddleware, parametreController.updateParametre)

module.exports = router