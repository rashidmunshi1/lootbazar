const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String, // URL for category image
    },
    parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Links a subcategory to its parent category
    default: null
}
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
