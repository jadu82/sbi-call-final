const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    uniqueid: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Status', statusSchema);
