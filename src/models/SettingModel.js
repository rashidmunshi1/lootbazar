const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    apiKey: {
        type: String,
        default: '',
        trim: true
    },
    amount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
