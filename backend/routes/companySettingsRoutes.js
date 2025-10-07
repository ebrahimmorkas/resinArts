const express = require('express');
const router = express.Router();
const companySettingsController = require('../controllers/companySettingsController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const multer = require('multer');

// Multer configuration for file upload
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Protected routes (Admin only)
router.get(
  '/',
  authenticate,
  authorize(['admin', 'user']),
  companySettingsController.getCompanySettings
);

router.put(
  '/',
  authenticate,
  authorize(['admin']),
  upload.single('logo'),
  companySettingsController.updateCompanySettings
);

// Public routes (no authentication required)
router.get('/policies', companySettingsController.getPublicPolicies);
router.get('/contact', companySettingsController.getContactInfo);

module.exports = router;