// routes/authRouter.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/login', authController.getLogin);
router.post('/login', authController.login);
router.get('/change-credentials', verifyToken, authController.getChangeCredentials);
router.post('/change-credentials', verifyToken, authController.changeCredentials);

// New route for logging out from all devices
router.post('/logout-all', verifyToken, authController.logoutAll);

module.exports = router;
