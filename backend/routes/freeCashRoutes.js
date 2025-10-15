const express = require('express');
const router = express.Router();
const { addFreeCash, checkFreeCashEligibility, bulkAddFreeCash } = require('../controllers/freeCashController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

router.post('/add', authenticate, authorize(['admin']), addFreeCash);
router.get('/check-eligibility', authenticate, authorize(['user']), checkFreeCashEligibility);
router.post('/bulk-add', authenticate, authorize(['admin']), bulkAddFreeCash);

module.exports = router;