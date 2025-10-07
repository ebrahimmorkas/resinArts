const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const freeCashRoutes = require('./routes/freeCashRoutes');
const discountRoutes = require('./routes/discountRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const companySettingsRoute = require('./routes/companySettingsRoutes')
const authenticate = require('./middlewares/authenticate');
const authorize = require('./middlewares/authorize');
const User = require('./models/User');
const morgan = require('morgan');

const app = express();

// Middleware
// app.use(morgan('dev')); // Request logging for debugging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Public product routes
app.use('/api/product', productRoutes); // Make products public

// Public category routes (for browsing)
app.use('/api/category', categoryRoutes); // Make categories public

// Public discount routes (for displaying offers)
app.use('/api/discount', discountRoutes); // Make discounts public

// Public banner routes
app.use('/api/banner', bannerRoutes); // Make banners public

// Public announcement routes
app.use('/api/announcement', announcementRoutes); // Make announcements public

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Cart routes - require authentication
app.use('/api/cart', authenticate, authorize(['user']), cartRoutes);

// Order routes - require authentication
app.use('/api/order', authenticate, orderRoutes);

// User routes - require authentication
app.use('/api/user', authenticate, userRoutes);

// Free cash routes - require authentication
app.use('/api/free-cash', authenticate, freeCashRoutes);

// Company settings routes
app.use('/api/company-settings', companySettingsRoute);

// Authenticated user info
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User logged in',
      user: {
        id: user._id,
        name: user.first_name + " " + user.middle_name + " " + user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        whatsapp_number: user.whatsapp_number,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User profile route
app.get('/api/user/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User profile', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));