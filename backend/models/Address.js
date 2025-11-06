const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  full_address: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique name per user
addressSchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Address', addressSchema);