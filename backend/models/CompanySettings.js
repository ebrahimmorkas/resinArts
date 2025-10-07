const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  // Personal Information
  adminName: {
    type: String,
    required: [true, 'Admin name is required'],
    trim: true
  },
  adminWhatsappNumber: {
    type: String,
    trim: true
  },
  adminPhoneNumber: {
    type: String,
    trim: true
  },
  adminAddress: {
    type: String,
    trim: true
  },
  adminCity: {
    type: String,
    trim: true
  },
  adminState: {
    type: String,
    trim: true
  },
  adminPincode: {
    type: String,
    trim: true
  },
  adminEmail: {
    type: String,
    required: [true, 'Admin email is required'],
    trim: true,
    lowercase: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
    companyLogo: {
    type: String,
    default: ''
  },
  instagramId: {
    type: String,
    trim: true
  },
  facebookId: {
    type: String,
    trim: true
  },
  
  // Policies (stored as HTML from React Quill)
  privacyPolicy: {
    type: String,
    default: ''
  },
  returnPolicy: {
    type: String,
    default: ''
  },
  shippingPolicy: {
    type: String,
    default: ''
  },
  refundPolicy: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure only one document exists (singleton pattern)
companySettingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      adminName: 'Admin',
      adminEmail: 'admin@example.com'
    });
  }
  return settings;
};

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = CompanySettings;