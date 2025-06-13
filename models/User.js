// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uniqueid: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
