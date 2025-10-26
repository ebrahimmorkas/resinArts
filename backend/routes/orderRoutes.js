const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const express = require('express');
const router = express.Router();
const { placeOrder, fetchOrders, shippingPriceUpdate, handleStatusChange, editOrder, sendAcceptEmailWhenShippingPriceAddedAutomatically, rejectZeroQuantityOrder, confirmOrderUpdate, bulkAccept, bulkReject, bulkConfirm, bulkDispatch, bulkComplete, bulkDelete, bulkUpdateShippingPrice, automaticDelete } = require('../controllers/orderController');

router.post('/place-order', authenticate, authorize(['user']), placeOrder);
router.get('/all', authenticate, authorize(['admin']), fetchOrders);
router.post('/shipping-price-update', authenticate, authorize(['admin']), shippingPriceUpdate);
router.post('/status-change', authenticate, authorize(['admin']), handleStatusChange);
router.post('/edit-order/:orderId', authenticate, authorize(['admin']), editOrder);
router.post('/sendAcceptEmailWhenShippingPriceAddedAutomatically', authenticate, authorize(['admin']), sendAcceptEmailWhenShippingPriceAddedAutomatically );
router.post('/reject-zero-quantity-order', authenticate, authorize(['admin']), rejectZeroQuantityOrder);
router.post('/confirm-order-update', authenticate, authorize(['admin']), confirmOrderUpdate);
// Bulk actions routes
router.post('/bulk-accept', authenticate, authorize(['admin']), bulkAccept);
router.post('/bulk-reject', authenticate, authorize(['admin']), bulkReject);
router.post('/bulk-confirm', authenticate, authorize(['admin']), bulkConfirm);
router.post('/bulk-dispatch', authenticate, authorize(['admin']), bulkDispatch);
router.post('/bulk-complete', authenticate, authorize(['admin']), bulkComplete);
router.post('/bulk-delete', authenticate, authorize(['admin']), bulkDelete);
router.post('/bulk-update-shipping', authenticate, authorize(['admin']), bulkUpdateShippingPrice);
// Cron job
router.delete('/automatic-delete', authenticate, authorize(['admin']), automaticDelete);

module.exports = router;
