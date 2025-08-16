const express = require("express")
const Cart = require("../models/Cart") // Adjust path as needed
const router = express.Router()

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Authentication required" })
  }
  next()
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
    } = req.body

    const existingItem = await Cart.findOne({
      user_id: req.user.id,
      product_id,
      variant_name: variant_name || null,
      size: size || null,
    })

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += quantity
      await existingItem.save()
      res.status(200).json(existingItem)
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
      }

      // Only add variant fields if they exist
      if (variant_id) cartItemData.variant_id = variant_id
      if (details_id) cartItemData.details_id = details_id
      if (size_id) cartItemData.size_id = size_id
      if (variant_name) cartItemData.variant_name = variant_name
      if (size) cartItemData.size = size

      const newCartItem = new Cart(cartItemData)
      await newCartItem.save()
      res.status(201).json(newCartItem)
    }
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
  } catch (error) {
    console.error("Error clearing cart:", error)
    res.status(500).json({ error: "Failed to clear cart" })
  }
})

module.exports = router
