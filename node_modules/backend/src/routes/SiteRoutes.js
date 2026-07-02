const express = require('express')
const router = express.Router()
const siteController = require('../controllers/SiteController')
const authMiddleware = require('../middlewares/authMiddleware')

router.get('/',     authMiddleware, siteController.getSites)
router.get('/:id',  authMiddleware, siteController.getSiteById)
router.post('/',    authMiddleware, siteController.createSite)
router.put('/:id',  authMiddleware, siteController.updateSite)
router.delete('/:id', authMiddleware, siteController.deleteSite)

module.exports = router