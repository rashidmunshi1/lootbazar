const Notification = require('../models/NotificationModel');
const Product = require('../models/ProductsModel');


const notificationController = {
viewProduct: async (req, res) => {
    try {
        const { productId } = req.params;  
        const { viewerUserId, type: bodyType } = req.body;
        const queryType = req.query.type;
        const type = bodyType || queryType || 'view';

        // Fetch the product and check if it exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        // Prevent notification if the owner views their own product
        if (product.userId.toString() === viewerUserId) {
            return res.status(200).json({ message: "Owner viewed the product. No notification stored." });
        }

        // Create a notification entry for product view
        const newNotification = new Notification({
            productId,
            viewerUserId,
            type
        });
        await newNotification.save();

        res.status(201).json({ message: "Product viewed and notification stored successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},

getNotifications: async (req, res) => {
        try {
            const notifications = await Notification.find({ isRead: false }).populate('productId viewerUserId');
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getProductViewers: async (req, res) => {
        try {
            const { productId } = req.params;
            const viewers = await Notification.find({ productId })
                .populate('viewerUserId')
                .sort({ createdAt: -1 });
            res.status(200).json(viewers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificationController;