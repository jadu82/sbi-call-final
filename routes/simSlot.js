// routes/simSlot.js
const express = require('express');
const router = express.Router();
const simSlotController = require('../controllers/simSlotController');

router.post('/sim-slot-event', simSlotController.handleSimSlotEvent);

module.exports = router;
