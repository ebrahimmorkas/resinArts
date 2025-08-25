const express = require('express'); 
const router = express.Router();
const {addFreeCash} = require('../controllers/freeCashController');

router.post('/add', addFreeCash);

module.exports =  router