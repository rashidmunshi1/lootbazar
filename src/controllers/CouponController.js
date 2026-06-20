const Coupon = require('../models/CouponModel');

const CouponController = {
    // Create a new coupon
    store: async (req, res) => {
        try {
            const { code, discountType, discountValue, minOrderValue, isActive, description, expiryDate } = req.body;

            if (!code || !discountValue) {
                return res.status(400).json({ message: "Coupon code and discount value are required." });
            }

            // Check if coupon code already exists
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return res.status(400).json({ message: "Coupon code already exists." });
            }

            const newCoupon = new Coupon({
                code,
                discountType,
                discountValue,
                minOrderValue: minOrderValue || 0,
                isActive: isActive !== undefined ? isActive : true,
                description,
                expiryDate: expiryDate || null
            });

            const savedCoupon = await newCoupon.save();
            res.status(201).json(savedCoupon);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch all coupons
    index: async (req, res) => {
        try {
            const coupons = await Coupon.find().sort({ createdAt: -1 });
            res.status(200).json(coupons);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update coupon details
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { code, discountType, discountValue, minOrderValue, description, expiryDate } = req.body;

            const coupon = await Coupon.findById(id);
            if (!coupon) {
                return res.status(404).json({ message: "Coupon not found" });
            }

            // If updating code, check if new code is already taken
            if (code && code.toUpperCase() !== coupon.code) {
                const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
                if (existingCoupon) {
                    return res.status(400).json({ message: "Coupon code already exists." });
                }
                coupon.code = code;
            }

            if (discountType !== undefined) coupon.discountType = discountType;
            if (discountValue !== undefined) coupon.discountValue = discountValue;
            if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
            if (description !== undefined) coupon.description = description;
            if (expiryDate !== undefined) coupon.expiryDate = expiryDate || null;

            const updatedCoupon = await coupon.save();
            res.status(200).json(updatedCoupon);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Toggle coupon active/inactive status
    toggleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);
            if (!coupon) {
                return res.status(404).json({ message: "Coupon not found" });
            }

            coupon.isActive = !coupon.isActive;
            const updatedCoupon = await coupon.save();
            res.status(200).json(updatedCoupon);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a coupon
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCoupon = await Coupon.findByIdAndDelete(id);
            if (!deletedCoupon) {
                return res.status(404).json({ message: "Coupon not found" });
            }
            res.status(200).json({ message: "Coupon deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch all active and non-expired coupons for mobile app
    activeCoupons: async (req, res) => {
        try {
            const now = new Date();
            const coupons = await Coupon.find({
                isActive: true,
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $gt: now } }
                ]
            }).sort({ createdAt: -1 });
            res.status(200).json(coupons);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Validate and apply a coupon
    validateCoupon: async (req, res) => {
        try {
            const { code, orderAmount } = req.body;

            if (!code) {
                return res.status(400).json({ message: "Coupon code is required." });
            }
            if (orderAmount === undefined || isNaN(orderAmount) || Number(orderAmount) < 0) {
                return res.status(400).json({ message: "Valid order amount is required." });
            }

            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (!coupon) {
                return res.status(404).json({ message: "Coupon code not found." });
            }

            if (!coupon.isActive) {
                return res.status(400).json({ message: "This coupon is currently inactive." });
            }

            if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
                return res.status(400).json({ message: "This coupon has expired." });
            }

            if (Number(orderAmount) < coupon.minOrderValue) {
                return res.status(400).json({ 
                    message: `Minimum order amount of ₹${coupon.minOrderValue} is required to apply this coupon.` 
                });
            }

            let discountAmount = 0;
            if (coupon.discountType === 'percentage') {
                discountAmount = (Number(orderAmount) * coupon.discountValue) / 100;
            } else {
                discountAmount = coupon.discountValue;
            }

            // Cap the discount so it doesn't exceed order amount
            if (discountAmount > Number(orderAmount)) {
                discountAmount = Number(orderAmount);
            }

            const finalAmount = Number(orderAmount) - discountAmount;

            res.status(200).json({
                message: "Coupon applied successfully.",
                coupon: {
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    minOrderValue: coupon.minOrderValue,
                    description: coupon.description
                },
                discountAmount: Number(discountAmount.toFixed(2)),
                finalAmount: Number(finalAmount.toFixed(2))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CouponController;
