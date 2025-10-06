const express = require('express');
const router = express.Router();
const companySettingsController = require('../controllers/companySettingsController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Protected routes (Admin only)
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  companySettingsController.getCompanySettings
);

router.put(
  '/',
  authenticate,
  authorize(['admin']),
  companySettingsController.updateCompanySettings
);

// Public routes (no authentication required)
router.get('/policies', companySettingsController.getPublicPolicies);
router.get('/contact', companySettingsController.getContactInfo);

module.exports = router;