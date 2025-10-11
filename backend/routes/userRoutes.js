const express = require('express');
const { findUser, fetchUsers, getUserProfile, updateUserProfile, updateAdminProfile } = require('../controllers/userController');
const authorize = require('../middlewares/authorize');
const router = express.Router();

router.get('/all', authorize(['admin']), fetchUsers);
router.post('/find-user', authorize(['user', 'admin']), findUser);
router.get('/profile', authorize(['user', 'admin']), getUserProfile);
router.put('/update-profile', authorize(['user']), updateUserProfile);
router.put('/update-profile-admin', authorize(['admin']), updateAdminProfile);

module.exports = router;