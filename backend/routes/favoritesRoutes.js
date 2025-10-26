const express = require('express');
const router = express.Router();
const { 
  addToFavorites, 
  removeFromFavorites, 
  getFavorites,
  checkFavorites 
} = require('../controllers/favoritesController');
const authenticate = require('../middlewares/authenticate');

// All routes require authentication
router.post('/add', authenticate, addToFavorites);
router.post('/remove', authenticate, removeFromFavorites);
router.get('/list', authenticate, getFavorites);
router.post('/check', authenticate, checkFavorites);

module.exports = router;