const Product = require('../models/Product');

exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      categoryPath,
      details,
      colorVariants,
      sizeVariants,
      pricingSections,
      basePriceRanges,
    } = req.body;

    // Parse JSON fields if they are strings
    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
    const parsedColorVariants = typeof colorVariants === 'string' ? JSON.parse(colorVariants) : colorVariants;
    const parsedSizeVariants = typeof sizeVariants === 'string' ? JSON.parse(sizeVariants) : sizeVariants;
    const parsedPricingSections = typeof pricingSections === 'string' ? JSON.parse(pricingSections) : pricingSections;
    const parsedBasePriceRanges = typeof basePriceRanges === 'string' ? JSON.parse(basePriceRanges) : basePriceRanges;
    const parsedCategoryPath = typeof categoryPath === 'string' ? JSON.parse(categoryPath) : categoryPath;

    // Basic validation
    if (!name || !category) {
      return res.status(400).json({ error: 'Product name and category are required' });
    }

    // Handle uploaded images
    const files = req.files || [];
    const updatedColorVariants = parsedColorVariants.map((variant, index) => {
      const file = files.find((f, i) => i === index); // Match file to variant
      return {
        ...variant,
        image: file ? `/uploads/${file.filename}` : null,
      };
    });

    const productData = {
      name,
      price: price || '',
      category,
      categoryPath: parsedCategoryPath || [],
      details: parsedDetails || [],
      colorVariants: updatedColorVariants || [],
      sizeVariants: parsedSizeVariants || [],
      pricingSections: parsedPricingSections || [],
      basePriceRanges: parsedBasePriceRanges || [],
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Server error while adding product' });
  }
};