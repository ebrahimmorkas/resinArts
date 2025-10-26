const User = require('../models/User');
const Product = require('../models/Product');

// Add to favorites
addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Check if product exists and is active
    const product = await Product.findById(productId).select('_id isActive');
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Add to favorites (prevent duplicates with $addToSet)
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: productId } },
      { new: true }
    ).select('favorites');

    res.status(200).json({ 
      message: 'Added to favorites',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ message: 'Failed to add to favorites' });
  }
};

// Remove from favorites
removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: productId } },
      { new: true }
    ).select('favorites');

    res.status(200).json({ 
      message: 'Removed from favorites',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Failed to remove from favorites' });
  }
};

// Get user's favorites (paginated for performance)
getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select('favorites')
      .populate({
        path: 'favorites',
        match: { isActive: true },
        select: 'name image price discountPrice discountStartDate discountEndDate hasVariants variants stock createdAt lastRestockedAt',
        options: { 
          skip: skip,
          limit: limit 
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out null products (deleted/inactive)
    const validFavorites = user.favorites.filter(fav => fav !== null);
    
    // Get total count for pagination
    const totalFavorites = await User.findById(userId).select('favorites');
    const total = totalFavorites.favorites.length;

    res.status(200).json({
      favorites: validFavorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
};

// Check if products are favorited (batch check for performance)
checkFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body; // Array of product IDs

    const user = await User.findById(userId).select('favorites');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const favoritesSet = new Set(user.favorites.map(id => id.toString()));
    const result = {};
    
    productIds.forEach(id => {
      result[id] = favoritesSet.has(id);
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Check favorites error:', error);
    res.status(500).json({ message: 'Failed to check favorites' });
  }
};

module.exports = {
    addToFavorites, 
    removeFromFavorites,
    getFavorites, 
    checkFavorites
};