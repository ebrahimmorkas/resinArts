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
  type: {
    type: String,
    enum: ['order', 'lowStock', 'outOfStock'],
    default: 'order',
  },
});

module.exports = mongoose.model('Notification', notificationSchema);