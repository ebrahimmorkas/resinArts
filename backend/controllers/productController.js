const { default: mongoose } = require("mongoose");
const Product = require("../models/Product");
const { cloudinary } = require("../utils/cloudinary");
const multer = require("multer");
const e = require("express");
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Category = require('../models/Category');



// Start of function to check the file extension
const fileFilter = (req, file, cb) => {
  // Check file extensions
  const allowedExtensions = ['.xlsx', '.csv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed extensions: ${allowedExtensions.join(', ')}`), false);
  }
};
// End of function to check the file extension

// Configure multer for in-memory storage to handle file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
})

// Helper function to upload a single product's image to Cloudinary
// Start of function to add product to cloudinary for single product
const uploadImageToCloudinary = async (fileBuffer, folder) => {
  if (!fileBuffer) return null

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: folder }, (error, result) => {
      if (error) reject(error)
      else resolve(result.secure_url)
    })
    uploadStream.end(fileBuffer)
  })
}
// End of function to add product's image to cloudinary

// Start of function to upload image to cloudinary for bulk edit
const BulkUploadImageToCloudinary = async (imagePath, folder = 'products') => {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at path: ${imagePath}`);
    }

    // Check file extension
    const allowedImageExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = path.extname(imagePath).toLowerCase();
    
    if (!allowedImageExtensions.includes(fileExtension)) {
      throw new Error(`Invalid image format. Allowed: ${allowedImageExtensions.join(', ')}`);
    }

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: folder,
      resource_type: 'image'
    });
    
    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
// End of function to upload image to cloudinary for bulk edit

// Start of function to add single product
const addProduct = async (req, res) => {
  try {
    // Parse JSON fields from FormData
    const productData = JSON.parse(req.body.productData)
    const {
      name,
      mainCategory,
      subCategory,
      categoryPath,
      productDetails,
      stock,
      price,
      bulkPricing,
      hasVariants,
      variants,
    } = productData

    // Map uploaded files by their fieldname for easier access
    const uploadedFiles = {}
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (!uploadedFiles[file.fieldname]) {
          uploadedFiles[file.fieldname] = []
        }
        uploadedFiles[file.fieldname].push(file)
      })
    }

    // Handle main product image upload
    let imageUrl = null
    const mainImageFile = uploadedFiles["image"]?.[0]
    if (mainImageFile) {
      imageUrl = await uploadImageToCloudinary(mainImageFile.buffer, "products")
    }

    // Handle additional images for basic product
    const additionalImagesUrls = []
    const basicAdditionalImages = uploadedFiles["additionalImages"]
    if (basicAdditionalImages && basicAdditionalImages.length > 0) {
      for (const file of basicAdditionalImages) {
        const url = await uploadImageToCloudinary(file.buffer, "products/additional")
        if (url) additionalImagesUrls.push(url)
      }
    }

    // Prepare basic product data
    const newProductData = {
      name,
      mainCategory,
      subCategory,
      categoryPath,
      productDetails: productDetails || [],
      stock: hasVariants ? undefined : stock, // Only include if no variants
      price: hasVariants ? undefined : price, // Only include if no variants
      image: hasVariants ? undefined : imageUrl, // Only include if no variants
      additionalImages: hasVariants ? [] : additionalImagesUrls, // Only include if no variants
      bulkPricing: hasVariants ? [] : bulkPricing, // Only include if no variants
      hasVariants,
    }

    // Process variants if they exist
    if (hasVariants && variants && variants.length > 0) {
      let defaultVariantFound = false
      newProductData.variants = await Promise.all(
        variants.map(async (variant, variantIndex) => {
          // Handle variant image
          let variantImageUrl = null
          const variantImageFile = uploadedFiles[`variants[${variantIndex}].variantImage`]?.[0]
          if (variantImageFile) {
            variantImageUrl = await uploadImageToCloudinary(variantImageFile.buffer, "products/variants")
          }

          // Process 'moreDetails' sections (now 'size' instances) within each variant
          const processedMoreDetails = await Promise.all(
            variant.moreDetails.map(async (md, mdIndex) => {
              const mdAdditionalImagesUrls = []
              // Always check for files, regardless of reuse flag.
              // If reuse was selected on frontend, the file object was copied.
              const mdAdditionalImagesFiles =
                uploadedFiles[`variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`]
              if (mdAdditionalImagesFiles && mdAdditionalImagesFiles.length > 0) {
                for (const file of mdAdditionalImagesFiles) {
                  const url = await uploadImageToCloudinary(file.buffer, "products/variants/more-details")
                  if (url) mdAdditionalImagesUrls.push(url)
                }
              }

              // Explicitly process size fields: convert to Number or null if empty string
              const processedSize = {
                length: md.size.length !== "" ? Number(md.size.length) : null,
                breadth: md.size.breadth !== "" ? Number(md.size.breadth) : null,
                height: md.size.height !== "" ? Number(md.size.height) : null,
                unit: md.size.unit !== "" ? md.size.unit : null, // Also handle unit as null if empty
              }

              // Process optional details: if reusing, use the array directly from productData
              const processedOptionalDetails =
                md.reuseOptionalDetails === "yes" && md.optionalDetails
                  ? md.optionalDetails
                  : md.optionalDetails.filter((od) => od.key && od.value)

              // Determine price, stock, and bulk pricing for this specific moreDetails entry
              // If 'isPriceSame' is 'yes' or there's only one size section, use common price/bulk pricing
              const finalPrice =
                variant.isPriceSame === "yes" || variant.moreDetails.length === 1 ? variant.commonPrice : md.price
              const finalBulkPricingCombinations =
                variant.isPriceSame === "yes" || variant.moreDetails.length === 1
                  ? variant.commonBulkPricingCombinations.filter((bpc) => bpc.wholesalePrice && bpc.quantity)
                  : md.bulkPricingCombinations.filter((bpc) => bpc.wholesalePrice && bpc.quantity)

              // If 'isStockSame' is 'yes' or there's only one size section, use common stock
              const finalStock =
                variant.isStockSame === "yes" || variant.moreDetails.length === 1 ? variant.commonStock : md.stock

              return {
                ...md,
                additionalImages: mdAdditionalImagesUrls, // Use the URLs from uploaded files
                optionalDetails: processedOptionalDetails, // Use processed optional details
                size: processedSize, // Use the processed size object
                price: finalPrice, // Always include price
                stock: finalStock, // Always include stock
                bulkPricingCombinations: finalBulkPricingCombinations, // Always include bulk pricing
              }
            }),
          )

          // Validate and set default variant
          if (variant.isDefault) {
            if (defaultVariantFound) {
              // If another default was already found, this is an error or needs to be unset
              return res.status(400).json({ error: "Only one product variant can be set as default." })
            }
            defaultVariantFound = true
          }

          return {
            ...variant,
            variantImage: variantImageUrl,
            moreDetails: processedMoreDetails,
            // Remove commonPrice, commonStock, commonBulkPricingCombinations from the variant object itself
            // as they are now propagated to each moreDetails entry
            commonPrice: undefined,
            commonStock: undefined,
            commonBulkPricingCombinations: undefined,
          }
        }),
      )
    }

    const newProduct = new Product(newProductData)
    const savedProduct = await newProduct.save()

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}
// End of function to add single product

// Start of function for bulk adding product
const bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload an Excel (.xlsx) or CSV file.'
      });
    }

    // Parse Excel/CSV file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid format.'
      });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      successCount: 0,
      failCount: 0
    };

    // Group rows by product name to handle variants
    const productGroups = {};
    jsonData.forEach((row, index) => {
      const productName = row.productName?.trim();
      if (!productName) return;
      
      if (!productGroups[productName]) {
        productGroups[productName] = [];
      }
      productGroups[productName].push({ ...row, originalRowIndex: index });
    });

    results.totalProcessed = Object.keys(productGroups).length;

    // Process each product
    for (const [productName, productRows] of Object.entries(productGroups)) {
      try {
        const firstRow = productRows[0];
        
        // Validate required fields
        if (!firstRow.mainCategory || !firstRow.subCategory) {
          throw new Error('Missing required fields: mainCategory or subCategory');
        }

        // Verify categories exist
        const mainCategory = await Category.findById(firstRow.mainCategory);
        const subCategory = await Category.findById(firstRow.subCategory);
        
        if (!mainCategory) {
          throw new Error(`Main category not found: ${firstRow.mainCategory}`);
        }
        if (!subCategory) {
          throw new Error(`Sub category not found: ${firstRow.subCategory}`);
        }

        // Parse product details
        let productDetails = [];
        if (firstRow.productDetails) {
          try {
            const parsed = JSON.parse(firstRow.productDetails);
            productDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
          } catch (e) {
            // If not JSON, treat as plain text
            productDetails = [{ key: 'details', value: String(firstRow.productDetails) }];
          }
        }

        // Handle main product image
        let mainImageUrl = '';
        if (firstRow.mainImage && firstRow.mainImage.trim() !== '') {
          try {
            mainImageUrl = await BulkUploadImageToCloudinary(firstRow.mainImage.trim(), 'products');
          } catch (imageError) {
            throw new Error(`Main image upload failed: ${imageError.message}`);
          }
        }

        // Handle additional images
        let additionalImageUrls = [];
        if (firstRow.additionalImages && firstRow.additionalImages.trim() !== '') {
          const imagePaths = firstRow.additionalImages.split(',').map(path => path.trim());
          for (const imagePath of imagePaths) {
            try {
              const imageUrl = await BulkUploadImageToCloudinary(imagePath, 'products/additional');
              additionalImageUrls.push(imageUrl);
            } catch (imageError) {
              // Log error but continue with other images
              console.error(`Additional image upload failed for ${imagePath}:`, imageError.message);
            }
          }
        }

        // Parse bulk pricing
        let bulkPricing = [];
        if (firstRow.bulkPricing && firstRow.bulkPricing.trim() !== '' && firstRow.bulkPricing !== '[]') {
          try {
            bulkPricing = JSON.parse(firstRow.bulkPricing);
          } catch (e) {
            console.error('Invalid bulk pricing JSON:', firstRow.bulkPricing);
          }
        }

        // Create base product object
        const productData = {
          name: productName,
          mainCategory: firstRow.mainCategory,
          subCategory: firstRow.subCategory,
          categoryPath: firstRow.categoryPath || '',
          productDetails: productDetails,
          image: mainImageUrl,
          additionalImages: additionalImageUrls,
          bulkPricing: bulkPricing,
          hasVariants: firstRow.hasVariants === 'TRUE' || firstRow.hasVariants === true,
        };

        // Handle variants or simple product
        if (productData.hasVariants) {
          // Group rows by variant color name
          const variantGroups = {};
          productRows.forEach(row => {
            const colorName = row.variantColorName?.trim() || 'default';
            if (!variantGroups[colorName]) {
              variantGroups[colorName] = [];
            }
            variantGroups[colorName].push(row);
          });

          const variants = [];
          
          for (const [colorName, variantRows] of Object.entries(variantGroups)) {
            const firstVariantRow = variantRows[0];
            
            // Upload variant image
            let variantImageUrl = '';
            if (firstVariantRow.variantImage && firstVariantRow.variantImage.trim() !== '') {
              try {
                variantImageUrl = await BulkUploadImageToCloudinary(firstVariantRow.variantImage.trim(), 'products/variants');
              } catch (imageError) {
                console.error(`Variant image upload failed:`, imageError.message);
              }
            }

            // Parse variant optional details
            let variantOptionalDetails = [];
            if (firstVariantRow.variantOptionalDetails && firstVariantRow.variantOptionalDetails.trim() !== '' && firstVariantRow.variantOptionalDetails !== '[]') {
              try {
                const parsed = JSON.parse(firstVariantRow.variantOptionalDetails);
                if (Array.isArray(parsed)) {
                  variantOptionalDetails = parsed;
                } else {
                  variantOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
                }
              } catch (e) {
                console.error('Invalid variant optional details JSON:', firstVariantRow.variantOptionalDetails);
              }
            }

            // Create more details for each size combination
            const moreDetails = [];
            
            for (const row of variantRows) {
              if (row.sizeLength || row.sizeBreadth || row.sizeHeight) {
                // Parse size bulk pricing
                let sizeBulkPricing = [];
                if (row.sizeBulkPricing && row.sizeBulkPricing.trim() !== '' && row.sizeBulkPricing !== '[]') {
                  try {
                    sizeBulkPricing = JSON.parse(row.sizeBulkPricing);
                  } catch (e) {
                    console.error('Invalid size bulk pricing JSON:', row.sizeBulkPricing);
                  }
                }

                // Parse size optional details
                let sizeOptionalDetails = [];
                if (row.sizeOptionalDetails && row.sizeOptionalDetails.trim() !== '' && row.sizeOptionalDetails !== '[]') {
                  try {
                    const parsed = JSON.parse(row.sizeOptionalDetails);
                    if (Array.isArray(parsed)) {
                      sizeOptionalDetails = parsed;
                    } else {
                      sizeOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
                    }
                  } catch (e) {
                    console.error('Invalid size optional details JSON:', row.sizeOptionalDetails);
                  }
                }

                // Handle size additional images
                let sizeAdditionalImages = [];
                if (row.sizeAdditionalImages && row.sizeAdditionalImages.trim() !== '') {
                  const imagePaths = row.sizeAdditionalImages.split(',').map(path => path.trim());
                  for (const imagePath of imagePaths) {
                    try {
                      const imageUrl = await BulkUploadImageToCloudinary(imagePath, 'products/variants/more-details');
                      sizeAdditionalImages.push(imageUrl);
                    } catch (imageError) {
                      console.error(`Size additional image upload failed for ${imagePath}:`, imageError.message);
                    }
                  }
                }

                // Parse discount bulk pricing
                let discountBulkPricing = [];
                if (row.discountBulkPricing && row.discountBulkPricing.trim() !== '' && row.discountBulkPricing !== '[]') {
                  try {
                    discountBulkPricing = JSON.parse(row.discountBulkPricing);
                  } catch (e) {
                    console.error('Invalid discount bulk pricing JSON:', row.discountBulkPricing);
                  }
                }

                const moreDetail = {
                  size: {
                    length: parseFloat(row.sizeLength) || undefined,
                    breadth: parseFloat(row.sizeBreadth) || undefined,
                    height: parseFloat(row.sizeHeight) || undefined,
                    unit: row.sizeUnit || undefined
                  },
                  additionalImages: sizeAdditionalImages,
                  optionalDetails: sizeOptionalDetails,
                  price: parseFloat(row.sizePrice) || undefined,
                  stock: parseInt(row.sizeStock) || undefined,
                  bulkPricingCombinations: sizeBulkPricing,
                  discountStartDate: row.discountStartDate ? new Date(row.discountStartDate) : undefined,
                  discountEndDate: row.discountEndDate ? new Date(row.discountEndDate) : undefined,
                  discountPrice: parseFloat(row.discountPrice) || undefined,
                  comeBackToOriginalPrice: row.comeBackToOriginalPrice === 'TRUE' || row.comeBackToOriginalPrice === true,
                  discountBulkPricing: discountBulkPricing
                };

                moreDetails.push(moreDetail);
              }
            }

            const variant = {
              colorName: colorName === 'default' ? '' : colorName,
              variantImage: variantImageUrl,
              optionalDetails: variantOptionalDetails,
              moreDetails: moreDetails,
              isDefault: firstVariantRow.isDefaultVariant === 'TRUE' || firstVariantRow.isDefaultVariant === true
            };

            variants.push(variant);
          }

          productData.variants = variants;
        } else {
          // Simple product without variants
          productData.price = parseFloat(firstRow.price) || undefined;
          productData.stock = parseInt(firstRow.stock) || undefined;
          
          // Handle discount fields
          if (firstRow.discountStartDate) {
            productData.discountStartDate = new Date(firstRow.discountStartDate);
          }
          if (firstRow.discountEndDate) {
            productData.discountEndDate = new Date(firstRow.discountEndDate);
          }
          if (firstRow.discountPrice) {
            productData.discountPrice = parseFloat(firstRow.discountPrice);
          }
          if (firstRow.comeBackToOriginalPrice) {
            productData.comeBackToOriginalPrice = firstRow.comeBackToOriginalPrice === 'TRUE' || firstRow.comeBackToOriginalPrice === true;
          }
          if (firstRow.discountBulkPricing && firstRow.discountBulkPricing.trim() !== '' && firstRow.discountBulkPricing !== '[]') {
            try {
              productData.discountBulkPricing = JSON.parse(firstRow.discountBulkPricing);
            } catch (e) {
              console.error('Invalid discount bulk pricing JSON:', firstRow.discountBulkPricing);
            }
          }
        }

        // Create and save product
        const newProduct = new Product(productData);
        await newProduct.save();

        results.successful.push({
          productName: productName,
          productId: newProduct._id,
          variantsCount: productData.hasVariants ? productData.variants?.length || 0 : 0,
          imagesUploaded: {
            main: !!mainImageUrl,
            additional: additionalImageUrls.length,
            variants: productData.variants?.reduce((total, variant) => {
              return total + (variant.variantImage ? 1 : 0) + 
                     variant.moreDetails?.reduce((sum, detail) => sum + detail.additionalImages.length, 0);
            }, 0) || 0
          }
        });

        results.successCount++;

      } catch (error) {
        results.failed.push({
          productName: productName,
          error: error.message,
          rowsAffected: productGroups[productName].map(row => row.originalRowIndex + 1)
        });
        results.failCount++;
      }

      // Send progress update
      if (req.io) {
        const processed = results.successCount + results.failCount;
        req.io.emit('productUploadProgress', {
          processed: processed,
          total: results.totalProcessed,
          successCount: results.successCount,
          failCount: results.failCount
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Product upload completed. ${results.successCount} successful, ${results.failCount} failed.`,
      results: results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during product upload',
      error: error.message
    });
  }
};
// End of function for bulk adding product

// Export addProduct with upload.any() middleware directly
module.exports = {
  addProduct: [upload.any(), addProduct],
}


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

// Function that will restock products that are single. (Both condition that is variants and non-variant product will be handled over here)
const restock = async (req, res) => {
  console.log("Request received")
  try {
    const { productId, updatedStock, productData } = req.body;

    if(Object.keys(productData).length === 0) {
      console.log("Request received for product without variants")
      // The product does not have any variants
      // Validate input
      if (!productId || typeof updatedStock !== "number") {
        return res.status(400).json({ message: "Invalid input data" });
      }

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Calculate new stock
      const newStock = product.stock + updatedStock;

      // Update product
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: { stock: newStock } },
        { new: true }
      );

      return res.status(200).json({
        message: "Stock updated successfully",
        product: updatedProduct
      });
    } else {
      // The product has variants
      console.log("Request received for product with variants")
      const product = await Product.findById(productId)
      if(!product) {
        return res.status(404).json({message: "Product not found"});
      }

      console.log(productData)
      
      // Track if any updates were made
      let updatesCount = 0;
      let hasErrors = false;

      // Process all updates sequentially
      for (const [variantID, variantData] of Object.entries(productData)) {
        console.log(variantID)
        console.log(variantData)

        for (const [detailsID, detailsData] of Object.entries(variantData)) {
          console.log(detailsID)
          console.log(detailsData)

          for (const [sizeID, stockData] of Object.entries(detailsData)) {
            console.log(sizeID)
            console.log(stockData)
            
            if(stockData !== "" && stockData != null) {
              try {
                const s_id = new mongoose.Types.ObjectId(sizeID);
                
                // Find the current stock for this specific variant/detail/size
                let currentStock = 0;
                let found = false;
                
                for (const variant of product.variants) {
                  for (const details of variant.moreDetails) {
                    if(details.size._id.toString() === s_id.toString()) {
                      currentStock = parseInt(details.stock) || 0;
                      found = true;
                      break;
                    }
                  }
                  if (found) break;
                }

                if (found) {
                  console.log("IDs matched")
                  console.log("Current stock:", currentStock)
                  const newStockToAdd = parseInt(stockData);
                  const updatedStock = currentStock + newStockToAdd;
                  
                  const updateResult = await Product.updateOne(
                    {_id: product._id},
                    { 
                      $set: {
                        "variants.$[v].moreDetails.$[md].stock": updatedStock,
                        "variants.$[v].moreDetails.$[md].lastRestockedAt": new Date()
                      } 
                    },
                    {
                      arrayFilters: [
                        {"v._id": variantID},
                        {"md._id": detailsID}
                      ]
                    }
                  );
                  
                  if (updateResult.modifiedCount > 0) {
                    updatesCount++;
                  }
                  console.log("Stock updated successfully for size:", sizeID);
                } else {
                  console.log('Size ID not found in product variants');
                }
              } catch(error) {
                console.error("Error updating stock for size:", sizeID, error);
                hasErrors = true;
              }
            }
          }
        }
      }

      // Send response only once after all updates are complete
      if (hasErrors) {
        return res.status(500).json({
          message: "Some updates failed",
          successfulUpdates: updatesCount
        });
      } else if (updatesCount > 0) {
        return res.status(200).json({
          message: "Stock updated successfully",
          updatedItems: updatesCount
        });
      } else {
        return res.status(200).json({
          message: "No stock updates were needed - empty or invalid values skipped",
          updatedItems: 0
        });
      }
    }

  } catch (error) {
    console.error("Restock error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Start of function to mass restock
const massRestock = async (req, res) => {
  console.log("Mass restock request received");
  const data = req.body;
  
  try {
    let totalUpdates = 0;
    let errors = [];
    
    // Process all products sequentially to avoid conflicts
    for (const [productID, productData] of Object.entries(data)) {
      console.log(`Processing product: ${productID}`);
      console.log("Product data starts here");
      console.log(productData);
      console.log("Product data ends here");

      try {
        const product = await Product.findById(productID);
        if (!product) {
          console.log(`Product not found for ID: ${productID}`);
          errors.push({ productID, error: "Product not found" });
          continue;
        }

        if (product.hasVariants) {
          // Handle products with variants
          let productUpdates = 0;
          
          for (const [variantID, variantData] of Object.entries(productData)) {
            console.log("Variant data starts here");
            console.log(variantData);
            console.log("Variant data ends here");

            for (const [detailsID, detailsData] of Object.entries(variantData)) {
              console.log("Details data starts here");
              console.log(detailsData);
              console.log("Details data ends here");

              for (const [sizeID, stockData] of Object.entries(detailsData)) {
                console.log("Stock data starts here");
                console.log(stockData);
                console.log("Stock data ends here");

                if (stockData !== "" && stockData != null && stockData !== undefined) {
                  try {
                    const s_id = new mongoose.Types.ObjectId(sizeID);
                    
                    // Find current stock for this size
                    let currentStock = 0;
                    let found = false;
                    
                    for (const variant of product.variants) {
                      for (const details of variant.moreDetails) {
                        if (details.size._id.toString() === s_id.toString()) {
                          currentStock = parseInt(details.stock) || 0;
                          found = true;
                          break;
                        }
                      }
                      if (found) break;
                    }

                    if (found) {
                      console.log("IDs matched");
                      const newStockToAdd = parseInt(stockData);
                      
                      if (isNaN(newStockToAdd)) {
                        console.log("Invalid stock data, skipping:", stockData);
                        continue;
                      }
                      
                      const updatedStock = currentStock + newStockToAdd;

                      const updateResult = await Product.updateOne(
                        { _id: product._id },
                        { 
                          $set: {
                            "variants.$[v].moreDetails.$[md].stock": updatedStock,
                            "variants.$[v].moreDetails.$[md].lastRestockedAt": new Date()
                          }
                        },
                        {
                          arrayFilters: [
                            { "v._id": variantID },
                            { "md._id": detailsID }
                          ]
                        }
                      );

                      if (updateResult.modifiedCount > 0) {
                        productUpdates++;
                        totalUpdates++;
                      }
                      console.log("Stock updated successfully for size:", sizeID);
                    } else {
                      console.log('Size ID not found in product variants');
                    }
                  } catch (error) {
                    console.error("Error updating stock for size:", sizeID, error);
                    errors.push({ 
                      productID, 
                      variantID, 
                      detailsID, 
                      sizeID, 
                      error: error.message 
                    });
                  }
                }
              }
            }
          }
          
          console.log(`Product ${productID} - ${productUpdates} updates completed`);
        } else {
          // Handle products without variants
          console.log("Processing product without variants");
          console.log(productData);
          console.log(typeof(productData));

          // Get stock values from productData
          const stockValues = Object.values(productData).filter(val => val !== "" && val != null);
          
          if (stockValues.length > 0) {
            try {
              const stockToAdd = parseInt(stockValues[0]); // Take first valid stock value
              
              if (!isNaN(stockToAdd)) {
                const updatedStock = parseInt(product.stock) + stockToAdd;
                
                const updatedProduct = await Product.findByIdAndUpdate(
                  productID,
                  { 
                    $set: { 
                      stock: updatedStock,
                      lastRestockedAt: new Date()
                    }
                  },
                  { new: true }
                );

                if (updatedProduct) {
                  totalUpdates++;
                  console.log(`Product ${productID} stock updated successfully`);
                }
              } else {
                console.log(`Invalid stock data for product ${productID}`);
              }
            } catch (error) {
              console.error(`Error updating product ${productID}:`, error);
              errors.push({ productID, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing product ${productID}:`, error);
        errors.push({ productID, error: error.message });
      }
    }

    // Send single response after all processing is complete
    if (errors.length > 0) {
      return res.status(207).json({ // 207 = Multi-Status
        message: "Mass restock completed with some errors",
        totalUpdates,
        errors,
        success: totalUpdates > 0
      });
    } else if (totalUpdates > 0) {
      return res.status(200).json({
        message: "Mass restock completed successfully",
        totalUpdates
      });
    } else {
      return res.status(200).json({
        message: "No stock updates were made - all values were empty or invalid",
        totalUpdates: 0
      });
    }

  } catch (error) {
    console.error("Mass restock error:", error);
    return res.status(500).json({
      message: "Internal server error during mass restock",
      error: error.message
    });
  }
};
// End of function to mass restock

// Start of function for revising rate for multiple products
const massRevisedRate = (req, res) => {
  console.log("Revised rate request received")
  console.log(req.body);
  const data = req.body;
  
  try {
    // Use Promise.all to properly handle async operations
    const updatePromises = Object.entries(data).map(async ([productID, productData]) => {
      console.log(productID);
      console.log("Product data starts here")
      console.log(productData);
      console.log("Product data ends here")

      const product = await Product.findById(productID);
      if (!product) {
        console.log(`Product not found for ID: ${productID}`);
        return { success: false, productID, error: "Product not found" };
      }

      if (product.hasVariants) {
        // Handle products with variants
        const variantUpdatePromises = Object.entries(productData).map(async ([variantID, variantData]) => {
          console.log("Variant data starts here")
          console.log(variantData);
          console.log("Variant data ends here")

          const detailsUpdatePromises = Object.entries(variantData).map(async ([detailsID, detailsData]) => {
            console.log("details data starts here")
            console.log(detailsData)
            console.log("details data ends here")

            // Extract discount/pricing data INCLUDING discountBulkPricing
            const { 
              discountStartDate, 
              discountEndDate, 
              discountPrice, 
              comeBackToOriginalPrice,
              discountBulkPricing,
              ...sizeData 
            } = detailsData;

            // Process only the size data (ObjectId keys)
            const sizeUpdatePromises = Object.entries(sizeData).map(async ([sizeID, priceData]) => {
              if (!mongoose.Types.ObjectId.isValid(sizeID)) {
                console.log(`Invalid ObjectId: ${sizeID}, skipping...`);
                return { success: false, error: "Invalid ObjectId" };
              }

              const s_id = new mongoose.Types.ObjectId(sizeID);
              console.log("Price data starts here")
              console.log(priceData);
              console.log("Price data ends here")

              if (priceData === "" || !priceData) {
                console.log("Empty price data, skipping...");
                return { success: true, skipped: true };
              }

              // Find the specific variant and details to get current price
              const variant = product.variants.find(v => v._id.toString() === variantID);
              if (!variant) {
                console.log("Variant not found");
                return { success: false, error: "Variant not found" };
              }

              const details = variant.moreDetails.find(md => md._id.toString() === detailsID);
              if (!details) {
                console.log("Details not found");
                return { success: false, error: "Details not found" };
              }

              const sizeDetail = details.size._id.toString() === s_id.toString() ? details : null;
              if (!sizeDetail) {
                console.log("Size detail not found");
                return { success: false, error: "Size detail not found" };
              }

              const oldPrice = parseFloat(sizeDetail.price);
              const newDiscountPrice = parseFloat(priceData);

              // Validation: discount price should be less than original price
              if (newDiscountPrice >= oldPrice) {
                console.log("Discounted price cannot be greater than or equal to original price");
                return { success: false, error: "Invalid discount price" };
              }

              try {
                console.log("Updating the product");
                
                // Prepare update object
                let updateObj = {
                  "variants.$[v].moreDetails.$[md].discountPrice": newDiscountPrice,
                };

                // Add other discount fields if they exist
                if (discountStartDate) {
                  updateObj["variants.$[v].moreDetails.$[md].discountStartDate"] = new Date(discountStartDate);
                }
                if (discountEndDate) {
                  updateObj["variants.$[v].moreDetails.$[md].discountEndDate"] = new Date(discountEndDate);
                }
                if (comeBackToOriginalPrice !== null && comeBackToOriginalPrice !== undefined) {
                  const shouldComeBack = comeBackToOriginalPrice === 'yes';
                  updateObj["variants.$[v].moreDetails.$[md].comeBackToOriginalPrice"] = shouldComeBack;
                  
                  // If comeBackToOriginalPrice is false (no), update the actual price as well
                  if (!shouldComeBack) {
                    updateObj["variants.$[v].moreDetails.$[md].price"] = newDiscountPrice;
                    
                    // 🎯 NEW TWIST: Update bulkPricing with discountBulkPricing when comeBackToOriginal is No
                    if (discountBulkPricing && Array.isArray(discountBulkPricing)) {
                      const validBulkPricing = discountBulkPricing.filter(item => 
                        item.wholesalePrice !== '' && item.quantity !== ''
                      );
                      updateObj["variants.$[v].moreDetails.$[md].bulkPricingCombinations"] = validBulkPricing;
                    }
                  }
                }

                // Always store discountBulkPricing
                if (discountBulkPricing && Array.isArray(discountBulkPricing)) {
                  const validDiscountBulkPricing = discountBulkPricing.filter(item => 
                    item.wholesalePrice !== '' && item.quantity !== ''
                  );
                  updateObj["variants.$[v].moreDetails.$[md].discountBulkPricing"] = validDiscountBulkPricing;
                }

                const updatedProduct = await Product.updateOne(
                  { _id: product._id },
                  { $set: updateObj },
                  {
                    arrayFilters: [
                      { "v._id": new mongoose.Types.ObjectId(variantID) },
                      { "md._id": new mongoose.Types.ObjectId(detailsID) }
                    ]
                  }
                );

                return { success: true, updated: updatedProduct.modifiedCount > 0 };

              } catch (error) {
                console.error("Error updating variant product:", error);
                return { success: false, error: error.message };
              }
            });

            const sizeResults = await Promise.all(sizeUpdatePromises);
            return { success: true, sizeResults };
          });

          const detailsResults = await Promise.all(detailsUpdatePromises);
          return { success: true, detailsResults };
        });

        const variantResults = await Promise.all(variantUpdatePromises);
        return { success: true, productID, variantResults };

      } else {
        // Handle products without variants
        console.log("Processing product without variants");
        console.log(productData);

        // Extract discount/pricing data for non-variant products INCLUDING discountBulkPricing
        const { 
          discountStartDate, 
          discountEndDate, 
          discountPrice, 
          comeBackToOriginalPrice,
          discountBulkPricing,
          ...priceData 
        } = productData;

        // Get the actual price value (should be the only remaining key)
        const priceValues = Object.values(priceData).filter(val => val !== "");
        
        if (priceValues.length === 0) {
          console.log("No price data to update");
          return { success: true, skipped: true };
        }

        const newDiscountPrice = parseFloat(priceValues[0]);
        const oldPrice = parseFloat(product.price);

        // Validation: discount price should be less than original price
        if (newDiscountPrice >= oldPrice) {
          console.log("Discounted price cannot be greater than or equal to original price");
          return { success: false, error: "Invalid discount price" };
        }

        try {
          let updateObj = {
            discountPrice: newDiscountPrice
          };

          // Add other discount fields if they exist
          if (discountStartDate) {
            updateObj.discountStartDate = new Date(discountStartDate);
          }
          if (discountEndDate) {
            updateObj.discountEndDate = new Date(discountEndDate);
          }
          if (comeBackToOriginalPrice !== null && comeBackToOriginalPrice !== undefined) {
            const shouldComeBack = comeBackToOriginalPrice === 'yes';
            updateObj.comeBackToOriginalPrice = shouldComeBack;
            
            // If comeBackToOriginalPrice is false (no), update the actual price as well
            if (!shouldComeBack) {
              updateObj.price = newDiscountPrice;
              
              // 🎯 NEW TWIST: Update bulkPricing with discountBulkPricing when comeBackToOriginal is No
              if (discountBulkPricing && Array.isArray(discountBulkPricing)) {
                const validBulkPricing = discountBulkPricing.filter(item => 
                  item.wholesalePrice !== '' && item.quantity !== ''
                );
                updateObj.bulkPricing = validBulkPricing;
              }
            }
          }

          // Always store discountBulkPricing
          if (discountBulkPricing && Array.isArray(discountBulkPricing)) {
            const validDiscountBulkPricing = discountBulkPricing.filter(item => 
              item.wholesalePrice !== '' && item.quantity !== ''
            );
            updateObj.discountBulkPricing = validDiscountBulkPricing;
          }

          const updatedProduct = await Product.findByIdAndUpdate(
            productID,
            { $set: updateObj },
            { new: true }
          );

          return { success: true, productID, updated: !!updatedProduct };

        } catch (error) {
          console.error("Error updating non-variant product:", error);
          return { success: false, error: error.message };
        }
      }
    });

    // Wait for all updates to complete
    Promise.all(updatePromises)
      .then(results => {
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          console.error("Some updates failed:", failures);
          return res.status(400).json({ 
            message: "Some products failed to update", 
            failures 
          });
        }
        
        console.log("All products updated successfully");
        return res.status(200).json({ 
          message: "Mass revised rate update completed successfully",
          results 
        });
      })
      .catch(error => {
        console.error("Error in mass revised rate:", error);
        return res.status(500).json({ 
          message: "Error processing mass revised rate",
          error: error.message 
        });
      });

  } catch (error) {
    console.error("Error in mass revised rate:", error);
    return res.status(500).json({ 
      message: "Error processing mass revised rate",
      error: error.message 
    });
  }
}
// End of function for revising rate for multiple 

// Start of function that will handle the product without being checked
const revisedRate = async (req, res) => {
  console.log("Revised rate request received");
  const {
    productId,
    updatedPrice,
    discountStartDate,
    discountEndDate,
    discountPrice,
    comeBackToOriginalPrice,
    discountBulkPricing,
    productData
  } = req.body;

  try {
    if (Object.keys(productData).length === 0) {
      console.log("Processing product without variants");
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log("Product found");
      
      // Validate discount price
      if (parseFloat(product.price) <= parseFloat(discountPrice)) {
        console.log("Discount price is greater than or equal to original price");
        return res.status(400).json({
          message: "Discount price cannot be greater than or equal to original price"
        });
      }

      console.log("Discount price is valid");

      try {
        let updateObj = {
          discountPrice: parseFloat(discountPrice),
          discountStartDate,
          discountEndDate,
          discountBulkPricing,
          comeBackToOriginalPrice: comeBackToOriginalPrice === 'yes'
        };

        if (comeBackToOriginalPrice === 'no') {
          console.log("Selected no - updating original price as well");
          updateObj.price = parseFloat(discountPrice);
          updateObj.bulkPricing = discountBulkPricing;
        } else {
          console.log("Selected yes - keeping original price");
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          { $set: updateObj },
          { new: true }
        );

        console.log("Rate revised successfully");
        return res.status(200).json({ message: "Rate revised successfully" });

      } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: "Revising rate failed" });
      }

    } else {
      // Handle products with variants
      console.log("Processing product with variants");
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let errors = [];
      let updates = 0;

      // Process all variants sequentially
      for (const [variantId, variantData] of Object.entries(productData)) {
        console.log("Processing variant:", variantId);
        console.log(variantData);

        for (const [detailsId, detailsData] of Object.entries(variantData)) {
          console.log("Processing details:", detailsId);
          console.log(detailsData);

          try {
            // Find the specific variant and details
            const variant = product.variants.find(v => v._id.toString() === variantId);
            if (!variant) {
              errors.push({ variantId, detailsId, message: "Variant not found" });
              continue;
            }

            const details = variant.moreDetails.find(md => md._id.toString() === detailsId);
            if (!details) {
              errors.push({ variantId, detailsId, message: "Details not found" });
              continue;
            }

            // Validate discount price
            if (parseFloat(details.price) <= parseFloat(detailsData.discountPrice)) {
              console.log("Discount price is greater than or equal to original price");
              errors.push({ 
                variantId, 
                detailsId, 
                message: "Discount price cannot be greater than or equal to original price" 
              });
              continue;
            }

            console.log("Discount price is valid for details:", detailsId);

            let updateObj = {
              "variants.$[v].moreDetails.$[md].discountPrice": parseFloat(detailsData.discountPrice),
              "variants.$[v].moreDetails.$[md].discountStartDate": detailsData.discountStartDate,
              "variants.$[v].moreDetails.$[md].discountEndDate": detailsData.discountEndDate,
              "variants.$[v].moreDetails.$[md].comeBackToOriginalPrice": detailsData.comeBackToOriginalPrice === 'yes',
              "variants.$[v].moreDetails.$[md].discountBulkPricing": detailsData.bulkPricing
            };

            if (detailsData.comeBackToOriginalPrice === 'no') {
              console.log("Selected no - updating original price and bulk pricing");
              updateObj["variants.$[v].moreDetails.$[md].price"] = parseFloat(detailsData.discountPrice);
              updateObj["variants.$[v].moreDetails.$[md].bulkPricingCombinations"] = detailsData.bulkPricing;
            }

            const updateResult = await Product.updateOne(
              { _id: productId },
              { $set: updateObj },
              {
                arrayFilters: [
                  { "v._id": variantId },
                  { "md._id": detailsId }
                ]
              }
            );

            if (updateResult.modifiedCount > 0) {
              updates++;
              console.log("Successfully updated variant details:", detailsId);
            }

          } catch (error) {
            console.error("Error updating variant details:", error);
            errors.push({ 
              variantId, 
              detailsId, 
              message: error.message 
            });
          }
        }
      }

      // Send single response after all processing
      if (errors.length > 0) {
        return res.status(207).json({ // 207 = Multi-Status
          message: "Rate revision completed with some errors",
          updates,
          errors,
          success: updates > 0
        });
      } else if (updates > 0) {
        return res.status(200).json({
          message: "Rate revised successfully for all variants",
          updates
        });
      } else {
        return res.status(400).json({
          message: "No updates were made"
        });
      }
    }

  } catch (error) {
    console.error("Revised rate error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
// End of function that will handle the product without being checked

// Start of function that will handle mass upload of products
// End of function that will handle mass upload of products


// Export addProduct with upload.any() middleware directly
module.exports = {
  addProduct: [upload.any(), addProduct],
  fetchProducts,
  restock,
  massRestock,
  massRevisedRate,
  revisedRate,
  upload,
  bulkUploadProducts
}
