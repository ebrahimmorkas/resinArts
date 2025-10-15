const express = require('express');
const multer = require('multer');
const path = require('path');
const { findUser, fetchUsers, getUserProfile, updateUserProfile, updateAdminProfile,deleteUsers,sendCustomEmail,importUsers,exportUsers, downloadSample } = require('../controllers/userController');
const authorize = require('../middlewares/authorize');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Only Excel files are allowed'));
        }
        cb(null, true);
    }
});

router.get('/all', authenticate, authorize(['admin']), fetchUsers);
router.post('/find-user', authenticate, authorize(['user', 'admin']), findUser);
router.get('/profile', authenticate, authorize(['user', 'admin']), getUserProfile);
router.put('/update-profile', authenticate, authorize(['user']), updateUserProfile);
router.put('/update-profile-admin', authenticate, authorize(['admin']), updateAdminProfile);
router.post('/delete', authenticate, authorize(['admin']), deleteUsers);
router.post('/send-email', authenticate, authorize(['admin']), sendCustomEmail);
router.post('/import', authenticate, authorize(['admin']), upload.single('file'), importUsers);
router.get('/export', authenticate, authorize(['admin']), exportUsers);
router.get('/sample', downloadSample);

module.exports = router;