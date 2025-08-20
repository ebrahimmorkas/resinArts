const express = require('express');
const { findUser } = require('../controllers/userController');
const authorize = require('../middlewares/authorize');
const router = express.Router();

router.post('/find-user', authorize(['user']), findUser);

module.exports = router;