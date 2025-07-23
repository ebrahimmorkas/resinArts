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
    type: String, // Store image URL for main categories
    required: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries on parent_category_id
categorySchema.index({ parent_category_id: 1 });

module.exports = mongoose.model('Category', categorySchema);