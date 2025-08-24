const express = require('express');
const router = express.Router();
const { addCategory } = require('../controllers/addCategoryController');
const getAllCategories = require('../controllers/getAllCategoriesController');
const {fetchCategories} = require("../controllers/categoryController");

router.post('/add', ...addCategory);
router.get('/all', getAllCategories);
// This route is for fetching categories for paying cash to user and this route is not intended for fetchibg categoris on AddProduct.jsx page
router.get('/fetch-categories', fetchCategories);

module.exports = router;