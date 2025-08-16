"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [applyFreeCash, setApplyFreeCash] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  axios.defaults.withCredentials = true

  // Load cart from backend on component mount
  useEffect(() => {
    fetchCartFromBackend()
  }, [])

  // Fetch cart items from backend
  const fetchCartFromBackend = async () => {
    try {
      setLoading(true)
      const response = await axios.get("http://localhost:3000/api/cart", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200) {
        const cartData = response.data
        // Convert backend cart data to frontend format
        const formattedCart = {}
        cartData.forEach((item) => {
          const cartKey = `${item.product_id}-${item.variant_name || "default"}-${item.size || "default"}`
          formattedCart[cartKey] = {
            productId: item.product_id,
            colorName: item.variant_name || null,
            sizeString: item.size || null,
            quantity: item.quantity,
            price: item.price,
            discountedPrice: item.discounted_price,
            imageUrl: item.image_url,
            productName: item.product_name,
            variantId: item.variant_id,
            detailsId: item.details_id,
            sizeId: item.size_id,
            cashApplied: item.cash_applied,
          }
        })
        setCartItems(formattedCart)
      }
    } catch (err) {
      setError("Failed to load cart")
      console.error("Error fetching cart:", err)
    } finally {
      setLoading(false)
    }
  }

  // Add item to cart (both frontend and backend)
  const addToCart = async (productId, colorName, sizeString, quantity, productData) => {
    try {
      setLoading(true)
      const cartKey = `${productId}-${colorName || "default"}-${sizeString || "default"}`

      const cartItemData = {
        image_url: productData.imageUrl,
        product_id: productId,
        product_name: productData.productName,
        quantity: quantity,
        price: productData.price,
        cash_applied: applyFreeCash,
        discounted_price: productData.discountedPrice || productData.price,
      }

      // Only add variant fields if they exist and are not empty
      if (productData.variantId && productData.variantId !== "") {
        cartItemData.variant_id = productData.variantId
      }
      if (productData.detailsId && productData.detailsId !== "") {
        cartItemData.details_id = productData.detailsId
      }
      if (productData.sizeId && productData.sizeId !== "") {
        cartItemData.size_id = productData.sizeId
      }
      if (colorName && colorName !== "") {
        cartItemData.variant_name = colorName
      }
      if (sizeString && sizeString !== "") {
        cartItemData.size = sizeString
      }

      const response = await axios.post("http://localhost:3000/api/cart", cartItemData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200 || response.status === 201) {
        // Update frontend state
        setCartItems((prev) => ({
          ...prev,
          [cartKey]: {
            productId,
            colorName: colorName || null,
            sizeString: sizeString || null,
            quantity: (prev[cartKey]?.quantity || 0) + quantity,
            price: productData.price,
            discountedPrice: productData.discountedPrice || productData.price,
            imageUrl: productData.imageUrl,
            productName: productData.productName,
            variantId: productData.variantId,
            detailsId: productData.detailsId,
            sizeId: productData.sizeId,
            cashApplied: applyFreeCash,
          },
        }))
      } else {
        throw new Error("Failed to add item to cart")
      }
    } catch (err) {
      setError("Failed to add item to cart")
      console.error("Error adding to cart:", err)
    } finally {
      setLoading(false)
    }
  }

  // Update item quantity
  const updateQuantity = async (cartKey, change) => {
    try {
      const item = cartItems[cartKey]
      if (!item) return

      const newQuantity = item.quantity + change

      if (newQuantity <= 0) {
        await removeFromCart(cartKey)
        return
      }

      const response = await axios.put(
        "http://localhost:3000/api/cart",
        {
          product_id: item.productId,
          variant_name: item.colorName,
          size: item.sizeString,
          quantity: newQuantity,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.status === 200) {
        setCartItems((prev) => ({
          ...prev,
          [cartKey]: {
            ...prev[cartKey],
            quantity: newQuantity,
          },
        }))
      }
    } catch (err) {
      setError("Failed to update quantity")
      console.error("Error updating quantity:", err)
    }
  }

  // Remove item from cart
  const removeFromCart = async (cartKey) => {
    try {
      const item = cartItems[cartKey]
      if (!item) return

      const response = await axios.delete("http://localhost:3000/api/cart", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          product_id: item.productId,
          variant_name: item.colorName,
          size: item.sizeString,
        },
      })

      if (response.status === 200) {
        setCartItems((prev) => {
          const newCart = { ...prev }
          delete newCart[cartKey]
          return newCart
        })
      }
    } catch (err) {
      setError("Failed to remove item")
      console.error("Error removing from cart:", err)
    }
  }

  // Calculate cart total
  const getCartTotal = () => {
    const total = Object.values(cartItems).reduce((sum, item) => {
      const price = item.discountedPrice || item.price
      return sum + price * item.quantity
    }, 0)

    return applyFreeCash ? Math.max(0, total - 150) : total
  }

  // Get unique items count
  const getUniqueCartItemsCount = () => {
    return Object.keys(cartItems).length
  }

  // Get total items count
  const getTotalItemsCount = () => {
    return Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0)
  }

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    applyFreeCash,
    setApplyFreeCash,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getUniqueCartItemsCount,
    getTotalItemsCount,
    fetchCartFromBackend,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
