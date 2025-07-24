const express = require('express');
const router = express.Router();
const addCategory = require('../controllers/addCategoryController');
const getAllCategories = require('../controllers/getAllCategoriesController');

router.post('/add', addCategory);
router.get('/all', getAllCategories);

module.exports = router;