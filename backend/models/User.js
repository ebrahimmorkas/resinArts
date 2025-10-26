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
    favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
}],
    zip_code: {
        type: String,
        required: true
    },
    resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
});

userSchema.index({ favorites: 1 });

module.exports = mongoose.model('User', userSchema);