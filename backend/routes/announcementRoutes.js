const express = require('express');
const { add, fetchAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');

const router = express.Router();

router.post('/add', add);
router.get('/all', fetchAnnouncements);
router.put('/update/:id', updateAnnouncement);
router.delete('/delete/:id', deleteAnnouncement);

module.exports = router;