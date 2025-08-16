"use client"

import { useState, useEffect, useRef, useContext } from "react"
import { ProductContext } from "../../../Context/ProductContext"
import { useCart } from "../../../Context/CartContext"
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
  Check,
  Heart,
  Palette,
  Trash2,
  Settings,
  Package,
  LogOut,
  Share2,
  MessageCircle,
} from "lucide-react"

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

export default function Home() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    applyFreeCash,
    setApplyFreeCash,
    loading: cartLoading,
    error: cartError,
    addToCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getUniqueCartItemsCount,
    getTotalItemsCount,
  } = useCart()

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
  const [selectedImage, setSelectedImage] = useState(null)

  const contextData = useContext(ProductContext) || { products: [], loading: false, error: null }
  const { products, loading, error } = contextData
  console.log("Products from context:", contextData)

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

  const isDiscountActive = (product, variant = null, sizeDetail = null) => {
    let discountStartDate, discountEndDate

    if (sizeDetail && sizeDetail.discountStartDate && sizeDetail.discountEndDate) {
      discountStartDate = sizeDetail.discountStartDate
      discountEndDate = sizeDetail.discountEndDate
    } else if (product.discountStartDate && product.discountEndDate) {
      discountStartDate = product.discountStartDate
      discountEndDate = product.discountEndDate
    } else {
      return false
    }

    const now = new Date()
    const startDate = new Date(discountStartDate)
    const endDate = new Date(discountEndDate)
    return now >= startDate && now <= endDate
  }

  const isRecentlyRestocked = (product, variant = null, sizeDetail = null) => {
    let lastRestockedAt

    if (sizeDetail && sizeDetail.lastRestockedAt) {
      lastRestockedAt = sizeDetail.lastRestockedAt
    } else if (product.lastRestockedAt) {
      lastRestockedAt = product.lastRestockedAt
    } else {
      return false
    }

    const restockDate = new Date(lastRestockedAt)
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    return restockDate >= threeDaysAgo && restockDate <= now
  }

  const formatSize = (sizeObj) => {
    if (!sizeObj) return "N/A"
    if (typeof sizeObj === "string") return sizeObj
    if (sizeObj.length && sizeObj.breadth && sizeObj.height) {
      const unit = sizeObj.unit || "cm"
      return `${sizeObj.length} × ${sizeObj.breadth} × ${sizeObj.height} ${unit}`
    }
    return "N/A"
  }

  const getDisplayPrice = (product, variant = null, sizeDetail = null) => {
    // Check for discount at size level first
    if (sizeDetail) {
      if (isDiscountActive(product, variant, sizeDetail) && sizeDetail.discountPrice) {
        return sizeDetail.discountPrice
      }
      if (sizeDetail.price) {
        return sizeDetail.price
      }
    }

    // Check for discount at product level
    if (isDiscountActive(product) && product.discountPrice) {
      return product.discountPrice
    }

    // Check variant level price
    if (variant && variant.price) {
      return variant.price
    }

    // Check product level price
    if (product.price && product.price !== "" && product.price !== null) {
      return product.price
    }

    // If no price at top level, get from first variant's first size
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0]
      if (firstVariant.moreDetails && firstVariant.moreDetails.length > 0) {
        return firstVariant.moreDetails[0].price || 0
      }
    }

    return 0
  }

  const getBulkPricing = (product, variant = null, sizeDetail = null) => {
    // Check for discount bulk pricing at size level first
    if (sizeDetail) {
      if (isDiscountActive(product, variant, sizeDetail) && sizeDetail.discountBulkPricing) {
        return sizeDetail.discountBulkPricing
      }
      if (sizeDetail.bulkPricingCombinations) {
        return sizeDetail.bulkPricingCombinations
      }
    }

    // Check for discount bulk pricing at product level
    if (isDiscountActive(product) && product.discountBulkPricing) {
      return product.discountBulkPricing
    }

    // Return regular bulk pricing
    if (product.bulkPricing) {
      return product.bulkPricing
    }

    return []
  }

  const getProductBadge = (product, variant = null, sizeDetail = null) => {
    if (isDiscountActive(product, variant, sizeDetail)) {
      return { text: "DISCOUNTED", color: "bg-red-500" }
    }
    if (isRecentlyRestocked(product, variant, sizeDetail)) {
      return { text: "RESTOCKED", color: "bg-green-500" }
    }
    return { text: "NEW", color: "bg-blue-500" }
  }

  // Generate cart key for variant-specific items
  const generateCartKey = (productId, colorName = null, sizeString = null) => {
    return `${productId}-${colorName || "default"}-${sizeString || "default"}`
  }

  // Parse cart key to get product details
  const parseCartKey = (cartKey) => {
    const [productId, colorName, sizeString] = cartKey.split("-")
    return {
      productId: productId,
      colorName: colorName === "default" ? null : colorName,
      sizeString: sizeString === "default" ? null : sizeString,
    }
  }

  const handleAddToCart = async (productId, colorName = null, sizeString = null, quantity = 1) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return

    const variant = product.variants?.find((v) => v.colorName === colorName)
    const sizeDetail = variant?.moreDetails?.find((md) => formatSize(md.size) === sizeString)

    const productData = {
      imageUrl: variant?.variantImage || product.image || "/placeholder.svg",
      productName: product.name,
      variantId: variant?._id || "",
      detailsId: sizeDetail?._id || "",
      sizeId: sizeDetail?.size?._id || "",
      price: getDisplayPrice(product, variant, sizeDetail),
      discountedPrice: isDiscountActive(product, variant, sizeDetail)
        ? sizeDetail?.discountPrice || product.discountPrice
        : null,
    }

    await addToCart(productId, colorName, sizeString, quantity, productData)
  }

  const handleUpdateQuantity = async (cartKey, change) => {
    await updateQuantity(cartKey, change)
  }

  const handleRemoveFromCart = async (cartKey) => {
    await removeFromCart(cartKey)
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
        setShowCategoryFilter(false)
        setSelectedCategory(null)
        setSelectedFilters((prev) => {
          const filtered = prev.filter((f) => f !== "category")
          return filtered.length === 0 ? ["all"] : filtered
        })
      } else {
        setShowCategoryFilter(true)
        setSelectedCategory("Electronics")
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

  const handleShare = async (product, variant = null) => {
    const productUrl = `${window.location.origin}/product/${product._id}${variant ? `?variant=${variant.colorName}` : ""}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.name}`,
          url: productUrl,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl)
        alert("Product link copied to clipboard!")
      } catch (err) {
        console.log("Error copying to clipboard:", err)
      }
    }
  }

  const handleWhatsAppShare = (product, variant = null) => {
    const productUrl = `${window.location.origin}/product/${product._id}${variant ? `?variant=${variant.colorName}` : ""}`
    const message = `Check out this ${product.name}: ${productUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const ProductCard = ({ product }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null)
    const [selectedSizeDetail, setSelectedSizeDetail] = useState(selectedVariant?.moreDetails?.[0] || null)
    const [addQuantity, setAddQuantity] = useState(1)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
      if (selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.length > 0) {
        setSelectedSizeDetail(selectedVariant.moreDetails[0])
      }
    }, [selectedVariant])

    const badge = getProductBadge(product, selectedVariant, selectedSizeDetail)
    const displayPrice = getDisplayPrice(product, selectedVariant, selectedSizeDetail)
    const bulkPricing = getBulkPricing(product, selectedVariant, selectedSizeDetail)

    const getVariantAndSizeCount = () => {
      const variantCount = product.variants?.length || 0
      const totalSizes =
        product.variants?.reduce((total, variant) => {
          return total + (variant.moreDetails?.length || 0)
        }, 0) || 0
      return { variantCount, totalSizes }
    }

    const { variantCount, totalSizes } = getVariantAndSizeCount()

    const hasVariants = product.variants && product.variants.length > 0
    const isSimpleProduct = !hasVariants

    const getCurrentImages = () => {
      const images = []

      // Add variant image first
      if (selectedVariant && selectedVariant.variantImage) {
        images.push(selectedVariant.variantImage)
      } else if (product.image) {
        images.push(product.image)
      }

      // Add additional images from size detail
      if (selectedSizeDetail && selectedSizeDetail.additionalImages) {
        images.push(...selectedSizeDetail.additionalImages)
      }

      // Add additional images from product level
      if (product.additionalImages) {
        images.push(...product.additionalImages)
      }

      return images.filter(Boolean)
    }

    const currentImages = getCurrentImages()
    const currentImage = currentImages[currentImageIndex] || "/placeholder.svg"

    const handleVariantSelect = (variant) => {
      setSelectedVariant(variant)
      setCurrentImageIndex(0)
      if (variant.moreDetails && variant.moreDetails.length > 0) {
        setSelectedSizeDetail(variant.moreDetails[0])
      }
    }

    const handleSizeSelect = (sizeDetail) => {
      setSelectedSizeDetail(sizeDetail)
      setCurrentImageIndex(0)
    }

    const handleImageNavigation = (direction) => {
      if (currentImages.length <= 1) return

      if (direction === "next") {
        setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
      }
    }

    const handleAddToCartWithQuantity = async () => {
      if (isSimpleProduct) {
        // For simple products without variants
        await handleAddToCart(product._id, null, null, addQuantity)
      } else {
        // For products with variants
        if (!selectedVariant || !selectedSizeDetail) return
        const sizeString = formatSize(selectedSizeDetail.size)
        await handleAddToCart(product._id, selectedVariant.colorName, sizeString, addQuantity)
      }
      setAddQuantity(1)
    }

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group w-full">
        <div className="relative">
          <div className="relative">
            <img
              src={currentImage || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => setSelectedImage(currentImage)}
            />

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageNavigation("prev")
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageNavigation("next")
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {currentImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${badge.color}`}>{badge.text}</span>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShare(product, selectedVariant)
              }}
              className="p-1 rounded-full bg-white/90 text-gray-600 hover:text-blue-500 transition-colors"
              title="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleWhatsAppShare(product, selectedVariant)
              }}
              className="p-1 rounded-full bg-white/90 text-gray-600 hover:text-green-500 transition-colors"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleWishlist(product._id)}
              className={`p-1 rounded-full transition-colors ${
                wishlist.includes(product._id)
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-600 hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlist.includes(product._id) ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">${displayPrice}</span>
            {isDiscountActive(product, selectedVariant, selectedSizeDetail) &&
              selectedSizeDetail?.price &&
              selectedSizeDetail.price > displayPrice && (
                <span className="text-sm text-gray-500 line-through">${selectedSizeDetail.price}</span>
              )}
          </div>

          <div className="mb-2">
            <span className="text-xs text-gray-600">
              Stock: {selectedSizeDetail?.stock || product.stock || 0} available
            </span>
          </div>

          {hasVariants && (
            <>
              {!showDetails ? (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Variants:</span>
                      <span className="font-medium">{variantCount} colors</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sizes:</span>
                      <span className="font-medium">{totalSizes} options</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 space-y-3">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-gray-600">Variants:</span>
                    <div className="flex gap-1 flex-wrap">
                      {product.variants?.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => handleVariantSelect(variant)}
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedVariant?.colorName === variant.colorName
                              ? "border-blue-500 scale-110"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: variant.colorName.toLowerCase() }}
                          title={variant.colorName}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedVariant && selectedSizeDetail && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        Color: <span className="font-medium capitalize">{selectedVariant.colorName}</span>
                      </div>
                      <div>
                        Size: <span className="font-medium">{formatSize(selectedSizeDetail.size)}</span>
                      </div>
                    </div>
                  )}

                  {selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.length > 1 && (
                    <div>
                      <span className="text-xs text-gray-600 mb-1 block">Available Sizes:</span>
                      <div className="flex gap-1 flex-wrap">
                        {selectedVariant.moreDetails.map((sizeDetail, index) => (
                          <button
                            key={index}
                            onClick={() => handleSizeSelect(sizeDetail)}
                            className={`px-2 py-1 text-xs rounded border ${
                              selectedSizeDetail === sizeDetail
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {formatSize(sizeDetail.size)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkPricing.length > 0 && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        {isDiscountActive(product, selectedVariant, selectedSizeDetail)
                          ? "Discounted Bulk Pricing:"
                          : "Bulk Pricing:"}
                      </p>
                      <div className="space-y-1">
                        {bulkPricing.map((tier, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{tier.quantity}+ pcs</span>
                            <span className="font-semibold">${tier.wholesalePrice} each</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                />
                <button
                  onClick={() => setAddQuantity(addQuantity + 1)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {hasVariants && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {showDetails ? "Hide" : "Details"}
                </button>
                <button
                  onClick={() => setSelectedVariantProduct(product)}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <Palette className="w-4 h-4" />
                  Variants
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCartWithQuantity}
              disabled={hasVariants && (!selectedVariant || !selectedSizeDetail)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Add {addQuantity} to Cart
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ProductModal = ({ product, onClose }) => {
    if (!product) return null

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
                  src={product.variants?.[0]?.variantImage || product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ${getDisplayPrice(product, product.variants?.[0], product.variants?.[0]?.moreDetails?.[0])}
                  </span>
                </div>

                {product.productDetails && product.productDetails.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Product Details</h3>
                    <div className="space-y-2">
                      {product.productDetails.map((detail, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="font-medium">{detail.key}:</span>
                          <span>{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">Category: {product.categoryPath}</p>
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
    const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null)
    const [selectedSizeDetail, setSelectedSizeDetail] = useState(selectedVariant?.moreDetails?.[0] || null)
    const [localQuantityToAdd, setLocalQuantityToAdd] = useState(1)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
      if (selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.length > 0) {
        setSelectedSizeDetail(selectedVariant.moreDetails[0])
      }
    }, [selectedVariant])

    if (!product) return null

    const handleVariantSelect = (variant) => {
      setSelectedVariant(variant)
      setCurrentImageIndex(0)
      if (variant.moreDetails && variant.moreDetails.length > 0) {
        setSelectedSizeDetail(variant.moreDetails[0])
      }
    }

    const handleSizeSelect = (sizeDetail) => {
      setSelectedSizeDetail(sizeDetail)
      setCurrentImageIndex(0)
    }

    const handleAddToCartFromModal = async () => {
      if (!selectedVariant || !selectedSizeDetail) return

      const sizeString = formatSize(selectedSizeDetail.size)
      await handleAddToCart(product._id, selectedVariant.colorName, sizeString, localQuantityToAdd)
      onClose()
    }

    const getCurrentImages = () => {
      const images = []

      if (selectedVariant && selectedVariant.variantImage) {
        images.push(selectedVariant.variantImage)
      }

      if (selectedSizeDetail && selectedSizeDetail.additionalImages) {
        images.push(...selectedSizeDetail.additionalImages)
      }

      if (product.additionalImages) {
        images.push(...product.additionalImages)
      }

      return images.filter(Boolean)
    }

    const currentImages = getCurrentImages()
    const currentImage = currentImages[currentImageIndex] || "/placeholder.svg"
    const displayPrice = getDisplayPrice(product, selectedVariant, selectedSizeDetail)
    const bulkPricing = getBulkPricing(product, selectedVariant, selectedSizeDetail)

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
              <div className="relative mb-4">
                <img
                  src={currentImage || "/placeholder.svg"}
                  alt={`${product.name} - ${selectedVariant?.colorName || "default"} variant`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(currentImage)}
                />

                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
                      }
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {currentImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600">${displayPrice}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Color: {selectedVariant?.colorName || "Select Color"}</h4>
              <div className="flex gap-3 flex-wrap">
                {product.variants?.map((variant, index) => {
                  const isSelected = selectedVariant?.colorName === variant.colorName

                  return (
                    <button
                      key={index}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all overflow-hidden ${
                        isSelected ? "border-blue-500 scale-105 shadow-lg" : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={variant.colorName}
                    >
                      <img
                        src={variant.variantImage || "/placeholder.svg"}
                        alt={variant.colorName}
                        className="w-full h-full object-cover rounded-lg"
                      />
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

            {selectedVariant && selectedVariant.moreDetails && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">
                  Size: {selectedSizeDetail ? formatSize(selectedSizeDetail.size) : "Select Size"}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedVariant.moreDetails.map((sizeDetail, index) => (
                    <button
                      key={index}
                      onClick={() => handleSizeSelect(sizeDetail)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedSizeDetail === sizeDetail
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {formatSize(sizeDetail.size)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSizeDetail && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Selected Variant Details</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Price: <span className="font-semibold">${displayPrice}</span>
                  </div>
                  <div>
                    Stock: <span className="font-semibold">{selectedSizeDetail.stock} available</span>
                  </div>
                  {selectedSizeDetail.optionalDetails?.map((detail, index) => (
                    <div key={index}>
                      {detail.key}: <span className="font-semibold">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkPricing.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {isDiscountActive(product, selectedVariant, selectedSizeDetail)
                    ? "Discounted Bulk Pricing"
                    : "Bulk Pricing"}
                </h4>
                <div className="space-y-2">
                  {bulkPricing.map((tier, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{tier.quantity}+ pieces</span>
                      <span className="font-semibold">${tier.wholesalePrice} each</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant && selectedSizeDetail && (
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
                      onChange={(e) => setLocalQuantityToAdd(Math.max(1, Number.parseInt(e.target.value) || 1))}
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

            {!selectedVariant || !selectedSizeDetail ? (
              <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-center">
                Please select both color and size
              </div>
            ) : (
              <button
                onClick={handleAddToCartFromModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Add {localQuantityToAdd} to Cart - {selectedVariant.colorName}, {formatSize(selectedSizeDetail.size)}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

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

  const getJustArrivedProducts = () => {
    return products.filter((product) => {
      // You can add logic here to determine "just arrived" products
      // For now, showing all products
      return true
    })
  }

  const getRestockedProducts = () => {
    return products.filter((product) => {
      return (
        isRecentlyRestocked(product) ||
        product.variants?.some((variant) =>
          variant.moreDetails?.some((sizeDetail) => isRecentlyRestocked(product, variant, sizeDetail)),
        )
      )
    })
  }

  const getRevisedRatesProducts = () => {
    return products.filter((product) => {
      return (
        isDiscountActive(product) ||
        product.variants?.some((variant) =>
          variant.moreDetails?.some((sizeDetail) => isDiscountActive(product, variant, sizeDetail)),
        )
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center w-full">
        <p className="text-sm font-medium">
          🎉 Special Festival Sale - Up to 50% Off! Free Shipping on Orders Over $100
        </p>
      </div>

      <nav className="bg-white shadow-lg sticky top-0 z-40 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 h-full flex items-center">
              <img
                src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=60&fit=crop"
                alt="Oula Market"
                className="h-12 w-auto"
              />
            </div>
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
            <div className="flex items-center space-x-4">
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
              {cartLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading cart...</p>
                </div>
              )}
              {cartError && (
                <div className="text-center py-8">
                  <p className="text-red-500">{cartError}</p>
                </div>
              )}
              {Object.keys(cartItems).length === 0 && !cartLoading ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(cartItems).map(([cartKey, item]) => {
                    const product = products.find((p) => p._id === item.productId)
                    if (!product) return null

                    const variant = product.variants?.find((v) => v.colorName === item.colorName)
                    const itemPrice = item.discountedPrice || item.price

                    return (
                      <div key={cartKey} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.productName}
                          className="w-15 h-15 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.productName}</h3>
                          <p className="text-xs text-gray-500">
                            {item.colorName && item.sizeString
                              ? `${item.colorName}, ${item.sizeString}`
                              : "Default variant"}
                          </p>
                          <p className="text-blue-600 font-bold">${itemPrice}</p>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(cartKey, -1)}
                              className="p-1 hover:bg-gray-100 rounded"
                              disabled={cartLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(cartKey, 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                              disabled={cartLoading}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(cartKey)}
                            className="p-1 text-red-500 hover:bg-red-500 rounded transition-colors"
                            title="Remove from cart"
                            disabled={cartLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t pt-4">
                    <div className="mb-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={applyFreeCash}
                          onChange={(e) => setApplyFreeCash(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Apply ₹150 free cash</span>
                      </label>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-xl">${getCartTotal().toFixed(2)}</span>
                    </div>
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                      disabled={cartLoading}
                    >
                      {cartLoading ? "Processing..." : "Checkout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

        {showCategoryFilter && selectedCategory && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
              {products
                .filter((product) => product.categoryPath?.includes(selectedCategory))
                .map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
            </div>
          </section>
        )}

        <section className="mb-12" ref={justArrivedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Just Arrived</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {getJustArrivedProducts()
              .slice(0, 10)
              .map((product) => (
                <ProductCard key={`just-arrived-${product._id}`} product={product} />
              ))}
          </div>
        </section>

        <section className="mb-12" ref={restockedRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Restocked Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {getRestockedProducts().map((product) => (
              <ProductCard key={`restocked-${product._id}`} product={product} />
            ))}
          </div>
        </section>

        <section className="mb-12" ref={revisedRatesRef}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Revised Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {getRevisedRatesProducts().map((product) => (
              <ProductCard key={`revised-rates-${product._id}`} product={product} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      </div>

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
                    Shipping Info
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
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
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300 text-sm">© 2024 Oula Market. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {selectedVariantProduct && (
        <VariantModal product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} />
      )}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  )
}
