const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const authorize = require('../middlewares/authorize');

// Multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });
// const upload = multer({ storage });
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/product/add
router.post('/add', authorize(['admin']), upload.array('colorImages'), productController.addProduct);
router.get('/all', authorize(['admin', 'user']), productController.fetchProducts);

module.exports = router;