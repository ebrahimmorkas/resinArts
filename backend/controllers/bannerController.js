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
    const { startDate, endDate, isDefault, isActive } = req.body;
    
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

    const newBanner = new Banner({
      image: uploadResult.secure_url,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isDefault: isDefault === 'true' || isDefault === true,
      isActive: isActive === 'true' || isActive === true
    });

    const savedBanner = await newBanner.save();
    console.log('Banner saved successfully');

    res.status(201).json({ 
      message: 'Banner added successfully', 
      banner: savedBanner 
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

// Other functions remain the same...
const fetchBanners = async (req, res) => {
  try {
    const now = new Date();
    const expiredBanners = await Banner.find({ endDate: { $lt: now } });
    
    for (const banner of expiredBanners) {
      const urlParts = banner.image.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `banners/${fileName}`;
      await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));
      await Banner.findByIdAndDelete(banner._id);
    }

    const banners = await Banner.find({}).sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const urlParts = banner.image.split('/');
    const fileName = urlParts[urlParts.length - 1].split('.')[0];
    const publicId = `banners/${fileName}`;
    await cloudinary.uploader.destroy(publicId).catch(err => console.error('Cloudinary delete error:', err));

    await Banner.findByIdAndDelete(id);
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error.message);
    res.status(500).json({ message: 'Error deleting banner', error: error.message });
  }
};

module.exports = {
  addBanner: [upload.single('image'), addBanner],
  fetchBanners,
  deleteBanner
};