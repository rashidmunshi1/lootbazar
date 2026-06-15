const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    video: {
        type: String, // URL or path to the video file
        required: true
    },
    duration: {
        type: String,
        default: null
    },
    publicId: {
        type: String,
        default: null
    },
    size: {
        type: Number,
        default: null
    },
    mimetype: {
        type: String,
        default: null
    },
    filename: {
        type: String,
        default: null
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000, // Expires after 24 hours
        index: { expires: '24h' } // Automatic deletion after 24 hours
    }
}, { timestamps: true });

const Status = mongoose.model('Status', statusSchema);
module.exports = Status;