const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const express = require('express');
const router = express.Router();
const {placeOrder, fetchOrders, shippingPriceUpdate, handleStatusChange, editOrder, sendAcceptEmailWhenShippingPriceAddedAutomatically, rejectZeroQuantityOrder, confirmOrderUpdate} = require('../controllers/orderController');

router.post('/place-order', authenticate, authorize(['user']), placeOrder);
router.get('/all', authenticate, authorize(['admin']), fetchOrders);
router.post('/shipping-price-update', authenticate, authorize(['admin']), shippingPriceUpdate);
router.post('/status-change', authenticate, authorize(['admin']), handleStatusChange);
router.post('/edit-order/:orderId', authenticate, authorize(['admin']), editOrder);
router.post('/sendAcceptEmailWhenShippingPriceAddedAutomatically', authenticate, authorize(['admin']), sendAcceptEmailWhenShippingPriceAddedAutomatically );
router.post('/reject-zero-quantity-order', rejectZeroQuantityOrder);
router.post('/confirm-order-update', confirmOrderUpdate);

module.exports = router;
