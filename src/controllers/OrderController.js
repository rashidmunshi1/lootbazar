const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductsModel');

const OrderController = {
    // Store/Create or update order details
    store: async (req, res) => {
        try {
            const { orderId, paymentStatus, userId, productId, dateTime, transactionId } = req.body;

            // Validation of presence
            if (!orderId || !paymentStatus || !userId || !productId || !dateTime) {
                return res.status(400).json({ 
                    success: false,
                    message: "All fields are required: orderId, paymentStatus, userId, productId, dateTime." 
                });
            }

            // Validation of ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid userId format. Must be a 24-character hex string."
                });
            }

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid productId format. Must be a 24-character hex string."
                });
            }

            // Verify if user exists
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            // Verify if product exists
            const productExists = await Product.findById(productId);
            if (!productExists) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found."
                });
            }

            // Parse and validate date
            const parsedDate = new Date(dateTime);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format for dateTime. Please provide a valid date string (e.g. ISO format)."
                });
            }

            // Check if orderId already exists; update it if it does
            let order = await Order.findOne({ orderId });
            if (order) {
                order.paymentStatus = paymentStatus;
                order.userId = userId;
                order.productId = productId;
                order.dateTime = parsedDate;
                if (transactionId !== undefined) {
                    order.transactionId = transactionId;
                }
                await order.save();
                return res.status(200).json({
                    success: true,
                    message: "Order details updated successfully.",
                    data: order
                });
            }

            // Create new order
            const newOrder = new Order({
                orderId,
                paymentStatus,
                userId,
                productId,
                dateTime: parsedDate,
                transactionId
            });

            const savedOrder = await newOrder.save();
            res.status(201).json({
                success: true,
                message: "Order details stored successfully.",
                data: savedOrder
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Fetch all orders with populated user and product details
    index: async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('userId', 'name mobileno email')
                .populate('productId', 'title price')
                .sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Fetch a single order by orderId
    show: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findOne({ orderId })
                .populate('userId', 'name mobileno email')
                .populate('productId', 'title price');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            res.status(200).json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Update order status by orderId
    updateStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { paymentStatus } = req.body;

            if (!paymentStatus) {
                return res.status(400).json({
                    success: false,
                    message: "paymentStatus is required."
                });
            }

            const order = await Order.findOne({ orderId });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            order.paymentStatus = paymentStatus;
            await order.save();

            res.status(200).json({
                success: true,
                message: "Order status updated successfully.",
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = OrderController;
