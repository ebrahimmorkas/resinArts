const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  unread: {
    type: Boolean,
    default: true,
  },
  recipient: {
    type: String,
    required: true,
    enum: ['admin'],
    default: 'admin',
  },
  orderId: {
    type: mongoose.Types.ObjectId,
    ref: 'Order',
    required: false,
  },
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  abandonedCartId: {
    type: mongoose.Types.ObjectId,
    ref: 'AbandonedCart',
    required: false,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  type: {
    type: String,
    enum: ['order', 'lowStock', 'outOfStock', 'abandonedCart'],
    default: 'order',
  },
  itemCount: {
    type: Number,
    required: false,
  },
  customerName: {
    type: String,
    required: false,
  },
  whatsappNumber: {
    type: String,
    required: false,
  },
  cartItems: {
    type: Array,
    required: false,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);