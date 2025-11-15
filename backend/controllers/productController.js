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
  const allowedExtensions = ['.xlsx', '.csv', '.jpg', '.jpeg', '.png', '.zip'];
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
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB
  }
})

// Start of function that will find the product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};
// End of function that will find the product by ID

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

// Start of function that will handle the deletion of product's image from cloudinary
// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract the public_id from the full Cloudinary URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      // Get everything after 'upload/v123456789/' (the folder path + filename)
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image: ${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};
// End of function that will handle the deletion of product's immage from cloudinary

// Helper function to duplicate image on Cloudinary
const duplicateCloudinaryImage = async (imageUrl) => {
  if (!imageUrl) return null;
  
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
      
      // Upload a copy with a new public_id
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: urlParts.slice(uploadIndex + 2, -1).join('/'), // Preserve folder structure
      });
      
      return result.secure_url;
    }
  } catch (error) {
    console.error('Error duplicating image:', error);
    return null;
  }
  return null;
};

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
    // 🚫 Limit total products to 100
    const MAX_PRODUCTS = 100000000;
    const productCount = await Product.countDocuments();
    if (productCount >= MAX_PRODUCTS) {
      return res.status(400).json({
        error: `Cannot add more than ${MAX_PRODUCTS} products.`,
      });
    }

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
      hasDimensionPricing,
  dimensionPricingData,
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
  stock: hasVariants ? undefined : stock, // Only exclude if has variants
  price: hasVariants || hasDimensionPricing === "yes" ? undefined : price, // Exclude if variants or dimension pricing
  image: hasVariants ? undefined : imageUrl, // Only include if no variants
  additionalImages: hasVariants ? [] : additionalImagesUrls, // Only include if no variants
  bulkPricing: hasVariants ? [] : bulkPricing, // Only exclude if has variants
  hasVariants,
  hasDimensions: hasDimensionPricing === "yes",
  pricingType: hasDimensionPricing === "yes" ? dimensionPricingData[0]?.pricingType || "dynamic" : "normal",
  dimensions: hasDimensionPricing === "yes" && dimensionPricingData[0]?.pricingType === "dynamic" 
    ? dimensionPricingData.map(d => ({
        length: Number(d.length) || null,
        breadth: Number(d.breadth) || null,
        height: d.height ? Number(d.height) : null,
        price: Number(d.price) || null
      })) 
    : [],
  staticDimensions: hasDimensionPricing === "yes" && dimensionPricingData[0]?.pricingType === "static"
    ? dimensionPricingData.map(d => ({
        length: Number(d.length) || null,
        breadth: Number(d.breadth) || null,
        height: d.height ? Number(d.height) : null,
        price: Number(d.price) || null,
        stock: Number(d.stock) || null,
        bulkPricing: d.bulkPricing ? d.bulkPricing.filter(bp => bp.wholesalePrice && bp.quantity) : []
      }))
    : [],
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
// Helper function to build category path recursively
const buildCategoryPath = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) return '';
  
  if (!category.parent_category_id) {
    // This is a root category
    return category.categoryName;
  } else {
    // This has a parent, recursively build the path
    const parentPath = await buildCategoryPath(category.parent_category_id);
    return `${parentPath} > ${category.categoryName}`;
  }
};

// Helper function to find category by name in the entire hierarchy
const findCategoryByName = async (categoryName) => {
  return await Category.findOne({
    categoryName: { $regex: `^${categoryName.trim()}$`, $options: 'i' }
  });
};

// Helper function to validate category hierarchy
const validateCategoryHierarchy = async (mainCategoryName, subCategoryName) => {
  // Find main category (should be root level)
  const mainCategory = await Category.findOne({
    categoryName: { $regex: `^${mainCategoryName.trim()}$`, $options: 'i' },
    parent_category_id: null // Main categories have no parent
  });

  if (!mainCategory) {
    throw new Error(`Main category not found: ${mainCategoryName}`);
  }

  // Find sub category anywhere in the hierarchy
  const subCategory = await findCategoryByName(subCategoryName);
  
  if (!subCategory) {
    throw new Error(`Sub category not found: ${subCategoryName}`);
  }

  // Check if subCategory is actually under the mainCategory hierarchy
  const isUnderMainCategory = await checkIfCategoryIsUnderParent(subCategory._id, mainCategory._id);
  
  if (!isUnderMainCategory) {
    throw new Error(`Sub category '${subCategoryName}' is not under main category '${mainCategoryName}'`);
  }

  return { mainCategory, subCategory };
};

// Helper function to check if a category is under a parent category (recursively)
const checkIfCategoryIsUnderParent = async (categoryId, parentId) => {
  const category = await Category.findById(categoryId);
  if (!category) return false;
  
  if (!category.parent_category_id) {
    // Reached root level
    return categoryId.toString() === parentId.toString();
  }
  
  if (category.parent_category_id.toString() === parentId.toString()) {
    return true; // Direct parent match
  }
  
  // Recursively check parent hierarchy
  return await checkIfCategoryIsUnderParent(category.parent_category_id, parentId);
};

// Updated bulkUploadProducts function - Replace the category validation section
const bulkUploadProducts = async (req, res) => {
  let tempDir = null;
  
  try {
    console.log('=== BULK UPLOAD STARTED ===');
    
    // Check if files are uploaded
    if (!req.files || !req.files.excelFile || !req.files.imagesZip) {
      console.log('Missing files:', req.files);
      return res.status(400).json({
        success: false,
        message: 'Please upload both Excel file and images ZIP file.'
      });
    }

    const excelFile = req.files.excelFile[0];
    const zipFile = req.files.imagesZip[0];

    console.log('Excel file:', excelFile.originalname, excelFile.size, 'bytes');
    console.log('ZIP file:', zipFile.originalname, zipFile.size, 'bytes');

    // Extract ZIP file to temporary directory
    const AdmZip = require('adm-zip');
    tempDir = path.join(__dirname, '../temp', `upload_${Date.now()}`);
    
    console.log('Creating temp directory:', tempDir);
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    }
    
    try {
      const zip = new AdmZip(zipFile.buffer);
      const zipEntries = zip.getEntries();
      
      console.log(`ZIP contains ${zipEntries.length} entries`);
      
      // Log all entries in the ZIP
      zipEntries.forEach((entry, index) => {
        console.log(`Entry ${index + 1}: ${entry.entryName} (isDirectory: ${entry.isDirectory})`);
      });
      
      // Extract all files
      zip.extractAllTo(tempDir, true);
      console.log('Extraction completed to:', tempDir);
      
      // Verify extraction by listing files
      const extractedFiles = fs.readdirSync(tempDir, { recursive: true });
      console.log('Extracted files:', extractedFiles);
      
    } catch (zipError) {
      console.error('ZIP extraction error:', zipError);
      throw new Error(`Failed to extract ZIP file: ${zipError.message}`);
    }

    // Parse Excel file
    console.log('Parsing Excel file...');
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Excel parsed: ${jsonData.length} rows found`);

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

    // Group rows by product name
    const productGroups = {};
    const seenProductNames = new Set();

    for (let index = 0; index < jsonData.length; index++) {
  const row = jsonData[index];
  const productName = row.productName?.trim();
  
  if (!productName) {
    results.failed.push({
      productName: 'N/A',
      error: 'Missing product name',
      rowsAffected: [index + 2]
    });
    results.failCount++;
    continue;
  }

  const productNameLower = productName.toLowerCase();

  // First, add to productGroups regardless
  if (!productGroups[productNameLower]) {
    productGroups[productNameLower] = [];
  }
  productGroups[productNameLower].push({ ...row, originalRowIndex: index });
}

// Now check for existing products AFTER grouping
const existingProductsMap = new Map();
for (const productNameLower of Object.keys(productGroups)) {
  const firstRow = productGroups[productNameLower][0];
  const productName = firstRow.productName.trim();
  
  const existingProduct = await Product.findOne({
    name: { $regex: `^${productName}$`, $options: 'i' }
  });
  
  if (existingProduct) {
    // Store existing product info
    if (!results.existingProducts) {
      results.existingProducts = [];
    }
    results.existingProducts.push({
      productId: existingProduct._id,
      name: existingProduct.name,
      image: existingProduct.image,
      categoryPath: existingProduct.categoryPath,
      hasVariants: existingProduct.hasVariants,
      variantsCount: existingProduct.variants?.length || 0
    });
    
    // Mark this product to be skipped during processing
    existingProductsMap.set(productNameLower, true);
  }
}

// Remove existing products from productGroups
for (const productNameLower of existingProductsMap.keys()) {
  delete productGroups[productNameLower];
}

    results.totalProcessed = Object.keys(productGroups).length;
    console.log(`Processing ${results.totalProcessed} products...`);

    // Helper function to parse dimensions
    const parseDimensions = (dimensionsString) => {
      if (!dimensionsString || dimensionsString.trim() === '' || dimensionsString.trim() === '[]') {
        return { hasDimensions: false, pricingType: 'normal', dimensions: [], staticDimensions: [] };
      }

      try {
        const parsed = JSON.parse(dimensionsString);
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return { hasDimensions: false, pricingType: 'normal', dimensions: [], staticDimensions: [] };
        }

        // Check if dynamic (single entry with "1*1*1" key)
        if (parsed.length === 1) {
          const firstKey = Object.keys(parsed[0])[0];
          if (firstKey === "1*1*1") {
            const price = parseFloat(parsed[0][firstKey]);
            return {
              hasDimensions: true,
              pricingType: 'dynamic',
              dimensions: [{
                length: 1,
                breadth: 1,
                height: 1,
                price: price
              }],
              staticDimensions: []
            };
          }
        }

        // Otherwise it's static
        const staticDimensions = [];
        for (const dimObj of parsed) {
          const dimKey = Object.keys(dimObj)[0];
          const dimValue = dimObj[dimKey];
          
          // Parse dimension key (e.g., "12*12*12")
          const parts = dimKey.split('*').map(p => parseFloat(p.trim()));
          
          if (parts.length < 2) {
            throw new Error(`Invalid dimension format: ${dimKey}`);
          }

          const length = parts[0] || null;
          const breadth = parts[1] || null;
          const height = parts[2] || null;

          // dimValue should be an object with price, stock, bulkPricing
          let price, stock, bulkPricing = [];
          
          if (typeof dimValue === 'object' && dimValue !== null) {
            price = parseFloat(dimValue.price) || null;
            stock = parseInt(dimValue.stock) || null;
            bulkPricing = dimValue.bulkPricing || [];
          } else {
            // If just a number/string, treat as price only
            price = parseFloat(dimValue) || null;
            stock = null;
            bulkPricing = [];
          }

          staticDimensions.push({
            length: length,
            breadth: breadth,
            height: height,
            price: price,
            stock: stock,
            bulkPricing: bulkPricing
          });
        }

        return {
          hasDimensions: true,
          pricingType: 'static',
          dimensions: [],
          staticDimensions: staticDimensions
        };

      } catch (error) {
        console.error('Error parsing dimensions:', error);
        throw new Error(`Invalid dimensions format: ${error.message}`);
      }
    };

    results.totalProcessed = Object.keys(productGroups).length;
    console.log(`Processing ${results.totalProcessed} products...`);

    // Helper function to find image in extracted folder
    const findImageInTemp = (filename) => {
      if (!filename || filename.trim() === '') return null;
      
      const cleanFilename = filename.trim();
      
      // Try direct path first
      const directPath = path.join(tempDir, cleanFilename);
      if (fs.existsSync(directPath)) {
        console.log(`Found image (direct): ${cleanFilename}`);
        return directPath;
      }
      
      // Search recursively in all subdirectories
      const findInDir = (dir) => {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              const found = findInDir(fullPath);
              if (found) return found;
            } else if (file.toLowerCase() === cleanFilename.toLowerCase()) {
              console.log(`Found image (recursive): ${cleanFilename} at ${fullPath}`);
              return fullPath;
            }
          }
        } catch (err) {
          console.error(`Error reading directory ${dir}:`, err);
        }
        return null;
      };
      
      const foundPath = findInDir(tempDir);
      if (!foundPath) {
        console.warn(`Image not found: ${cleanFilename}`);
      }
      return foundPath;
    };

    // Process each product group
    for (const [productNameLower, productRows] of Object.entries(productGroups)) {
      try {
        const firstRow = productRows[0];
        const productName = firstRow.productName.trim();

        console.log(`\n=== Processing product: ${productName} ===`);

        // Only mainCategory is required
        if (!firstRow.mainCategory) {
          throw new Error('Missing required field: mainCategory');
        }

        // Validate main category
        const mainCategory = await Category.findOne({
          categoryName: { $regex: `^${firstRow.mainCategory.trim()}$`, $options: 'i' },
          parent_category_id: null
        });

        if (!mainCategory) {
          throw new Error(`Main category not found: ${firstRow.mainCategory}`);
        }

        let subCategory = null;
        let autoGeneratedCategoryPath = mainCategory.categoryName;

        // If subCategory is provided, validate it
        if (firstRow.subCategory && firstRow.subCategory.trim() !== '') {
          subCategory = await findCategoryByName(firstRow.subCategory);
          
          if (!subCategory) {
            throw new Error(`Sub category not found: ${firstRow.subCategory}`);
          }

          // Check if subCategory is actually under the mainCategory hierarchy
          const isUnderMainCategory = await checkIfCategoryIsUnderParent(subCategory._id, mainCategory._id);
          
          if (!isUnderMainCategory) {
            throw new Error(`Sub category '${firstRow.subCategory}' is not under main category '${firstRow.mainCategory}'`);
          }

          // Generate category path with subcategory
          autoGeneratedCategoryPath = await buildCategoryPath(subCategory._id);
        }

        let productDetails = [];
        if (firstRow.productDetails) {
          try {
            const parsed = JSON.parse(firstRow.productDetails);
            productDetails = Object.entries(parsed).map(([key, value]) => ({ 
              key, 
              value: String(value) 
            }));
          } catch (e) {
            productDetails = [{ key: 'details', value: String(firstRow.productDetails) }];
          }
        }

        const hasVariants = firstRow.hasVariants === 'TRUE' || firstRow.hasVariants === true;

        const productData = {
          name: productName,
          mainCategory: mainCategory._id,
          subCategory: subCategory ? subCategory._id : mainCategory._id,
          categoryPath: autoGeneratedCategoryPath,
          productDetails: productDetails,
          hasVariants: hasVariants,
        };

        if (!hasVariants) {
          console.log('Processing simple product...');
          
          // Parse dimensions first
          const dimensionData = parseDimensions(firstRow.dimensions);
          
          // Handle simple product
          let mainImageUrl = '';
          if (firstRow.mainImage) {
            console.log(`Looking for main image: ${firstRow.mainImage}`);
            const imagePath = findImageInTemp(firstRow.mainImage);
            if (imagePath) {
              mainImageUrl = await BulkUploadImageToCloudinary(imagePath, 'products');
              console.log(`Main image uploaded: ${mainImageUrl}`);
            } else {
              throw new Error(`Main image not found: ${firstRow.mainImage}`);
            }
          }

          let additionalImageUrls = [];
          if (firstRow.additionalImages && firstRow.additionalImages.trim() !== '') {
            const imageFilenames = firstRow.additionalImages.split(',').map(f => f.trim());
            console.log(`Looking for additional images: ${imageFilenames.join(', ')}`);
            for (const filename of imageFilenames) {
              const imagePath = findImageInTemp(filename);
              if (imagePath) {
                const url = await BulkUploadImageToCloudinary(imagePath, 'products/additional');
                additionalImageUrls.push(url);
                console.log(`Additional image uploaded: ${url}`);
              } else {
                console.warn(`Additional image not found: ${filename}`);
              }
            }
          }

          let bulkPricing = [];
          if (firstRow.bulkPricing && firstRow.bulkPricing.trim() !== '' && firstRow.bulkPricing !== '[]') {
            try {
              bulkPricing = JSON.parse(firstRow.bulkPricing);
            } catch (e) {
              console.error('Invalid bulk pricing JSON:', firstRow.bulkPricing);
            }
          }

          let discountBulkPricing = [];
          if (firstRow.discountBulkPricing && firstRow.discountBulkPricing.trim() !== '' && firstRow.discountBulkPricing !== '[]') {
            try {
              discountBulkPricing = JSON.parse(firstRow.discountBulkPricing);
            } catch (e) {
              console.error('Invalid discount bulk pricing JSON');
            }
          }

          productData.image = mainImageUrl;
          productData.additionalImages = additionalImageUrls;
          
          // If dimensions are present, don't set price, stock, bulkPricing at product level
          if (dimensionData.hasDimensions) {
            console.log(`Product has dimension-based pricing (${dimensionData.pricingType})`);
            productData.price = null;
            productData.stock = dimensionData.pricingType === 'dynamic' ? (parseInt(firstRow.stock) || 0) : null;
            productData.bulkPricing = dimensionData.pricingType === 'dynamic' ? bulkPricing : [];
            productData.hasDimensions = true;
            productData.pricingType = dimensionData.pricingType;
            productData.dimensions = dimensionData.dimensions;
            productData.staticDimensions = dimensionData.staticDimensions;
          } else {
            productData.price = parseFloat(firstRow.price) || 0;
            productData.stock = parseInt(firstRow.stock) || 0;
            productData.bulkPricing = bulkPricing;
            productData.hasDimensions = false;
            productData.pricingType = 'normal';
            productData.dimensions = [];
            productData.staticDimensions = [];
          }
          
          productData.variants = [];

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
          if (discountBulkPricing.length > 0) {
            productData.discountBulkPricing = discountBulkPricing;
          }

       } else {
          console.log('Processing product with variants...');
          
          // Check if dimensions column has data for variant products
          if (firstRow.dimensions && firstRow.dimensions.trim() !== '' && firstRow.dimensions.trim() !== '[]') {
            throw new Error('Products with variants cannot have dimension-based pricing. Please remove dimensions column data for variant products.');
          }
          
          // Handle product with variants
          productData.image = '';
          productData.additionalImages = [];
          productData.bulkPricing = [];
          productData.stock = null;
          productData.price = null;
          productData.hasDimensions = false;
          productData.pricingType = 'normal';
          productData.dimensions = [];
          productData.staticDimensions = [];

          const variantGroups = {};
          for (const row of productRows) {
            const colorName = row.variantColorName?.trim();
            if (!colorName) {
              throw new Error('Missing variant color name for product with variants');
            }
            if (!variantGroups[colorName]) {
              variantGroups[colorName] = [];
            }
            variantGroups[colorName].push(row);
          }

          const variants = [];
          let defaultVariantFound = false;

          for (const [colorName, variantRows] of Object.entries(variantGroups)) {
            console.log(`Processing variant: ${colorName}`);
            const firstVariantRow = variantRows[0];

            let variantImageUrl = '';
            if (firstVariantRow.variantImage) {
              console.log(`Looking for variant image: ${firstVariantRow.variantImage}`);
              const imagePath = findImageInTemp(firstVariantRow.variantImage);
              if (imagePath) {
                variantImageUrl = await BulkUploadImageToCloudinary(imagePath, 'products/variants');
                console.log(`Variant image uploaded: ${variantImageUrl}`);
              } else {
                console.warn(`Variant image not found: ${firstVariantRow.variantImage}`);
              }
            }

            let variantOptionalDetails = [];
            if (firstVariantRow.variantOptionalDetails && firstVariantRow.variantOptionalDetails.trim() !== '' && firstVariantRow.variantOptionalDetails !== '[]') {
              try {
                const parsed = JSON.parse(firstVariantRow.variantOptionalDetails);
                variantOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ 
                  key, 
                  value: String(value) 
                }));
              } catch (e) {
                console.error('Invalid variant optional details JSON');
              }
            }

            const isDefault = firstVariantRow.isDefaultVariant === 'TRUE' || firstVariantRow.isDefaultVariant === true;
            if (isDefault) {
              if (defaultVariantFound) {
                throw new Error('Multiple default variants found. Only one variant can be default.');
              }
              defaultVariantFound = true;
            }

            const moreDetails = [];
            for (const sizeRow of variantRows) {
              let sizeAdditionalImages = [];
              if (sizeRow.sizeAdditionalImages && sizeRow.sizeAdditionalImages.trim() !== '' && sizeRow.sizeAdditionalImages !== '[]') {
                const imageFilenames = sizeRow.sizeAdditionalImages.split(',').map(f => f.trim());
                for (const filename of imageFilenames) {
                  const imagePath = findImageInTemp(filename);
                  if (imagePath) {
                    const url = await BulkUploadImageToCloudinary(imagePath, 'products/variants/more-details');
                    sizeAdditionalImages.push(url);
                  } else {
                    console.warn(`Size additional image not found: ${filename}`);
                  }
                }
              }

              let sizeOptionalDetails = [];
              if (sizeRow.sizeOptionalDetails && sizeRow.sizeOptionalDetails.trim() !== '' && sizeRow.sizeOptionalDetails !== '[]') {
                try {
                  const parsed = JSON.parse(sizeRow.sizeOptionalDetails);
                  sizeOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ 
                    key, 
                    value: String(value) 
                  }));
                } catch (e) {
                  console.error('Invalid size optional details JSON');
                }
              }

              let sizeBulkPricing = [];
              if (sizeRow.sizeBulkPricing && sizeRow.sizeBulkPricing.trim() !== '' && sizeRow.sizeBulkPricing !== '[]') {
                try {
                  sizeBulkPricing = JSON.parse(sizeRow.sizeBulkPricing);
                } catch (e) {
                  console.error('Invalid size bulk pricing JSON');
                }
              }

              let discountBulkPricing = [];
              if (sizeRow.discountBulkPricing && sizeRow.discountBulkPricing.trim() !== '' && sizeRow.discountBulkPricing !== '[]') {
                try {
                  discountBulkPricing = JSON.parse(sizeRow.discountBulkPricing);
                } catch (e) {
                  console.error('Invalid discount bulk pricing JSON');
                }
              }

              const sizeDetail = {
                size: {
                  length: sizeRow.sizeLength ? parseFloat(sizeRow.sizeLength) : null,
                  breadth: sizeRow.sizeBreadth ? parseFloat(sizeRow.sizeBreadth) : null,
                  height: sizeRow.sizeHeight ? parseFloat(sizeRow.sizeHeight) : null,
                  unit: sizeRow.sizeUnit || null
                },
                additionalImages: sizeAdditionalImages,
                optionalDetails: sizeOptionalDetails,
                price: parseFloat(sizeRow.sizePrice) || 0,
                stock: parseInt(sizeRow.sizeStock) || 0,
                bulkPricingCombinations: sizeBulkPricing
              };

              if (sizeRow.discountStartDate) {
                sizeDetail.discountStartDate = new Date(sizeRow.discountStartDate);
              }
              if (sizeRow.discountEndDate) {
                sizeDetail.discountEndDate = new Date(sizeRow.discountEndDate);
              }
              if (sizeRow.discountPrice) {
                sizeDetail.discountPrice = parseFloat(sizeRow.discountPrice);
              }
              if (sizeRow.comeBackToOriginalPrice !== undefined && sizeRow.comeBackToOriginalPrice !== null && sizeRow.comeBackToOriginalPrice !== '') {
                sizeDetail.comeBackToOriginalPrice = sizeRow.comeBackToOriginalPrice === 'TRUE' || sizeRow.comeBackToOriginalPrice === true;
              }
              if (discountBulkPricing.length > 0) {
                sizeDetail.discountBulkPricing = discountBulkPricing;
              }

              moreDetails.push(sizeDetail);
            }

            const variant = {
              colorName: colorName,
              variantImage: variantImageUrl,
              optionalDetails: variantOptionalDetails,
              moreDetails: moreDetails,
              isDefault: isDefault,
              commonBulkPricingCombinations: []
            };

            variants.push(variant);
          }

          productData.variants = variants;
        }

        console.log('Saving product to database...');
        const newProduct = new Product(productData);
        await newProduct.save();
        console.log(`Product saved successfully: ${newProduct._id}`);

        results.successful.push({
          productName: productName,
          productId: newProduct._id,
          categoryPath: autoGeneratedCategoryPath,
          variantsCount: productData.hasVariants ? productData.variants?.length || 0 : 0,
          rowsProcessed: productRows.length
        });

        results.successCount++;

      } catch (error) {
        console.error(`Error processing product ${productRows[0].productName}:`, error);
        results.failed.push({
          productName: productRows[0].productName.trim(),
          error: error.message,
          rowsAffected: productRows.map(row => row.originalRowIndex + 2)
        });
        results.failCount++;
      }

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

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      console.log('Cleaning up temp directory...');
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('Temporary files cleaned up');
    }

    // Clean up temp directory
if (tempDir && fs.existsSync(tempDir)) {
  console.log('Cleaning up temp directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Temporary files cleaned up');
}

console.log('=== BULK UPLOAD COMPLETED ===');
console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);

// Prepare response
const responseData = {
  success: true,
  message: `Product upload completed. ${results.successCount} successful, ${results.failCount} failed.`,
  results: results
};

// Add existing products info if any
if (results.existingProducts && results.existingProducts.length > 0) {
  responseData.existingProducts = results.existingProducts;
  responseData.message = `${results.successCount} products uploaded. ${results.existingProducts.length} products already exist and require confirmation to override.`;
}

return res.status(200).json(responseData);

  } catch (error) {
    console.error('=== BULK UPLOAD ERROR ===');
    console.error(error);
    
    // Clean up temp directory in case of error
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Temp directory cleaned up after error');
      } catch (cleanupError) {
        console.error('Error cleaning up temp directory:', cleanupError);
      }
    }
    
   return res.status(500).json({
    success: false,
    message: 'Server error during product upload',
    error: error.message
  });
  }
};
// End of function for bulk adding product

// Start of function that will override existing products with the new data when uploaded throgh excel file
const bulkOverrideProducts = async (req, res) => {
  let tempDir = null;
  
  try {
    console.log('=== BULK OVERRIDE STARTED ===');
    
    if (!req.files || !req.files.excelFile || !req.files.imagesZip) {
      return res.status(400).json({
        success: false,
        message: 'Please upload both Excel file and images ZIP file.'
      });
    }

    const productIds = JSON.parse(req.body.productIds);
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products selected for override.'
      });
    }

    const excelFile = req.files.excelFile[0];
    const zipFile = req.files.imagesZip[0];

    console.log('Products to override:', productIds.length);

    // Extract ZIP file
    const AdmZip = require('adm-zip');
    tempDir = path.join(__dirname, '../temp', `override_${Date.now()}`);
    
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    }
    
    const zip = new AdmZip(zipFile.buffer);
    zip.extractAllTo(tempDir, true);
    console.log('ZIP extracted to:', tempDir);

    // Parse Excel
    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Group by product name
    const productGroups = {};
    for (let index = 0; index < jsonData.length; index++) {
      const row = jsonData[index];
      const productName = row.productName?.trim();
      
      if (!productName) continue;

      const productNameLower = productName.toLowerCase();
      
      if (!productGroups[productNameLower]) {
        productGroups[productNameLower] = [];
      }
      productGroups[productNameLower].push({ ...row, originalRowIndex: index });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: productIds.length,
      successCount: 0,
      failCount: 0
    };

    // Helper function to parse dimensions
    const parseDimensions = (dimensionsString) => {
      if (!dimensionsString || dimensionsString.trim() === '' || dimensionsString.trim() === '[]') {
        return { hasDimensions: false, pricingType: 'normal', dimensions: [], staticDimensions: [] };
      }

      try {
        const parsed = JSON.parse(dimensionsString);
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return { hasDimensions: false, pricingType: 'normal', dimensions: [], staticDimensions: [] };
        }

        // Check if dynamic (single entry with "1*1*1" key)
        if (parsed.length === 1) {
          const firstKey = Object.keys(parsed[0])[0];
          if (firstKey === "1*1*1") {
            const price = parseFloat(parsed[0][firstKey]);
            return {
              hasDimensions: true,
              pricingType: 'dynamic',
              dimensions: [{
                length: 1,
                breadth: 1,
                height: 1,
                price: price
              }],
              staticDimensions: []
            };
          }
        }

        // Otherwise it's static
        const staticDimensions = [];
        for (const dimObj of parsed) {
          const dimKey = Object.keys(dimObj)[0];
          const dimValue = dimObj[dimKey];
          
          // Parse dimension key (e.g., "12*12*12")
          const parts = dimKey.split('*').map(p => parseFloat(p.trim()));
          
          if (parts.length < 2) {
            throw new Error(`Invalid dimension format: ${dimKey}`);
          }

          const length = parts[0] || null;
          const breadth = parts[1] || null;
          const height = parts[2] || null;

          // dimValue should be an object with price, stock, bulkPricing
          let price, stock, bulkPricing = [];
          
          if (typeof dimValue === 'object' && dimValue !== null) {
            price = parseFloat(dimValue.price) || null;
            stock = parseInt(dimValue.stock) || null;
            bulkPricing = dimValue.bulkPricing || [];
          } else {
            // If just a number/string, treat as price only
            price = parseFloat(dimValue) || null;
            stock = null;
            bulkPricing = [];
          }

          staticDimensions.push({
            length: length,
            breadth: breadth,
            height: height,
            price: price,
            stock: stock,
            bulkPricing: bulkPricing
          });
        }

        return {
          hasDimensions: true,
          pricingType: 'static',
          dimensions: [],
          staticDimensions: staticDimensions
        };

      } catch (error) {
        console.error('Error parsing dimensions:', error);
        throw new Error(`Invalid dimensions format: ${error.message}`);
      }
    };

    // Helper function to find images
    const findImageInTemp = (filename) => {
      if (!filename || filename.trim() === '') return null;
      
      const cleanFilename = filename.trim();
      const directPath = path.join(tempDir, cleanFilename);
      if (fs.existsSync(directPath)) {
        return directPath;
      }
      
      const findInDir = (dir) => {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              const found = findInDir(fullPath);
              if (found) return found;
            } else if (file.toLowerCase() === cleanFilename.toLowerCase()) {
              return fullPath;
            }
          }
        } catch (err) {
          console.error(`Error reading directory ${dir}:`, err);
        }
        return null;
      };
      
      return findInDir(tempDir);
    };

    // Process each product to override
    for (const productId of productIds) {
      try {
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
          results.failed.push({
            productId,
            error: 'Product not found'
          });
          results.failCount++;
          continue;
        }

        const productNameLower = existingProduct.name.toLowerCase();
        const productRows = productGroups[productNameLower];

        if (!productRows || productRows.length === 0) {
          results.failed.push({
            productId,
            productName: existingProduct.name,
            error: 'Product data not found in Excel'
          });
          results.failCount++;
          continue;
        }

        const firstRow = productRows[0];
        console.log(`\n=== Overriding product: ${existingProduct.name} ===`);

        // Collect old images to delete
        const imagesToDelete = [];
        // if (existingProduct.image) imagesToDelete.push(existingProduct.image);
        // if (existingProduct.additionalImages) imagesToDelete.push(...existingProduct.additionalImages);
        // if (existingProduct.variants) {
        //   existingProduct.variants.forEach(v => {
        //     if (v.variantImage) imagesToDelete.push(v.variantImage);
        //     if (v.moreDetails) {
        //       v.moreDetails.forEach(md => {
        //         if (md.additionalImages) imagesToDelete.push(...md.additionalImages);
        //       });
        //     }
        //   });
        // }

        // // Validate categories
        // if (!firstRow.mainCategory) {
        //   throw new Error('Missing required field: mainCategory');
        // }

        const mainCategory = await Category.findOne({
          categoryName: { $regex: `^${firstRow.mainCategory.trim()}$`, $options: 'i' },
          parent_category_id: null
        });

        if (!mainCategory) {
          throw new Error(`Main category not found: ${firstRow.mainCategory}`);
        }

        let subCategory = null;
        let autoGeneratedCategoryPath = mainCategory.categoryName;

        if (firstRow.subCategory && firstRow.subCategory.trim() !== '') {
          subCategory = await findCategoryByName(firstRow.subCategory);
          
          if (!subCategory) {
            throw new Error(`Sub category not found: ${firstRow.subCategory}`);
          }

          const isUnderMainCategory = await checkIfCategoryIsUnderParent(subCategory._id, mainCategory._id);
          
          if (!isUnderMainCategory) {
            throw new Error(`Sub category '${firstRow.subCategory}' is not under main category '${firstRow.mainCategory}'`);
          }

          autoGeneratedCategoryPath = await buildCategoryPath(subCategory._id);
        }

        let productDetails = [];
        if (firstRow.productDetails) {
          try {
            const parsed = JSON.parse(firstRow.productDetails);
            productDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
          } catch (e) {
            productDetails = [{ key: 'details', value: String(firstRow.productDetails) }];
          }
        }

        const hasVariants = firstRow.hasVariants === 'TRUE' || firstRow.hasVariants === true;

        const productData = {
          name: existingProduct.name, // Keep the same name
          mainCategory: mainCategory._id,
          subCategory: subCategory ? subCategory._id : mainCategory._id,
          categoryPath: autoGeneratedCategoryPath,
          productDetails: productDetails,
          hasVariants: hasVariants,
        };

       if (!hasVariants) {
          // Simple product
          
          // Parse dimensions first
          const dimensionData = parseDimensions(firstRow.dimensions);
          
          let mainImageUrl = '';
          if (firstRow.mainImage) {
            const imagePath = findImageInTemp(firstRow.mainImage);
            if (imagePath) {
              mainImageUrl = await BulkUploadImageToCloudinary(imagePath, 'products');
            }
          }

          let additionalImageUrls = [];
if (firstRow.additionalImages && firstRow.additionalImages.trim() !== '') {
  const imageFilenames = firstRow.additionalImages.split(',').map(f => f.trim());
  console.log(`Looking for additional images: ${imageFilenames.join(', ')}`);
  for (const filename of imageFilenames) {
    const imagePath = findImageInTemp(filename);
    if (imagePath) {
      const url = await BulkUploadImageToCloudinary(imagePath, 'products/additional');
      additionalImageUrls.push(url);
      console.log(`Additional image uploaded: ${url}`);
    } else {
      console.warn(`Additional image not found in ZIP: ${filename}`);
    }
  }
  console.log(`Total additional images uploaded: ${additionalImageUrls.length}`);
}

          let bulkPricing = [];
          if (firstRow.bulkPricing && firstRow.bulkPricing.trim() !== '' && firstRow.bulkPricing !== '[]') {
            try {
              bulkPricing = JSON.parse(firstRow.bulkPricing);
            } catch (e) {
              console.error('Invalid bulk pricing JSON');
            }
          }

          let discountBulkPricing = [];
          if (firstRow.discountBulkPricing && firstRow.discountBulkPricing.trim() !== '' && firstRow.discountBulkPricing !== '[]') {
            try {
              discountBulkPricing = JSON.parse(firstRow.discountBulkPricing);
            } catch (e) {
              console.error('Invalid discount bulk pricing JSON');
            }
          }

          productData.image = mainImageUrl;
          productData.additionalImages = additionalImageUrls;
          
          // If dimensions are present, don't set price, stock, bulkPricing at product level
          if (dimensionData.hasDimensions) {
            console.log(`Product has dimension-based pricing (${dimensionData.pricingType})`);
            productData.price = null;
            productData.stock = dimensionData.pricingType === 'dynamic' ? (parseInt(firstRow.stock) || 0) : null;
            productData.bulkPricing = dimensionData.pricingType === 'dynamic' ? bulkPricing : [];
            productData.hasDimensions = true;
            productData.pricingType = dimensionData.pricingType;
            productData.dimensions = dimensionData.dimensions;
            productData.staticDimensions = dimensionData.staticDimensions;
          } else {
            // Normal product without dimensions - completely override
            productData.price = parseFloat(firstRow.price) || 0;
            productData.stock = parseInt(firstRow.stock) || 0;
            productData.bulkPricing = bulkPricing;
            productData.hasDimensions = false;
            productData.pricingType = 'normal';
            productData.dimensions = [];
            productData.staticDimensions = [];
          }
          
          productData.variants = [];

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
          if (discountBulkPricing.length > 0) {
            productData.discountBulkPricing = discountBulkPricing;
          }

       } else {
          // Product with variants - same logic as bulkUploadProducts
          
          // Check if dimensions column has data for variant products
          if (firstRow.dimensions && firstRow.dimensions.trim() !== '' && firstRow.dimensions.trim() !== '[]') {
            throw new Error('Products with variants cannot have dimension-based pricing. Please remove dimensions column data for variant products.');
          }
          
          productData.image = '';
          productData.additionalImages = [];
          productData.bulkPricing = [];
          productData.stock = null;
          productData.price = null;
          productData.hasDimensions = false;
          productData.pricingType = 'normal';
          productData.dimensions = [];
          productData.staticDimensions = [];

          const variantGroups = {};
          for (const row of productRows) {
            const colorName = row.variantColorName?.trim();
            if (!colorName) {
              throw new Error('Missing variant color name');
            }
            if (!variantGroups[colorName]) {
              variantGroups[colorName] = [];
            }
            variantGroups[colorName].push(row);
          }

          const variants = [];
          let defaultVariantFound = false;

          for (const [colorName, variantRows] of Object.entries(variantGroups)) {
            const firstVariantRow = variantRows[0];

            let variantImageUrl = '';
            if (firstVariantRow.variantImage) {
              const imagePath = findImageInTemp(firstVariantRow.variantImage);
              if (imagePath) {
                variantImageUrl = await BulkUploadImageToCloudinary(imagePath, 'products/variants');
              }
            }

            let variantOptionalDetails = [];
            if (firstVariantRow.variantOptionalDetails && firstVariantRow.variantOptionalDetails.trim() !== '' && firstVariantRow.variantOptionalDetails !== '[]') {
              try {
                const parsed = JSON.parse(firstVariantRow.variantOptionalDetails);
                variantOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
              } catch (e) {
                console.error('Invalid variant optional details JSON');
              }
            }

            const isDefault = firstVariantRow.isDefaultVariant === 'TRUE' || firstVariantRow.isDefaultVariant === true;
            if (isDefault) {
              if (defaultVariantFound) {
                throw new Error('Multiple default variants found');
              }
              defaultVariantFound = true;
            }

            const moreDetails = [];
            for (const sizeRow of variantRows) {
              let sizeAdditionalImages = [];
              if (sizeRow.sizeAdditionalImages && sizeRow.sizeAdditionalImages.trim() !== '' && sizeRow.sizeAdditionalImages !== '[]') {
                const imageFilenames = sizeRow.sizeAdditionalImages.split(',').map(f => f.trim());
                for (const filename of imageFilenames) {
                  const imagePath = findImageInTemp(filename);
                  if (imagePath) {
                    const url = await BulkUploadImageToCloudinary(imagePath, 'products/variants/more-details');
                    sizeAdditionalImages.push(url);
                  }
                }
              }

              let sizeOptionalDetails = [];
              if (sizeRow.sizeOptionalDetails && sizeRow.sizeOptionalDetails.trim() !== '' && sizeRow.sizeOptionalDetails !== '[]') {
                try {
                  const parsed = JSON.parse(sizeRow.sizeOptionalDetails);
                  sizeOptionalDetails = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
                } catch (e) {
                  console.error('Invalid size optional details JSON');
                }
              }

              let sizeBulkPricing = [];
              if (sizeRow.sizeBulkPricing && sizeRow.sizeBulkPricing.trim() !== '' && sizeRow.sizeBulkPricing !== '[]') {
                try {
                  sizeBulkPricing = JSON.parse(sizeRow.sizeBulkPricing);
                } catch (e) {
                  console.error('Invalid size bulk pricing JSON');
                }
              }

              let discountBulkPricing = [];
              if (sizeRow.discountBulkPricing && sizeRow.discountBulkPricing.trim() !== '' && sizeRow.discountBulkPricing !== '[]') {
                try {
                  discountBulkPricing = JSON.parse(sizeRow.discountBulkPricing
                    );
                } catch (e) {
                  console.error('Invalid discount bulk pricing JSON');
                }
              }

              const sizeDetail = {
                size: {
                  length: sizeRow.sizeLength ? parseFloat(sizeRow.sizeLength) : null,
                  breadth: sizeRow.sizeBreadth ? parseFloat(sizeRow.sizeBreadth) : null,
                  height: sizeRow.sizeHeight ? parseFloat(sizeRow.sizeHeight) : null,
                  unit: sizeRow.sizeUnit || null
                },
                additionalImages: sizeAdditionalImages,
                optionalDetails: sizeOptionalDetails,
                price: parseFloat(sizeRow.sizePrice) || 0,
                stock: parseInt(sizeRow.sizeStock) || 0,
                bulkPricingCombinations: sizeBulkPricing
              };

              if (sizeRow.discountStartDate) {
                sizeDetail.discountStartDate = new Date(sizeRow.discountStartDate);
              }
              if (sizeRow.discountEndDate) {
                sizeDetail.discountEndDate = new Date(sizeRow.discountEndDate);
              }
              if (sizeRow.discountPrice) {
                sizeDetail.discountPrice = parseFloat(sizeRow.discountPrice);
              }
              if (sizeRow.comeBackToOriginalPrice !== undefined && sizeRow.comeBackToOriginalPrice !== null && sizeRow.comeBackToOriginalPrice !== '') {
                sizeDetail.comeBackToOriginalPrice = sizeRow.comeBackToOriginalPrice === 'TRUE' || sizeRow.comeBackToOriginalPrice === true;
              }
              if (discountBulkPricing.length > 0) {
                sizeDetail.discountBulkPricing = discountBulkPricing;
              }

              moreDetails.push(sizeDetail);
            }

            const variant = {
              colorName: colorName,
              variantImage: variantImageUrl,
              optionalDetails: variantOptionalDetails,
              moreDetails: moreDetails,
              isDefault: isDefault,
              commonBulkPricingCombinations: []
            };

            variants.push(variant);
          }

          productData.variants = variants;
        }
// Now collect images to delete - only delete if we have replacements
if (productData.image && existingProduct.image && productData.image !== existingProduct.image) {
  imagesToDelete.push(existingProduct.image);
}

if (productData.additionalImages && productData.additionalImages.length > 0) {
  // New additional images uploaded, delete old ones
  if (existingProduct.additionalImages && existingProduct.additionalImages.length > 0) {
    imagesToDelete.push(...existingProduct.additionalImages);
  }
}

if (productData.hasVariants && productData.variants) {
  // Handle variant images
  productData.variants.forEach((variant, vIndex) => {
    const existingVariant = existingProduct.variants?.[vIndex];
    
    if (variant.variantImage && existingVariant?.variantImage && variant.variantImage !== existingVariant.variantImage) {
      imagesToDelete.push(existingVariant.variantImage);
    }
    
    if (variant.moreDetails) {
      variant.moreDetails.forEach((md, mdIndex) => {
        const existingMd = existingVariant?.moreDetails?.[mdIndex];
        
        if (md.additionalImages && md.additionalImages.length > 0) {
          if (existingMd?.additionalImages && existingMd.additionalImages.length > 0) {
            imagesToDelete.push(...existingMd.additionalImages);
          }
        }
      });
    }
  });
}

console.log(`Images marked for deletion: ${imagesToDelete.length}`);
        // Update product in database
        console.log('Updating product in database...');
        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          productData,
          { new: true, runValidators: true }
        );
        console.log(`Product updated successfully: ${updatedProduct._id}`);

        // Delete old images from Cloudinary
        if (imagesToDelete.length > 0) {
          console.log(`Deleting ${imagesToDelete.length} old images from Cloudinary...`);
          await Promise.all(imagesToDelete.map(url => deleteFromCloudinary(url).catch(err => {
            console.error(`Failed to delete image ${url}:`, err);
          })));
        }

        results.successful.push({
          productId: updatedProduct._id,
          productName: updatedProduct.name,
          categoryPath: autoGeneratedCategoryPath,
          variantsCount: productData.hasVariants ? productData.variants?.length || 0 : 0
        });

        results.successCount++;

      } catch (error) {
        console.error(`Error overriding product ${productId}:`, error);
        results.failed.push({
          productId,
          error: error.message
        });
        results.failCount++;
      }

      // Emit progress
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

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      console.log('Cleaning up temp directory...');
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('Temporary files cleaned up');
    }

    console.log('=== BULK OVERRIDE COMPLETED ===');
    console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);

    return res.status(200).json({
      success: true,
      message: `Product override completed. ${results.successCount} successful, ${results.failCount} failed.`,
      results: results
    });

  } catch (error) {
    console.error('=== BULK OVERRIDE ERROR ===');
    console.error(error);
    
    // Clean up temp directory in case of error
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Temp directory cleaned up after error');
      } catch (cleanupError) {
        console.error('Error cleaning up temp directory:', cleanupError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error during product override',
      error: error.message
    });
  }
};
// End of function that will override existing products with the new data when uploaded throgh excel file

const fetchProducts = async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Detect if this request is for the ADMIN panel
    // -------------------------------------------------
    const isAdminRequest =
      req.query.all === 'true' ||                // old ?all=true flag
      req.path.toLowerCase().includes('/admin'); // any admin route

    // -------------------------------------------------
    // 2. ADMIN – return **every** product (no filter)
    // -------------------------------------------------
    if (isAdminRequest) {
      const products = await Product.find({})               // <-- NO isActive filter
        .select(
          'name mainCategory subCategory categoryPath price stock discountPrice discountStartDate discountEndDate bulkPricing discountBulkPricing image hasVariants createdAt lastRestockedAt isActive variants.colorName variants.variantImage variants.isActive variants.commonPrice variants.commonStock variants.discountCommonPrice variants.discountStartDate variants.discountEndDate variants.bulkPricing variants.discountBulkPricing variants._id variants.moreDetails._id variants.moreDetails.price variants.moreDetails.stock variants.moreDetails.size variants.moreDetails.isActive variants.moreDetails.discountPrice variants.moreDetails.discountStartDate variants.moreDetails.discountEndDate variants.moreDetails.bulkPricingCombinations variants.moreDetails.discountBulkPricing hasDimensions pricingType dimensions staticDimensions'
        )
        .populate('mainCategory', 'categoryName isActive')
        .populate('subCategory', 'categoryName isActive')
        .lean();

      const totalCount = products.length;

      return res.status(200).json({
        products,
        count: totalCount,
        totalCount,
        totalPages: 1,
        currentPage: 1,
        hasMore: false,
      });
    }

   // -------------------------------------------------
// 3. CLIENT (Home) – paginated, only active products
// -------------------------------------------------
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 50;
const skip = (page - 1) * limit;

// Build filter query
const filter = { isActive: true };

// Add category filter if provided
const categoryId = req.query.categoryId;
if (categoryId) {
  // Helper function to get all descendant category IDs
  const getAllDescendants = async (catId) => {
    const Category = require('../models/Category'); // Adjust path to your Category model
    const ids = [catId];
    
    const getChildren = async (parentId) => {
      const children = await Category.find({ parent_category_id: parentId }).select('_id');
      for (const child of children) {
        ids.push(child._id.toString());
        await getChildren(child._id.toString());
      }
    };
    
    await getChildren(catId);
    return ids;
  };
  
  // Get all descendant category IDs
  const allCategoryIds = await getAllDescendants(categoryId);
  
  filter.$or = [
    { mainCategory: { $in: allCategoryIds } },
    { subCategory: { $in: allCategoryIds } }
  ];
}

const products = await Product.find(filter)
  .select(
    'name mainCategory subCategory categoryPath price stock discountPrice discountStartDate discountEndDate bulkPricing discountBulkPricing image hasVariants createdAt lastRestockedAt isActive variants.colorName variants.variantImage variants.isActive variants.commonPrice variants.commonStock variants.discountCommonPrice variants.discountStartDate variants.discountEndDate variants.bulkPricing variants.discountBulkPricing variants._id variants.moreDetails._id variants.moreDetails.price variants.moreDetails.stock variants.moreDetails.size variants.moreDetails.isActive variants.moreDetails.discountPrice variants.moreDetails.discountStartDate variants.moreDetails.discountEndDate variants.moreDetails.bulkPricingCombinations variants.moreDetails.discountBulkPricing hasDimensions pricingType dimensions staticDimensions'
  )
  .populate('mainCategory', 'categoryName isActive')
  .populate('subCategory', 'categoryName isActive')
  .lean()
  .skip(skip)
  .limit(limit);

const totalCount = await Product.countDocuments(filter);

console.log('Backend Fetch (Client):', {
  page,
  skip,
  limit,
  categoryId,
  allCategoryIds: categoryId ? filter.$or : 'none',
  productCount: products.length,
  totalCount,
});

return res.status(200).json({
  products,
  count: products.length,
  totalCount,
  totalPages: Math.ceil(totalCount / limit),
  currentPage: page,
  hasMore: skip + products.length < totalCount,
});
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

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

// Start of funcion that will handle the deletion of product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Find the product first to check if it exists
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting product",
      error: error.message
    });
  }
};
// End of funcion that will handle the deletion of product

// Start of function that will handle the ediing of product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = JSON.parse(req.body.productData);

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imagesToDelete = [];
    
    // Store previous values for potential restoration
    const previousValues = {
      price: existingProduct.price,
      stock: existingProduct.stock,
      bulkPricing: existingProduct.bulkPricing,
      hasDimensions: existingProduct.hasDimensions,
      pricingType: existingProduct.pricingType,
      dimensions: existingProduct.dimensions,
      staticDimensions: existingProduct.staticDimensions
    };

    // Organize files by fieldname
    const filesByField = {};
    if (req.files) {
      req.files.forEach(file => {
        if (!filesByField[file.fieldname]) {
          filesByField[file.fieldname] = [];
        }
        filesByField[file.fieldname].push(file);
      });
    }

    // Handle main image
    if (filesByField['image'] && filesByField['image'][0]) {
      if (existingProduct.image) {
        imagesToDelete.push(existingProduct.image);
      }
      productData.image = await uploadImageToCloudinary(filesByField['image'][0].buffer, 'products');
    } else {
      productData.image = existingProduct.image;
    }

    // Handle additional images
    const existingImagesToKeep = productData.existingAdditionalImages || [];
    const newImageFiles = filesByField['additionalImages'] || [];

    // Determine which existing images to delete
    const imagesToDeleteFromAdditional = (existingProduct.additionalImages || []).filter(
      url => !existingImagesToKeep.includes(url)
    );
    imagesToDelete.push(...imagesToDeleteFromAdditional);

    // Upload new images
    const newImageUrls = [];
    if (newImageFiles.length > 0) {
      for (const file of newImageFiles) {
        const url = await uploadImageToCloudinary(file.buffer, 'products');
        newImageUrls.push(url);
      }
    }

    // Combine kept existing images with new ones
    productData.additionalImages = [...existingImagesToKeep, ...newImageUrls];

    // Remove the temporary tracking field
    delete productData.existingAdditionalImages;

    // Handle variants dynamically
    if (productData.hasVariants && productData.variants) {
      for (let variantIndex = 0; variantIndex < productData.variants.length; variantIndex++) {
        const variant = productData.variants[variantIndex];
        const existingVariant = existingProduct.variants?.[variantIndex];

        // Handle variant image
        const variantImageKey = `variants[${variantIndex}].variantImage`;
        if (filesByField[variantImageKey] && filesByField[variantImageKey][0]) {
          // New variant image uploaded
          if (existingVariant?.variantImage) {
            imagesToDelete.push(existingVariant.variantImage);
          }
          variant.variantImage = await uploadImageToCloudinary(filesByField[variantImageKey][0].buffer, 'products/variants');
        } else if (variant.existingVariantImage) {
          // Keep existing variant image
          variant.variantImage = variant.existingVariantImage;
        } else if (existingVariant?.variantImage) {
          // No change, keep existing
          variant.variantImage = existingVariant.variantImage;
        }

        // Remove temporary tracking field
        delete variant.existingVariantImage;

        // Handle moreDetails additional images dynamically
        if (variant.moreDetails) {
          for (let mdIndex = 0; mdIndex < variant.moreDetails.length; mdIndex++) {
            const mdImagesKey = `variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`;
            const md = variant.moreDetails[mdIndex];
            const existingMd = existingVariant?.moreDetails?.[mdIndex];

            const existingMdImagesToKeep = md.existingAdditionalImages || [];
            const newMdImageFiles = filesByField[mdImagesKey] || [];

            // Determine which existing moreDetail images to delete
            const mdImagesToDelete = (existingMd?.additionalImages || []).filter(
              url => !existingMdImagesToKeep.includes(url)
            );
            imagesToDelete.push(...mdImagesToDelete);

            // Upload new moreDetail images
            const newMdImageUrls = [];
            if (newMdImageFiles.length > 0) {
              for (const file of newMdImageFiles) {
                const url = await uploadImageToCloudinary(file.buffer, 'products/variants');
                newMdImageUrls.push(url);
              }
            }

            // Combine kept existing images with new ones
            variant.moreDetails[mdIndex].additionalImages = [...existingMdImagesToKeep, ...newMdImageUrls];

            // Remove temporary tracking field
            delete variant.moreDetails[mdIndex].existingAdditionalImages;
          }
        }
     }
    }

    // Handle dimension-based pricing
    if (productData.hasDimensionPricing === "yes" && productData.dimensionPricingData) {
      const dimensionData = productData.dimensionPricingData;
      const pricingType = dimensionData[0]?.pricingType || 'dynamic';
      
      if (pricingType === 'dynamic') {
        productData.hasDimensions = true;
        productData.pricingType = 'dynamic';
        productData.dimensions = dimensionData.map(d => ({
          length: Number(d.length) || null,
          breadth: Number(d.breadth) || null,
          height: d.height ? Number(d.height) : null,
          price: Number(d.price) || null
        }));
        productData.staticDimensions = [];
        productData.price = null;
        // Keep stock and bulkPricing from productData (already set)
      } else {
        // Static
        productData.hasDimensions = true;
        productData.pricingType = 'static';
        productData.staticDimensions = dimensionData.map(d => ({
          length: Number(d.length) || null,
          breadth: Number(d.breadth) || null,
          height: d.height ? Number(d.height) : null,
          price: Number(d.price) || null,
          stock: Number(d.stock) || null,
          bulkPricing: d.bulkPricing || []
        }));
        productData.dimensions = [];
        productData.price = null;
        productData.stock = null;
        productData.bulkPricing = [];
      }
    } else {
      // Normal product without dimensions
      productData.hasDimensions = false;
      productData.pricingType = 'normal';
      productData.dimensions = [];
      productData.staticDimensions = [];
    }
    
    // Clean up temporary fields
    delete productData.hasDimensionPricing;
    delete productData.dimensionPricingData;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    );

    // Delete old images from Cloudinary
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map(url => deleteFromCloudinary(url)));
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product', 
      error: error.message 
    });
  }
};
// End of function that will handle the editing of product

// Start of function that will handle bulk editing of products
const bulkEditProducts = async (req, res) => {
  try {
    const productsData = JSON.parse(req.body.productsData);
    
    if (!Array.isArray(productsData) || productsData.length === 0) {
      return res.status(400).json({ message: 'No products data provided' });
    }

    // Organize files by product index and field
    const filesByProduct = {};
    if (req.files) {
      req.files.forEach(file => {
        // Parse fieldname like: products[0].image or products[1].additionalImages
        const match = file.fieldname.match(/products\[(\d+)\]\.(.+)/);
        if (match) {
          const productIndex = parseInt(match[1]);
          const fieldPath = match[2];
          
          if (!filesByProduct[productIndex]) {
            filesByProduct[productIndex] = {};
          }
          
          if (!filesByProduct[productIndex][fieldPath]) {
            filesByProduct[productIndex][fieldPath] = [];
          }
          
          filesByProduct[productIndex][fieldPath].push(file);
        }
      });
    }

    const updateResults = [];
    const imagesToDelete = [];

    // Process each product
    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];
      const productFiles = filesByProduct[i] || {};
      const { productId } = productData;

      try {
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
          updateResults.push({
            productId,
            success: false,
            error: 'Product not found'
          });
          continue;
        }

        const productImagesToDelete = [];
        const finalProductData = {
          name: productData.name,
          mainCategory: productData.mainCategory,
          subCategory: productData.subCategory,
          categoryPath: productData.categoryPath,
          productDetails: productData.productDetails || [],
          hasVariants: productData.hasVariants
        };

        // Handle main image
        if (productFiles['image'] && productFiles['image'][0]) {
          if (existingProduct.image) {
            productImagesToDelete.push(existingProduct.image);
          }
          finalProductData.image = await uploadImageToCloudinary(
            productFiles['image'][0].buffer,
            'products'
          );
        } else if (productData.existingImage) {
          finalProductData.image = productData.existingImage;
        } else {
          finalProductData.image = existingProduct.image;
        }

        // Handle additional images
        const existingImagesToKeep = productData.existingAdditionalImages || [];
        const newImageFiles = productFiles['additionalImages'] || [];

        const imagesToDeleteFromAdditional = (existingProduct.additionalImages || []).filter(
          url => !existingImagesToKeep.includes(url)
        );
        productImagesToDelete.push(...imagesToDeleteFromAdditional);

        const newImageUrls = [];
        if (newImageFiles.length > 0) {
          for (const file of newImageFiles) {
            const url = await uploadImageToCloudinary(file.buffer, 'products');
            newImageUrls.push(url);
          }
        }

        finalProductData.additionalImages = [...existingImagesToKeep, ...newImageUrls];

        // Handle non-variant product fields
        if (!productData.hasVariants) {
          finalProductData.stock = productData.stock;
          finalProductData.price = productData.price;
          finalProductData.bulkPricing = productData.bulkPricing || [];
        }

        // Handle variants
        if (productData.hasVariants && productData.variants) {
          finalProductData.variants = [];

          for (let variantIndex = 0; variantIndex < productData.variants.length; variantIndex++) {
            const variant = productData.variants[variantIndex];
            const existingVariant = existingProduct.variants?.[variantIndex];

            const variantObj = {
              colorName: variant.colorName,
              optionalDetails: variant.optionalDetails || [],
              isDefault: variant.isDefault,
              isPriceSame: variant.isPriceSame,
              isStockSame: variant.isStockSame,
              commonPrice: variant.commonPrice,
              commonStock: variant.commonStock,
              commonBulkPricingCombinations: variant.commonBulkPricingCombinations || [],
              moreDetails: []
            };

            // Handle variant image
            const variantImageKey = `variants[${variantIndex}].variantImage`;
            if (productFiles[variantImageKey] && productFiles[variantImageKey][0]) {
              if (existingVariant?.variantImage) {
                productImagesToDelete.push(existingVariant.variantImage);
              }
              variantObj.variantImage = await uploadImageToCloudinary(
                productFiles[variantImageKey][0].buffer,
                'products/variants'
              );
            } else if (variant.existingVariantImage) {
              variantObj.variantImage = variant.existingVariantImage;
            } else if (existingVariant?.variantImage) {
              variantObj.variantImage = existingVariant.variantImage;
            }

            // Handle moreDetails
            if (variant.moreDetails) {
              for (let mdIndex = 0; mdIndex < variant.moreDetails.length; mdIndex++) {
                const md = variant.moreDetails[mdIndex];
                const existingMd = existingVariant?.moreDetails?.[mdIndex];

                const mdImagesKey = `variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`;
                const existingMdImagesToKeep = md.existingAdditionalImages || [];
                const newMdImageFiles = productFiles[mdImagesKey] || [];

                const mdImagesToDelete = (existingMd?.additionalImages || []).filter(
                  url => !existingMdImagesToKeep.includes(url)
                );
                productImagesToDelete.push(...mdImagesToDelete);

                const newMdImageUrls = [];
                if (newMdImageFiles.length > 0) {
                  for (const file of newMdImageFiles) {
                    const url = await uploadImageToCloudinary(file.buffer, 'products/variants');
                    newMdImageUrls.push(url);
                  }
                }

                const mdObj = {
                  size: md.size,
                  optionalDetails: md.optionalDetails || [],
                  additionalImages: [...existingMdImagesToKeep, ...newMdImageUrls]
                };

                if (variant.isPriceSame === "no" && variant.moreDetails.length > 1) {
                  mdObj.price = md.price;
                  mdObj.bulkPricingCombinations = md.bulkPricingCombinations || [];
                }
                if (variant.isStockSame === "no" && variant.moreDetails.length > 1) {
                  mdObj.stock = md.stock;
                }

                variantObj.moreDetails.push(mdObj);
              }
            }

            finalProductData.variants.push(variantObj);
          }
        }

        // Update product in database
        const updatedProduct = await Product.findByIdAndUpdate(
          productId,
          finalProductData,
          { new: true, runValidators: true }
        );

        // Delete old images from Cloudinary
        if (productImagesToDelete.length > 0) {
          await Promise.all(productImagesToDelete.map(url => deleteFromCloudinary(url)));
        }

        imagesToDelete.push(...productImagesToDelete);

        updateResults.push({
          productId,
          success: true,
          product: updatedProduct
        });

      } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
        updateResults.push({
          productId,
          success: false,
          error: error.message
        });
      }
    }

    // Check if all updates were successful
    const allSuccessful = updateResults.every(result => result.success);
    const successCount = updateResults.filter(result => result.success).length;

    res.status(allSuccessful ? 200 : 207).json({
      message: `${successCount} out of ${productsData.length} products updated successfully`,
      results: updateResults,
      totalDeleted: imagesToDelete.length
    });

  } catch (error) {
    console.error('Bulk edit error:', error);
    res.status(500).json({
      message: 'Error updating products',
      error: error.message
    });
  }
};
// End of function that will handle bulk editing of products

// Start of function that will handle duplication of products
const duplicateProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs array is required" });
    }

    const duplicatedProducts = [];
    
    for (const productId of productIds) {
      const originalProduct = await Product.findById(productId).lean();
      
      if (!originalProduct) {
        continue;
      }

      // Generate unique name
      let copyNumber = 1;
      let newName = `${originalProduct.name}-copy${copyNumber}`;
      
      while (await Product.findOne({ name: newName })) {
        copyNumber++;
        newName = `${originalProduct.name}-copy${copyNumber}`;
      }

      // Create new product data
      const newProductData = {
        ...originalProduct,
        _id: undefined,
        name: newName,
        createdAt: undefined,
        updatedAt: undefined,
        __v: undefined,
      };

      // Duplicate main product image
      if (newProductData.image) {
        const duplicatedImage = await duplicateCloudinaryImage(newProductData.image);
        newProductData.image = duplicatedImage || newProductData.image;
      }

      // Duplicate additional images for non-variant products
      if (newProductData.additionalImages && newProductData.additionalImages.length > 0) {
        const duplicatedAdditionalImages = [];
        for (const imageUrl of newProductData.additionalImages) {
          const duplicatedImage = await duplicateCloudinaryImage(imageUrl);
          duplicatedAdditionalImages.push(duplicatedImage || imageUrl);
        }
        newProductData.additionalImages = duplicatedAdditionalImages;
      }

      // Handle variants
      if (newProductData.hasVariants && newProductData.variants) {
        const duplicatedVariants = [];
        
        for (const variant of newProductData.variants) {
          const newVariant = {
            ...variant,
            _id: undefined,
          };
          
          // Duplicate variant image
          if (newVariant.variantImage) {
            const duplicatedVariantImage = await duplicateCloudinaryImage(newVariant.variantImage);
            newVariant.variantImage = duplicatedVariantImage || newVariant.variantImage;
          }
          
          // Handle moreDetails (size configurations)
          if (newVariant.moreDetails && newVariant.moreDetails.length > 0) {
            const duplicatedMoreDetails = [];
            
            for (const md of newVariant.moreDetails) {
              const newMd = {
                ...md,
                _id: undefined,
                size: {
                  ...md.size,
                  _id: undefined,
                },
              };
              
              // Duplicate additional images for this size configuration
              if (newMd.additionalImages && newMd.additionalImages.length > 0) {
                const duplicatedMdImages = [];
                for (const imageUrl of newMd.additionalImages) {
                  const duplicatedImage = await duplicateCloudinaryImage(imageUrl);
                  duplicatedMdImages.push(duplicatedImage || imageUrl);
                }
                newMd.additionalImages = duplicatedMdImages;
              }
              
              duplicatedMoreDetails.push(newMd);
            }
            
            newVariant.moreDetails = duplicatedMoreDetails;
          }
          
          duplicatedVariants.push(newVariant);
        }
        
        newProductData.variants = duplicatedVariants;
      }

      const duplicatedProduct = new Product(newProductData);
      const savedProduct = await duplicatedProduct.save();
      duplicatedProducts.push(savedProduct);
    }

    res.status(201).json({
      message: `Successfully duplicated ${duplicatedProducts.length} product(s)`,
      products: duplicatedProducts,
    });

  } catch (error) {
    console.error("Error duplicating products:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
};
// End of function that will handle duplication of products

// Start of function for activating and deacivating products
const toggleProductStatus = async (req, res) => {
  try {
    const { productId, isActive, variantId, sizeId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId).populate('mainCategory subCategory');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If activating product
    if (isActive) {
      // Check if categories exist and are active
      if (!product.mainCategory) {
        return res.status(400).json({ 
          message: 'Cannot activate product: Main category does not exist' 
        });
      }

      if (!product.mainCategory.isActive) {
        return res.status(400).json({ 
          message: `Cannot activate product: Main category "${product.mainCategory.categoryName}" is inactive` 
        });
      }

      if (product.subCategory) {
        if (!product.subCategory.isActive) {
          return res.status(400).json({ 
            message: `Cannot activate product: Sub category "${product.subCategory.categoryName}" is inactive` 
          });
        }
      }

      // If activating specific size
      if (variantId && sizeId) {
        const updateResult = await Product.updateOne(
          { _id: productId },
          { 
            $set: { 
              "variants.$[v].moreDetails.$[md].isActive": true
            }
          },
          {
            arrayFilters: [
              { "v._id": variantId },
              { "md._id": sizeId }
            ]
          }
        );

        if (updateResult.modifiedCount > 0) {
          return res.status(200).json({ message: 'Size activated successfully' });
        } else {
          return res.status(400).json({ message: 'Failed to activate size' });
        }
      }

      // If activating specific variant
      if (variantId && !sizeId) {
        const updateResult = await Product.updateOne(
          { _id: productId },
          { 
            $set: { 
              "variants.$[v].isActive": true,
              "variants.$[v].moreDetails.$[].isActive": true
            }
          },
          {
            arrayFilters: [
              { "v._id": variantId }
            ]
          }
        );

        if (updateResult.modifiedCount > 0) {
          return res.status(200).json({ message: 'Variant activated successfully' });
        } else {
          return res.status(400).json({ message: 'Failed to activate variant' });
        }
      }

      // Activating entire product
      product.isActive = true;
      product.deactivatedBy = null;
      product.deactivatedDueToCategory = null;
      
      if (product.hasVariants) {
        product.variants.forEach(variant => {
          variant.isActive = true;
          variant.moreDetails.forEach(md => {
            md.isActive = true;
          });
        });
      }

      await product.save();
      return res.status(200).json({ message: 'Product activated successfully' });

    } else {
      // Deactivating product/variant/size
      
      // If deactivating specific size
      if (variantId && sizeId) {
        const updateResult = await Product.updateOne(
          { _id: productId },
          { 
            $set: { 
              "variants.$[v].moreDetails.$[md].isActive": false
            }
          },
          {
            arrayFilters: [
              { "v._id": variantId },
              { "md._id": sizeId }
            ]
          }
        );

        if (updateResult.modifiedCount > 0) {
          return res.status(200).json({ message: 'Size deactivated successfully' });
        } else {
          return res.status(400).json({ message: 'Failed to deactivate size' });
        }
      }

      // If deactivating specific variant
      if (variantId && !sizeId) {
        const updateResult = await Product.updateOne(
          { _id: productId },
          { 
            $set: { 
              "variants.$[v].isActive": false,
              "variants.$[v].moreDetails.$[].isActive": false
            }
          },
          {
            arrayFilters: [
              { "v._id": variantId }
            ]
          }
        );

        if (updateResult.modifiedCount > 0) {
          return res.status(200).json({ message: 'Variant deactivated successfully' });
        } else {
          return res.status(400).json({ message: 'Failed to deactivate variant' });
        }
      }

      // Deactivating entire product
      product.isActive = false;
      product.deactivatedBy = 'manual';
      
      if (product.hasVariants) {
        product.variants.forEach(variant => {
          variant.isActive = false;
          variant.moreDetails.forEach(md => {
            md.isActive = false;
          });
        });
      }

      await product.save();
      return res.status(200).json({ message: 'Product deactivated successfully' });
    }

  } catch (error) {
    console.error('Toggle product status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function for activating and deacivating products

// Start of function to activate and deactivate products in bulk
const bulkToggleProductStatus = async (req, res) => {
  try {
    const { productIds, isActive } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId).populate('mainCategory subCategory');
        
        if (!product) {
          results.failed.push({
            productId,
            error: 'Product not found'
          });
          continue;
        }

        if (isActive) {
          // Check categories before activating
          if (!product.mainCategory) {
            results.failed.push({
              productId,
              productName: product.name,
              error: 'Main category does not exist'
            });
            continue;
          }

          if (!product.mainCategory.isActive) {
            results.failed.push({
              productId,
              productName: product.name,
              error: `Main category "${product.mainCategory.categoryName}" is inactive`
            });
            continue;
          }

          if (product.subCategory && !product.subCategory.isActive) {
            results.failed.push({
              productId,
              productName: product.name,
              error: `Sub category "${product.subCategory.categoryName}" is inactive`
            });
            continue;
          }

          // Activate product
          product.isActive = true;
          product.deactivatedBy = null;
          product.deactivatedDueToCategory = null;
          
          if (product.hasVariants) {
            product.variants.forEach(variant => {
              variant.isActive = true;
              variant.moreDetails.forEach(md => {
                md.isActive = true;
              });
            });
          }

        } else {
          // Deactivate product
          product.isActive = false;
          product.deactivatedBy = 'manual';
          
          if (product.hasVariants) {
            product.variants.forEach(variant => {
              variant.isActive = false;
              variant.moreDetails.forEach(md => {
                md.isActive = false;
              });
            });
          }
        }

        await product.save();
        results.successful.push({
          productId,
          productName: product.name
        });

      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `${results.successful.length} products updated successfully`,
      results
    });

  } catch (error) {
    console.error('Bulk toggle product status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function to activate and deactivate products in bulk

// start of function that will activate and eactivate products variants
const toggleVariantSizeStatus = async (req, res) => {
  try {
    const { productId, variantId, sizeId, isActive } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If toggling a specific size
    if (variantId && sizeId) {
      const updateResult = await Product.updateOne(
        { _id: productId },
        { 
          $set: { 
            "variants.$[v].moreDetails.$[md].isActive": isActive
          }
        },
        {
          arrayFilters: [
            { "v._id": variantId },
            { "md._id": sizeId }
          ]
        }
      );

      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ 
          message: `Size ${isActive ? 'activated' : 'deactivated'} successfully` 
        });
      } else {
        return res.status(400).json({ message: 'Failed to update size status' });
      }
    }

    // If toggling an entire variant (and all its sizes)
    if (variantId && !sizeId) {
      const updateResult = await Product.updateOne(
        { _id: productId },
        { 
          $set: { 
            "variants.$[v].isActive": isActive,
            "variants.$[v].moreDetails.$[].isActive": isActive
          }
        },
        {
          arrayFilters: [
            { "v._id": variantId }
          ]
        }
      );

      if (updateResult.modifiedCount > 0) {
        return res.status(200).json({ 
          message: `Variant ${isActive ? 'activated' : 'deactivated'} successfully` 
        });
      } else {
        return res.status(400).json({ message: 'Failed to update variant status' });
      }
    }

    return res.status(400).json({ message: 'Invalid request parameters' });

  } catch (error) {
    console.error('Toggle variant/size status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function that will activate and deactivate products variants

// Start of function that will handle the searching of products
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(200).json({ results: [] });
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    
    // Create search conditions for product name and variant colors
    const searchConditions = searchTerms.map(term => ({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { 'variants.colorName': { $regex: term, $options: 'i' } }
      ]
    }));

    // Find matching products (limit to 100 results for performance)
    const products = await Product.find({
      isActive: true,
      $and: searchConditions
    })
      .select('name image hasVariants variants.colorName variants.variantImage variants.isActive variants.moreDetails.size variants.moreDetails.price variants.moreDetails.stock variants.moreDetails.isActive price stock')
      .populate('mainCategory', 'categoryName isActive')
      .populate('subCategory', 'categoryName isActive')
      .lean()
      .limit(100);

    // Filter out products with inactive categories
    const filteredProducts = products.filter(product => {
      const mainCat = product.mainCategory;
      const subCat = product.subCategory;
      
      if (mainCat && mainCat.isActive === false) return false;
      if (subCat && subCat.isActive === false) return false;
      
      return true;
    });

    // Build search results matching your frontend format
    const results = [];
    
    filteredProducts.forEach((product) => {
      if (product.hasVariants && product.variants) {
        product.variants.filter(v => v.isActive !== false).forEach((variant) => {
          if (variant.moreDetails && variant.moreDetails.length > 0) {
            variant.moreDetails.filter(md => md.isActive !== false).forEach((sizeDetail) => {
              results.push({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                colorName: variant.colorName,
                sizeDetail: sizeDetail,
                image: variant.variantImage || product.image,
                price: sizeDetail.price,
                stock: sizeDetail.stock
              });
            });
          } else {
            results.push({
              productId: product._id,
              productName: product.name,
              variantId: variant._id,
              colorName: variant.colorName,
              sizeDetail: null,
              image: variant.variantImage || product.image,
              price: variant.commonPrice,
              stock: variant.commonStock
            });
          }
        });
      } else {
        results.push({
          productId: product._id,
          productName: product.name,
          variantId: null,
          colorName: null,
          sizeDetail: null,
          image: product.image,
          price: product.price,
          stock: product.stock
        });
      }
    });

    return res.status(200).json({ results, count: results.length });
  } catch (err) {
    console.log("Error in searching products:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// End of function that will handle the searching of products

module.exports = {
  addProduct: [upload.any(), addProduct],
  fetchProducts,
  restock,
  massRestock,
  massRevisedRate,
  revisedRate,
  upload,
  bulkUploadProducts,
  deleteProduct,
  editProduct,
  getProductById,
  bulkEditProducts,
  duplicateProducts,
  toggleProductStatus,
  bulkToggleProductStatus,
  toggleVariantSizeStatus,
  bulkOverrideProducts,
  searchProducts
}
