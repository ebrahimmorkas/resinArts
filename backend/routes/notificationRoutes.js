const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Get all notifications for admin
router.get('/all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: 'admin' })
      .sort({ time: -1 })
      .limit(50);
    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Mark notification as read
router.post('/mark-read/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { unread: false },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete notification
router.delete('/delete/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: 'admin', unread: true },
      { unread: false }
    );
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Clear all notifications
router.delete('/clear-all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: 'admin' });
    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;