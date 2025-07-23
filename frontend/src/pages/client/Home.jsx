"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  User,
  ShoppingCart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  Eye,
  Star,
  Check,
  Heart,
  Palette,
  Trash2,
} from "lucide-react"

// Mock data with real sample images and variants
const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    price: 150,
    originalPrice: 200,
    badge: "NEW",
    category: "Electronics",
    type: "just-arrived",
    rating: 4.5,
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
        },
        {
          name: "White",
          value: "#FFFFFF",
          image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop",
        },
        {
          name: "Blue",
          value: "#3B82F6",
          image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["One Size"],
    },
    priceChart: [
      { quantity: "1-4", price: 150 },
      { quantity: "5-9", price: 140 },
      { quantity: "10+", price: 130 },
    ],
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    price: 100,
    originalPrice: 150,
    badge: "-33%",
    category: "Electronics",
    type: "revised-rates",
    rating: 4.8,
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
        },
        {
          name: "Silver",
          value: "#C0C0C0",
          image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?w=300&h=300&fit=crop",
        },
        {
          name: "Rose Gold",
          value: "#E8B4B8",
          image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["38mm", "42mm", "44mm"],
    },
    priceChart: [
      { quantity: "1-2", price: 100 },
      { quantity: "3-5", price: 95 },
      { quantity: "6+", price: 90 },
    ],
  },
  {
    id: 3,
    name: "Organic Cotton T-Shirt",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
    price: 25,
    originalPrice: 35,
    badge: "RESTOCKED",
    category: "Clothing",
    type: "restocked",
    rating: 4.3,
    variants: {
      colors: [
        {
          name: "White",
          value: "#FFFFFF",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
        },
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=300&h=300&fit=crop",
        },
        {
          name: "Navy",
          value: "#1E3A8A",
          image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&h=300&fit=crop",
        },
        {
          name: "Gray",
          value: "#6B7280",
          image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    priceChart: [
      { quantity: "1-4", price: 25 },
      { quantity: "5-9", price: 22 },
      { quantity: "10+", price: 20 },
    ],
  },
  {
    id: 4,
    name: "Professional Camera Lens",
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop",
    price: 299,
    originalPrice: 399,
    badge: "-25%",
    category: "Electronics",
    type: "just-arrived",
    rating: 4.9,
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["50mm", "85mm", "135mm"],
    },
    priceChart: [
      { quantity: "1", price: 299 },
      { quantity: "2-3", price: 289 },
      { quantity: "4+", price: 279 },
    ],
  },
  {
    id: 5,
    name: "Luxury Leather Wallet",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop",
    price: 80,
    originalPrice: 120,
    badge: "HOT",
    category: "Accessories",
    type: "revised-rates",
    rating: 4.6,
    variants: {
      colors: [
        {
          name: "Brown",
          value: "#8B4513",
          image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop",
        },
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1553062407984-6d7b8b5c8f7b?w=300&h=300&fit=crop",
        },
        {
          name: "Tan",
          value: "#D2B48C",
          image: "https://images.unsplash.com/photo-1608070740394-6d7b8b83add3?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["Standard"],
    },
    priceChart: [
      { quantity: "1-2", price: 80 },
      { quantity: "3-5", price: 75 },
      { quantity: "6+", price: 70 },
    ],
  },
  {
    id: 6,
    name: "Gaming Mechanical Keyboard",
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop",
    price: 120,
    originalPrice: 160,
    badge: "RESTOCKED",
    category: "Electronics",
    type: "restocked",
    rating: 4.7,
    variants: {
      colors: [
        {
          name: "RGB",
          value: "#FF6B6B",
          image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop",
        },
        {
          name: "White",
          value: "#FFFFFF",
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["60%", "TKL", "Full Size"],
    },
    priceChart: [
      { quantity: "1-3", price: 120 },
      { quantity: "4-7", price: 115 },
      { quantity: "8+", price: 110 },
    ],
  },
  {
    id: 7,
    name: "Wireless Bluetooth Speaker",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
    price: 75,
    originalPrice: 100,
    badge: "-25%",
    category: "Electronics",
    type: "just-arrived",
    rating: 4.4,
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
        },
        {
          name: "Blue",
          value: "#3B82F6",
          image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&h=300&fit=crop",
        },
        {
          name: "Red",
          value: "#EF4444",
          image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["Compact", "Standard", "Large"],
    },
    priceChart: [
      { quantity: "1-3", price: 75 },
      { quantity: "4-6", price: 70 },
      { quantity: "7+", price: 65 },
    ],
  },
  {
    id: 8,
    name: "Designer Sunglasses",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
    price: 120,
    originalPrice: 180,
    badge: "HOT",
    category: "Accessories",
    type: "revised-rates",
    rating: 4.7,
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
        },
        {
          name: "Tortoise",
          value: "#8B4513",
          image: "https://images.unsplash.com/photo-1511499794561-7780e7231661?w=300&h=300&fit=crop",
        },
        {
          name: "Gold",
          value: "#FFD700",
          image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300&h=300&fit=crop",
        },
      ],
      sizes: ["Small", "Medium", "Large"],
    },
    priceChart: [
      { quantity: "1-2", price: 120 },
      { quantity: "3-4", price: 115 },
      { quantity: "5+", price: 110 },
    ],
  },
]

const categories = [
  {
    id: 1,
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    name: "Clothing",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    name: "Home & Garden",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c8ce0db2?w=100&h=100&fit=crop",
  },
  { id: 4, name: "Sports", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop" },
  { id: 5, name: "Books", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop" },
  { id: 6, name: "Beauty", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop" },
  { id: 7, name: "Toys", image: "https://images.unsplash.com/photo-1558877385-1c2d7b8e8b8b?w=100&h=100&fit=crop" },
  {
    id: 8,
    name: "Automotive",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=100&h=100&fit=crop",
  },
  {
    id: 9,
    name: "Jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7d3138?w=100&h=100&fit=crop",
  },
  { id: 10, name: "Kitchen", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop" },
]

const banners = [
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
]

export default function HomePage() {
  const [cartItems, setCartItems] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState(["all"])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [wishlist, setWishlist] = useState([])
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null)

  // Refs for scrolling to sections
  const justArrivedRef = useRef(null)
  const restockedRef = useRef(null)
  const revisedRatesRef = useRef(null)

  // Auto-rotate banners - FIXED: Added empty dependency array
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, []) // Fixed: Empty dependency array prevents continuous re-creation

  // Close dropdowns when clicking outside - FIXED: Proper dependency array
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileOpen(false)
      }
    }
    
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isProfileOpen]) // Fixed: Only add listener when dropdown is open

  // Generate cart key for variant-specific items
  const generateCartKey = (productId, color = null, size = null) => {
    if (color && size) {
      return `${productId}-${color}-${size}`
    }
    return `${productId}-default-default`
  }

  // Parse cart key to get product details
  const parseCartKey = (cartKey) => {
    const [productId, color, size] = cartKey.split("-")
    return {
      productId: Number.parseInt(productId),
      color: color === "default" ? null : color,
      size: size === "default" ? null : size,
    }
  }

  const handleAddToCart = (productId, selectedColor = null, selectedSize = null) => {
    const cartKey = generateCartKey(productId, selectedColor, selectedSize)
    setCartItems((prev) => ({
      ...prev,
      [cartKey]: (prev[cartKey] || 0) + 1,
    }))
  }

  const handleUpdateQuantity = (cartKey, change) => {
    setCartItems((prev) => {
      const newQuantity = (prev[cartKey] || 0) + change
      if (newQuantity <= 0) {
        const { [cartKey]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [cartKey]: newQuantity }
    })
  }

  const handleRemoveFromCart = (cartKey) => {
    setCartItems((prev) => {
      const { [cartKey]: removed, ...rest } = prev
      return rest
    })
  }

  const handleCategoryClick = (category) => {
    if (selectedCategory === category.name) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category.name)
    }
  }

  const handleFilterChange = (filter) => {
    const wasSelected = selectedFilters.includes(filter)

    setSelectedFilters((prev) => {
      if (filter === "all") {
        return ["all"]
      }
      const newFilters = prev.filter((f) => f !== "all")
      if (newFilters.includes(filter)) {
        const filtered = newFilters.filter((f) => f !== filter)
        return filtered.length === 0 ? ["all"] : filtered
      }
      return [...newFilters, filter]
    })

    // Only scroll to section if filter is being selected (not deselected)
    if (!wasSelected) {
      if (filter === "just-arrived") {
        setTimeout(() => justArrivedRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      } else if (filter === "restocked") {
        setTimeout(() => restockedRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      } else if (filter === "revised-rates") {
        setTimeout(() => revisedRatesRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    }
  }

  const toggleWishlist = (productId) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  const getFilteredProducts = () => {
    let filtered = mockProducts

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Filter by selected filters
    if (!selectedFilters.includes("all")) {
      filtered = filtered.filter((product) =>
        selectedFilters.some((filter) => {
          if (filter === "category") return true
          if (filter === "just-arrived") return product.type === "just-arrived"
          if (filter === "revised-rates") return product.type === "revised-rates"
          if (filter === "restocked") return product.type === "restocked"
          return false
        }),
      )
    }

    return filtered
  }

  // Check if product has any variant in cart
  const getProductCartQuantity = (productId) => {
    return Object.entries(cartItems)
      .filter(([cartKey]) => parseCartKey(cartKey).productId === productId)
      .reduce((total, [, quantity]) => total + quantity, 0)
  }

  const ProductCard = ({ product }) => {
    const totalQuantity = getProductCartQuantity(product.id)
    const isInWishlist = wishlist.includes(product.id)

    // Get all cart keys for this product
    const getProductCartKeys = (productId) => {
      return Object.keys(cartItems).filter((cartKey) => parseCartKey(cartKey).productId === productId)
    }

    const handleRemoveAllVariants = (productId) => {
      const productCartKeys = getProductCartKeys(productId)
      productCartKeys.forEach((cartKey) => {
        handleRemoveFromCart(cartKey)
      })
    }

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group w-full">
        <div className="relative">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = "/placeholder.svg?height=300&width=300"
            }}
          />
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 text-xs font-bold rounded-full ${
                product.badge === "NEW"
                  ? "bg-green-500 text-white"
                  : product.badge === "HOT"
                    ? "bg-red-500 text-white"
                    : product.badge === "RESTOCKED"
                      ? "bg-blue-500 text-white"
                      : "bg-orange-500 text-white"
              }`}
            >
              {product.badge}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-1 rounded-full transition-colors ${
                isInWishlist ? "bg-red-500 text-white" : "bg-white/90 text-gray-600 hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
            </button>
            <div className="flex items-center bg-white/90 rounded-full px-2 py-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs ml-1">{product.rating}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
            <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
          </div>

          {/* Variants Preview */}
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-600">Colors:</span>
              <div className="flex gap-1">
                {product.variants.colors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.value }}
                  />
                ))}
                {product.variants.colors.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.variants.colors.length - 3}</span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Sizes: {product.variants.sizes.slice(0, 3).join(", ")}
              {product.variants.sizes.length > 3 && ` +${product.variants.sizes.length - 3} more`}
            </div>
          </div>

          {/* Price Chart */}
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-1">Bulk Pricing:</p>
            <div className="space-y-1">
              {product.priceChart.map((tier, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{tier.quantity} pcs</span>
                  <span className="font-semibold">${tier.price} each</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {/* First Row - Details and Select Variant */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProduct(product)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
              <button
                onClick={() => setSelectedVariantProduct(product)}
                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
              >
                <Palette className="w-4 h-4" />
                Variants
              </button>
            </div>

            {/* Second Row - Add to Cart or Cart Status */}
            {totalQuantity === 0 ? (
              <button
                onClick={() => setSelectedVariantProduct(product)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Select Variant & Add to Cart
              </button>
            ) : (
              <div className="space-y-2">
                <div className="w-full bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-center">
                  <span className="font-medium text-green-800">In Cart: {totalQuantity} items</span>
                  <button
                    onClick={() => setSelectedVariantProduct(product)}
                    className="block w-full mt-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                  >
                    Add more variants
                  </button>
                </div>

                {/* Remove from Cart Button */}
                <button
                  onClick={() => handleRemoveAllVariants(product.id)}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove All from Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ProductModal = ({ product, onClose }) => {
    if (!product) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full rounded-lg object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=400&width=400"
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.rating})</span>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Bulk Pricing</h3>
                  <div className="space-y-2">
                    {product.priceChart.map((tier, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tier.quantity} pieces</span>
                        <span className="font-semibold">${tier.price} each</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>

                <button
                  onClick={() => {
                    setSelectedVariantProduct(product)
                    onClose()
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  Select Variant & Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const VariantModal = ({ product, onClose }) => {
    const [selectedColor, setSelectedColor] = useState(null)
    const [selectedSize, setSelectedSize] = useState(null)

    // Initialize selected variants when product changes - FIXED: Added proper cleanup
    useEffect(() => {
      if (product?.variants) {
        setSelectedColor(product.variants.colors[0] || null)
        setSelectedSize(product.variants.sizes[0] || null)
      } else {
        setSelectedColor(null)
        setSelectedSize(null)
      }
    }, [product]) // Fixed: Reset when product changes

    if (!product) return null

    const cartKey = generateCartKey(product.id, selectedColor?.name, selectedSize)
    const currentVariantQuantity = cartItems[cartKey] || 0

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">Select Variants</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <img
                src={selectedColor?.image || product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=300&width=300"
                }}
              />
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600">${product.price}</p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Color: {selectedColor?.name}</h4>
              <div className="flex gap-3 flex-wrap">
                {product.variants.colors.map((color, index) => (
                  <button
                    key={`${color.name}-${index}`}
                    onClick={() => setSelectedColor(color)}
                    className={`relative w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-lg border-2 transition-all ${
                      selectedColor?.name === color.name ? "border-blue-500 scale-110" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {selectedColor?.name === color.name && (
                      <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Size: {selectedSize}</h4>
              <div className="flex gap-2 flex-wrap">
                {product.variants.sizes.map((size, index) => (
                  <button
                    key={`${size}-${index}`}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedSize === size
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Current variant quantity display */}
            {currentVariantQuantity > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  This variant ({selectedColor?.name}, {selectedSize}) is already in your cart: {currentVariantQuantity}{" "}
                  items
                </p>
              </div>
            )}

            {/* Add to Cart or Quantity Controls */}
            {currentVariantQuantity === 0 ? (
              <button
                onClick={() => {
                  handleAddToCart(product.id, selectedColor?.name, selectedSize)
                  onClose()
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Add to Cart - {selectedColor?.name}, {selectedSize}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-blue-600 text-white rounded-lg px-4 py-3">
                  <button onClick={() => handleUpdateQuantity(cartKey, -1)} className="p-1 hover:bg-blue-700 rounded">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium">Qty: {currentVariantQuantity}</span>
                  <button onClick={() => handleUpdateQuantity(cartKey, 1)} className="p-1 hover:bg-blue-700 rounded">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center w-full">
        <p className="text-sm font-medium">
          🎉 Special Festival Sale - Up to 50% Off! Free Shipping on Orders Over $100
        </p>
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Full Height */}
            <div className="flex-shrink-0 h-full flex items-center">
              <img src="/logo.png" alt="Oula Market" className="h-full w-auto py-2" />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <User className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      Edit Profile
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      My Orders
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      Logout
                    </a>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-gray-700 hover:text-blue-600 transition-colors duration-200"
              >
                <ShoppingCart className="h-6 w-6" />
                {Object.keys(cartItems).length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Shopping Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {Object.keys(cartItems).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(cartItems).map(([cartKey, quantity]) => {
                    const { productId, color, size } = parseCartKey(cartKey)
                    const product = mockProducts.find((p) => p.id === productId)
                    const colorInfo = product.variants.colors.find((c) => c.name === color)

                    return (
                      <div key={cartKey} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={colorInfo?.image || product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-15 h-15 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder.svg?height=60&width=60"
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{product.name}</h3>
                          <p className="text-xs text-gray-500">
                            {color && size ? `${color}, ${size}` : "Default variant"}
                          </p>
                          <p className="text-blue-600 font-bold">${product.price}</p>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(cartKey, -1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium">{quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(cartKey, 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(cartKey)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-xl">
                        $
                        {Object.entries(cartItems)
                          .reduce((total, [cartKey, quantity]) => {
                            const { productId } = parseCartKey(cartKey)
                            const product = mockProducts.find((p) => p.id === productId)
                            return total + product.price * quantity
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200">
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner Carousel */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <img
                src={banner || "/placeholder.svg"}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=400&width=800"
                }}
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-2xl sm:text-4xl font-bold mb-2">Special Offers</h2>
                  <p className="text-lg sm:text-xl">Up to 50% Off on Selected Items</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors duration-200"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentBanner ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop by Categories - FIXED GRID, NO SCROLLING */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Categories</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {categories.slice(0, 10).map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`text-center cursor-pointer group transition-all duration-200 ${
                  selectedCategory === category.name ? "transform scale-105" : ""
                }`}
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-2 group-hover:shadow-xl transition-all duration-300 overflow-hidden relative ${
                    selectedCategory === category.name ? "ring-4 ring-blue-500 shadow-xl" : ""
                  }`}
                >
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=40&width=40"
                    }}
                  />
                  {selectedCategory === category.name && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-blue-600 bg-white rounded-full p-1" />
                    </div>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.name
                      ? "text-blue-600 font-bold"
                      : "text-gray-700 group-hover:text-blue-600"
                  }`}
                >
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Filters - Centered */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Filters</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { key: "all", label: "All Products" },
              { key: "category", label: "Shop by Category" },
              { key: "just-arrived", label: "Just Arrived" },
              { key: "revised-rates", label: "Revised Rates" },
              { key: "restocked", label: "Restocked Items" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedFilters.includes(filter.key)
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-blue-300"
                }`}
              >
                {selectedFilters.includes(filter.key) && <Check className="w-4 h-4 text-white" />}
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Just Arrived Products */}
        <section className="mb-12" ref={justArrivedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Just Arrived</h2>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {mockProducts
              .filter((p) => p.type === "just-arrived")
              .map((product) => (
                <div key={product.id} className="flex-shrink-0 w-72">
                  <ProductCard product={product} />
                </div>
              ))}
          </div>
        </section>

        {/* Restocked Items */}
        <section className="mb-12" ref={restockedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Restocked Items</h2>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {mockProducts
              .filter((p) => p.type === "restocked")
              .map((product) => (
                <div key={product.id} className="flex-shrink-0 w-72">
                  <ProductCard product={product} />
                </div>
              ))}
          </div>
        </section>

        {/* Revised Rates */}
        <section className="mb-12" ref={revisedRatesRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Revised Rates</h2>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {mockProducts
              .filter((p) => p.type === "revised-rates")
              .map((product) => (
                <div key={product.id} className="flex-shrink-0 w-72">
                  <ProductCard product={product} />
                </div>
              ))}
          </div>
        </section>

        {/* All Products Grid */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {getFilteredProducts().map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>

      {/* Product Modal */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* Variant Selection Modal */}
      <VariantModal product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} />
    </div>
  )
}