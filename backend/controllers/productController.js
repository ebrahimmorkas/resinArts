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

    // Parse JSON fields
    const parsedDetails = details ? JSON.parse(details) : [];
    const parsedColorVariants = colorVariants ? JSON.parse(colorVariants) : [];
    const parsedSizeVariants = sizeVariants ? JSON.parse(sizeVariants) : [];
    const parsedPricingSections = pricingSections ? JSON.parse(pricingSections) : [];
    const parsedBasePriceRanges = basePriceRanges ? JSON.parse(basePriceRanges) : [];

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!stock || isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'Valid stock quantity is required' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!parsedColorVariants.length || !parsedColorVariants[0].color) {
      return res.status(400).json({ error: 'At least one color variant is required' });
    }

    // Validate price exclusivity
    const hasBasePrice = price && price !== '';
    const hasColorPrice = parsedColorVariants.some((v) => v.price && v.price !== '');
    const hasSizePrice = parsedSizeVariants.some((v) => v.price && v.price !== '');
    const hasPricingSections = parsedPricingSections.some(
      (s) => (s.price && s.price !== '') || (s.wholesalePrice && s.wholesalePrice !== '') || (s.thresholdQuantity && s.thresholdQuantity !== '')
    );

    if (!hasBasePrice && !hasColorPrice && !hasSizePrice && !hasPricingSections) {
      return res.status(400).json({ error: 'Base price, variant prices, or pricing combinations are required' });
    }
    if (hasBasePrice && hasColorPrice) {
      return res.status(400).json({ error: 'Base price and color variant prices cannot both be set' });
    }
    if (hasColorPrice && hasSizePrice) {
      return res.status(400).json({ error: 'Color variant prices and size variant prices cannot both be set' });
    }

    // Validate size variants (dimensions or dropdown consistency)
    const useDimensions = parsedSizeVariants.some((v) => v.length || v.breadth || v.height);
    const useDropdown = parsedSizeVariants.some((v) => v.size && !v.length && !v.breadth && !v.height);
    if (useDimensions && useDropdown) {
      return res.status(400).json({
        error: 'All size variants must use either the size dropdown or dimensions, not both',
      });
    }
    for (let i = 0; i < parsedSizeVariants.length; i++) {
      const variant = parsedSizeVariants[i];
      if (useDimensions) {
        if (!variant.length || !variant.breadth || !variant.height) {
          return res.status(400).json({
            error: `Length, Breadth, and Height are required for size variant ${i + 1}`,
          });
        }
      } else if (!variant.size) {
        return res.status(400).json({ error: `Size is required for size variant ${i + 1}` });
      }
      if (variant.forAllColors === 'no' && (!variant.availableColors || !variant.availableColors.length)) {
        return res.status(400).json({
          error: `At least one color must be selected for size variant ${i + 1} if not available for all colors`,
        });
      }
    }

    // Validate color variants
    for (let i = 0; i < parsedColorVariants.length; i++) {
      const variant = parsedColorVariants[i];
      if (variant.forAllSizes === 'no' && (!variant.availableSizes || !variant.availableSizes.length)) {
        return res.status(400).json({
          error: `At least one size must be selected for color variant ${i + 1} if not available for all sizes`,
        });
      }
    }

    // Validate price ranges (retail price <= wholesale price)
    for (let i = 0; i < parsedBasePriceRanges.length; i++) {
      const range = parsedBasePriceRanges[i];
      if (range.retailPrice && range.wholesalePrice && parseFloat(range.retailPrice) > parseFloat(range.wholesalePrice)) {
        return res.status(400).json({
          error: `Retail price cannot be greater than wholesale price in base price range ${i + 1}`,
        });
      }
    }
    for (let i = 0; i < parsedColorVariants.length; i++) {
      const variant = parsedColorVariants[i];
      for (let j = 0; j < variant.priceRanges.length; j++) {
        const range = variant.priceRanges[j];
        if (range.retailPrice && range.wholesalePrice && parseFloat(range.retailPrice) > parseFloat(range.wholesalePrice)) {
          return res.status(400).json({
            error: `Retail price cannot be greater than wholesale price in color variant ${i + 1}, price range ${j + 1}`,
          });
        }
      }
    }
    for (let i = 0; i < parsedSizeVariants.length; i++) {
      const variant = parsedSizeVariants[i];
      for (let j = 0; j < variant.priceRanges.length; j++) {
        const range = variant.priceRanges[j];
        if (range.retailPrice && range.wholesalePrice && parseFloat(range.retailPrice) > parseFloat(range.wholesalePrice)) {
          return res.status(400).json({
            error: `Retail price cannot be greater than wholesale price in size variant ${i + 1}, price range ${j + 1}`,
          });
        }
      }
    }

    // Ensure base price equals retail price in the first base price range
    if (hasBasePrice && parsedBasePriceRanges.length > 0) {
      if (!parsedBasePriceRanges[0].retailPrice || parseFloat(parsedBasePriceRanges[0].retailPrice) !== parseFloat(price)) {
        return res.status(400).json({
          error: 'Base price must equal the retail price in the first base price range',
        });
      }
      if (!parsedBasePriceRanges[0].wholesalePrice || !parsedBasePriceRanges[0].thresholdQuantity) {
        return res.status(400).json({
          error: 'Retail Price, Wholesale Price, and Threshold Quantity are required for the first base price range when base price is set',
        });
      }
    }

    // Validate price ranges for variants
    for (let i = 0; i < parsedColorVariants.length; i++) {
      const variant = parsedColorVariants[i];
      if (variant.price && variant.priceRanges.length > 0) {
        const firstRange = variant.priceRanges[0];
        if (!firstRange.retailPrice || !firstRange.wholesalePrice || !firstRange.thresholdQuantity) {
          return res.status(400).json({
            error: `Retail Price, Wholesale Price, and Threshold Quantity are required for the first price range in color variant ${i + 1} when price is set`,
          });
        }
      }
    }
    for (let i = 0; i < parsedSizeVariants.length; i++) {
      const variant = parsedSizeVariants[i];
      if (variant.price && variant.priceRanges.length > 0) {
        const firstRange = variant.priceRanges[0];
        if (!firstRange.retailPrice || !firstRange.wholesalePrice || !firstRange.thresholdQuantity) {
          return res.status(400).json({
            error: `Retail Price, Wholesale Price, and Threshold Quantity are required for the first price range in size variant ${i + 1} when price is set`,
          });
        }
      }
    }

    // Handle image uploads for color variants
    const colorImages = req.files && req.files['colorImages'] ? req.files['colorImages'] : [];
    const colorVariantsWithImages = parsedColorVariants.map((variant, index) => {
      const imageFile = Array.isArray(colorImages) ? colorImages[index] : colorImages;
      return {
        ...variant,
        image: imageFile ? `/uploads/${imageFile.filename}` : null,
      };
    });

    // Clean up parsed data
    const cleanedDetails = parsedDetails.filter((detail) => detail.name && detail.value);
    const cleanedColorVariants = colorVariantsWithImages.filter((variant) => variant.color);
    const cleanedSizeVariants = parsedSizeVariants.filter((variant) => variant.size || (variant.length && variant.breadth && variant.height));
    const cleanedPricingSections = parsedPricingSections.filter(
      (section) => section.color || section.size || section.price || section.wholesalePrice || section.thresholdQuantity
    );
    const cleanedBasePriceRanges = parsedBasePriceRanges.filter(
      (range) => range.retailPrice || range.wholesalePrice || range.thresholdQuantity
    );

    // Prepare product data
    const productData = {
      name,
      price: price || '',
      stock,
      category,
      categoryPath: categoryPath ? JSON.parse(categoryPath) : [],
      details: cleanedDetails,
      colorVariants: cleanedColorVariants,
      sizeVariants: cleanedSizeVariants,
      pricingSections: cleanedPricingSections,
      basePriceRanges: cleanedBasePriceRanges,
    };

    // Save product to database
    const product = new Product(productData);
    await product.save();

    return res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    if (req.files && req.files['colorImages']) {
      const colorImages = Array.isArray(req.files['colorImages'])
        ? req.files['colorImages']
        : [req.files['colorImages']];
      colorImages.forEach((file) => {
        const filePath = path.join(__dirname, '..', 'uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    return res.status(500).json({ error: 'Failed to add product' });
  }
};

module.exports = { addProduct };