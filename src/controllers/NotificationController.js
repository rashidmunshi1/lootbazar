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
        if (viewerUserId && product.userId.toString() === viewerUserId.toString()) {
            return res.status(200).json({ message: "Owner viewed the product. No notification stored." });
        }

        // Only create a new entry if this user hasn't viewed this product before
        const existingNotification = await Notification.findOne({
            productId,
            viewerUserId,
            type
        });

        if (!existingNotification) {
            const newNotification = new Notification({
                productId,
                viewerUserId,
                type
            });
            await newNotification.save();
        }

        res.status(201).json({ message: "Product viewed and notification stored successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},

    getNotifications: async (req, res) => {
        try {
            const { userId, isRead } = req.query;
            let query = {};

            if (userId) {
                // Find all products owned by this merchant/user
                const products = await Product.find({ userId }).select('_id');
                const productIds = products.map(p => p._id);
                query.productId = { $in: productIds };
            }

            if (isRead !== undefined) {
                query.isRead = isRead === 'true';
            }

            const notifications = await Notification.find(query)
                .populate('productId viewerUserId')
                .sort({ createdAt: -1 });

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