const express = require('express');
const { add, addWithOverride, fetchAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');

const router = express.Router();

router.post('/add', add);
router.post('/add-with-override', addWithOverride); // Added missing route
router.get('/all', fetchAnnouncements);
router.put('/update/:id', updateAnnouncement);
router.delete('/delete/:id', deleteAnnouncement);

module.exports = router;