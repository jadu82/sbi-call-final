const mongoose = require('mongoose');

const BatterySchema = new mongoose.Schema({
    uniqueid: { type: String, required: true },
    batteryLevel: { type: Number, required: true },
    isCharging: { type: Boolean, required: true },
    connectivity: { type: String, enum: ["Online", "Offline"], required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Battery', BatterySchema);
