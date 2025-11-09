const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress, changeOrderAddress, getUserAddresses } = require('../controllers/addressController');

// All routes require authentication
router.use(authenticate);

// GET /api/address - Get all addresses for logged-in user
router.get('/', getAddresses);

// GET /api/address/:id - Get single address by ID
router.get('/:id', getAddressById);

// POST /api/address - Create new address
router.post('/', createAddress);

// PUT /api/address/:id - Update address
router.put('/:id', updateAddress);

// DELETE /api/address/:id - Delete address
router.delete('/:id', deleteAddress);

// GET /api/address/user/:userId - Get all addresses for a specific user (Admin only)
router.get('/user/:userId', authorize(['admin']), getUserAddresses);

// POST /api/address/change-order-address - Change order delivery address
router.post('/change-order-address', changeOrderAddress);

module.exports = router;