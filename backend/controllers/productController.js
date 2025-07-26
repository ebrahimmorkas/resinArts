const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      category,
      categoryPath,
      details,
      colorVariants,
      sizeVariants,
      pricingSections,
      basePriceRanges,
    } = req.body;

    // Validate required fields
    if (!name || !category || !stock || isNaN(stock) || stock < 0) {
      return res.status(400).json({
        error: 'Product name, category, and valid stock are required',
      });
    }

    if (!colorVariants || JSON.parse(colorVariants).length === 0) {
      return res.status(400).json({
        error: 'At least one color variant is required',
      });
    }

    // Parse JSON strings
    const parsedDetails = details ? JSON.parse(details) : [];
    const parsedColorVariants = JSON.parse(colorVariants);
    const parsedSizeVariants = sizeVariants ? JSON.parse(sizeVariants) : [];
    const parsedPricingSections = pricingSections ? JSON.parse(pricingSections) : [];
    const parsedBasePriceRanges = basePriceRanges ? JSON.parse(basePriceRanges) : [];

    // Validate size variants
    const useDimensions = parsedSizeVariants.some((v) => v.length && v.breadth && v.height);
    const useDropdown = parsedSizeVariants.some((v) => v.size && !v.length && !v.breadth && !v.height);
    if (useDimensions && useDropdown) {
      return res.status(400).json({
        error: 'All size variants must use either dimensions or dropdown, not both',
      });
    }
    if (parsedSizeVariants.length === 0) {
      return res.status(400).json({
        error: 'At least one size variant is required',
      });
    }

    // Process uploaded images
    const colorImages = req.files ? req.files.map((file) => `/Uploads/${file.filename}`) : [];

    // Assign images to color variants (match by index)
    parsedColorVariants.forEach((variant, index) => {
      if (colorImages[index]) {
        variant.image = colorImages[index];
      }
    });

    // Create product
    const product = new Product({
      name,
      price: price ? parseFloat(price) : undefined,
      stock: parseInt(stock),
      category,
      categoryPath: categoryPath ? JSON.parse(categoryPath) : [],
      details: parsedDetails.filter((d) => d.name && d.value),
      colorVariants: parsedColorVariants.map((v) => ({
        color: v.color,
        image: v.image || '',
        price: v.price ? parseFloat(v.price) : undefined,
        isDefault: v.isDefault || false,
        optionalDetails: v.optionalDetails ? v.optionalDetails.filter((d) => d.name && d.value) : [],
        priceRanges: v.priceRanges
          ? v.priceRanges
              .filter((r) => r.minQuantity && r.unitPrice)
              .map((r) => ({
                minQuantity: parseInt(r.minQuantity),
                maxQuantity: r.maxQuantity ? parseInt(r.maxQuantity) : undefined,
                unitPrice: parseFloat(r.unitPrice),
              }))
          : [], // Default to empty array if priceRanges is undefined
      })),
      sizeVariants: parsedSizeVariants.map((v) => ({
        size: v.size || '',
        price: v.price ? parseFloat(v.price) : undefined,
        isDefault: v.isDefault || false,
        optionalDetails: v.optionalDetails.filter((d) => d.name && d.value),
        priceRanges: v.priceRanges
          .filter((r) => r.retailPrice && r.wholesalePrice && r.thresholdQuantity)
          .map((r) => ({
            retailPrice: parseFloat(r.retailPrice),
            wholesalePrice: parseFloat(r.wholesalePrice),
            thresholdQuantity: parseInt(r.thresholdQuantity),
          })),
        length: v.length ? parseFloat(v.length) : undefined,
        breadth: v.breadth ? parseFloat(v.breadth) : undefined,
        height: v.height ? parseFloat(v.height) : undefined,
        forAllColors: v.forAllColors === 'yes',
        availableColors: v.availableColors || [],
      })),
      pricingSections: parsedPricingSections
        .filter((s) => s.color && (s.size || (s.length && s.breadth && s.height)))
        .map((s) => ({
          color: s.color,
          size: s.size || '',
          price: s.price ? parseFloat(s.price) : undefined,
          wholesalePrice: s.wholesalePrice ? parseFloat(s.wholesalePrice) : undefined,
          thresholdQuantity: s.thresholdQuantity ? parseInt(s.thresholdQuantity) : undefined,
          priceRanges: s.priceRanges
            .filter((r) => r.retailPrice && r.wholesalePrice && r.thresholdQuantity)
            .map((r) => ({
              retailPrice: parseFloat(r.retailPrice),
              wholesalePrice: parseFloat(r.wholesalePrice),
              thresholdQuantity: parseInt(r.thresholdQuantity),
            })),
        })),
      basePriceRanges: parsedBasePriceRanges
        .filter((r) => r.retailPrice && r.wholesalePrice && r.thresholdQuantity)
        .map((r) => ({
          retailPrice: parseFloat(r.retailPrice),
          wholesalePrice: parseFloat(r.wholesalePrice),
          thresholdQuantity: parseInt(r.thresholdQuantity),
        })),
    });

    // Save to database
    await product.save();

    return res.status(201).json({
      message: 'Product added successfully',
      product,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlink(path.join(__dirname, '../Uploads', file.filename), (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    return res.status(500).json({
      error: error.message || 'Failed to add product',
    });
  }
};

module.exports = { addProduct };