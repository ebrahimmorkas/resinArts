const express = require('express');
const router = express.Router();
const { addFreeCash, checkFreeCashEligibility } = require('../controllers/freeCashController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

router.post('/add', authenticate, authorize(['admin']), addFreeCash);
router.get('/check-eligibility', authenticate, authorize(['user']), checkFreeCashEligibility);

module.exports = router;