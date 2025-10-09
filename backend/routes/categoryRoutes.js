const express = require('express');
const router = express.Router();
const { addCategory } = require('../controllers/addCategoryController');
const getAllCategories = require('../controllers/getAllCategoriesController');
const { fetchCategories, upload, bulkUploadCategories, deleteCategory, updateCategoryName, updateCategoryImage,  toggleCategoryStatus, bulkToggleCategoryStatus, addSubcategory, toggleSubcategoryStatus } = require("../controllers/categoryController");
const authorize = require('../middlewares/authorize');
const authenticate = require('../middlewares/authenticate');

// PUBLIC ROUTES (No authentication required)
router.get('/fetch-categories', fetchCategories); // Make public for guest browsing

// ADMIN ONLY ROUTES (Authentication + Authorization required)
router.post('/add', authenticate, authorize(['admin']), ...addCategory);
router.get('/all', authenticate, authorize(['admin']), getAllCategories);
router.post('/bulk-upload', authenticate, authorize(['admin']), upload.single('file'), bulkUploadCategories);
router.delete('/delete-category/:id', authenticate, authorize(['admin']), deleteCategory);
router.put('/update-category/:id', authenticate, authorize(['admin']), updateCategoryName);
router.put('/update-category-image/:id', authenticate, authorize(['admin']), upload.single('image'), updateCategoryImage);
router.post('/add-subcategory', authenticate, authorize(['admin']), addSubcategory);
router.post('/toggle-status', authenticate, authorize(['admin']), toggleCategoryStatus);
router.post('/bulk-toggle-status', authenticate, authorize(['admin']), bulkToggleCategoryStatus);
router.post('/toggle-subcategory-status', authenticate, authorize(['admin']), toggleSubcategoryStatus);


module.exports = router;