const User = require('../models/User');
const Product = require('../models/Product');

// Run this periodically via cron job to remove deleted/inactive products from favorites
async function cleanupInvalidFavorites() {
  try {
    const users = await User.find({ favorites: { $exists: true, $ne: [] } });
    
    for (const user of users) {
      const validProducts = await Product.find({
        _id: { $in: user.favorites },
        isActive: true
      }).select('_id');
      
      const validIds = validProducts.map(p => p._id.toString());
      const currentIds = user.favorites.map(id => id.toString());
      
      const idsToRemove = currentIds.filter(id => !validIds.includes(id));
      
      if (idsToRemove.length > 0) {
        await User.findByIdAndUpdate(user._id, {
          $pull: { favorites: { $in: idsToRemove } }
        });
        console.log(`Cleaned ${idsToRemove.length} invalid favorites for user ${user._id}`);
      }
    }
    
    console.log('Favorites cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = cleanupInvalidFavorites;