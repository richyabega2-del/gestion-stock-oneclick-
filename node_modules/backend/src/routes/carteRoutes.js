const express = require('express')
const router  = express.Router()
const { getCartes, creerCarte, modifierCarte, changerStatut, supprimerCarte, getStats } = require('../controllers/carteController')
const verifierToken = require('../middlewares/authMiddleware')

router.use(verifierToken)

router.get('/',           getCartes)
router.get('/stats',      getStats)
router.post('/',          creerCarte)
router.put('/:id',        modifierCarte)
router.put('/:id/statut', changerStatut)
router.delete('/:id',     supprimerCarte)

module.exports = router
