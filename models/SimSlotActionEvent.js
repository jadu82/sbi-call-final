// models/SimSlotActionEvent.js
const mongoose = require('mongoose');

const SimSlotActionEventSchema = new mongoose.Schema({
  uniqueid: {
    type: String,
    required: true,
    index: true
  },
  simSlot: {
    type: Number,
    required: true
  },
  actionType: {
    type: String,
    enum: ['register', 'erase'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ensure one doc per (uniqueid, simSlot)
SimSlotActionEventSchema.index({ uniqueid: 1, simSlot: 1 }, { unique: true });

module.exports = mongoose.model('SimSlotActionEvent', SimSlotActionEventSchema);
