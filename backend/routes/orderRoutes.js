const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const express = require('express');
const router = express.Router();
const {placeOrder} = require('../controllers/orderController');

router.post('/place-order', authenticate, authorize(['user']), placeOrder)

module.exports = router;
