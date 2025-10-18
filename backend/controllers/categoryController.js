const Category = require('../models/Category');
const Product = require('../models/Product');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const {cloudinary} = require('../utils/cloudinary');
const mongoose = require('mongoose');

// Fetching all the categories (This function is not intended for fteching the categories while the adding the product)
const fetchCategories = async (req, res) => {
    try {
        const categories = await Category.find({})
            .select('-__v')
            .lean();

        if(!categories || categories.length == 0) {
            return res.status(200).json({message: "No categories found", categories: []});
        }

        return res.status(200).json({message: "categories found", categories});
    } catch(error) {
        console.log("Error while fetching categories:", error);
        return res.status(500).json({message: "Error while fetching categories", error: error.message})
    }
};

// This function will be used by other controller for checking whether categopry exists or not
const findCategoryById = async (categoryID) => {
    try {
        const category = await Category.findById(categoryID);
        return category;
    } catch (error) {
        throw new Error("Error while finding category " + error.message);
    }
}

const findSubCategoryById = async (categoryID) => {
    try {
        const category = await Category.findById(categoryID);
        return category;
    } catch (error) {
        throw new Error("Error while finding category " + error.message);
    }
}

// Multer configuration for file upload (memory storage to avoid saving on server)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file extensions
  const allowedExtensions = ['.xlsx', '.csv', '.jpg', '.jpeg', '.png'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed extensions: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Utility function to upload image to Cloudinary
const uploadImageToCloudinary = async (imagePath, folder = 'categories') => {
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

// Controller for bulk category upload
const bulkUploadCategories = async (req, res) => {
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
      totalProcessed: jsonData.length,
      successCount: 0,
      failCount: 0
    };

    // Sort by level to ensure parent categories are created first
    const sortedData = jsonData.sort((a, b) => (a.level || 0) - (b.level || 0));

    // Process categories
    for (let i = 0; i < sortedData.length; i++) {
      const row = sortedData[i];
      
      try {
        const { categoryPath, categoryName, image, level, description } = row;

        // Validate required fields
        if (!categoryPath || !categoryName) {
          throw new Error('Missing required fields: categoryPath or categoryName');
        }

        // Parse category path
        const pathSegments = categoryPath.split(' > ').map(segment => segment.trim());
        let parentCategoryId = null;

        // For non-root categories, find parent
        if (pathSegments.length > 1) {
          const parentPath = pathSegments.slice(0, -1).join(' > ');
          
          // Find parent category by reconstructing its path
          const parentCategory = await Category.findOne({ 
            categoryName: pathSegments[pathSegments.length - 2] 
          });

          if (!parentCategory) {
            throw new Error(`Parent category not found for path: ${parentPath}`);
          }
          parentCategoryId = parentCategory._id;
        }

        // Check for duplicates (same name under same parent)
        const existingCategory = await Category.findOne({
          categoryName: categoryName,
          parent_category_id: parentCategoryId
        });

        if (existingCategory) {
          // For root categories, skip duplicates
          if (level === 0 || level === '0') {
            results.failed.push({
              row: i + 1,
              data: row,
              error: `Root category '${categoryName}' already exists`
            });
            continue;
          }
          // For sub-categories, allow duplicates under different parents
        }

        // Handle image upload
        let imageUrl = '';
        if (image && image.trim() !== '') {
          try {
            imageUrl = await uploadImageToCloudinary(image.trim(), 'categories');
          } catch (imageError) {
            throw new Error(`Image upload failed: ${imageError.message}`);
          }
        }

        // Create category
        const newCategory = new Category({
          categoryName: categoryName.trim(),
          parent_category_id: parentCategoryId,
          image: imageUrl
        });

        await newCategory.save();

        results.successful.push({
          row: i + 1,
          categoryId: newCategory._id,
          categoryName: newCategory.categoryName,
          parentId: parentCategoryId,
          imageUploaded: !!imageUrl
        });

        results.successCount++;

      } catch (error) {
        results.failed.push({
          row: i + 1,
          data: row,
          error: error.message
        });
        results.failCount++;
      }

      // Send progress update (optional - for real-time updates)
      if (req.io) {
        req.io.emit('categoryUploadProgress', {
          processed: i + 1,
          total: sortedData.length,
          successCount: results.successCount,
          failCount: results.failCount
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Category upload completed. ${results.successCount} successful, ${results.failCount} failed.`,
      results: results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during category upload',
      error: error.message
    });
  }
};

// Update category name
// Update category name
const updateCategoryName = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldCategoryName = category.categoryName;
    category.categoryName = categoryName.trim();
    await category.save();

    // Helper function to build category path
    const buildCategoryPath = async (categoryId) => {
      const cat = await Category.findById(categoryId);
      if (!cat) return '';
      
      if (!cat.parent_category_id) {
        return cat.categoryName;
      }
      
      const parentPath = await buildCategoryPath(cat.parent_category_id);
      return `${parentPath} > ${cat.categoryName}`;
    };

    // Function to get all descendant category IDs
    const getAllDescendantIds = async (parentId) => {
      const children = await Category.find({ parent_category_id: parentId });
      let allIds = children.map(child => child._id);
      
      for (const child of children) {
        const descendantIds = await getAllDescendantIds(child._id);
        allIds = allIds.concat(descendantIds);
      }
      
      return allIds;
    };

    // Get all descendant category IDs (including the current category)
    const descendantIds = await getAllDescendantIds(id);
    const allAffectedCategoryIds = [id, ...descendantIds];

    // Find all products that have any of these categories as mainCategory or subCategory
    const productsToUpdate = await Product.find({
      $or: [
        { mainCategory: { $in: allAffectedCategoryIds } },
        { subCategory: { $in: allAffectedCategoryIds } }
      ]
    });

    // Update categoryPath for each affected product
    let updatedProductCount = 0;
    for (const product of productsToUpdate) {
      let newCategoryPath = '';
      
      // Build the category path based on mainCategory and subCategory
      if (product.mainCategory) {
        const mainCatPath = await buildCategoryPath(product.mainCategory);
        newCategoryPath = mainCatPath;
        
        if (product.subCategory) {
          const subCatPath = await buildCategoryPath(product.subCategory);
          newCategoryPath = subCatPath; // Full path from root to subcategory
        }
      }
      
      // Update the product's categoryPath
      if (product.categoryPath !== newCategoryPath) {
        product.categoryPath = newCategoryPath;
        await product.save();
        updatedProductCount++;
      }
    }

    res.status(200).json({ 
      message: 'Category and related products updated successfully',
      category,
      updatedProductsCount: updatedProductCount
    });
  } catch (error) {
    console.error('Error updating category name:', error);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

// Update category image
const updateCategoryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if it's a remove image request
    if (req.body.removeImage) {
      if (category.image) {
        try {
          const urlParts = category.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.log('Failed to delete image from Cloudinary:', error.message);
        }
      }
      
      category.image = null;
      await category.save();
      
      return res.status(200).json({ 
        message: 'Image removed successfully',
        imageUrl: null
      });
    }

    // Upload new image
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old image from Cloudinary if exists
    if (category.image) {
      try {
        const urlParts = category.image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log('Failed to delete old image from Cloudinary:', error.message);
      }
    }

    // Upload new image to Cloudinary using buffer
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'categories',
      resource_type: 'image'
    });

    category.image = result.secure_url;
    await category.save();

    res.status(200).json({ 
      message: 'Image updated successfully',
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Error updating category image:', error);
    res.status(500).json({ message: 'Failed to update image', error: error.message });
  }
};

// Add subcategory
const addSubcategory = async (req, res) => {
  try {
    const { categoryName, parent_category_id } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (!parent_category_id) {
      return res.status(400).json({ message: 'Parent category ID is required' });
    }

    // Check if parent category exists
    const parentCategory = await Category.findById(parent_category_id);
    if (!parentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }

    const newCategory = new Category({
      categoryName: categoryName.trim(),
      parent_category_id: parent_category_id,
      image: null
    });

    await newCategory.save();

    res.status(201).json({ 
      message: 'Subcategory added successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Error adding subcategory:', error);
    res.status(500).json({ message: 'Failed to add subcategory', error: error.message });
  }
};

// Delete category (recursive)
// Delete category (recursive)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Function to recursively get all descendant category IDs
    const getAllDescendantIds = async (parentId) => {
      const children = await Category.find({ parent_category_id: parentId });
      let allIds = children.map(child => child._id);
      
      for (const child of children) {
        const descendantIds = await getAllDescendantIds(child._id);
        allIds = allIds.concat(descendantIds);
      }
      
      return allIds;
    };

    // Get all descendant category IDs
    const descendantIds = await getAllDescendantIds(id);
    const allCategoryIds = [id, ...descendantIds];

    // Get all categories that will be deleted to extract image URLs
    const categoriesToDelete = await Category.find({ _id: { $in: allCategoryIds } });

    // Delete category images from Cloudinary
    for (const cat of categoriesToDelete) {
      if (cat.image) {
        try {
          const urlParts = cat.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.log(`Failed to delete image for category ${cat.categoryName}:`, error.message);
        }
      }
    }

    // Find all products that have any of these categories as mainCategory or subCategory
    const productsToDelete = await Product.find({
      $or: [
        { mainCategory: { $in: allCategoryIds } },
        { subCategory: { $in: allCategoryIds } }
      ]
    });

    // Delete product images from Cloudinary
    const deleteFromCloudinary = async (imageUrl) => {
      if (!imageUrl) return;
      try {
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted image: ${publicId}`);
        }
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    };

    // Delete all images for each product
    for (const product of productsToDelete) {
      // Delete main product image
      if (product.image) {
        await deleteFromCloudinary(product.image);
      }

      // Delete additional images
      if (product.additionalImages && product.additionalImages.length > 0) {
        for (const img of product.additionalImages) {
          await deleteFromCloudinary(img);
        }
      }

      // Delete variant images
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (variant.variantImage) {
            await deleteFromCloudinary(variant.variantImage);
          }

          // Delete moreDetails images
          if (variant.moreDetails && variant.moreDetails.length > 0) {
            for (const detail of variant.moreDetails) {
              if (detail.additionalImages && detail.additionalImages.length > 0) {
                for (const img of detail.additionalImages) {
                  await deleteFromCloudinary(img);
                }
              }
            }
          }
        }
      }
    }

    // Delete all products
    const deletedProductsCount = await Product.deleteMany({
      $or: [
        { mainCategory: { $in: allCategoryIds } },
        { subCategory: { $in: allCategoryIds } }
      ]
    });

    // Delete all categories (parent and all descendants)
    await Category.deleteMany({ _id: { $in: allCategoryIds } });

    res.status(200).json({ 
      message: 'Category, subcategories, and related products deleted successfully',
      deletedCategoriesCount: allCategoryIds.length,
      deletedProductsCount: deletedProductsCount.deletedCount
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

// Start of function to activate/deactivate category
const toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId, isActive, reactivateProducts } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (isActive) {
      // Activating category
      category.isActive = true;

      // Get all descendant categories
      const getAllDescendantIds = async (parentId) => {
        const children = await Category.find({ parent_category_id: parentId });
        let allIds = children.map(child => child._id);
        
        for (const child of children) {
          const descendantIds = await getAllDescendantIds(child._id);
          allIds = allIds.concat(descendantIds);
        }
        
        return allIds;
      };

      const descendantIds = await getAllDescendantIds(categoryId);
      const allCategoryIds = [categoryId, ...descendantIds];

      // Activate all descendant categories
      await Category.updateMany(
        { _id: { $in: allCategoryIds } },
        { $set: { isActive: true } }
      );

      // Handle product reactivation
      if (reactivateProducts && category.deactivatedProducts && category.deactivatedProducts.length > 0) {
        const productsToReactivate = [];
        
        for (const productId of category.deactivatedProducts) {
          const product = await Product.findById(productId).populate('mainCategory subCategory');
          
          if (!product) continue;

          // Check if both categories are active
          let canReactivate = true;
          
          if (!product.mainCategory || !product.mainCategory.isActive) {
            canReactivate = false;
          }
          
          if (product.subCategory && !product.subCategory.isActive) {
            canReactivate = false;
          }

          if (canReactivate) {
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
            productsToReactivate.push(productId);
          }
        }

        // Clear deactivated products list
        category.deactivatedProducts = [];
        await category.save();

        // Clear from other categories' deactivatedProducts arrays
        await Category.updateMany(
          { _id: { $in: allCategoryIds } },
          { $set: { deactivatedProducts: [] } }
        );

        return res.status(200).json({ 
          message: 'Category activated successfully',
          reactivatedProducts: productsToReactivate.length,
          categoryIds: allCategoryIds
        });
      }

      await category.save();
      return res.status(200).json({ 
        message: 'Category activated successfully',
        categoryIds: allCategoryIds
      });

    } else {
      // Deactivating category
      category.isActive = false;

      // Get all descendant categories
      const getAllDescendantIds = async (parentId) => {
        const children = await Category.find({ parent_category_id: parentId });
        let allIds = children.map(child => child._id);
        
        for (const child of children) {
          const descendantIds = await getAllDescendantIds(child._id);
          allIds = allIds.concat(descendantIds);
        }
        
        return allIds;
      };

      const descendantIds = await getAllDescendantIds(categoryId);
      const allCategoryIds = [categoryId, ...descendantIds];

      // Deactivate all descendant categories
      await Category.updateMany(
        { _id: { $in: allCategoryIds } },
        { $set: { isActive: false } }
      );

      // Find and deactivate all products with these categories
      const affectedProducts = await Product.find({
        $or: [
          { mainCategory: { $in: allCategoryIds } },
          { subCategory: { $in: allCategoryIds } }
        ],
        isActive: true
      });

      const deactivatedProductIds = [];

      for (const product of affectedProducts) {
        product.isActive = false;
        product.deactivatedBy = 'category';
        product.deactivatedDueToCategory = categoryId;
        
        if (product.hasVariants) {
          product.variants.forEach(variant => {
            variant.isActive = false;
            variant.moreDetails.forEach(md => {
              md.isActive = false;
            });
          });
        }
        
        await product.save();
        deactivatedProductIds.push(product._id);
      }

      // Store deactivated products in category
      category.deactivatedProducts = deactivatedProductIds;
      await category.save();

      return res.status(200).json({ 
        message: 'Category deactivated successfully',
        deactivatedProducts: deactivatedProductIds.length,
        categoryIds: allCategoryIds
      });
    }

  } catch (error) {
    console.error('Toggle category status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function to activate/deactivate category

// Start of function to bulk activate/deactivate categories
const bulkToggleCategoryStatus = async (req, res) => {
  try {
    const { categoryIds, isActive, reactivateProducts } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'Category IDs array is required' });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const categoryId of categoryIds) {
      try {
        const requestBody = { categoryId, isActive };
        if (reactivateProducts !== undefined) {
          requestBody.reactivateProducts = reactivateProducts;
        }

        // Reuse single toggle function
        await toggleCategoryStatus({ body: requestBody }, {
          status: (code) => ({
            json: (data) => {
              if (code === 200) {
                results.successful.push({ categoryId, ...data });
              } else {
                results.failed.push({ categoryId, error: data.message });
              }
            }
          })
        });

      } catch (error) {
        results.failed.push({
          categoryId,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: `${results.successful.length} categories updated successfully`,
      results
    });

  } catch (error) {
    console.error('Bulk toggle category status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function to bulk activate/deactivate categories

// Start of function that will activate and deactivate the sub categories
const toggleSubcategoryStatus = async (req, res) => {
  try {
    const { categoryId, isActive } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get all descendant categories
    const getAllDescendantIds = async (parentId) => {
      const children = await Category.find({ parent_category_id: parentId });
      let allIds = children.map(child => child._id);
      
      for (const child of children) {
        const descendantIds = await getAllDescendantIds(child._id);
        allIds = allIds.concat(descendantIds);
      }
      
      return allIds;
    };

    const descendantIds = await getAllDescendantIds(categoryId);
    const allCategoryIds = [categoryId, ...descendantIds];

    // Update all categories
    await Category.updateMany(
      { _id: { $in: allCategoryIds } },
      { $set: { isActive: isActive } }
    );

    // If deactivating, deactivate products
    if (!isActive) {
      const affectedProducts = await Product.find({
        $or: [
          { mainCategory: { $in: allCategoryIds } },
          { subCategory: { $in: allCategoryIds } }
        ],
        isActive: true
      });

      const deactivatedProductIds = [];

      for (const product of affectedProducts) {
        product.isActive = false;
        product.deactivatedBy = 'category';
        product.deactivatedDueToCategory = categoryId;
        
        if (product.hasVariants) {
          product.variants.forEach(variant => {
            variant.isActive = false;
            variant.moreDetails.forEach(md => {
              md.isActive = false;
            });
          });
        }
        
        await product.save();
        deactivatedProductIds.push(product._id);
      }

      category.deactivatedProducts = deactivatedProductIds;
      await category.save();
    }

    return res.status(200).json({ 
      message: `Subcategory ${isActive ? 'activated' : 'deactivated'} successfully`,
      affectedCategories: allCategoryIds.length
    });

  } catch (error) {
    console.error('Toggle subcategory status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// End of function that will activate and deactivate the sub categories

module.exports = {
    fetchCategories,
    findCategoryById,
    findSubCategoryById,
    upload,
    bulkUploadCategories,
    deleteCategory,
    updateCategoryName, 
    updateCategoryImage, 
    addSubcategory,
    toggleCategoryStatus,
    bulkToggleCategoryStatus,
    toggleSubcategoryStatus
}