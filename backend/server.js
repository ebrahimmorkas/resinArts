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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Configurable frontend origin
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Serve static files for uploads
// app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit on connection failure
  });

// Routes
// Authentication routes (login, signup, logout)
app.use('/api/auth', authRoutes);

// User routes (if any, e.g., profile management)
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

// Admin routes (protected by authenticate and authorize)
app.use('/api/category', authenticate, authorize(['admin']), categoryRoutes);
app.use('/api/product', authenticate, productRoutes);
app.use('/api/cart', authenticate, authorize(['user']), cartRoutes);
app.use('/api/order', authenticate, orderRoutes);
app.use('/api/user', authenticate, userRoutes);
app.use('/api/free-cash', authenticate, authorize(['admin']), freeCashRoutes);
app.use('/api/discount', authenticate, authorize(['admin']), discountRoutes);

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
        name: user.name,
        role: user.role,
        email: user.email, // Include additional fields as needed
      },
    });
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