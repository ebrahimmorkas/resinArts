const express = require('express');
const router = express.Router();
const addCategory = require('../controllers/addCategoryController');

router.post('/add', addCategory);

module.exports = router;