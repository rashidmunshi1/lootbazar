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
    },
    whatsapp: {
        apiKey: {
            type: String,
            default: '',
            trim: true
        },
        campaignName: {
            type: String,
            default: 'lbotp',
            trim: true
        },
        userName: {
            type: String,
            default: 'Galaxy Traders',
            trim: true
        }
    }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
