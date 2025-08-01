"use client"

import { useState, useEffect, useRef, useCallback, useContext } from "react"
import { ProductContext } from '../../../Context/ProductContext';
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
  Settings,
  Package,
  LogOut,
} from "lucide-react"

// Database products - 3 different pricing scenarios
const databaseProducts = [
  // Scenario 1: Base price with basePriceRanges
  {
    _id: "688a36fddd24e93753865284",
    name: "test image claude",
    price: 10,
    stock: 12,
    details: [
      {
        name: "w",
        value: "e",
      },
    ],
    colorVariants: [
      {
        color: "red",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753888507/ProductImages/izlm97cj0yfqyddgdbeb.png",
        price: null,
        isDefault: true,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [],
      },
      {
        color: "blue",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753888508/ProductImages/qmkjpn1svscdxrji77jw.png",
        price: null,
        isDefault: false,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [],
      },
    ],
    sizeVariants: [
      {
        size: "XXL",
        price: null,
        isDefault: true,
        forAllColors: "yes",
        availableColors: [],
        optionalDetails: [],
      },
    ],
    basePriceRanges: [
      {
        retailPrice: 10,
        wholesalePrice: 9,
        thresholdQuantity: 1,
      },
    ],
    type: "revised-rates",
    category: "Electronics",
  },
  // Scenario 2: Color-based pricing
  {
    _id: "688a418cdd24e9375386529b",
    name: "test agai a",
    price: null,
    stock: 9,
    details: [
      {
        name: "erjk",
        value: "jdhfjk",
      },
      {
        name: "fjsdhfik",
        value: "shfiu",
      },
      {
        name: "fudhfi",
        value: "idsfiu",
      },
      {
        name: "jsbf",
        value: "dsjkfbjskfb",
      },
    ],
    colorVariants: [
      {
        color: "red",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891208/ProductImages/gqh4o36gntmqqkp7h7ks.jpg",
        price: 9,
        isDefault: false,
        forAllSizes: "no",
        availableSizes: ["S", "XS"],
        optionalDetails: [
          {
            name: "red",
            value: "red",
          },
        ],
        priceRanges: [
          {
            retailPrice: 9,
            wholesalePrice: 8,
            thresholdQuantity: 9,
          },
        ],
      },
      {
        color: "green",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891209/ProductImages/yl48luxaynw6dypznaox.png",
        price: 10,
        isDefault: true,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [
          {
            name: "green",
            value: "green",
          },
        ],
        priceRanges: [
          {
            retailPrice: 10,
            wholesalePrice: 9,
            thresholdQuantity: 11,
          },
        ],
      },
      {
        color: "blue",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891211/ProductImages/s5xbxzqxsaoncer6vbof.png",
        price: 8,
        isDefault: false,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [],
        priceRanges: [
          {
            retailPrice: 8,
            wholesalePrice: 7,
            thresholdQuantity: 78,
          },
          {
            retailPrice: 7,
            wholesalePrice: 6,
            thresholdQuantity: 79,
          },
        ],
      },
    ],
    sizeVariants: [
      {
        size: "XS",
        price: null,
        isDefault: true,
        forAllColors: "yes",
        availableColors: [],
        optionalDetails: [
          {
            name: "er",
            value: "re",
          },
        ],
      },
      {
        size: "XXXL",
        price: null,
        isDefault: false,
        forAllColors: "yes",
        availableColors: [],
        optionalDetails: [],
      },
    ],
    basePriceRanges: [],
    type: "restocked",
    category: "Clothing",
  },
  // Scenario 3: Size-based pricing
  {
    _id: "688b5bd7b8f57fcbe72a50d3",
    name: "test",
    price: null,
    stock: 9,
    details: [
      {
        name: "rew",
        value: "dfsdf",
      },
    ],
    colorVariants: [
      {
        color: "yellow",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753963477/ProductImages/lgl7gvm7fab0a8bjeqer.jpg",
        price: null,
        isDefault: true,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [
          {
            name: "gr",
            value: "gb",
          },
        ],
      },
      {
        color: "pink",
        imageUrl:
          "https://res.cloudinary.com/djn2jtaez/image/upload/v1753963478/ProductImages/xmyvc8z34drawkf1ix0v.jpg",
        price: null,
        isDefault: false,
        forAllSizes: "yes",
        availableSizes: [],
        optionalDetails: [],
      },
    ],
    sizeVariants: [
      {
        size: "XS",
        price: 45,
        isDefault: true,
        forAllColors: "no",
        availableColors: ["yellow"],
        optionalDetails: [],
        priceRanges: [
          {
            retailPrice: 45,
            wholesalePrice: 30,
            thresholdQuantity: 5,
          },
          {
            retailPrice: 30,
            wholesalePrice: 15,
            thresholdQuantity: 6,
          },
        ],
      },
      {
        size: "S",
        price: 56,
        isDefault: false,
        forAllColors: "yes",
        availableColors: [],
        optionalDetails: [],
        priceRanges: [
          {
            retailPrice: 56,
            wholesalePrice: 45,
            thresholdQuantity: 6,
          },
        ],
      },
    ],
    basePriceRanges: [],
    type: "just-arrived",
    category: "Accessories",
  },
]

// Mock data with real sample images and variants (keeping existing for other sections)
const mockProducts = [
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
    description:
      "Professional-grade camera lens with superior optical quality, fast autofocus, and weather sealing. Ideal for portrait, landscape, and professional photography with exceptional sharpness.",
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=300&h=300&fit=crop",
          price: 299,
          priceChart: [
            { quantity: "1", price: 299 },
            { quantity: "2-3", price: 289 },
            { quantity: "4+", price: 279 },
          ],
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
    description:
      "Handcrafted luxury leather wallet with RFID protection, multiple card slots, and premium Italian leather construction. Perfect blend of style, security, and functionality.",
    variants: {
      colors: [
        {
          name: "Brown",
          value: "#8B4513",
          image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop",
          price: 80,
          priceChart: [
            { quantity: "1-2", price: 80 },
            { quantity: "3-5", price: 75 },
            { quantity: "6+", price: 70 },
          ],
        },
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1553062407984-6d7b8b5c8f7b?w=300&h=300&fit=crop",
          price: 85,
          priceChart: [
            { quantity: "1-2", price: 85 },
            { quantity: "3-5", price: 80 },
            { quantity: "6+", price: 75 },
          ],
        },
        {
          name: "Tan",
          value: "#D2B48C",
          image: "https://images.unsplash.com/photo-1608070740394-6d7b8b83add3?w=300&h=300&fit=crop",
          price: 82,
          priceChart: [
            { quantity: "1-2", price: 82 },
            { quantity: "3-5", price: 77 },
            { quantity: "6+", price: 72 },
          ],
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
    description:
      "High-performance mechanical gaming keyboard with RGB backlighting, programmable keys, and tactile switches. Built for gamers and professionals who demand precision and durability.",
    variants: {
      colors: [
        {
          name: "RGB",
          value: "#FF6B6B",
          image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop",
          price: 120,
          priceChart: [
            { quantity: "1-3", price: 120 },
            { quantity: "4-7", price: 115 },
            { quantity: "8+", price: 110 },
          ],
        },
        {
          name: "White",
          value: "#FFFFFF",
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
          price: 125,
          priceChart: [
            { quantity: "1-3", price: 125 },
            { quantity: "4-7", price: 120 },
            { quantity: "8+", price: 115 },
          ],
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
    description:
      "Portable wireless Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life. Perfect for outdoor adventures, parties, and home entertainment.",
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
          price: 75,
          priceChart: [
            { quantity: "1-3", price: 75 },
            { quantity: "4-6", price: 70 },
            { quantity: "7+", price: 65 },
          ],
        },
        {
          name: "Blue",
          value: "#3B82F6",
          image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&h=300&fit=crop",
          price: 78,
          priceChart: [
            { quantity: "1-3", price: 78 },
            { quantity: "4-6", price: 73 },
            { quantity: "7+", price: 68 },
          ],
        },
        {
          name: "Red",
          value: "#EF4444",
          image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=300&h=300&fit=crop",
          price: 77,
          priceChart: [
            { quantity: "1-3", price: 77 },
            { quantity: "4-6", price: 72 },
            { quantity: "7+", price: 67 },
          ],
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
    description:
      "Premium designer sunglasses with UV400 protection, polarized lenses, and lightweight titanium frame. Combines fashion and function for ultimate eye protection and style.",
    variants: {
      colors: [
        {
          name: "Black",
          value: "#000000",
          image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
          price: 120,
          priceChart: [
            { quantity: "1-2", price: 120 },
            { quantity: "3-4", price: 115 },
            { quantity: "5+", price: 110 },
          ],
        },
        {
          name: "Tortoise",
          value: "#8B4513",
          image: "https://images.unsplash.com/photo-1511499794561-7780e7231661?w=300&h=300&fit=crop",
          price: 125,
          priceChart: [
            { quantity: "1-2", price: 125 },
            { quantity: "3-4", price: 120 },
            { quantity: "5+", price: 115 },
          ],
        },
        {
          name: "Gold",
          value: "#FFD700",
          image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300&h=300&fit=crop",
          price: 130,
          priceChart: [
            { quantity: "1-2", price: 130 },
            { quantity: "3-4", price: 125 },
            { quantity: "5+", price: 120 },
          ],
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

// Transform database products to match our component structure
const transformDatabaseProduct = (dbProduct) => {
  const defaultColorVariant = dbProduct.colorVariants.find((c) => c.isDefault) || dbProduct.colorVariants[0]
  const defaultSizeVariant = dbProduct.sizeVariants.find((s) => s.isDefault) || dbProduct.sizeVariants[0]

  // Determine pricing logic
  let basePrice = 0
  let priceChart = []

  if (dbProduct.price) {
    // Base price scenario
    basePrice = dbProduct.price
    if (dbProduct.basePriceRanges && dbProduct.basePriceRanges.length > 0) {
      priceChart = dbProduct.basePriceRanges.map((range) => ({
        quantity: `${range.thresholdQuantity}+`,
        price: range.wholesalePrice,
      }))
    }
  } else if (dbProduct.colorVariants.some((c) => c.price)) {
    // Color-based pricing
    const colorWithPrice = dbProduct.colorVariants.find((c) => c.price)
    basePrice = colorWithPrice.price
    if (colorWithPrice.priceRanges && colorWithPrice.priceRanges.length > 0) {
      priceChart = colorWithPrice.priceRanges.map((range) => ({
        quantity: `${range.thresholdQuantity}+`,
        price: range.wholesalePrice,
      }))
    }
  } else if (dbProduct.sizeVariants.some((s) => s.price)) {
    // Size-based pricing
    const sizeWithPrice = dbProduct.sizeVariants.find((s) => s.price)
    basePrice = sizeWithPrice.price
    if (sizeWithPrice.priceRanges && sizeWithPrice.priceRanges.length > 0) {
      priceChart = sizeWithPrice.priceRanges.map((range) => ({
        quantity: `${range.thresholdQuantity}+`,
        price: range.wholesalePrice,
      }))
    }
  }

  // Transform color variants
  const colors = dbProduct.colorVariants.map((colorVariant) => {
    const colorPrice = dbProduct.price || colorVariant.price || basePrice
    let colorPriceChart = []

    if (dbProduct.price && dbProduct.basePriceRanges.length > 0) {
      colorPriceChart = dbProduct.basePriceRanges.map((range) => ({
        quantity: `${range.thresholdQuantity}+`,
        price: range.wholesalePrice,
      }))
    } else if (colorVariant.priceRanges && colorVariant.priceRanges.length > 0) {
      colorPriceChart = colorVariant.priceRanges.map((range) => ({
        quantity: `${range.thresholdQuantity}+`,
        price: range.wholesalePrice,
      }))
    }

    return {
      name: colorVariant.color,
      value: colorVariant.color,
      image: colorVariant.imageUrl,
      price: colorPrice,
      priceChart: colorPriceChart,
      optionalDetails: colorVariant.optionalDetails || [],
      availableSizes: colorVariant.forAllSizes === "yes" ? [] : colorVariant.availableSizes,
    }
  })

  // Transform size variants
  const sizes = dbProduct.sizeVariants.map((sizeVariant) => {
    return {
      name: sizeVariant.size,
      price: sizeVariant.price,
      availableColors: sizeVariant.forAllColors === "yes" ? [] : sizeVariant.availableColors,
      optionalDetails: sizeVariant.optionalDetails || [],
      priceChart: sizeVariant.priceRanges
        ? sizeVariant.priceRanges.map((range) => ({
            quantity: `${range.thresholdQuantity}+`,
            price: range.wholesalePrice,
          }))
        : [],
    }
  })

  return {
    id: dbProduct._id,
    name: dbProduct.name,
    image: defaultColorVariant.imageUrl,
    price: basePrice,
    originalPrice: Math.round(basePrice * 1.3), // Assuming 30% markup for original price
    badge: "NEW",
    category: dbProduct.category,
    type: dbProduct.type,
    rating: 4.5,
    stock: dbProduct.stock,
    description: `${dbProduct.name} - Premium quality product with multiple variants available.`,
    details: dbProduct.details || [],
    variants: {
      colors: colors,
      sizes: sizes.map((s) => s.name),
    },
    priceChart: priceChart,
    dbProduct: dbProduct, // Keep original for detailed logic
  }
}

// Transform all database products
const transformedDbProducts = databaseProducts.map(transformDatabaseProduct)

// Combine all products
const allProducts = [...transformedDbProducts, ...mockProducts]

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
  { id: 10, name: "Kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop" },
  {
    id: 11,
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407984-6d7b8b5c8f7b?w=100&h=100&fit=crop",
  },
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
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null)
  const [quantityToAdd, setQuantityToAdd] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const products = useContext(ProductContext);
  console.log(products);

  // Store variant selections per product ID to prevent resets
  const [variantSelections, setVariantSelections] = useState({})

  // Refs for scrolling to sections
  const justArrivedRef = useRef(null)
  const restockedRef = useRef(null)
  const revisedRatesRef = useRef(null)

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isProfileOpen])

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
      productId: productId,
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

    if (filter === "category") {
      if (wasSelected) {
        // Deselecting category filter
        setShowCategoryFilter(false)
        setSelectedCategory(null) // Clear selected category
        setSelectedFilters((prev) => {
          const filtered = prev.filter((f) => f !== "category")
          return filtered.length === 0 ? ["all"] : filtered
        })
      } else {
        // Selecting category filter
        setShowCategoryFilter(true)
        setSelectedCategory("Electronics") // Set first category as selected
        setSelectedFilters((prev) => {
          const newFilters = prev.filter((f) => f !== "all")
          return [...newFilters, "category"]
        })
      }
      return
    }

    setSelectedFilters((prev) => {
      if (filter === "all") {
        setShowCategoryFilter(false)
        setSelectedCategory(null)
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
    let filtered = allProducts
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }
    // Filter by active category filter
    if (activeCategoryFilter) {
      filtered = filtered.filter((product) => product.category === activeCategoryFilter)
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

  // Get unique cart items count (not total quantity)
  const getUniqueCartItemsCount = () => {
    return Object.keys(cartItems).length
  }

  // Update the getVariantSelection function to handle color objects properly
  const getVariantSelection = useCallback(
    (productId) => {
      if (!variantSelections[productId]) {
        const product = allProducts.find((p) => p.id === productId)
        if (product) {
          const defaultSelection = {
            color: product.variants.colors[0],
            size: product.variants.sizes[0],
          }
          setVariantSelections((prev) => ({
            ...prev,
            [productId]: defaultSelection,
          }))
          return defaultSelection
        }
      }
      return variantSelections[productId]
    },
    [variantSelections, allProducts],
  )

  // Update variant selection for a specific product
  const updateVariantSelection = useCallback(
    (productId, type, value) => {
      setVariantSelections((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          [type]: value,
        },
      }))
    },
    [setVariantSelections],
  )

  // Get pricing info for database products
  const getProductPricing = (product, selectedColor = null, selectedSize = null) => {
    if (!product.dbProduct) {
      // Regular mock product
      return {
        price: product.price,
        priceChart: product.priceChart || [],
      }
    }

    const dbProduct = product.dbProduct

    // Helper function to format price ranges correctly
    const formatPriceRanges = (priceRanges) => {
      if (!priceRanges || priceRanges.length === 0) return []

      // Filter out invalid ranges
      const validRanges = priceRanges.filter((range) => range.thresholdQuantity != null && range.wholesalePrice != null)

      if (validRanges.length === 0) return []

      // Sort by threshold quantity
      const sortedRanges = validRanges.sort((a, b) => a.thresholdQuantity - b.thresholdQuantity)

      if (sortedRanges.length === 1) {
        // Single range case: "12+ pieces - $8"
        return [
          {
            quantity: `${sortedRanges[0].thresholdQuantity}+ pieces`,
            price: sortedRanges[0].wholesalePrice,
          },
        ]
      } else {
        // Multiple ranges case
        const formattedRanges = []

        for (let i = 0; i < sortedRanges.length; i++) {
          const current = sortedRanges[i]
          const next = sortedRanges[i + 1]

          if (i === 0) {
            // First range: "1 - 12 pieces - $8"
            formattedRanges.push({
              quantity: `1 - ${current.thresholdQuantity} pieces`,
              price: current.wholesalePrice,
            })
          }

          if (next) {
            // Middle ranges: "13 - 24 pieces - $6"
            formattedRanges.push({
              quantity: `${current.thresholdQuantity + 1} - ${next.thresholdQuantity} pieces`,
              price: next.wholesalePrice,
            })
          } else if (i > 0) {
            // Last range: "25+ pieces - $6"
            formattedRanges.push({
              quantity: `${current.thresholdQuantity + 1}+ pieces`,
              price: current.wholesalePrice,
            })
          }
        }

        return formattedRanges
      }
    }

    // Base price scenario
    if (dbProduct.price) {
      return {
        price: dbProduct.price,
        priceChart: formatPriceRanges(dbProduct.basePriceRanges),
      }
    }

    // Color-based pricing
    if (selectedColor && dbProduct.colorVariants.some((c) => c.price)) {
      const colorVariant = dbProduct.colorVariants.find((c) => c.color === selectedColor)
      if (colorVariant && colorVariant.price) {
        return {
          price: colorVariant.price,
          priceChart: formatPriceRanges(colorVariant.priceRanges),
        }
      }
    }

    // Size-based pricing
    if (selectedSize && dbProduct.sizeVariants.some((s) => s.price)) {
      const sizeVariant = dbProduct.sizeVariants.find((s) => s.size === selectedSize)
      if (sizeVariant && sizeVariant.price) {
        return {
          price: sizeVariant.price,
          priceChart: formatPriceRanges(sizeVariant.priceRanges),
        }
      }
    }

    return {
      price: product.price,
      priceChart: product.priceChart || [],
    }
  }

  const ProductCard = ({ product }) => {
    const totalQuantity = getProductCartQuantity(product.id)
    const isInWishlist = wishlist.includes(product.id)

    // Get default variant cart key
    const defaultColor = product.variants.colors[0]?.name
    const defaultSize = product.variants.sizes[0]
    const defaultCartKey = generateCartKey(product.id, defaultColor, defaultSize)
    const defaultVariantQuantity = cartItems[defaultCartKey] || 0

    // Get pricing info
    const pricingInfo = getProductPricing(product, defaultColor, defaultSize)

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

    const handleDirectAddToCart = () => {
      handleAddToCart(product.id, defaultColor, defaultSize)
    }

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group w-full">
        <div className="relative">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => setSelectedImage(product.image)}
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
            <span className="text-lg font-bold text-gray-900">${pricingInfo.price}</span>
            <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
          </div>

          {/* Stock Info for Database Products */}
          {product.stock && (
            <div className="mb-2">
              <span className="text-xs text-gray-600">Stock: {product.stock} available</span>
            </div>
          )}

          {/* Variants Preview */}
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-600">Colors:</span>
              <div className="flex gap-1">
                {product.variants.colors.slice(0, 3).map((color, index) => (
                  <div key={index} className="relative">
                    {color.image ? (
                      <img
                        src={color.image || "/placeholder.svg"}
                        alt={color.name}
                        className="w-3 h-3 rounded-full border border-gray-300 object-cover"
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.value }}
                      />
                    )}
                  </div>
                ))}
                {product.variants.colors.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.variants.colors.length - 3}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-600">Default Size:</span>
              <span className="text-xs font-medium text-gray-800">{defaultSize}</span>
            </div>
            <div className="text-xs text-gray-600">
              All Sizes: {product.variants.sizes.slice(0, 3).join(", ")}
              {product.variants.sizes.length > 3 && ` +${product.variants.sizes.length - 3} more`}
            </div>
          </div>

          {/* Price Chart */}
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-1">Bulk Pricing:</p>
            <div className="space-y-1">
              {pricingInfo.priceChart.map((tier, index) => (
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

            {/* Second Row - Add to Cart */}
            <button
              onClick={handleDirectAddToCart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Add to Cart
            </button>

            {/* Third Row - Quantity Controls (if item in cart) */}
            {totalQuantity > 0 && (
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

                {/* Default variant quantity controls */}
                {defaultVariantQuantity > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-blue-800">Default: {defaultVariantQuantity}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(defaultCartKey, -1)}
                        className="p-1 hover:bg-blue-200 rounded text-blue-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateQuantity(defaultCartKey, 1)}
                        className="p-1 hover:bg-blue-200 rounded text-blue-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

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

    const pricingInfo = getProductPricing(product)

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">${pricingInfo.price}</span>
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

                {/* Product Details */}
                {product.details && product.details.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Product Details</h3>
                    <div className="space-y-2">
                      {product.details.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-medium">{detail.name}:</span>
                          <span>{detail.value}</span>
                        </div>
                      ))}
                      {product.stock && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Stock:</span>
                          <span>{product.stock} available</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bulk Pricing */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Bulk Pricing</h3>
                  <div className="space-y-2">
                    {pricingInfo.priceChart.map((tier, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tier.quantity} pieces</span>
                        <span className="font-semibold">${tier.price} each</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{product.description}</p>
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

  // Enhanced VariantModal with database product support
  const VariantModal = ({ product, onClose }) => {
    if (!product) return null

    // Get current selections for this product (will initialize if not exists)
    const currentSelection = getVariantSelection(product.id)

    if (!currentSelection) return null

    const cartKey = generateCartKey(
      product.id,
      currentSelection.color?.name || currentSelection.color?.color,
      currentSelection.size,
    )
    const currentVariantQuantity = cartItems[cartKey] || 0

    // Get variant-specific pricing - use the selected color name properly
    const selectedColorName = currentSelection.color?.name || currentSelection.color?.color || currentSelection.color
    const pricingInfo = getProductPricing(product, selectedColorName, currentSelection.size)

    // Update quantityToAdd when variant changes and it exists in cart
    const [localQuantityToAdd, setLocalQuantityToAdd] = useState(1)

    useEffect(() => {
      if (currentVariantQuantity > 0) {
        setLocalQuantityToAdd(currentVariantQuantity)
      } else {
        setLocalQuantityToAdd(1)
      }
    }, [currentVariantQuantity])

    const handleColorSelect = (color) => {
      // Handle both database and mock product color structures
      const colorToSelect = color.color || color.name || color
      const colorObject = availableColors.find((c) => (c.color || c.name) === colorToSelect) || color
      updateVariantSelection(product.id, "color", colorObject)
    }

    const handleSizeSelect = (size) => {
      updateVariantSelection(product.id, "size", size)
    }

    const handleQuantityInputChange = (e) => {
      const value = Number.parseInt(e.target.value) || 1
      setLocalQuantityToAdd(Math.max(1, value))
    }

    const handleAddToCartFromModal = () => {
      // Clear existing quantity first, then add new quantity
      if (currentVariantQuantity > 0) {
        handleRemoveFromCart(cartKey)
      }
      for (let i = 0; i < localQuantityToAdd; i++) {
        handleAddToCart(product.id, selectedColorName, currentSelection.size)
      }
      onClose()
    }

    const handleRemoveFromCartModal = () => {
      handleRemoveFromCart(cartKey)
      setLocalQuantityToAdd(1)
    }

    // Get available sizes for selected color (database products)
    const getAvailableSizes = () => {
      if (!product.dbProduct) return product.variants.sizes

      const dbProduct = product.dbProduct
      const selectedColorVariant = dbProduct.colorVariants.find((c) => c.color === selectedColorName)

      if (selectedColorVariant && selectedColorVariant.forAllSizes === "no") {
        return selectedColorVariant.availableSizes
      }

      return dbProduct.sizeVariants.map((s) => s.size)
    }

    // Get available colors for selected size (database products)
    const getAvailableColors = () => {
      if (!product.dbProduct) return product.variants.colors

      const dbProduct = product.dbProduct
      const selectedSizeVariant = dbProduct.sizeVariants.find((s) => s.size === currentSelection.size)

      if (selectedSizeVariant && selectedSizeVariant.forAllColors === "no") {
        return dbProduct.colorVariants.filter((c) => selectedSizeVariant.availableColors.includes(c.color))
      }

      return dbProduct.colorVariants
    }

    // Get optional details for current selection
    const getOptionalDetails = () => {
      if (!product.dbProduct) return []

      const dbProduct = product.dbProduct
      let details = []

      // Color-specific details
      const selectedColorVariant = dbProduct.colorVariants.find((c) => c.color === selectedColorName)
      if (selectedColorVariant && selectedColorVariant.optionalDetails) {
        details = [...details, ...selectedColorVariant.optionalDetails]
      }

      // Size-specific details
      const selectedSizeVariant = dbProduct.sizeVariants.find((s) => s.size === currentSelection.size)
      if (selectedSizeVariant && selectedSizeVariant.optionalDetails) {
        details = [...details, ...selectedSizeVariant.optionalDetails]
      }

      return details.filter((detail) => detail.name && detail.value)
    }

    const availableSizes = getAvailableSizes()
    const availableColors = getAvailableColors()
    const optionalDetails = getOptionalDetails()

    // Get the current selected color's image
    const getCurrentColorImage = () => {
      if (!currentSelection.color) return product.image

      // For database products
      if (product.dbProduct) {
        const selectedColorVariant = availableColors.find((c) => c.color === selectedColorName)
        return selectedColorVariant?.imageUrl || product.image
      }

      // For mock products
      return currentSelection.color.image || product.image
    }

    const currentImage = getCurrentColorImage()

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-800">Select Variants</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="mb-4">
              {/* Main Image - Only this should open image modal */}
              <img
                src={currentImage || "/placeholder.svg"}
                alt={`${product.name} - ${selectedColorName || "default"} variant`}
                className="w-full h-48 object-cover rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(currentImage)}
              />
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600">${pricingInfo.price}</p>
            </div>

            {/* Variant Description */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Color: {selectedColorName || "Select Color"}</h4>
              <div className="flex gap-3 flex-wrap">
                {availableColors.map((color, index) => {
                  const colorName = color.color || color.name
                  const isSelected = selectedColorName === colorName

                  return (
                    <button
                      key={`color-${product.id}-${index}`}
                      onClick={() => handleColorSelect(color)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all overflow-hidden ${
                        isSelected ? "border-blue-500 scale-105 shadow-lg" : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={colorName}
                    >
                      {color.imageUrl || color.image ? (
                        <img
                          src={color.imageUrl || color.image}
                          alt={colorName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-lg"
                          style={{ backgroundColor: color.value || colorName }}
                        />
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <div className="bg-white rounded-full p-1 shadow-md">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Size: {currentSelection.size || "Select Size"}</h4>
              <div className="flex gap-2 flex-wrap">
                {availableSizes.map((size, index) => (
                  <button
                    key={`size-${product.id}-${index}`}
                    onClick={() => handleSizeSelect(size)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      currentSelection.size === size
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Details */}
            {optionalDetails.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Variant Details</h4>
                <div className="space-y-2">
                  {optionalDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{detail.name}:</span>
                      <span>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variant-specific Price Chart */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Bulk Pricing for {selectedColorName || "Default"}</h4>
              <div className="space-y-2">
                {pricingInfo.priceChart.map((tier, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{tier.quantity}</span>
                    <span className="font-semibold">${tier.price} each</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current variant quantity display */}
            {currentVariantQuantity > 0 && currentSelection.color && currentSelection.size && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  This variant ({selectedColorName}, {currentSelection.size}) is in your cart: {currentVariantQuantity}{" "}
                  items
                </p>
              </div>
            )}

            {/* Quantity Controls - Enhanced with direct input */}
            {currentSelection.color && currentSelection.size && (
              <div className="mb-4">
                <h4 className="font-semibold mb-3">Quantity</h4>
                <div className="flex items-center justify-center bg-blue-50 rounded-lg px-4 py-3 gap-4">
                  <button
                    onClick={() => setLocalQuantityToAdd(Math.max(1, localQuantityToAdd - 1))}
                    className="p-2 hover:bg-blue-200 rounded-full text-blue-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={localQuantityToAdd}
                      onChange={handleQuantityInputChange}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={() => setLocalQuantityToAdd(localQuantityToAdd + 1)}
                    className="p-2 hover:bg-blue-200 rounded-full text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!currentSelection.color || !currentSelection.size ? (
              <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-center">
                Please select both color and size
              </div>
            ) : (
              <div className="space-y-3">
                {currentVariantQuantity > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCartFromModal}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                    >
                      Update Cart - {localQuantityToAdd} items
                    </button>
                    <button
                      onClick={handleRemoveFromCartModal}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                    >
                      Remove from Cart
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddToCartFromModal}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                  >
                    Add {localQuantityToAdd} to Cart - {selectedColorName}, {currentSelection.size}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Image Modal Component
  const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="relative bg-white rounded-lg p-4 max-w-[85vw] max-h-[85vh] shadow-2xl">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Full size product image"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
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
              <img
                src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=60&fit=crop"
                alt="Oula Market"
                className="h-12 w-auto"
              />
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
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
                {getUniqueCartItemsCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getUniqueCartItemsCount()}
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
                    const product = allProducts.find((p) => p.id === productId)
                    const colorInfo = product.variants.colors.find((c) => c.name === color)
                    const pricingInfo = getProductPricing(product, color, size)
                    const itemPrice = pricingInfo.price
                    return (
                      <div key={cartKey} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={colorInfo?.image || product.image}
                          alt={product.name}
                          className="w-15 h-15 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{product.name}</h3>
                          <p className="text-xs text-gray-500">
                            {color && size ? `${color}, ${size}` : "Default variant"}
                          </p>
                          <p className="text-blue-600 font-bold">${itemPrice}</p>
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
                            const { productId, color, size } = parseCartKey(cartKey)
                            const product = allProducts.find((p) => p.id === productId)
                            const pricingInfo = getProductPricing(product, color, size)
                            const itemPrice = pricingInfo.price
                            return total + itemPrice * quantity
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
                alt={`Festival Sale Banner ${index + 1}`}
                className="w-full h-full object-cover"
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
        {/* Shop by Categories */}
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
                  className={`w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-2 mx-auto group-hover:shadow-xl transition-all duration-300 overflow-hidden relative ${
                    selectedCategory === category.name ? "ring-4 ring-blue-500 shadow-xl" : ""
                  }`}
                >
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={`${category.name} category`}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {selectedCategory === category.name && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-blue-600 bg-white rounded-full p-1" />
                    </div>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium transition-colors duration-200 text-center leading-tight px-1 ${
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

        {/* Filters */}
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

        {/* Category Filter Section - Shows selected category products */}
        {showCategoryFilter && selectedCategory && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
              {allProducts
                .filter((product) => product.category === selectedCategory)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </section>
        )}

        {/* Just Arrived Products */}
        <section className="mb-12" ref={justArrivedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Just Arrived</h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4 min-w-max">
              {allProducts
                .filter((p) => p.type === "just-arrived")
                .map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-72">
                    <ProductCard product={product} />
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Restocked Items */}
        <section className="mb-12" ref={restockedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Restocked Items</h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4 min-w-max">
              {allProducts
                .filter((p) => p.type === "restocked")
                .map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-72">
                    <ProductCard product={product} />
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Revised Rates */}
        <section className="mb-12" ref={revisedRatesRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Revised Rates</h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4 min-w-max">
              {allProducts
                .filter((p) => p.type === "revised-rates")
                .map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-72">
                    <ProductCard product={product} />
                  </div>
                ))}
            </div>
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-gray-300 text-sm">
                Your trusted e-commerce partner for quality products and exceptional service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Shipping Info
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Facebook
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-300 text-sm">
            <p>Design and developed by: ABC</p>
            <p className="mt-2">&copy; 2024 Your E-commerce Store. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Product Modal */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* Variant Selection Modal */}
      <VariantModal product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} />
      {/* Image Modal */}
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  )
}
