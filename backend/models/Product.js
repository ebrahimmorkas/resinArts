const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryPath: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    details: [
      {
        name: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    colorVariants: [
      {
        color: { type: String, trim: true, required: true },
        imageUrl: { type: String, default: null }, // Changed from `image` to `imageUrl`
        price: { type: Number, default: null },
        isDefault: { type: Boolean, default: false },
        forAllSizes: { type: String, default: "yes" },
        availableSizes: [{ type: String, trim: true }],
        optionalDetails: [
          {
            name: { type: String, trim: true },
            value: { type: String, trim: true },
          },
        ],
        priceRanges: [
          {
            retailPrice: { type: Number, default: null },
            wholesalePrice: { type: Number, default: null },
            thresholdQuantity: { type: Number, default: null },
          },
        ],
      },
    ],
    sizeVariants: [
      {
        size: { type: String, trim: true },
        price: { type: Number, default: null },
        isDefault: { type: Boolean, default: false },
        length: { type: Number, default: null },
        breadth: { type: Number, default: null },
        height: { type: Number, default: null },
        forAllColors: { type: String, default: "yes" },
        availableColors: [{ type: String, trim: true }],
        optionalDetails: [
          {
            name: { type: String, trim: true },
            value: { type: String, trim: true },
          },
        ],
        priceRanges: [
          {
            retailPrice: { type: Number, default: null },
            wholesalePrice: { type: Number, default: null },
            thresholdQuantity: { type: Number, default: null },
          },
        ],
      },
    ],
    pricingSections: [
      {
        color: { type: String, trim: true },
        size: { type: String, trim: true },
        priceRanges: [
          {
            retailPrice: { type: Number, default: null },
            wholesalePrice: { type: Number, default: null },
            thresholdQuantity: { type: Number, default: null },
          },
        ],
      },
    ],
    basePriceRanges: [
      {
        retailPrice: { type: Number, default: null },
        wholesalePrice: { type: Number, default: null },
        thresholdQuantity: { type: Number, default: null },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);