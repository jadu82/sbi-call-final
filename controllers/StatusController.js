const Battery = require('../models/Battery');

exports.updateDeviceStatus = async (req, res) => {
    try {
        const { uniqueid, batteryLevel, isCharging, connectivity } = req.body;

        if (!uniqueid) {
            return res.status(400).json({ message: 'Unique ID is required' });
        }

        const timestamp = new Date(); // ✅ Correct Format

        console.log(`Updating Device Status: 
        UniqueID: ${uniqueid}, Battery: ${batteryLevel}, Charging: ${isCharging}, Connectivity: ${connectivity}, timestamp: ${timestamp.toISOString()}`);

        const updatedBatteryData = await Battery.findOneAndUpdate(
            { uniqueid }, 
            { batteryLevel, isCharging, connectivity, timestamp }, 
            { new: true, upsert: true }
        );

        console.log("Updated Battery Data:", updatedBatteryData);

        res.status(201).json({
            success: true,
            message: "Saved successfully"
        });
    } catch (error) {
        console.error('Error updating device status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
