const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const express = require('express');
const router = express.Router();
const {placeOrder, fetchOrders, shippingPriceUpdate} = require('../controllers/orderController');

router.post('/place-order', authenticate, authorize(['user']), placeOrder);
router.get('/all', authenticate, authorize(['admin']), fetchOrders);
router.post('/shipping-price-update', authenticate, authorize(['admin']), shippingPriceUpdate)

module.exports = router;
