const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    isOpen: {
        type: Boolean,
        default: true,
    },
    // Ensure we only ever have one settings document
    singleton: {
        type: String,
        default: 'config',
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
