const Category = require("../models/CategoryModel");

const CategoryController = {
  // Fetch all categories
  // Fetch all categories (with parent details populated)
  index: async (req, res) => {
    try {
      // .populate('parentId', 'name') fetches the parent's actual name instead of just an ID
      const categories = await Category.find().populate("parentId", "name");
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add a new category
  store: async (req, res) => {
    try {
      const { name, description ,parentId} = req.body;

      // Capture the uploaded image path from multer
      const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

      const newCategory = new Category({
        name,
        description,
        image: imagePath, // Save image path in the database
        parentId: parentId || null,
      });

      const savedCategory = await newCategory.save();
      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Fetch subcategories for a specific parent category filter
  getByParent: async (req, res) => {
    try {
      const { parentId } = req.params;
      const subCategories = await Category.find({ parentId }).populate(
        "parentId",
        "name",
      );
      res.status(200).json(subCategories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Fetch all main categories and automatically group their subcategories inside them
  getAllGrouped: async (req, res) => {
    try {
      // 1. Find all main categories (where parentId is null)
      const mainCategories = await Category.find({
        $or: [{ parentId: null }, { parentId: { $exists: false } }],
      });

      // 2. Map through each main category and find its children
      const groupedData = await Promise.all(
        mainCategories.map(async (mainCat) => {
          const subCategories = await Category.find({ parentId: mainCat._id });

          return {
            _id: mainCat._id,
            name: mainCat.name,
            description: mainCat.description,
            image: mainCat.image,
            subcategories: subCategories, // Tucks the subcategories neatly inside
          };
        }),
      );

      res.status(200).json(groupedData);
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
      const { name, description, image } = req.body;
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, description, image },
        { new: true, runValidators: true },
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
