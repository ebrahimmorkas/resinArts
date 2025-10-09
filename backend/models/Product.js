const mongoose = require("mongoose")

// Schema for dynamic key-value pairs (Product Details, Optional Details)
const keyValueSchema = mongoose.Schema({
  key: { type: String, required: false }, // Made optional for testing
  value: { type: String, required: false }, // Made optional for testing
})

// Schema for Bulk Pricing
const bulkPricingSchema = mongoose.Schema({
  wholesalePrice: { type: Number, required: false }, // Made optional for testing
  quantity: { type: Number, required: false }, // Made optional for testing
})

// Schema for a single Size object
const singleSizeSchema = mongoose.Schema({
  length: { type: Number, required: false },
  breadth: { type: Number, required: false },
  height: { type: Number, required: false },
  unit: { type: String, enum: ["cm", "m", "inch"], required: false }, // Changed to required: false
})

// Schema for 'More Details' section (now representing a specific Size instance)
const moreDetailsSchema = mongoose.Schema({
  size: singleSizeSchema, // This should be an object, not an array
  additionalImages: [String], // Array of Cloudinary URLs
  optionalDetails: [keyValueSchema],
  // Fields for price/stock if they are specific to this moreDetails section
  price: { type: Number, required: false },
  stock: { type: Number, required: false },
  lastRestockedAt: {type: Date, required: false, default: null},
  discountStartDate: {type: Date, required: false, default: null},
    discountEndDate: {type: Date, required: false, default: null},
    discountPrice: {type: Number, required: false, default: ""},
    comeBackToOriginalPrice: {type: Boolean, required: false, default: null},
    discountBulkPricing: [{
  wholesalePrice: { type: Number },
  quantity: { type: Number }
}],
  bulkPricingCombinations: [bulkPricingSchema],
  isActive: { type: Boolean, default: true },
})

// Schema for Product Variants
const productVariantSchema = mongoose.Schema({
  colorName: { type: String, required: false }, // Made optional for testing
  variantImage: { type: String, required: false }, // Cloudinary URL
  optionalDetails: [keyValueSchema], // Variant-specific optional details
  moreDetails: [moreDetailsSchema], // Array of 'More Details' sections (each representing a unique size instance)
  // Fields for price/stock if they are common for all moreDetails sections of this variant
  commonPrice: { type: Number, required: false },
  commonStock: { type: Number, required: false },
  commonBulkPricingCombinations: [bulkPricingSchema],
  isDefault: { type: Boolean, default: false }, // New field for default variant
  isActive: { type: Boolean, default: true },
})

// Main Product Schema
const productSchema = mongoose.Schema(
  {
    name: { type: String, required: false, trim: true }, // Made optional for testing
    mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false }, // Made optional for testing
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false }, // Made optional for testing
    categoryPath: { type: String, required: false }, // e.g., Electronics > Mobiles > Vivo // Made optional for testing
    productDetails: [keyValueSchema],
    stock: { type: Number, required: false, default: "" }, // Required if no variants
    price: { type: Number, required: false, default: "" }, // Required if no variants
    lastRestockedAt: {type: Date, required: false, default: null},
    discountStartDate: {type: Date, required: false, default: null},
    discountEndDate: {type: Date, required: false, default: null},
    discountPrice: {type: Number, required: false, default: ""},
    comeBackToOriginalPrice: {type: Boolean, required: false, default: null},
    discountBulkPricing: [{
  wholesalePrice: { type: Number },
  quantity: { type: Number }
}],
    image: { type: String, required: false, default: "" }, // Main product image URL (Cloudinary)
    additionalImages: [String], // Array of Cloudinary URLs for basic product
    bulkPricing: [bulkPricingSchema], // Bulk pricing for basic product

    hasVariants: { type: Boolean, default: false }, // Flag to indicate if product has variants
    variants: [productVariantSchema], // Array of product variants
     isActive: { type: Boolean, default: true },
    deactivatedBy: { type: String, enum: ['manual', 'category', null], default: null },
    deactivatedDueToCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Product", productSchema)
