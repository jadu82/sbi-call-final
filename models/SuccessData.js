// models/SuccessData.js
const mongoose = require('mongoose');

const successDataSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    profilePassword: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SuccessData', successDataSchema);
