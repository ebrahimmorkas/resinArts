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
    whatsapp_number: String,
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        default: 'user',
    },
    zip_code: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);