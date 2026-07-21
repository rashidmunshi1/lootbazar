const Product = require("../models/ProductsModel");
const User = require("../models/UserModel");
const path = require('path');
const fs = require('fs');
const ProductController = {

    // Fetch all products
    index: async (req, res) => {
        try {
            // Get page number and limit from query params, default to page 1 and 10 products per page
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            // Calculate the number of documents to skip
            const skip = (page - 1) * limit;
            
            let query = {};
            if (req.query.all !== 'true') {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                query.createdAt = { $gt: twentyFourHoursAgo };
            }
    
            // Fetch products with pagination applied
            const products = await Product.find(query)
                .skip(skip)
                .limit(limit);
            
            // Count total products for pagination metadata
            const totalProducts = await Product.countDocuments(query);
    
            res.status(200).json({
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts,
                products
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },    

    // Add a new product
    store: async (req, res) => {
        try {
            console.log("Store request - Body:", req.body);
            console.log("Store request - Files:", req.files);
            // Trim keys in req.body to prevent trailing/leading space typos (like 'title ')
            const cleanedBody = {};
            for (const key in req.body) {
                cleanedBody[key.trim()] = req.body[key];
            }
            const { title, description, price, stock, moq, category, userId, location, phoneNumber, paymentStatus, images: bodyImages } = cleanedBody;
             // Check if userId exists in the database
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({ message: "User not found" });
            }

            // Parse category which can be a string, array, or JSON stringified array of category IDs
            let categoryIds = [];
            if (category) {
                if (typeof category === 'string') {
                    try {
                        if (category.startsWith('[') && category.endsWith(']')) {
                            categoryIds = JSON.parse(category);
                        } else {
                            categoryIds = [category];
                        }
                    } catch (e) {
                        categoryIds = [category];
                    }
                } else if (Array.isArray(category)) {
                    categoryIds = category;
                }
            }

            // Capture image URLs from request body, or upload multiple files to Cloudinary
            let images = [];
            
            if (req.files && req.files.length > 0) {
                const cloudinary = require('../Helper/cloudinaryConfig');
                const fs = require('fs');
                for (const file of req.files) {
                    try {
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'products'
                        });
                        images.push({
                            url: result.secure_url,
                            publicId: result.public_id
                        });
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (uploadError) {
                        console.error("Failed to upload product image to Cloudinary in store:", uploadError);
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    }
                }
            } else if (bodyImages) {
                const rawImages = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
                images = rawImages.map(img => {
                    if (typeof img === 'object' && img.url) {
                        return { url: img.url, publicId: img.publicId || null };
                    }
                    return { url: img, publicId: null };
                });
            }

            const newProduct = new Product({
                title,
                description,
                price,
                stock,
                moq,
                images,
                category: categoryIds,
                userId,
                location,
                phoneNumber,
                paymentStatus: paymentStatus || 'pending'
            });
            const savedProduct = await newProduct.save();
            res.status(201).json(savedProduct);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch a single product by ID
    edit: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a product by ID
    update: async (req, res) => {
        try {
            const { id } = req.params;
            // Trim keys in req.body to prevent trailing/leading space typos (like 'title ')
            const updateFields = {};
            for (const key in req.body) {
                updateFields[key.trim()] = req.body[key];
            }
    
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
    
            // Handle image updates
            let mergedImages = [...product.images];
            
            if (req.files && req.files.length > 0) {
                const cloudinary = require('../Helper/cloudinaryConfig');
                const fs = require('fs');
                for (const file of req.files) {
                    try {
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'products'
                        });
                        mergedImages.push({
                            url: result.secure_url,
                            publicId: result.public_id
                        });
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (uploadError) {
                        console.error("Failed to upload updated product image to Cloudinary:", uploadError);
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    }
                }
                updateFields.images = mergedImages;
            } else if (updateFields.images) {
                const rawImages = Array.isArray(updateFields.images) ? updateFields.images : [updateFields.images];
                const formattedImages = rawImages.map(img => {
                    if (typeof img === 'object' && img.url) {
                        return { url: img.url, publicId: img.publicId || null };
                    }
                    return { url: img, publicId: null };
                });
                updateFields.images = [...product.images, ...formattedImages];
            }
    
            // Handle category updates
            if (updateFields.category) {
                let categoryIds = [];
                if (typeof updateFields.category === 'string') {
                    try {
                        if (updateFields.category.startsWith('[') && updateFields.category.endsWith(']')) {
                            categoryIds = JSON.parse(updateFields.category);
                        } else {
                            categoryIds = [updateFields.category];
                        }
                    } catch (e) {
                        categoryIds = [updateFields.category];
                    }
                } else if (Array.isArray(updateFields.category)) {
                    categoryIds = updateFields.category;
                }
                updateFields.category = categoryIds;
            }
    
            // ✅ Merge existing product data with the provided fields
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                { $set: updateFields }, // Only update the provided fields
                { new: true, runValidators: true }
            );
    
            res.status(200).json(updatedProduct);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }    
    },

    deleteImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { imageId, index } = req.body; 
    
            // Fetch the product by ID
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            
            let targetImage = null;
            let targetIndex = -1;

            if (imageId) {
                // Find image by its subdocument _id
                targetIndex = product.images.findIndex(img => img._id && img._id.toString() === imageId);
                if (targetIndex !== -1) {
                    targetImage = product.images[targetIndex];
                } else {
                    return res.status(404).json({ message: "Image ID not found on this product" });
                }
            } else if (index !== undefined) {
                // Fallback to index
                const idx = parseInt(index);
                if (idx >= 0 && idx < product.images.length) {
                    targetIndex = idx;
                    targetImage = product.images[idx];
                } else {
                    return res.status(400).json({ message: "Invalid image index" });
                }
            } else {
                return res.status(400).json({ message: "Please provide imageId or index to delete" });
            }

            const imagePath = targetImage.url;
            const publicId = targetImage.publicId;

            // Remove the image from the array
            product.images.splice(targetIndex, 1);
    
            // Attempt to delete the file from the server or Cloudinary
            if (publicId) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    await cloudinary.uploader.destroy(publicId);
                } catch (clError) {
                    console.error("Failed to delete image from Cloudinary:", clError);
                }
            } else if (imagePath && imagePath.includes('cloudinary.com')) {
                // Extract publicId fallback
                const extractPublicId = (url) => {
                    try {
                        const parts = url.split('/upload/');
                        if (parts.length > 1) {
                            const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
                            const extensionIndex = pathAfterUpload.lastIndexOf('.');
                            return extensionIndex !== -1 ? pathAfterUpload.substring(0, extensionIndex) : pathAfterUpload;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    return null;
                };
                const extractedId = extractPublicId(imagePath);
                if (extractedId) {
                    try {
                        const cloudinary = require('../Helper/cloudinaryConfig');
                        await cloudinary.uploader.destroy(extractedId);
                    } catch (clError) {
                        console.error("Failed to delete image from Cloudinary:", clError);
                    }
                }
            } else if (imagePath) {
                try {
                    const normalizedPath = path.normalize(imagePath);
                    const fs = require('fs');
                    if (fs.existsSync(normalizedPath)) {
                        fs.unlinkSync(normalizedPath);
                    }
                } catch (fileError) {
                    console.error("Error deleting local file:", fileError);
                }
            }
    
            // Save the updated product data
            await product.save();
            res.status(200).json({ message: "Image deleted successfully", product });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a product by ID
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedProduct = await Product.findByIdAndDelete(id);
            if (!deletedProduct) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    listBycategoryId: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const { page = 1, limit = 10, search, title, all } = req.query;
    
            // Convert page and limit to numbers
            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
    
            let query = { category: categoryId, paymentStatus: 'paid' };

            // Default behavior is to restrict to products from the last 24 hours, unless all=true is passed
            if (all !== 'true') {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                query.createdAt = { $gt: twentyFourHoursAgo };
            }

            // Apply search term filtering on title and description if provided
            const searchTerm = search || title;
            if (searchTerm) {
                query.$or = [
                    { title: { $regex: new RegExp(searchTerm, "i") } },
                    { description: { $regex: new RegExp(searchTerm, "i") } }
                ];
            }
    
            // Fetch products with pagination
            const products = await Product.find(query)
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber);
    
            // Count total products for the category
            const totalProducts = await Product.countDocuments(query);
    
            res.status(200).json({
                products,
                totalPages: Math.ceil(totalProducts / limitNumber),
                currentPage: pageNumber,
                totalProducts
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    searchProduct: async (req, res) => {
        try {
            const { title, category, search } = req.query;
            const mongoose = require('mongoose');
            const Category = require("../models/CategoryModel");
            
            let query = { paymentStatus: 'paid' };

            // By default, if no search term/category is provided, restrict to active products (last 24 hours)
            if (req.query.all !== 'true' && !search && !title && !category) {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                query.createdAt = { $gt: twentyFourHoursAgo };
            }

            // 1. If explicit category is passed
            if (category) {
                if (mongoose.Types.ObjectId.isValid(category)) {
                    query.category = category;
                } else {
                    // Search by category name
                    const matchedCategory = await Category.findOne({
                        name: { $regex: new RegExp(category, "i") }
                    });
                    if (matchedCategory) {
                        query.category = matchedCategory._id;
                    } else {
                        // Category name was passed but not found in DB
                        return res.status(200).json([]);
                    }
                }
            }

            // 2. If general search or title parameter is passed
            const term = search || title;
            if (term) {
                let orConditions = [];

                // Match product title
                orConditions.push({ title: { $regex: new RegExp(term, "i") } });

                // If term is a valid ObjectId (directly search category by ID)
                if (mongoose.Types.ObjectId.isValid(term)) {
                    orConditions.push({ category: term });
                } else {
                    // Match category name
                    const matchingCategories = await Category.find({
                        name: { $regex: new RegExp(term, "i") }
                    });
                    const categoryIds = matchingCategories.map(cat => cat._id);
                    if (categoryIds.length > 0) {
                        orConditions.push({ category: { $in: categoryIds } });
                    }
                }

                query.$or = orConditions;
            }

            // Search products based on the constructed query
            const products = await Product.find(query).populate('category');
    
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    listByuserId: async (req, res) => {
        try {
            const { userId } = req.params;
    
            // Find all products with the provided user ID
            const products = await Product.find({ userId: userId });
    
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    produtsDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.query; // Current logged-in user ID requesting details
            
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            // Fetch videos (status) associated with this product
            const Status = require("../models/StatusModel");
            const videos = await Status.find({ productId: id });

            // Count total product views
            const Notification = require("../models/NotificationModel");
            const viewsCount = await Notification.countDocuments({ productId: id });

            // Fetch viewers list only if the logged-in user is the product owner
            let viewers = {};
            if (userId && product.userId.toString() === userId) {
                const rawViewers = await Notification.find({ productId: id })
                    .populate('viewerUserId')
                    .sort({ createdAt: -1 });

                // Helper to format time in human format
                const formatHumanTime = (dateString) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const seconds = Math.floor((now - date) / 1000);
                    
                    if (seconds < 60) return 'Just now';
                    const minutes = Math.floor(seconds / 60);
                    if (minutes < 60) return `${minutes} minutes ago`;
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return `${hours} hours ago`;
                    const days = Math.floor(hours / 24);
                    if (days === 1) return 'Yesterday';
                    if (days < 30) return `${days} days ago`;
                    
                    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                };

                const flatViewers = rawViewers.map(v => {
                    const viewer = v.viewerUserId || {};
                    return {
                        userId: viewer._id || null,
                        name: viewer.name || "Unknown User",
                        profileImage: viewer.profileImage || null,
                        address: viewer.address || "Not specified",
                        phoneNumber: viewer.mobileno || "Not specified",
                        time: formatHumanTime(v.viewedAt || v.createdAt),
                        type: v.type || 'view'
                    };
                });

                // Group viewers by type directly into the viewers object
                flatViewers.forEach(v => {
                    const t = v.type || 'view';
                    if (!viewers[t]) {
                        viewers[t] = [];
                    }
                    viewers[t].push(v);
                });
            }

            // Fetch similar products in the same category (excluding current product)
            const similarProducts = await Product.find({
                _id: { $ne: id },
                category: { $in: product.category }
            }).limit(10);

            res.status(200).json({
                product,
                videos,
                viewsCount,
                viewers,
                similarProducts
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    uploadProductImage: async (req, res) => {
        try {
            const { userId, productId } = req.body;
            
            if (!productId) {
                return res.status(400).json({ message: "productId is required" });
            }
            if (!userId) {
                return res.status(400).json({ message: "userId is required" });
            }
            if (!req.file) {
                return res.status(400).json({ message: "image file is required" });
            }

            // Verify product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            // Verify user exists
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({ message: "User not found" });
            }

            // Upload image to Cloudinary
            const cloudinary = require('../Helper/cloudinaryConfig');
            let imageUrl = '';
            let publicId = null;

            try {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'products'
                });
                imageUrl = result.secure_url;
                publicId = result.public_id;

                // Clean up local temp file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (uploadError) {
                console.error("Cloudinary upload failed, using local fallback path:", uploadError);
                // Fallback to local upload path if Cloudinary fails or is not configured
                imageUrl = req.file.path;
            }

            // Push to product's images array
            product.images.push({
                url: imageUrl,
                publicId: publicId
            });

            await product.save();

            res.status(200).json({
                message: "Image uploaded and added to product successfully",
                imageUrl,
                publicId,
                product
            });
        } catch (error) {
            // Clean up temp file in case of error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: error.message });
        }
    },

    // Update payment status of a product listing
    updatePaymentStatus: async (req, res) => {
        try {
            const { productId, userId, paymentStatus } = req.body;
            const mongoose = require('mongoose');

            // Validation of fields presence
            if (!productId || !userId || !paymentStatus) {
                return res.status(400).json({
                    success: false,
                    message: "productId, userId, and paymentStatus are required."
                });
            }

            // Validation of ObjectId format
            if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid format for productId or userId. Must be a 24-character hex string."
                });
            }

            // Update status directly using findOneAndUpdate to avoid validating unrelated fields (like legacy images with missing url)
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: productId, userId },
                { $set: { paymentStatus } },
                { new: true, runValidators: true }
            );

            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product listing not found for the given productId and userId."
                });
            }

            res.status(200).json({
                success: true,
                message: "Product listing payment status updated successfully.",
                product: updatedProduct
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = ProductController;
