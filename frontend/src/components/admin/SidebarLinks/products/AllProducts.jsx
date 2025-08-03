"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Edit, Trash2, X, Calendar, Clock, DollarSign, Check, Package } from "lucide-react"

// Mock ProductContext for demonstration - replace with your actual context
const ProductContext = React.createContext()

// Mock products data - replace with your actual context data
const mockProducts = [
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
    description: "Premium quality product with multiple variants available.",
    rating: 4.5,
    originalPrice: 13,
    variants: {
      colors: [
        {
          name: "red",
          value: "#FF0000",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753888507/ProductImages/izlm97cj0yfqyddgdbeb.png",
          price: 10,
          priceChart: [{ quantity: "1+", price: 9 }],
        },
        {
          name: "blue",
          value: "#0000FF",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753888508/ProductImages/qmkjpn1svscdxrji77jw.png",
          price: 10,
          priceChart: [{ quantity: "1+", price: 9 }],
        },
      ],
      sizes: ["XXL"],
    },
    priceChart: [{ quantity: "1+", price: 9 }],
  },
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
        optionalDetails: [],
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
        optionalDetails: [],
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
        optionalDetails: [],
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
    description: "Premium quality product with multiple variants available.",
    rating: 4.5,
    originalPrice: 12,
    variants: {
      colors: [
        {
          name: "red",
          value: "#FF0000",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891208/ProductImages/gqh4o36gntmqqkp7h7ks.jpg",
          price: 9,
          priceChart: [{ quantity: "9+", price: 8 }],
        },
        {
          name: "green",
          value: "#00FF00",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891209/ProductImages/yl48luxaynw6dypznaox.png",
          price: 10,
          priceChart: [{ quantity: "11+", price: 9 }],
        },
        {
          name: "blue",
          value: "#0000FF",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753891211/ProductImages/s5xbxzqxsaoncer6vbof.png",
          price: 8,
          priceChart: [
            { quantity: "78+", price: 7 },
            { quantity: "79+", price: 6 },
          ],
        },
      ],
      sizes: ["XS", "XXXL"],
    },
    priceChart: [{ quantity: "9+", price: 8 }],
  },
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
        optionalDetails: [],
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
    description: "Premium quality product with multiple variants available.",
    rating: 4.5,
    originalPrice: 60,
    variants: {
      colors: [
        {
          name: "yellow",
          value: "#FFFF00",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753963477/ProductImages/lgl7gvm7fab0a8bjeqer.jpg",
          price: 45,
          priceChart: [
            { quantity: "5+", price: 30 },
            { quantity: "6+", price: 15 },
          ],
        },
        {
          name: "pink",
          value: "#FFC0CB",
          image: "https://res.cloudinary.com/djn2jtaez/image/upload/v1753963478/ProductImages/xmyvc8z34drawkf1ix0v.jpg",
          price: 56,
          priceChart: [{ quantity: "6+", price: 45 }],
        },
      ],
      sizes: ["XS", "S"],
    },
    priceChart: [{ quantity: "5+", price: 30 }],
  },
]

export default function AdminProductsPage() {
  // Replace with your actual context
  // const products = useContext(ProductContext);
  const products = mockProducts

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRevisedRateModal, setShowRevisedRateModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [revisedRateData, setRevisedRateData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    discountedPrice: "",
  })
  const [restockData, setRestockData] = useState({})

  // Store variant selections per product ID
  const [variantSelections, setVariantSelections] = useState({})

  // Get current date and time for validation
  const getCurrentDateTime = () => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().slice(0, 5)
    return { date, time }
  }

  const { date: currentDate, time: currentTime } = getCurrentDateTime()

  // Get product image - prioritize cloudinary links
  const getProductImage = (product) => {
    // Check for cloudinary image in color variants
    const colorWithImage = product.colorVariants?.find(
      (color) => color.imageUrl && color.imageUrl.includes("cloudinary"),
    )

    if (colorWithImage) {
      return colorWithImage.imageUrl
    }

    // Check for any image in color variants
    const anyColorWithImage = product.colorVariants?.find((color) => color.imageUrl)
    if (anyColorWithImage) {
      return anyColorWithImage.imageUrl
    }

    // Return random placeholder image
    return `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000000)}?w=100&h=100&fit=crop`
  }

  // Get product price display
  const getProductPrice = (product) => {
    if (product.price) {
      return `$${product.price}`
    }
    return "-"
  }

  // Checkbox handling
  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p._id))
    }
  }

  // Get variant selection for admin details modal
  const getVariantSelection = useCallback(
    (productId) => {
      if (!variantSelections[productId]) {
        const product = products.find((p) => p._id === productId)
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
    [variantSelections, products],
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

  // Get pricing info for database products (same as Home.jsx)
  const getProductPricing = (product, selectedColor = null, selectedSize = null) => {
    if (!product.colorVariants) {
      // Regular mock product
      return {
        price: product.price,
        priceChart: product.priceChart || [],
      }
    }

    // Helper function to format price ranges correctly
    const formatPriceRanges = (priceRanges) => {
      if (!priceRanges || priceRanges.length === 0) return []

      const validRanges = priceRanges.filter((range) => range.thresholdQuantity != null && range.wholesalePrice != null)

      if (validRanges.length === 0) return []

      const sortedRanges = validRanges.sort((a, b) => a.thresholdQuantity - b.thresholdQuantity)

      if (sortedRanges.length === 1) {
        return [
          {
            quantity: `${sortedRanges[0].thresholdQuantity}+ pieces`,
            price: sortedRanges[0].wholesalePrice,
          },
        ]
      } else {
        const formattedRanges = []

        for (let i = 0; i < sortedRanges.length; i++) {
          const current = sortedRanges[i]
          const next = sortedRanges[i + 1]

          if (i === 0) {
            formattedRanges.push({
              quantity: `1 - ${current.thresholdQuantity} pieces`,
              price: current.wholesalePrice,
            })
          }

          if (next) {
            formattedRanges.push({
              quantity: `${current.thresholdQuantity + 1} - ${next.thresholdQuantity} pieces`,
              price: next.wholesalePrice,
            })
          } else if (i > 0) {
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
    if (product.price) {
      return {
        price: product.price,
        priceChart: formatPriceRanges(product.basePriceRanges),
      }
    }

    // Color-based pricing
    if (selectedColor && product.colorVariants.some((c) => c.price)) {
      const colorVariant = product.colorVariants.find((c) => c.color === selectedColor)
      if (colorVariant && colorVariant.price) {
        return {
          price: colorVariant.price,
          priceChart: formatPriceRanges(colorVariant.priceRanges),
        }
      }
    }

    // Size-based pricing
    if (selectedSize && product.sizeVariants.some((s) => s.price)) {
      const sizeVariant = product.sizeVariants.find((s) => s.size === selectedSize)
      if (sizeVariant && sizeVariant.price) {
        return {
          price: sizeVariant.price,
          priceChart: formatPriceRanges(sizeVariant.priceRanges),
        }
      }
    }

    return {
      price: product.price || 0,
      priceChart: product.priceChart || [],
    }
  }

  // Handle revised rate form submission
  const handleRevisedRateSubmit = () => {
    if (selectedProducts.length > 0) {
      console.log("Starting discount for products:", selectedProducts)
    } else {
      console.log("Starting discount for product:", selectedProduct._id)
    }
    console.log("Revised rate data:", revisedRateData)

    setShowRevisedRateModal(false)
    setRevisedRateData({
      startDate: "",
      startTime: "",
      endDate: "",
      discountedPrice: "",
    })
    setSelectedProduct(null)
    setSelectedProducts([])

    alert("Discount started successfully!")
  }

  // Handle restock form submission
  const handleRestockSubmit = () => {
    console.log("Restock data:", restockData)

    setShowRestockModal(false)
    setRestockData({})
    setSelectedProduct(null)
    setSelectedProducts([])

    alert("Stock updated successfully!")
  }

  // Validate revised rate form data
  const isRevisedRateFormValid = () => {
    const { startDate, startTime, endDate, discountedPrice } = revisedRateData

    if (!startDate || !startTime || !endDate || !discountedPrice) {
      return false
    }

    if (startDate < currentDate) {
      return false
    }

    if (startDate === currentDate && startTime < currentTime) {
      return false
    }

    if (endDate <= startDate) {
      return false
    }

    if (isNaN(Number.parseFloat(discountedPrice)) || Number.parseFloat(discountedPrice) <= 0) {
      return false
    }

    return true
  }

  // Validate restock form data
  const isRestockFormValid = () => {
    if (selectedProducts.length > 0) {
      return selectedProducts.every((productId) => {
        const stockValue = restockData[productId]
        return stockValue && !isNaN(Number.parseInt(stockValue)) && Number.parseInt(stockValue) > 0
      })
    } else if (selectedProduct) {
      const stockValue = restockData[selectedProduct._id]
      return stockValue && !isNaN(Number.parseInt(stockValue)) && Number.parseInt(stockValue) > 0
    }
    return false
  }

  // Initialize restock data when modal opens
  const initializeRestockData = (productIds) => {
    const initialData = {}
    productIds.forEach((productId) => {
      const product = products.find((p) => p._id === productId)
      if (product) {
        initialData[productId] = product.stock.toString()
      }
    })
    setRestockData(initialData)
  }

  // Details Modal Component (exactly like Home.jsx VariantModal)
  const DetailsModal = ({ product, onClose }) => {
    if (!product) return null

    // Get current selections for this product
    const currentSelection = getVariantSelection(product._id)

    if (!currentSelection) return null

    const selectedColorName = currentSelection.color?.name || currentSelection.color?.color || currentSelection.color
    const pricingInfo = getProductPricing(product, selectedColorName, currentSelection.size)

    const handleColorSelect = (color) => {
      const colorToSelect = color.color || color.name || color
      const colorObject = availableColors.find((c) => (c.color || c.name) === colorToSelect) || color
      updateVariantSelection(product._id, "color", colorObject)
    }

    const handleSizeSelect = (size) => {
      updateVariantSelection(product._id, "size", size)
    }

    // Get available sizes for selected color
    const getAvailableSizes = () => {
      if (!product.colorVariants) return product.variants.sizes

      const selectedColorVariant = product.colorVariants.find((c) => c.color === selectedColorName)

      if (selectedColorVariant && selectedColorVariant.forAllSizes === "no") {
        return selectedColorVariant.availableSizes
      }

      return product.sizeVariants.map((s) => s.size)
    }

    // Get available colors for selected size
    const getAvailableColors = () => {
      if (!product.colorVariants) return product.variants.colors

      const selectedSizeVariant = product.sizeVariants.find((s) => s.size === currentSelection.size)

      if (selectedSizeVariant && selectedSizeVariant.forAllColors === "no") {
        return product.colorVariants.filter((c) => selectedSizeVariant.availableColors.includes(c.color))
      }

      return product.colorVariants
    }

    // Get optional details for current selection
    const getOptionalDetails = () => {
      if (!product.colorVariants) return []

      let details = []

      const selectedColorVariant = product.colorVariants.find((c) => c.color === selectedColorName)
      if (selectedColorVariant && selectedColorVariant.optionalDetails) {
        details = [...details, ...selectedColorVariant.optionalDetails]
      }

      const selectedSizeVariant = product.sizeVariants.find((s) => s.size === currentSelection.size)
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
      if (!currentSelection.color) return getProductImage(product)

      // For database products
      if (product.colorVariants) {
        const selectedColorVariant = availableColors.find((c) => c.color === selectedColorName)
        return selectedColorVariant?.imageUrl || getProductImage(product)
      }

      // For mock products
      return currentSelection.color.image || getProductImage(product)
    }

    const currentImage = getCurrentColorImage()

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="mb-4">
              <img
                src={currentImage || "/placeholder.svg"}
                alt={`${product.name} - ${selectedColorName || "default"} variant`}
                className="w-full h-48 object-cover rounded-lg mb-4"
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
                      key={`color-${product._id}-${index}`}
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
                    key={`size-${product._id}-${index}`}
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

            {/* Product Details */}
            {product.details && product.details.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Product Details</h4>
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
          </div>
        </div>
      </div>
    )
  }

  // Revised Rate Modal Component
  const RevisedRateModal = ({ product, selectedProductIds, onClose }) => {
    const productsToShow =
      selectedProductIds.length > 0
        ? products.filter((p) => selectedProductIds.includes(p._id))
        : product
          ? [product]
          : []

    if (productsToShow.length === 0) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Add Revised Rate</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6">
            {/* Products Info */}
            <div className="mb-4 space-y-2">
              {productsToShow.map((prod) => (
                <div key={prod._id} className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800">{prod.name}</h3>
                  <p className="text-sm text-gray-600">Current Price: {getProductPrice(prod)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {/* Discount Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Discount Start Date
                </label>
                <input
                  type="date"
                  min={currentDate}
                  value={revisedRateData.startDate}
                  onChange={(e) => setRevisedRateData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Discount Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Discount Start Time
                </label>
                <input
                  type="time"
                  min={revisedRateData.startDate === currentDate ? currentTime : "00:00"}
                  value={revisedRateData.startTime}
                  onChange={(e) => setRevisedRateData((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Discount End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Discount End Date
                </label>
                <input
                  type="date"
                  min={revisedRateData.startDate || currentDate}
                  value={revisedRateData.endDate}
                  onChange={(e) => setRevisedRateData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Discounted Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Discounted Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter discounted price"
                  value={revisedRateData.discountedPrice}
                  onChange={(e) => setRevisedRateData((prev) => ({ ...prev, discountedPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevisedRateSubmit}
                disabled={!isRevisedRateFormValid()}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  isRevisedRateFormValid()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Start Discount
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Restock Modal Component
  const RestockModal = ({ product, selectedProductIds, onClose }) => {
    const productsToShow =
      selectedProductIds.length > 0
        ? products.filter((p) => selectedProductIds.includes(p._id))
        : product
          ? [product]
          : []

    if (productsToShow.length === 0) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Restock Products</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {productsToShow.map((prod) => (
                <div key={prod._id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={getProductImage(prod) || "/placeholder.svg"}
                      alt={prod.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{prod.name}</h3>
                      <p className="text-sm text-gray-600">Current Stock: {prod.stock}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter new stock quantity"
                      value={restockData[prod._id] || ""}
                      onChange={(e) =>
                        setRestockData((prev) => ({
                          ...prev,
                          [prod._id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockSubmit}
                disabled={!isRestockFormValid()}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  isRestockFormValid()
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your product inventory and pricing</p>
        </div>

        {/* Bulk Actions (shown when products are selected) */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowRevisedRateModal(true)
                    setRevisedRateData({
                      startDate: currentDate,
                      startTime: currentTime,
                      endDate: "",
                      discountedPrice: "",
                    })
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Add Revised Rate
                </button>
                <button
                  onClick={() => {
                    initializeRestockData(selectedProducts)
                    setShowRestockModal(true)
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Restock
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? "s" : ""}?`,
                      )
                    ) {
                      console.log("Delete products:", selectedProducts)
                      setSelectedProducts([])
                    }
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color Variants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size Variants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <img
                          src={getProductImage(product) || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {product.colorVariants?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {product.sizeVariants?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {getProductPrice(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Details Button - Always visible */}
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowDetailsModal(true)
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                        >
                          Details
                        </button>

                        {/* Individual action buttons - Only show when no products are selected */}
                        {selectedProducts.length === 0 && (
                          <>
                            {/* Add Revised Rate Button */}
                            <button
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowRevisedRateModal(true)
                                setRevisedRateData({
                                  startDate: currentDate,
                                  startTime: currentTime,
                                  endDate: "",
                                  discountedPrice: "",
                                })
                              }}
                              className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                            >
                              Add Revised Rate
                            </button>

                            {/* Restock Button */}
                            <button
                              onClick={() => {
                                setSelectedProduct(product)
                                initializeRestockData([product._id])
                                setShowRestockModal(true)
                              }}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              Restock
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                console.log("Edit product:", product._id)
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                  console.log("Delete product:", product._id)
                                }
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <p className="text-gray-400 mt-2">Add some products to get started</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <DetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedProduct(null)
          }}
        />
      )}

      {/* Revised Rate Modal */}
      {showRevisedRateModal && (
        <RevisedRateModal
          product={selectedProduct}
          selectedProductIds={selectedProducts}
          onClose={() => {
            setShowRevisedRateModal(false)
            setSelectedProduct(null)
            setRevisedRateData({
              startDate: "",
              startTime: "",
              endDate: "",
              discountedPrice: "",
            })
          }}
        />
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <RestockModal
          product={selectedProduct}
          selectedProductIds={selectedProducts}
          onClose={() => {
            setShowRestockModal(false)
            setSelectedProduct(null)
            setRestockData({})
          }}
        />
      )}
    </div>
  )
}
