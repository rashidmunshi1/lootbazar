const Category = require("../models/CategoryModel");

const CategoryController = {

    // Fetch all categories
    index: async (req, res) => {
        try {
            const categories = await Category.find().select('-image -description').sort({ order: 1 });
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Add a new category
    store: async (req, res) => {
        try {
            const { name, order } = req.body;
    
            const newCategory = new Category({
                name,
                order,
            });
    
            const savedCategory = await newCategory.save();
            const categoryObj = savedCategory.toObject();
            delete categoryObj.image;
            delete categoryObj.description;
            
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
            const category = await Category.findById(id).select('-image -description');
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
            const updatedCategory = await Category.findByIdAndUpdate(
                id,
                { name, order },
                { new: true, runValidators: true }
            ).select('-image -description');
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
