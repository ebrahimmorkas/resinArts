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
  },
  aboutUs: {
    type: String,
    default: ''
  },
  receiveOrderEmails: {
    type: Boolean,
    default: true
  },
  lowStockAlertThreshold: {
   type: Number,
   default: 10
  },
  receiveLowStockEmail: {
    type: Boolean,
    default: true
  },
  receiveOutOfStockEmail: {
    type: Boolean,
    default: true
  },
  // Dimension based pricing
  dimensionBasedPricing: {
    type: String,
    enum: ['static', 'dynamic'],
    default: 'dynamic'
  },
  // Shipping Price Settings
shippingPriceSettings: {
  isManual: {
    type: Boolean,
    default: true
  },
  sameForAll: {
    type: Boolean,
    default: false
  },
  commonShippingPrice: {
    type: Number,
    default: 0
  },
  shippingType: {
    type: String,
    enum: ['country', 'state', 'city', 'zipcode'],
    default: 'city'
  },
  shippingPrices: [
    {
      location: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  cityPrices: [
    {
      location: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  statePrices: [
    {
      location: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  zipCodePrices: [
    {
      location: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  freeShipping: {
    type: Boolean,
    default: false
  },
  freeShippingAboveAmount: {
    type: Number,
    default: 0
  }
},
 autoDeleteOrders: {
    enabled: {
      type: Boolean,
      default: false
    },
    deleteStatus: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Confirm', 'Dispatched', 'Completed'],
      default: 'Completed'
    },
    deleteAfterUnit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'years'],
      default: 'months'
    },
    deleteAfterValue: {
      type: Number,
      default: 1,
      min: 1
    }
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