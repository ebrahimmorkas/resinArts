const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
  },
  parent_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    required: false,
    ref: 'Category',
  },
  image: {
    type: String,
    required: false,
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  deactivatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
}, {
  timestamps: true,
});

categorySchema.index({ parent_category_id: 1 });

module.exports = mongoose.model('Category', categorySchema);