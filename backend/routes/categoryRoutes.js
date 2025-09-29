const express = require('express');
const router = express.Router();
const { addCategory } = require('../controllers/addCategoryController');
const getAllCategories = require('../controllers/getAllCategoriesController');
const {fetchCategories, upload, bulkUploadCategories, deleteCategory} = require("../controllers/categoryController");
const authorize = require('../middlewares/authorize');

router.post('/add', authorize(['admin']), ...addCategory);
router.get('/all', authorize(['admin']), getAllCategories);
// This route is for fetching categories for paying cash to user and this route is not intended for fetchibg categoris on AddProduct.jsx page
router.get('/fetch-categories', authorize(['admin', 'user']), fetchCategories);
router.post('/bulk-upload', authorize(['admin']), upload.single('file'), bulkUploadCategories);
router.delete('/delete-category/:id', deleteCategory);

module.exports = router;