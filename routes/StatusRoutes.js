const express = require('express');
const router = express.Router();
const { updateDeviceStatus } = require('../controllers/StatusController');

router.post('/updatee', updateDeviceStatus);

module.exports = router;
