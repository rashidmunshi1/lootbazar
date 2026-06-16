const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    viewerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'view'
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
