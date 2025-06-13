const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    senderNumber: { type: String }, // Sender's actual number or ID
    receiverNumber: { type: String, required: true }, // SIM number on which SMS received
    title: { type: String, required: true },
    body: { type: String, required: true },
    timestamp: { type: String, required: true },
    uniqueid: { type: String, required: true }
});

module.exports = mongoose.model('Notification', notificationSchema);
