// resinArts/backend/routes/abandonedCartRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const {
    getAllAbandonedCarts,
    deleteAbandonedCart,
    deleteMultipleAbandonedCarts,
    sendReminderEmail,
} = require('../controllers/abandonedCartController');

// Admin routes - all require authentication and admin authorization
router.get('/', authenticate, authorize(['admin']), getAllAbandonedCarts);
router.delete('/:id', authenticate, authorize(['admin']), deleteAbandonedCart);
router.post('/delete-multiple', authenticate, authorize(['admin']), deleteMultipleAbandonedCarts);
router.post('/send-reminder/:id', authenticate, authorize(['admin']), sendReminderEmail);

module.exports = router;