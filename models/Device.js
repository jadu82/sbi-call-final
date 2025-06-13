// models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  model: String,
  manufacturer: String,
  androidVersion: String,
  brand: String,
  simOperator: String,
  uniqueid: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  }
}, {
  timestamps: true    // <-- adds createdAt & updatedAt automatically
});

module.exports = mongoose.model('Device', deviceSchema);
