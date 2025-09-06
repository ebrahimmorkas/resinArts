const Banner = require('../models/Banner');
const { cloudinary } = require('../utils/cloudinary');
const multer = require('multer');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const addBanner = async (req, res) => {
  console.log('=== BANNER UPLOAD DEBUG START ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer ? `Buffer size: ${req.file.buffer.length}` : 'No buffer'
  } : 'No file');
  
  try {
    const { startDate, endDate, isDefault } = req.body; // Removed isActive
    
    if (!req.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ message: 'Image is required' });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log('ERROR: Empty file buffer');
      return res.status(400).json({ message: 'Invalid file - empty buffer' });
    }

    console.log('Starting Cloudinary upload...');
    
    // Upload image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'banners',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.log('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    // Check if this is the first banner in the database
    const existingBannersCount = await Banner.countDocuments();
    console.log('Existing banners count:', existingBannersCount);
    
    // If no existing banners, automatically set as default
    const shouldBeDefault = existingBannersCount === 0 ? true : (isDefault === 'true' || isDefault === true);
    console.log('Should be default:', shouldBeDefault);

    const newBanner = new Banner({
      image: uploadResult.secure_url,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isDefault: shouldBeDefault
      // Removed isActive field completely
    });

    const savedBanner = await newBanner.save();
    console.log('Banner saved successfully');

    res.status(201).json({ 
      message: existingBannersCount === 0 
        ? 'Banner added successfully and set as default (first banner)' 
        : 'Banner added successfully', 
      banner: savedBanner,
      autoSetDefault: existingBannersCount === 0
    });

  } catch (error) {
    console.log('=== BANNER UPLOAD ERROR ===');
    console.error('Full error:', error);
    res.status(500).json({ 
      message: 'Error adding banner', 
      error: error.message
    });
  }
};

const fetchBanners = async (req, res) => {
  try {
    const now = new Date();
    
    // Find expired banners
    const expiredBanners = await Banner.find({ endDate: { $lt: now } });
    
    // Delete expired banners and their Cloudinary images in parallel
    const deletePromises = expiredBanners.map(async (banner) => {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = banner.image.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const publicId = `banners/${fileName}`;
        
        // Delete from Cloudinary (don't wait for this to complete)
        cloudinary.uploader.destroy(publicId).catch(err => 
          console.error('Cloudinary delete error for expired banner:', err)
        );
        
        // Delete from database
        await Banner.findByIdAndDelete(banner._id);
      } catch (err) {
        console.error('Error deleting expired banner:', banner._id, err);
      }
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // Fetch all remaining banners (no active filtering)
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
};

// NEW API: Update banner default status
const updateBannerDefault = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault } = req.body;

    console.log(`Updating banner ${id} default status to:`, isDefault);

    // Find the banner first
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // If trying to remove default status, check if this is the only default banner
    if (banner.isDefault && !isDefault) {
      const defaultBannersCount = await Banner.countDocuments({ isDefault: true });
      console.log('Current default banners count:', defaultBannersCount);
      
      if (defaultBannersCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot remove default status. At least one default banner must exist.',
          error: 'LAST_DEFAULT_BANNER'
        });
      }
    }

    // Update the banner
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      { isDefault },
      { new: true }
    );

    console.log('Banner default status updated successfully');

    res.status(200).json({ 
      message: isDefault 
        ? 'Banner set as default successfully' 
        : 'Default status removed successfully',
      banner: updatedBanner
    });

  } catch (error) {
    console.error('Error updating banner default status:', error);
    res.status(500).json({ 
      message: 'Error updating banner default status', 
      error: error.message 
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the banner first
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Check if this is a default banner and if it's the only default banner
    if (banner.isDefault) {
      const defaultBannersCount = await Banner.countDocuments({ isDefault: true });
      console.log('Default banners count before deletion:', defaultBannersCount);
      
      if (defaultBannersCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last default banner. At least one default banner must exist.',
          error: 'LAST_DEFAULT_BANNER_DELETE'
        });
      }
    }

    console.log('Deleting banner:', id);
    
    // Extract public_id from Cloudinary URL for deletion
    const urlParts = banner.image.split('/');
    const fileName = urlParts[urlParts.length - 1].split('.')[0];
    const publicId = `banners/${fileName}`;
    
    // Delete from database first (faster response)
    await Banner.findByIdAndDelete(id);
    console.log('Banner deleted from database');

    // Delete from Cloudinary asynchronously (don't block the response)
    cloudinary.uploader.destroy(publicId)
      .then(result => console.log('Cloudinary deletion result:', result))
      .catch(err => console.error('Cloudinary delete error:', err));

    res.status(200).json({ 
      message: 'Banner deleted successfully',
      deletedBanner: banner
    });
  } catch (error) {
    console.error('Error deleting banner:', error.message);
    res.status(500).json({ 
      message: 'Error deleting banner', 
      error: error.message 
    });
  }
};

module.exports = {
  addBanner: [upload.single('image'), addBanner],
  fetchBanners,
  updateBannerDefault, // New API function
  deleteBanner
};