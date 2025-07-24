// controllers/getAllCategoriesController.js
const Category = require('../models/Category');

const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter(cat => String(cat.parent_category_id) === String(parentId))
    .map(cat => ({
      _id: cat._id,
      categoryName: cat.categoryName,
      image: cat.image || null,
      subcategories: buildCategoryTree(categories, cat._id)
    }));
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const tree = buildCategoryTree(categories);
    res.status(200).json(tree);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = getAllCategories;