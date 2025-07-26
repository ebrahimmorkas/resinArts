const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: String,
    default: '',
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  categoryPath: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  details: [{
    name: { type: String, trim: true },
    value: { type: String, trim: true },
  }],
  colorVariants: [{
    color: { type: String, trim: true, required: true },
    image: { type: String, default: null },
    price: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    optionalDetails: [{
      name: { type: String, trim: true },
      value: { type: String, trim: true },
    }],
    priceRanges: [{
      minQuantity: { type: Number, default: 1 },
      maxQuantity: { type: String, default: '' },
      unitPrice: { type: String, default: '' },
    }],
  }],
  sizeVariants: [{
    size: { type: String, trim: true },
    price: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    length: { type: Number, default: null },
    breadth: { type: Number, default: null },
    height: { type: Number, default: null },
    availableColors: [{ type: String, trim: true }], // New field for selected colors
    optionalDetails: [{
      name: { type: String, trim: true },
      value: { type: String, trim: true },
    }],
    priceRanges: [{
      retailPrice: { type: String, default: '' },
      wholesalePrice: { type: String, default: '' },
      thresholdQuantity: { type: String, default: '' },
    }],
  }],
  pricingSections: [{
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    price: { type: String, default: '' },
    wholesalePrice: { type: String, default: '' },
    thresholdQuantity: { type: String, default: '' },
    priceRanges: [{
      retailPrice: { type: String, default: '' },
      wholesalePrice: { type: String, default: '' },
      thresholdQuantity: { type: String, default: '' },
    }],
  }],
  basePriceRanges: [{
    retailPrice: { type: String, default: '' },
    wholesalePrice: { type: String, default: '' },
    thresholdQuantity: { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);