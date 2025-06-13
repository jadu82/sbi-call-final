const express = require('express');
const Admin = require('../models/Admin');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/settings', async (req, res) => {
    try {
        const admin = await Admin.findOne();
        console.log('Admin Data:', admin);
        res.render('settings', { adminPhoneNumber: admin ? admin.phoneNumber : '' });
    } catch (err) {
        console.error('Error loading settings:', err);
        res.status(500).send('Error loading settings');
    }
});

router.post('/update-number', adminController.updateAdminNumber);

router.get('/number', adminController.getAdminNumber);

module.exports = router;