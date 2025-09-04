const express = require('express');
const { addBanner, fetchBanners, deleteBanner } = require('../controllers/bannerController');

const router = express.Router();

router.post('/add', addBanner); // Multer is handled in controller
router.get('/fetch-banners', fetchBanners);
router.delete('/delete/:id', deleteBanner);

module.exports = router;