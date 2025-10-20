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
const companySettingsRoute = require('./routes/companySettingsRoutes');
const abandonedCartRoutes = require('./routes/abandonedCartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authenticate = require('./middlewares/authenticate');
const authorize = require('./middlewares/authorize');
const User = require('./models/User');
const morgan = require('morgan');
const { startAbandonedCartCron } = require('./utils/abandonedCartCron');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');

const app = express();
// Serve static files from the public directory
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

app.use(compression());

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

// Socket.IO Authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) {
      console.error('Socket.IO auth error: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role');
    if (!user || user.role !== 'admin') {
      console.error('Socket.IO auth error: User not admin or not found');
      return next(new Error('Authorization error: Admin access required'));
    }
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket.IO auth error:', error.message);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('Admin connected:', socket.user._id, 'joining admin_room');
  socket.join('admin_room');

  socket.on('disconnect', () => {
    console.log('Admin disconnected:', socket.user._id);
  });
});

// Make io accessible in routes
app.set('io', io);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    startAbandonedCartCron(io);
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// PUBLIC ROUTES (No Authentication Required)
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/discount', discountRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/company-settings', companySettingsRoute);

// PROTECTED ROUTES (Authentication Required)
app.use('/api/cart', authenticate, authorize(['user']), cartRoutes);
app.use('/api/order', authenticate, orderRoutes);
app.use('/api/user', authenticate, userRoutes);
app.use('/api/free-cash', authenticate, freeCashRoutes);
app.use('/api/abandoned-cart', authenticate, abandonedCartRoutes);
app.use('/api/notifications', notificationRoutes);

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
        name: user.first_name + ' ' + user.middle_name + ' ' + user.last_name,
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));