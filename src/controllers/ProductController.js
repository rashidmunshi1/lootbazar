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
            
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
            // Fetch products with pagination applied
            const products = await Product.find({ createdAt: { $gt: twentyFourHoursAgo } })
                .skip(skip)
                .limit(limit);
            
            // Count total products for pagination metadata
            const totalProducts = await Product.countDocuments({ createdAt: { $gt: twentyFourHoursAgo } });
    
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
            const { title, description, price, stock, moq, category, userId, location, phoneNumber, images: bodyImages } = req.body;
             // Check if userId exists in the database
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(404).json({ message: "User not found" });
            }

            // Capture image URLs from request body, with fallback to uploaded file names
            let images = [];
            if (bodyImages) {
                images = Array.isArray(bodyImages) ? bodyImages : [bodyImages];
            } else if (Array.isArray(req.files)) {
                images = req.files.map(file => file.filename); 
            }

            const newProduct = new Product({
                title,
                description,
                price,
                stock,
                moq,
                images,
                category,
                userId,
                location,
                phoneNumber
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
            const updateFields = req.body; // Capture the provided fields from the request body
    
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
    
            // ✅ If new image URLs are provided in request body, merge them
            if (updateFields.images) {
                const newImages = Array.isArray(updateFields.images) ? updateFields.images : [updateFields.images];
                updateFields.images = [...product.images, ...newImages];
            } else if (Array.isArray(req.files) && req.files.length > 0) {
                // Fallback if files are uploaded
                const newImages = req.files.map(file => file.path);
                updateFields.images = [...product.images, ...newImages];
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

    deleteImage : async (req, res) => {
        try {
            const { id } = req.params;
            const { index } = req.body; // Image index instead of path
    
            // Fetch the product by ID
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
    
            // Check if the provided index is valid
            if (index < 0 || index >= product.images.length) {
                return res.status(400).json({ message: "Invalid image index" });
            }
    
            // Get the image path based on the index
            const imagePath = product.images[index];
    
            // Remove the image from the array
            product.images.splice(index, 1);
    
            // Attempt to delete the file from the server
            try {
                const normalizedPath = path.normalize(imagePath);
                if (fs.existsSync(normalizedPath)) {
                    fs.unlinkSync(normalizedPath);
                }
            } catch (fileError) {
                console.error("Error deleting file:", fileError);
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
            const { page = 1, limit = 10 } = req.query; // Default values for page and limit
    
            // Convert page and limit to numbers
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
    
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const query = { category: categoryId, createdAt: { $gt: twentyFourHoursAgo } };
    
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
            const { title, category } = req.query; // Get title and category from query parameters
    
            // Check if both title and category are missing
            if (!title && !category) {
                return res.status(400).json({ error: "Please provide a product title or category to search." });
            }
    
            // Build the query object dynamically
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            let query = { createdAt: { $gt: twentyFourHoursAgo } };
            if (title) {
                query.title = { $regex: new RegExp(title, "i") }; // Case-insensitive search for title
            }
            if (category) {
                query.category = category; // Exact match for category ID
            }
    
            // Search products based on the constructed query
            const products = await Product.find(query);
    
            if (products.length === 0) {
                return res.status(404).json({ message: "No products found with the provided criteria." });
            }
    
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
            let viewers = [];
            if (userId && product.userId.toString() === userId) {
                viewers = await Notification.find({ productId: id })
                    .populate('viewerUserId')
                    .sort({ createdAt: -1 });
            }

            res.status(200).json({
                product,
                videos,
                viewsCount,
                viewers
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ProductController;
