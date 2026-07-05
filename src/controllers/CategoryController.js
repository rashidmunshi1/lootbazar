const Category = require("../models/CategoryModel");

const CategoryController = {

    // Fetch all categories
    index: async (req, res) => {
        try {
            const categories = await Category.find().sort({ order: 1 });
            const responseData = categories.map(cat => {
                const catObj = cat.toObject();
                return {
                    ...catObj,
                    image: catObj.image || null
                };
            });
            res.status(200).json(responseData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Add a new category
    store: async (req, res) => {
        try {
            const { name, order } = req.body;
            
            let image = null;
            if (req.file) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'categories'
                    });
                    image = uploadResult.secure_url;
                    
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (uploadError) {
                    console.error("Cloudinary upload failed in category store:", uploadError);
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                }
            }
    
            const newCategory = new Category({
                name,
                order,
                image
            });
    
            const savedCategory = await newCategory.save();
            const categoryObj = savedCategory.toObject();
            
            res.status(201).json({
                message: "Category successfully added",
                category: categoryObj
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },    

    // Fetch a single category by ID
    edit: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a category by ID
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, order } = req.body;
            
            const updateData = { name, order };
            
            if (req.file) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'categories'
                    });
                    updateData.image = uploadResult.secure_url;
                    
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (uploadError) {
                    console.error("Cloudinary upload failed in category update:", uploadError);
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                }
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            if (!updatedCategory) {
                return res.status(404).json({ message: "Category not found" });
            }
            res.status(200).json(updatedCategory);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a category by ID
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCategory = await Category.findByIdAndDelete(id);
            if (!deletedCategory) {
                return res.status(404).json({ message: "Category not found" });
            }
            res.status(200).json({ message: "Category deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = CategoryController;
