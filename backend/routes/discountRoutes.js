// routes/discountRoutes.js
const express = require('express');
const router = express.Router();
const authorize = require('../middlewares/authorize');
const { addDiscount, getDiscounts, getDiscountById, updateDiscount, deleteDiscount } = require('../controllers/discountController');

// POST /api/discounts/add - Add new discount
router.post('/add', authorize(['admin']), addDiscount);

// GET /api/discounts - Get all discounts
router.get('/fetch-discount', authorize(['user']), getDiscounts);

// GET /api/discounts/:id - Get discount by ID
router.get('/:id', getDiscountById);

// PUT /api/discounts/:id - Update discount
router.put('/:id', updateDiscount);

// DELETE /api/discounts/:id - Delete discount
router.delete('/:id', deleteDiscount);

module.exports = router;