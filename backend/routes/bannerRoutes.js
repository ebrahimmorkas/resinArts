const express = require('express');
const { addBanner, fetchBanners, updateBannerDefault, deleteBanner } = require('../controllers/bannerController');

const router = express.Router();

router.post('/add', addBanner); // Multer is handled in controller
router.get('/fetch-banners', fetchBanners);
router.put('/update-default/:id', updateBannerDefault); // New route for updating default status
router.delete('/delete/:id', deleteBanner);

module.exports = router;