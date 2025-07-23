const Category = require('../models/Category');

const addCategory = async (req, res) => {
  console.log('Adding category request received:', JSON.stringify(req.body, null, 2));
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.log('Categories array is required');
      return res.status(400).json({ error: 'Categories array is required' });
    }

    if (!categories[0].categoryName) {
      console.log('Main category name is required');
      return res.status(400).json({ error: 'Main category name is required' });
    }

    // Validate that only main category has an image
    for (const category of categories) {
      if (category.parent_category_id !== null && category.image) {
        console.log('Only main categories can have images');
        return res.status(400).json({ error: 'Only main categories can have images' });
      }
    }

    const savedCategoryIds = {};
    const savedCategories = [];

    for (const category of categories) {
      let parentId = null;
      
      if (category.parent_category_id) {
        console.log(`Processing parent_category_id: ${category.parent_category_id}`);
        
        if (category.parent_category_id === 'main') {
          // This is a direct child of main category
          parentId = savedCategoryIds['main'];
        } else {
          // This is a nested subcategory - find the parent using the path
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

      // Store the saved category ID with its path for future reference
      if (category.parent_category_id === null) {
        // This is the main category
        savedCategoryIds['main'] = saved._id;
        console.log(`Saved main category: ${category.categoryName}, _id: ${saved._id}`);
      } else {
        // This is a subcategory - store it with the current path for nested children
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

module.exports = addCategory;