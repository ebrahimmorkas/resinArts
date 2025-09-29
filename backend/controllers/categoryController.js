const Category = require('../models/Category');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const {cloudinary} = require('../utils/cloudinary');

// Fetching all the categories (This function is not intended for fteching the categories while the adding the product)
const fetchCategories = async (req, res) => {
    try {
        const categories = await Category.find({});

        if(!categories || categories.length == 0) {
            return res.status(200).json({message: "No categories found"});
        }

        // categories found
        return res.status(200).json({message: "categories found", categories});
    } catch(error) {
        return res.status(400).json({message: "Error while fetching categories", error})
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
  const allowedExtensions = ['.xlsx', '.csv'];
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

// Function to delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { cloudinary } = require('../utils/cloudinary');

    // Find the category to delete
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

    // Delete images from Cloudinary
    for (const cat of categoriesToDelete) {
      if (cat.image) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = cat.image.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.log(`Failed to delete image for category ${cat.categoryName}:`, error.message);
        }
      }
    }

    // Delete all categories (parent and all descendants)
    await Category.deleteMany({ _id: { $in: allCategoryIds } });

    res.status(200).json({ 
      message: 'Category and all subcategories deleted successfully',
      deletedCount: allCategoryIds.length
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

module.exports = {
    fetchCategories,
    findCategoryById,
    findSubCategoryById,
    upload,
    bulkUploadCategories,
    deleteCategory
}