const express = require('express');
const { findUser, fetchUsers } = require('../controllers/userController');
const authorize = require('../middlewares/authorize');
const router = express.Router();

router.get('/all', authorize(['admin']), fetchUsers);
router.post('/find-user', authorize(['user']), findUser);

module.exports = router;