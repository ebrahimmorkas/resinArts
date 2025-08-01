const Product = require("../models/Product");
const { cloudinary, uploadToCloudinary } = require("../utils/cloudinary");

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

    // Log received data for debugging
    console.log("Received body:", req.body);
    console.log("Received files:", req.files);
    console.log("Number of color variants:", parsedColorVariants.length);
    console.log("Number of uploaded files:", req.files ? req.files.length : 0);

    // Validate required fields
    if (!name || !stock || !category) {
      return res.status(400).json({ error: "Product name, stock, and category are required" });
    }
    if (isNaN(stock) || Number.parseFloat(stock) < 0) {
      return res.status(400).json({ error: "Stock must be a valid non-negative number" });
    }

    // Validate price inputs
    const hasBasePrice = price && price !== "" && !isNaN(price) && Number.parseFloat(price) >= 0;
    const hasColorPrices = parsedColorVariants.some(
      (v) => v.price && v.price !== "" && !isNaN(v.price) && Number.parseFloat(v.price) >= 0
    );
    const hasSizePrices = parsedSizeVariants.some(
      (v) => v.price && v.price !== "" && !isNaN(v.price) && Number.parseFloat(v.price) >= 0
    );
    const hasPricingSections = parsedPricingSections.some(
      (s) =>
        s.priceRanges &&
        s.priceRanges.some(
          (r) =>
            r.retailPrice && r.retailPrice !== "" && !isNaN(r.retailPrice) && Number.parseFloat(r.retailPrice) >= 0
        )
    );

    const activePriceMethods = [hasBasePrice, hasColorPrices, hasSizePrices, hasPricingSections].filter(Boolean).length;

    if (activePriceMethods === 0) {
      return res.status(400).json({
        error: "At least one price (base, color variant, size variant, or pricing combination) is required",
      });
    }
    if (activePriceMethods > 1) {
      return res.status(400).json({
        error: "Only one pricing method (base, color variant, size variant, or combination) can be set",
      });
    }

    // Validate price ranges function
    const validatePriceRanges = (ranges, context) => {
      if (!ranges || ranges.length === 0) return;

      ranges.forEach((range, index) => {
        const retailPrice = Number.parseFloat(range.retailPrice);
        const wholesalePrice = Number.parseFloat(range.wholesalePrice);
        const thresholdQuantity = Number.parseInt(range.thresholdQuantity);

        if (range.retailPrice || range.wholesalePrice || range.thresholdQuantity) {
          if (isNaN(retailPrice) || retailPrice < 0) {
            throw new Error(`Invalid Retail Price in price range ${index + 1} in ${context}`);
          }
          if (isNaN(wholesalePrice) || wholesalePrice < 0) {
            throw new Error(`Invalid Wholesale Price in price range ${index + 1} in ${context}`);
          }
          if (isNaN(thresholdQuantity) || thresholdQuantity < 1) {
            throw new Error(`Invalid Threshold Quantity in price range ${index + 1} in ${context}`);
          }

          if (wholesalePrice > retailPrice) {
            throw new Error(
              `Wholesale price cannot be greater than retail price in price range ${index + 1} in ${context}`
            );
          }

          if (index > 0) {
            const prevThreshold = Number.parseInt(ranges[index - 1].thresholdQuantity);
            if (thresholdQuantity <= prevThreshold) {
              throw new Error(
                `Threshold quantity must be greater than the previous range's threshold in price range ${index + 1} in ${context}`
              );
            }
          }
        }
      });
    };

    // Validate price ranges
    if (hasBasePrice && parsedBasePriceRanges.length > 0) {
      if (Number.parseFloat(parsedBasePriceRanges[0].retailPrice) !== Number.parseFloat(price)) {
        return res.status(400).json({ error: "Base price must equal the retail price in the first base price range" });
      }
    }
    validatePriceRanges(parsedBasePriceRanges, "base price ranges");

    parsedColorVariants.forEach((variant, index) => {
      if (variant.price && variant.priceRanges && variant.priceRanges.length > 0) {
        if (Number.parseFloat(variant.priceRanges[0].retailPrice) !== Number.parseFloat(variant.price)) {
          throw new Error(`Color variant ${index + 1} price must equal the retail price in its first price range`);
        }
      }
      validatePriceRanges(variant.priceRanges, `color variant ${index + 1}`);
    });

    parsedSizeVariants.forEach((variant, index) => {
      if (variant.price && variant.priceRanges && variant.priceRanges.length > 0) {
        if (Number.parseFloat(variant.priceRanges[0].retailPrice) !== Number.parseFloat(variant.price)) {
          throw new Error(`Size variant ${index + 1} price must equal the retail price in its first price range`);
        }
      }
      validatePriceRanges(variant.priceRanges, `size variant ${index + 1}`);
    });

    parsedPricingSections.forEach((section, index) => {
      validatePriceRanges(section.priceRanges, `pricing combination ${index + 1}`);
    });

    // Handle multiple image uploads to Cloudinary for color variants
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log("Files to upload:", req.files.length);
      
      // Upload all images to Cloudinary
      for (const file of req.files) {
        try {
          console.log("Uploading file:", file.originalname);
          const result = await uploadToCloudinary(file.buffer, {
            folder: "ProductImages",
            public_id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique filename
          });
          console.log("Cloudinary upload result:", result);
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          throw new Error(`Failed to upload image ${file.originalname} to Cloudinary: ${uploadError.message}`);
        }
      }
    } else {
      console.log("No files received for upload");
    }

    // Assign image URLs to color variants
    console.log("Image URLs:", imageUrls);
    console.log("Color variants before assignment:", parsedColorVariants);

    // Only assign images to color variants that have a color value
    const validColorVariants = parsedColorVariants.filter(variant => variant.color && variant.color.trim() !== '');
    
    if (imageUrls.length > 0 && validColorVariants.length > 0) {
      // If we have more images than color variants, use all images for the first variants
      // If we have fewer images than color variants, some variants won't have images
      validColorVariants.forEach((variant, index) => {
        if (imageUrls[index]) {
          variant.imageUrl = imageUrls[index];
          console.log(`Assigned image ${index} to color variant: ${variant.color}`);
        } else {
          variant.imageUrl = null;
          console.log(`No image available for color variant: ${variant.color}`);
        }
      });
    } else {
      // Set all imageUrls to null if no images uploaded
      validColorVariants.forEach((variant) => {
        variant.imageUrl = null;
      });
    }

    // Update the parsed color variants with the valid ones (with images assigned)
    parsedColorVariants.length = 0; // Clear the array
    parsedColorVariants.push(...validColorVariants); // Add back only valid variants

    // Log parsed color variants to verify
    console.log("Final Color Variants with images:", JSON.stringify(parsedColorVariants, null, 2));

    // Validate size variants
    const useDimensions = parsedSizeVariants.some((v) => v.useDimensions);
    const useDropdown = parsedSizeVariants.some((v) => !v.useDimensions && v.size);
    if (useDimensions && useDropdown) {
      return res.status(400).json({ error: "All size variants must use either dimensions or dropdown sizes, not both" });
    }
    
    parsedSizeVariants.forEach((variant, index) => {
      if (useDimensions) {
        if (!variant.length || !variant.breadth || !variant.height) {
          throw new Error(`Length, Breadth, and Height are required for size variant ${index + 1}`);
        }
      } else if (!variant.size) {
        throw new Error(`Size is required for size variant ${index + 1}`);
      }
      if (variant.forAllColors === "no" && (!variant.availableColors || variant.availableColors.length === 0)) {
        throw new Error(
          `At least one color must be selected for size variant ${index + 1} if not available for all colors`
        );
      }
    });

    parsedColorVariants.forEach((variant, index) => {
      if (!variant.color) {
        throw new Error(`Color is required for color variant ${index + 1}`);
      }
      if (variant.forAllSizes === "no" && (!variant.availableSizes || variant.availableSizes.length === 0)) {
        throw new Error(
          `At least one size must be selected for color variant ${index + 1} if not available for all sizes`
        );
      }
    });

    // Prepare product data
    const productData = {
      name,
      price: hasBasePrice ? Number.parseFloat(price) : undefined,
      stock: Number.parseInt(stock),
      category,
      categoryPath: categoryPath ? JSON.parse(categoryPath) : [],
      details: parsedDetails,
      colorVariants: parsedColorVariants,
      sizeVariants: parsedSizeVariants,
      pricingSections: parsedPricingSections,
      basePriceRanges: parsedBasePriceRanges,
      restockedAt: null,
      discountedPrice: null,
      discountStartDate: null,
      discountEndDate: null,
    };

    // Log product data before saving
    console.log("Product Data to Save:", JSON.stringify(productData, null, 2));

    // Save product to database
    const newProduct = new Product(productData);
    await newProduct.save();

    // Log saved product
    console.log("Saved Product:", JSON.stringify(newProduct, null, 2));

    res.status(201).json({ 
      message: "Product added successfully", 
      product: newProduct,
      uploadedImages: imageUrls.length 
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

const fetchProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({
      products
    });
  } catch (err) {
    console.log("Error in fetching the products");
    return res.status(500).json({message: 'Internal server error'});
  }
}

module.exports = { addProduct, fetchProducts };