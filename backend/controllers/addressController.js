const Address = require('../models/Address');

// Get all addresses for logged-in user
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

// Get single address by ID
const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({ 
      _id: req.params.id, 
      user_id: req.user.id 
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch address' });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    const { name, state, city, pincode, full_address } = req.body;
    
    // Validate required fields
    if (!name || !state || !city || !pincode || !full_address) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Check if address name already exists for this user
    const existingAddress = await Address.findOne({ 
      user_id: req.user.id, 
      name: name.trim() 
    });
    
    if (existingAddress) {
      return res.status(400).json({ 
        success: false, 
        message: `Address with name "${name}" already exists` 
      });
    }
    
    // Create new address
    const newAddress = new Address({
      user_id: req.user.id,
      name: name.trim(),
      state,
      city,
      pincode,
      full_address
    });
    
    await newAddress.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Address added successfully', 
      address: newAddress 
    });
  } catch (error) {
    console.error('Error creating address:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address with this name already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to create address' });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { name, state, city, pincode, full_address } = req.body;
    const addressId = req.params.id;
    
    // Validate required fields
    if (!name || !state || !city || !pincode || !full_address) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Find the address
    const address = await Address.findOne({ 
      _id: addressId, 
      user_id: req.user.id 
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Check if new name conflicts with existing address (excluding current address)
    if (name.trim() !== address.name) {
      const existingAddress = await Address.findOne({ 
        user_id: req.user.id, 
        name: name.trim(),
        _id: { $ne: addressId }
      });
      
      if (existingAddress) {
        return res.status(400).json({ 
          success: false, 
          message: `Address with name "${name}" already exists` 
        });
      }
    }
    
    // Update address
    address.name = name.trim();
    address.state = state;
    address.city = city;
    address.pincode = pincode;
    address.full_address = full_address;
    
    await address.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Address updated successfully', 
      address 
    });
  } catch (error) {
    console.error('Error updating address:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address with this name already exists' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ 
      _id: req.params.id, 
      user_id: req.user.id 
    });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress
};