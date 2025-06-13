// models/authModel.js
const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
  },
  password: { 
    type: String, 
    required: true 
  },
  // New field for token versioning
  tokenVersion: { 
    type: Number, 
    default: 0 
  },
}, { timestamps: true });

const Auth = mongoose.models.Auth || mongoose.model('Auth', authSchema);
module.exports = Auth;
