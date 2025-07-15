const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    first_name: String,
    middle_name: String,
    last_name: String,
    state: String,
    city: String,
    address: String,
    email: String,
    phone_number: String,
    password: String
});

module.exports = mongoose.model('User', userSchema);