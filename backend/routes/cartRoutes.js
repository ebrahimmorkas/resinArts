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
    } = req.body

    const existingItem = await Cart.findOne({
      user_id: req.user.id,
      product_id,
      variant_name: variant_name || null,
      size: size || null,
    })

    let savedItem;
    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += quantity
      savedItem = await existingItem.save()
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
      }

      // Only add variant fields if they exist
      if (variant_id) cartItemData.variant_id = variant_id
      if (details_id) cartItemData.details_id = details_id
      if (size_id) cartItemData.size_id = size_id
      if (variant_name) cartItemData.variant_name = variant_name
      if (size) cartItemData.size = size

      const newCartItem = new Cart(cartItemData)
      savedItem = await newCartItem.save()
    }

    // Send response first
    res.status(existingItem ? 200 : 201).json(savedItem)

    // Update abandoned cart asynchronously (non-blocking)
    process.nextTick(() => updateAbandonedCart(req.user.id, req));
    
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({ error: "Failed to add item to cart" })
  }
})

// PUT /api/cart - Update item quantity
router.put("/", async (req, res) => {
  try {
    const { product_id, variant_name, size, quantity } = req.body

    const cartItem = await Cart.findOneAndUpdate(
      {
        user_id: req.user.id,
        product_id,
        variant_name,
        size,
      },
      { quantity },
      { new: true },
    )

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" })
    }

    res.status(200).json(cartItem)

    // Update abandoned cart asynchronously (non-blocking)
    process.nextTick(() => updateAbandonedCart(req.user.id, req));
    
  } catch (error) {
    console.error("Error updating cart:", error)
    res.status(500).json({ error: "Failed to update cart item" })
  }
})

// DELETE /api/cart - Remove item from cart
router.delete("/", async (req, res) => {
  try {
    const { product_id, variant_name, size } = req.body

    const deletedItem = await Cart.findOneAndDelete({
      user_id: req.user.id,
      product_id,
      variant_name,
      size,
    })

    if (!deletedItem) {
      return res.status(404).json({ error: "Cart item not found" })
    }

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