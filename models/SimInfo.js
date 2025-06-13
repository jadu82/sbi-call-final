const mongoose = require("mongoose");

const simInfoSchema = new mongoose.Schema({
    uniqueid: { type: String, required: true },
    sim1Number: { type: String, default: null },
    sim1Carrier: { type: String, default: null },
    sim1Slot: { type: Number, default: null },
    sim2Number: { type: String, default: null },
    sim2Carrier: { type: String, default: null },
    sim2Slot: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SimInfo", simInfoSchema);
