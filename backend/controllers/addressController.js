const Address = require('../models/Address');
const sendEmail = require('../utils/sendEmail');

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

// Prevent using "Home" as address name (case-insensitive)
if (name.trim().toLowerCase() === 'home') {
  return res.status(400).json({ 
    success: false, 
    message: 'Cannot use "Home" as address name. This is reserved for your default address.' 
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

// Prevent using "Home" as address name (case-insensitive)
if (name.trim().toLowerCase() === 'home') {
  return res.status(400).json({ 
    success: false, 
    message: 'Cannot use "Home" as address name. This is reserved for your default address.' 
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

// Get all addresses for a specific user (Admin only)
const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const addresses = await Address.find({ user_id: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user addresses' });
  }
};

// Change order delivery address
const changeOrderAddress = async (req, res) => {
  try {
    const { orderId, newAddress, changedBy } = req.body; // changedBy: 'admin' or 'user'
    
    // Validate required fields
    if (!orderId || !newAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID and new address are required' 
      });
    }

    if (!newAddress.name || !newAddress.state || !newAddress.city || !newAddress.pincode || !newAddress.full_address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete address information is required' 
      });
    }

    // Find the order
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order status allows address change
    const allowedStatuses = ['Pending', 'Accepted', 'Confirm'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change address for ${order.status} orders. Address can only be changed for Pending, Accepted, or Confirm orders.` 
      });
    }

    // Store old address for email notification
    const oldAddress = order.delivery_address;

    // Find user for shipping calculation
    const User = require('../models/User');
    const user = await User.findById(order.user_id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Re-calculate shipping price based on new address
    const CompanySettings = require('../models/CompanySettings');
    const companySettings = await CompanySettings.getSingleton();
    
    // Create temporary user object with new address for shipping calculation
    const tempUser = {
      ...user.toObject(),
      state: newAddress.state,
      city: newAddress.city,
      zip_code: newAddress.pincode,
      address: newAddress.full_address
    };

    const calculateShippingPrice = async (user, itemsTotal, companySettings) => {
      try {
        // Check if free shipping is enabled and threshold is met
        if (companySettings.shippingPriceSettings.freeShipping && 
            itemsTotal >= companySettings.shippingPriceSettings.freeShippingAboveAmount) {
          return { shippingPrice: 0, isPending: false, needsManualEntry: false };
        }

        // Check if same for all products (common shipping price)
        if (companySettings.shippingPriceSettings.sameForAll && companySettings.shippingPriceSettings.commonShippingPrice !== undefined) {
          return { 
            shippingPrice: companySettings.shippingPriceSettings.commonShippingPrice, 
            isPending: false,
            needsManualEntry: false
          };
        }

        // Check if manual pricing is enabled
        if (companySettings.shippingPriceSettings.isManual) {
          return { shippingPrice: null, isPending: true, needsManualEntry: true };
        }

        // Location-based shipping
        const shippingType = companySettings.shippingPriceSettings.shippingType;
        let userLocation = null;

        if (shippingType === 'state') {
          userLocation = user.state;
        } else if (shippingType === 'city') {
          userLocation = user.city;
        } else if (shippingType === 'zipcode') {
          userLocation = user.zip_code;
        }

        // Validate user location is not empty
        if (!userLocation || userLocation.trim() === '') {
          return { shippingPrice: null, isPending: true, needsManualEntry: true };
        }

        // Find matching shipping price in the list
        const shippingEntry = companySettings.shippingPriceSettings.shippingPrices.find(
          entry => entry.location.toLowerCase().trim() === userLocation.toLowerCase().trim()
        );

        if (shippingEntry) {
          return { shippingPrice: shippingEntry.price, isPending: false, needsManualEntry: false };
        } else {
          // Location not found in list - require manual entry
          return { shippingPrice: null, isPending: true, needsManualEntry: true };
        }
      } catch (error) {
        console.error('Error calculating shipping price:', error);
        return { shippingPrice: null, isPending: true, needsManualEntry: true };
      }
    };

    const { shippingPrice, isPending } = await calculateShippingPrice(tempUser, order.price, companySettings);

    // Update order with new address and shipping price
    order.address_id = newAddress.address_id || null;
    order.delivery_address = {
      name: newAddress.name,
      state: newAddress.state,
      city: newAddress.city,
      pincode: newAddress.pincode,
      full_address: newAddress.full_address
    };
    order.shipping_price = shippingPrice || 0;
    order.total_price = isPending ? "Pending" : (order.price + (shippingPrice || 0));
    order.updatedAt = new Date();

    await order.save();

    // Send email notification
    try {
      if (changedBy === 'admin') {
        // Send email to customer
        const emailSubject = `Delivery Address Updated - Order #${orderId}`;
        const emailText = `Dear ${order.user_name},

Your delivery address for order #${orderId} has been updated by our team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDRESS CHANGE NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Change Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Order Status: ${order.status}

PREVIOUS ADDRESS (${oldAddress.name}):
${oldAddress.full_address}
${oldAddress.city}, ${oldAddress.state} - ${oldAddress.pincode}

NEW ADDRESS (${order.delivery_address.name}):
${order.delivery_address.full_address}
${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}

UPDATED SHIPPING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Shipping Cost: ₹${order.shipping_price === shippingPrice ? shippingPrice.toFixed(2) : 'N/A'}
New Shipping Cost: ${order.shipping_price === 0 ? 'Free' : `₹${order.shipping_price.toFixed(2)}`}
Updated Total Amount: ${order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`}

If you have any questions about this change, please contact us immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}

Thank you for your understanding.
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}`;

        await sendEmail(order.email, emailSubject, emailText);
        console.log(`Address change notification sent to customer: ${order.email}`);

        // Send notification to admin
        if (companySettings?.receiveOrderEmails && companySettings?.adminEmail) {
          const adminEmailSubject = `Order #${orderId} - Address Changed by Admin`;
          const adminEmailText = `Address changed for Order #${orderId}

Customer: ${order.user_name}
Email: ${order.email}

Old Address: ${oldAddress.full_address}, ${oldAddress.city}, ${oldAddress.state} - ${oldAddress.pincode}
New Address: ${order.delivery_address.full_address}, ${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}

New Shipping Cost: ${order.shipping_price === 0 ? 'Free' : `₹${order.shipping_price.toFixed(2)}`}
Updated Total: ${order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`}

---
${companySettings?.companyName || 'Mould Market'}`;

          await sendEmail(companySettings.adminEmail, adminEmailSubject, adminEmailText);
          console.log(`Address change notification sent to admin: ${companySettings.adminEmail}`);
        }
      } else {
        // Changed by user - send notification to admin
        if (companySettings?.receiveOrderEmails && companySettings?.adminEmail) {
          const adminEmailSubject = `Order #${orderId} - Address Changed by Customer`;
          const adminEmailText = `Customer has changed delivery address for Order #${orderId}

Customer: ${order.user_name}
Email: ${order.email}
Phone: ${order.phone_number}

Old Address (${oldAddress.name}):
${oldAddress.full_address}
${oldAddress.city}, ${oldAddress.state} - ${oldAddress.pincode}

New Address (${order.delivery_address.name}):
${order.delivery_address.full_address}
${order.delivery_address.city}, ${order.delivery_address.state} - ${order.delivery_address.pincode}

New Shipping Cost: ${order.shipping_price === 0 ? 'Free' : `₹${order.shipping_price.toFixed(2)}`}
Updated Total: ${order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`}

Please verify this change and contact the customer if needed.

---
${companySettings?.companyName || 'Mould Market'}`;

          await sendEmail(companySettings.adminEmail, adminEmailSubject, adminEmailText);
          console.log(`Address change notification sent to admin: ${companySettings.adminEmail}`);
        }
      }
    } catch (emailError) {
      console.error('Error sending address change email:', emailError);
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('orderUpdated', {
        _id: order._id,
        orderedProducts: order.orderedProducts,
        price: order.price,
        shipping_price: order.shipping_price,
        total_price: order.total_price,
        status: order.status,
        delivery_address: order.delivery_address,
        address_id: order.address_id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery address updated successfully',
      order: {
        id: order._id,
        delivery_address: order.delivery_address,
        shipping_price: order.shipping_price,
        total_price: order.total_price
      }
    });
  } catch (error) {
    console.error('Change order address error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to change delivery address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
   getUserAddresses,
  changeOrderAddress
};