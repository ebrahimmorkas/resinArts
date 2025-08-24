const Category = require('../models/Category');

// Fetching all the categories (This function is not intended for fteching the categories while the adding the product)
const fetchCategories = async (req, res) => {
    try {
        const categories = await Category.find({});

        if(!categories || categories.length == 0) {
            return res.status(200).json({message: "No user found"});
        }

        // categories found
        return res.status(200).json({message: "categories found", categories});
    } catch(error) {
        return res.status(400).json({message: "Error while fetching categories", error})
    }
};

module.exports = {
    fetchCategories,
}