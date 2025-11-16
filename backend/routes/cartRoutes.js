const express = require("express")
const Cart = require("../models/Cart")
const User = require("../models/User")
const AbandonedCart = require("../models/AbandonedCart")
const router = express.Router()

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Authentication required" })
  }
  next()
}

// Helper function to get current stock for a product
const getProductStock = async (productId, variantName, size) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      return { stock: 0, error: 'Product not found' };
    }

    // Simple product (no variants)
    if (!product.hasVariants) {
      return { stock: product.stock || 0 };
    }

    // Product with variants
    const variant = product.variants.find(v => v.colorName === variantName);
    if (!variant) {
      return { stock: 0, error: 'Variant not found' };
    }

    // Variant with common stock
    if (variant.commonStock !== undefined && variant.commonStock !== null) {
      return { stock: variant.commonStock };
    }

    // Variant with size-specific stock
    if (variant.moreDetails && variant.moreDetails.length > 0) {
      const sizeDetail = variant.moreDetails.find(md => {
        // Handle different size formats
        if (typeof md.size === 'object') {
          const sizeStr = `${md.size.length} × ${md.size.breadth} × ${md.size.height} ${md.size.unit || 'cm'}`;
          return sizeStr === size;
        }
        return md.size === size;
      });
      
      if (sizeDetail) {
        return { stock: sizeDetail.stock || 0 };
      }
    }

    return { stock: 0, error: 'Size not found' };
  } catch (error) {
    console.error('Error getting product stock:', error);
    return { stock: 0, error: 'Failed to fetch stock' };
  }
};

// Helper function to update/create abandoned cart
const updateAbandonedCart = async (userId, req) => {
  try {
    const io = req.app.get('io');
    
    // Fetch all cart items for this user
    const cartItems = await Cart.find({ user_id: userId });
    
    if (cartItems.length === 0) {
      // If cart is empty, remove abandoned cart and notification
      const deletedCart = await AbandonedCart.findOneAndDelete({ user_id: userId });
      
      if (deletedCart) {
        // Delete associated notification
        const Notification = require('../models/Notification');
        await Notification.deleteMany({ 
          abandonedCartId: deletedCart._id,
          type: 'abandonedCart'
        });
      }
      
      if (io) {
        io.to('admin_room').emit('abandoned_cart_removed', { userId: userId.toString() });
      }
      return;
    }

    // Fetch user details
    const user = await User.findById(userId);
    if (!user) return;

    const userName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();

    // Prepare cart items data
    const cartItemsData = cartItems.map(item => ({
      image_url: item.image_url,
      product_id: item.product_id,
      variant_id: item.variant_id,
      details_id: item.details_id,
      size_id: item.size_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      cash_applied: item.cash_applied,
      discounted_price: item.discounted_price,
    }));

    // Update or create abandoned cart
    const abandonedCart = await AbandonedCart.findOneAndUpdate(
      { user_id: userId },
      {
        user_name: userName,
        email: user.email,
        phone_number: user.phone_number,
        whatsapp_number: user.whatsapp_number,
        cart_items: cartItemsData,
        last_updated: new Date(),
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // Emit socket event to admin
    if (io) {
      io.to('admin_room').emit('abandoned_cart_updated', { 
        abandonedCart 
      });
    }
  } catch (error) {
    console.error('Error updating abandoned cart:', error);
  }
}

// Apply authentication middleware to all routes
router.use(requireAuth)

// GET /api/cart - Fetch all cart items for user
router.get("/", async (req, res) => {
  try {
    const cartItems = await Cart.find({ user_id: req.user.id })
    res.status(200).json(cartItems)
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ error: "Failed to fetch cart items" })
  }
})

// POST /api/cart - Add item to cart
router.post("/", async (req, res) => {
  try {
    const {
      image_url,
      product_id,
      variant_id,
      details_id,
      size_id,
      product_name,
      variant_name,
      size,
      quantity,
      price,
      cash_applied,
      discounted_price,
      bulk_pricing,
      custom_dimensions, // RECEIVED as snake_case
    } = req.body

    // Check stock availability
    const stockInfo = await getProductStock(product_id, variant_name, size);
    
    if (stockInfo.error) {
      return res.status(400).json({ error: stockInfo.error });
    }

    if (stockInfo.stock === 0) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // For dimension products, each dimension is a separate cart entry - don't merge
let existingItem = null;

if (!custom_dimensions) {
  // Only check for existing item if it's NOT a dimension product
  existingItem = await Cart.findOne({
    user_id: req.user.id,
    product_id,
    variant_name: variant_name || null,
    size: size || null,
  });
}

// Stock check only for non-dimension products
if (!custom_dimensions && existingItem) {
  // Check stock availability
  const stockInfo = await getProductStock(product_id, variant_name, size);
  
  if (stockInfo.error) {
    return res.status(400).json({ error: stockInfo.error });
  }

  if (stockInfo.stock === 0) {
    return res.status(400).json({ error: 'Product is out of stock' });
  }

  const currentCartQuantity = existingItem.quantity;
  const totalQuantity = currentCartQuantity + quantity;

  if (totalQuantity > stockInfo.stock) {
    return res.status(400).json({ 
      error: `Only ${stockInfo.stock} items available in stock. You already have ${currentCartQuantity} in cart.`,
      availableStock: stockInfo.stock,
      currentInCart: currentCartQuantity
    });
  }
}

    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;

    if (totalQuantity > stockInfo.stock) {
      return res.status(400).json({ 
        error: `Only ${stockInfo.stock} items available in stock. You already have ${currentCartQuantity} in cart.`,
        availableStock: stockInfo.stock,
        currentInCart: currentCartQuantity
      });
    }

    // AFTER destructuring request body, BEFORE stock check:
console.log('🔍 Backend received custom_dimensions:', custom_dimensions);

if (custom_dimensions) {
  // Validate custom dimensions with detailed logging
  console.log('Validating dimensions:', {
    length: custom_dimensions.length,
    breadth: custom_dimensions.breadth,
    height: custom_dimensions.height,
    calculatedPrice: custom_dimensions.calculatedPrice,
    unit: custom_dimensions.unit
  });

  if (!custom_dimensions.length || isNaN(custom_dimensions.length) || custom_dimensions.length <= 0) {
    console.error('❌ Invalid length:', custom_dimensions.length);
    return res.status(400).json({ 
      error: 'Invalid length for custom dimensions',
      received: custom_dimensions.length 
    });
  }
  
  if (!custom_dimensions.breadth || isNaN(custom_dimensions.breadth) || custom_dimensions.breadth <= 0) {
    console.error('❌ Invalid breadth:', custom_dimensions.breadth);
    return res.status(400).json({ 
      error: 'Invalid breadth for custom dimensions',
      received: custom_dimensions.breadth 
    });
  }
  
  if (custom_dimensions.height !== null && custom_dimensions.height !== undefined) {
    if (isNaN(custom_dimensions.height) || custom_dimensions.height <= 0) {
      console.error('❌ Invalid height:', custom_dimensions.height);
      return res.status(400).json({ 
        error: 'Invalid height for custom dimensions',
        received: custom_dimensions.height 
      });
    }
  }
  
  // CRITICAL: Check calculatedPrice exists and is valid
  if (!custom_dimensions.calculatedPrice || isNaN(custom_dimensions.calculatedPrice) || custom_dimensions.calculatedPrice <= 0) {
    console.error('❌ Invalid calculatedPrice:', custom_dimensions.calculatedPrice);
    return res.status(400).json({ 
      error: 'Invalid calculated price for custom dimensions',
      received: custom_dimensions.calculatedPrice,
      type: typeof custom_dimensions.calculatedPrice
    });
  }
  
  console.log('✅ Custom dimensions validation passed');
}

    let savedItem;
    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity = totalQuantity;
      savedItem = await existingItem.save();
    } else {
      const cartItemData = {
        user_id: req.user.id,
        image_url,
        product_id,
        product_name,
        quantity,
        price,
        cash_applied,
        discounted_price,
        bulk_pricing: bulk_pricing || [], 
        // customDimensions: custom_dimensions || null,
      }

      // ADD custom dimensions with correct field name for Mongoose
    if (custom_dimensions) {
      cartItemData.customDimensions = custom_dimensions; // Use camelCase for DB
    }

      // Only add variant fields if they exist
      if (variant_id) cartItemData.variant_id = variant_id;
      if (details_id) cartItemData.details_id = details_id;
      if (size_id) cartItemData.size_id = size_id;
      if (variant_name) cartItemData.variant_name = variant_name;
      if (size) cartItemData.size = size;

      const newCartItem = new Cart(cartItemData);
      savedItem = await newCartItem.save();
    }

    // Send response first
    res.status(existingItem ? 200 : 201).json(savedItem);

    // Update abandoned cart asynchronously (non-blocking)
    process.nextTick(() => updateAbandonedCart(req.user.id, req));
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// PUT /api/cart - Update item quantity
router.put("/", async (req, res) => {
  try {
    const { product_id, variant_name, size, quantity, custom_dimensions } = req.body;

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Stock check only for non-dimension products
    if (!custom_dimensions) {
      const stockInfo = await getProductStock(product_id, variant_name, size);
      
      if (stockInfo.error) {
        return res.status(400).json({ error: stockInfo.error });
      }

      if (stockInfo.stock === 0) {
        return res.status(400).json({ error: 'Product is out of stock' });
      }

      if (quantity > stockInfo.stock) {
        return res.status(400).json({ 
          error: `Only ${stockInfo.stock} items available in stock`,
          availableStock: stockInfo.stock
        });
      }
    }

    const query = {
      user_id: req.user.id,
      product_id,
      variant_name,
      size,
    };

    // If custom dimensions provided, add to query
    if (custom_dimensions) {
      query['customDimensions.length'] = custom_dimensions.length;
      query['customDimensions.breadth'] = custom_dimensions.breadth;
      query['customDimensions.unit'] = custom_dimensions.unit;
      
      if (custom_dimensions.height !== null && custom_dimensions.height !== undefined) {
        query['customDimensions.height'] = custom_dimensions.height;
      }
    }

    const cartItem = await Cart.findOneAndUpdate(
      query,
      { quantity },
      { new: true },
    );

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.status(200).json(cartItem);

    // Update abandoned cart asynchronously (non-blocking)
    process.nextTick(() => updateAbandonedCart(req.user.id, req));
    
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

// DELETE /api/cart - Remove item from cart
router.delete("/", async (req, res) => {
  try {
    const { product_id, variant_name, size, custom_dimensions } = req.body

    console.log('🔍 DELETE request received:', { product_id, variant_name, size, custom_dimensions });

    const query = {
      user_id: req.user.id,
      product_id,
    };

    // If custom dimensions provided, match them exactly
    if (custom_dimensions) {
      query['customDimensions.length'] = custom_dimensions.length;
      query['customDimensions.breadth'] = custom_dimensions.breadth;
      query['customDimensions.unit'] = custom_dimensions.unit;
      query['customDimensions.calculatedPrice'] = custom_dimensions.calculatedPrice;
      
      // Handle height - it can be null, undefined, or a number
      if (custom_dimensions.height !== null && custom_dimensions.height !== undefined) {
        query['customDimensions.height'] = custom_dimensions.height;
      } else {
        // Match documents where height is null or doesn't exist
        query['$or'] = [
          { 'customDimensions.height': null },
          { 'customDimensions.height': { $exists: false } }
        ];
      }
    } else {
      // For non-dimension products, use variant and size
      query.variant_name = variant_name;
      query.size = size;
    }

    console.log('🔍 Query built:', JSON.stringify(query, null, 2));

    const deletedItem = await Cart.findOneAndDelete(query)

    if (!deletedItem) {
      console.log('❌ Cart item not found with query:', query);
      return res.status(404).json({ error: "Cart item not found" })
    }

    console.log('✅ Deleted item:', deletedItem);

    res.status(200).json({ message: "Item removed from cart" })

    // Update abandoned cart asynchronously (non-blocking)
    process.nextTick(() => updateAbandonedCart(req.user.id, req));
    
  } catch (error) {
    console.error("Error removing from cart:", error)
    res.status(500).json({ error: "Failed to remove item from cart" })
  }
})

// DELETE /api/cart/clear - Clear entire cart
router.delete("/clear", async (req, res) => {
  try {
    await Cart.deleteMany({ user_id: req.user.id })
    
    res.status(200).json({ message: "Cart cleared successfully" })

    // Remove from abandoned cart asynchronously
    process.nextTick(async () => {
      try {
        const io = req.app.get('io');
        const deletedCart = await AbandonedCart.findOneAndDelete({ user_id: req.user.id });
        
        if (deletedCart) {
          // Delete associated notification
          const Notification = require('../models/Notification');
          await Notification.deleteMany({ 
            abandonedCartId: deletedCart._id,
            type: 'abandonedCart'
          });
        }
        
        if (deletedCart && io) {
          io.to('admin_room').emit('abandoned_cart_removed', { userId: req.user.id.toString() });
        }
      } catch (error) {
        console.error('Error removing abandoned cart:', error);
      }
    });
    
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ error: "Failed to clear cart" })
  }
})

module.exports = router