const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const express = require('express');
const router = express.Router();
const {placeOrder, fetchOrders} = require('../controllers/orderController');

router.post('/place-order', authenticate, authorize(['user']), placeOrder);
router.get('/all', authenticate, authorize(['admin']), fetchOrders)

module.exports = router;
