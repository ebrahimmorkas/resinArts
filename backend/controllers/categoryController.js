const Category = require('../models/Category');

// Fetching all the categories (This function is not intended for fteching the categories while the adding the product)
const fetchCategories = async (req, res) => {
    try {
        const categories = await Category.find({});

        if(!categories || categories.length == 0) {
            return res.status(200).json({message: "No categories found"});
        }

        // categories found
        return res.status(200).json({message: "categories found", categories});
    } catch(error) {
        return res.status(400).json({message: "Error while fetching categories", error})
    }
};

// This function will be used by other controller for checking whether categopry exists or not
const findCategoryById = async (categoryID) => {
    try {
        const category = await Category.findById(categoryID);
        return category;
    } catch (error) {
        throw new Error("Error while finding category " + error.message);
    }
}

const findSubCategoryById = async (categoryID) => {
    try {
        const category = await Category.findById(categoryID);
        return category;
    } catch (error) {
        throw new Error("Error while finding category " + error.message);
    }
}

module.exports = {
    fetchCategories,
    findCategoryById,
    findSubCategoryById
}