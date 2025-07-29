const Category = require('../models/Category');
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const addCategory = async (req, res) => {
  console.log('Adding category request received:', JSON.stringify(req.body, null, 2));
  try {
    const { categories } = req.body;
    const imageFile = req.file;

    if (!categories) {
      console.log('Categories data is required');
      return res.status(400).json({ error: 'Categories data is required' });
    }

    // Parse categories if it's a string (from FormData)
    let parsedCategories;
    try {
      parsedCategories = JSON.parse(categories);
    } catch (error) {
      console.log('Invalid categories JSON format');
      return res.status(400).json({ error: 'Invalid categories JSON format' });
    }

    if (!Array.isArray(parsedCategories) || parsedCategories.length === 0) {
      console.log('Categories array is required');
      return res.status(400).json({ error: 'Categories array is required' });
    }

    if (!parsedCategories[0].categoryName) {
      console.log('Main category name is required');
      return res.status(400).json({ error: 'Main category name is required' });
    }

    let imageUrl = null;
    if (imageFile) {
      // Upload image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'categories' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(imageFile.buffer);
      });
      imageUrl = uploadResult.secure_url;
      console.log('Image uploaded to Cloudinary:', imageUrl);
    }

    // Validate that only main category can have an image
    for (const category of parsedCategories) {
      if (category.parent_category_id !== null && category.image) {
        console.log('Only main categories can have images');
        return res.status(400).json({ error: 'Only main categories can have images' });
      }
      if (category.image && !isValidUrl(category.image)) {
        console.log('Invalid image URL provided');
        return res.status(400).json({ error: 'Invalid image URL' });
      }
    }

    // Update main category with Cloudinary image URL
    if (imageUrl) {
      parsedCategories[0].image = imageUrl;
    }

    const savedCategoryIds = {};
    const savedCategories = [];

    for (const category of parsedCategories) {
      let parentId = null;

      if (category.parent_category_id) {
        console.log(`Processing parent_category_id: ${category.parent_category_id}`);

        if (category.parent_category_id === 'main') {
          parentId = savedCategoryIds['main'];
        } else {
          const pathKey = category.parent_category_id;
          if (!savedCategoryIds[pathKey]) {
            console.log(`Invalid parent_category_id: ${category.parent_category_id} (path: ${pathKey})`);
            return res.status(400).json({ error: `Invalid parent_category_id: ${category.parent_category_id}` });
          }
          parentId = savedCategoryIds[pathKey];
        }
      }

      console.log(`Saving category: ${category.categoryName}, parentId: ${parentId || 'null'}`);

      const newCategory = new Category({
        categoryName: category.categoryName,
        parent_category_id: parentId,
        image: category.image || null,
      });

      const saved = await newCategory.save();
      savedCategories.push(saved);

      if (category.parent_category_id === null) {
        savedCategoryIds['main'] = saved._id;
        console.log(`Saved main category: ${category.categoryName}, _id: ${saved._id}`);
      } else {
        const currentPath = category.current_path;
        if (currentPath) {
          savedCategoryIds[currentPath] = saved._id;
          console.log(`Saved subcategory: ${category.categoryName}, path: ${currentPath}, _id: ${saved._id}`);
        }
      }
    }

    res.status(201).json({
      message: 'Categories created successfully',
      categories: savedCategories,
    });
  } catch (error) {
    console.error('Error creating categories:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Export the controller wrapped with multer middleware
module.exports = {
  addCategory: [upload.single('image'), addCategory],
};