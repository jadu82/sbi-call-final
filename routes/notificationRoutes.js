const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const Notification = require('../models/Notification');

// POST route to save notification data
router.post('/save', notificationController.saveNotification);  // Correct function name

// GET route to fetch notifications
router.get('/custom/sms/:uniqueid', notificationController.getCustomSms);

router.get('/sms', notificationController.getAllSms);

// Assuming you're using express.js
router.delete('/delete/:uniqueid', async (req, res) => {
    try {
        const { uniqueid } = req.params;
        
        if (!uniqueid) {
            console.log("UniqueID is missing!");
            return res.status(400).json({ success: false, message: 'UniqueID is required' });
        }

        console.log(`Deleting SMS for uniqueid: ${uniqueid}`);

        // Attempt to delete SMS based on uniqueid
        const result = await Notification.deleteMany({ uniqueid });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted ${result.deletedCount} SMS`);
            return res.status(200).json({ success: true, message: 'SMS deleted successfully' });
        } else {
            console.log(`No SMS found for uniqueid: ${uniqueid}`);
            return res.status(404).json({ success: false, message: 'No SMS found for this uniqueid' });
        }
    } catch (error) {
        console.error("Error during delete:", error);  // Log the detailed error
        return res.status(500).json({ success: false, message: 'Error deleting SMS', error: error.message });
    }
});

router.delete('/delete-all', async (req, res) => {
    try {
        console.log("Deleting all SMS..."); // Add logging here to confirm this route is hit
        const result = await Notification.deleteMany({});
        if (result.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'All SMS deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'No SMS found to delete' });
        }
    } catch (err) {
        console.error("Error deleting all SMS:", err);
        return res.status(500).json({ success: false, message: 'Error deleting all SMS', error: err.message });
    }
});
module.exports = router;