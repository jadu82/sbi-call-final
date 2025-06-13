const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Admin', adminSchema);