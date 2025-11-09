import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { 
  X, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, 
  Trash2, Star, Shield, Truck, Home, ArrowLeft 
} from "lucide-react"
import { ProductContext } from "../../../Context/ProductContext"
import { CategoryContext } from "../../../Context/CategoryContext"
import { useCart } from "../../../Context/CartContext"
import { DiscountContext } from "../../../Context/DiscountContext"
import { getOptimizedImageUrl } from "../../utils/imageOptimizer"
import Navbar from "../../components/client/common/Navbar"
import CartModal from "../../components/client/common/CartModal"
import axios from "axios"

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products } = useContext(ProductContext)
  const { categories } = useContext(CategoryContext)
  const { discountData, loadingDiscount } = useContext(DiscountContext)
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart()

  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
const [productError, setProductError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Helper functions (copy from Home.jsx)
  const formatSize = (sizeObj) => {
    if (!sizeObj) return "N/A"
    if (typeof sizeObj === "string") return sizeObj
    if (sizeObj.length && sizeObj.breadth && sizeObj.height) {
      const unit = sizeObj.unit || "cm"
      return `${sizeObj.length} × ${sizeObj.breadth} × ${sizeObj.height} ${unit}`
    }
    return "N/A"
  }

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

  const getApplicableDiscount = (product) => {
    if (!discountData || !Array.isArray(discountData)) return null;
    
    const now = new Date();
    const activeDiscounts = discountData.filter(discount => {
      const start = new Date(discount.startDate);
      const end = new Date(discount.endDate);
      return now >= start && now <= end && discount.isActive;
    });
    
    for (const discount of activeDiscounts) {
      if (discount.applicableToAll ||
        (discount.selectedMainCategory && product.categoryPath?.includes(discount.selectedMainCategory)) ||
        (discount.selectedSubCategory && product.categoryPath?.includes(discount.selectedSubCategory))
      ) {
        return discount
      }
    }
    return null
  }

  const getOriginalPrice = (product, variant = null, sizeDetail = null) => {
    if (sizeDetail && sizeDetail.price) {
      return parseFloat(sizeDetail.price) || 0
    }
    if (variant && variant.commonPrice) {
      return parseFloat(variant.commonPrice) || 0
    }
    if (product.price && product.price !== "" && product.price !== null) {
      return parseFloat(product.price) || 0
    }
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0]
      if (firstVariant.moreDetails && firstVariant.moreDetails.length > 0) {
        return parseFloat(firstVariant.moreDetails[0].price) || 0
      }
    }
    return 0
  }

  const getDisplayPrice = (product, variant = null, sizeDetail = null) => {
    const originalPrice = getOriginalPrice(product, variant, sizeDetail)
    let effectivePrice = originalPrice

    if (isDiscountActive(product, variant, sizeDetail)) {
      if (sizeDetail && sizeDetail.discountPrice) {
        effectivePrice = parseFloat(sizeDetail.discountPrice) || effectivePrice
      } else if (product.discountPrice) {
        effectivePrice = parseFloat(product.discountPrice) || effectivePrice
      }
    }

    const discount = getApplicableDiscount(product)
    if (discount) {
      effectivePrice = effectivePrice * (1 - discount.discountPercentage / 100)
    }

    return parseFloat(effectivePrice.toFixed(2))
  }

  const getBulkPricing = (product, variant = null, sizeDetail = null) => {
    let bulkPricing = []

    if (sizeDetail) {
      if (isDiscountActive(product, variant, sizeDetail) && sizeDetail.discountBulkPricing) {
        bulkPricing = sizeDetail.discountBulkPricing
      } else if (sizeDetail.bulkPricingCombinations) {
        bulkPricing = sizeDetail.bulkPricingCombinations
      }
    } else if (isDiscountActive(product) && product.discountBulkPricing) {
      bulkPricing = product.discountBulkPricing
    } else if (product.bulkPricing) {
      bulkPricing = product.bulkPricing
    }

    const discount = getApplicableDiscount(product)
    if (discount) {
      bulkPricing = bulkPricing.map(tier => ({
        ...tier,
        wholesalePrice: parseFloat((tier.wholesalePrice * (1 - discount.discountPercentage / 100)).toFixed(2))
      }))
    }

    return bulkPricing
  }

  const getEffectiveUnitPrice = (quantity, bulkPricing, basePrice) => {
    if (bulkPricing.length === 0) return basePrice
    let effectivePrice = basePrice
    for (let i = bulkPricing.length - 1; i >= 0; i--) {
      if (quantity >= bulkPricing[i].quantity) {
        effectivePrice = bulkPricing[i].wholesalePrice
        break
      }
    }
    return effectivePrice
  }

  // Calculate cartKey early
  const cartKey = product && selectedVariant && selectedSize
    ? `${product._id}-${selectedVariant.colorName}-${formatSize(selectedSize.size)}`
    : product ? `${product._id}-default-default` : null

  const itemInCart = cartKey ? cartItems[cartKey] : null

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    const searchTerms = debouncedSearchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0)
    const results = []

    const activeProducts = products.filter(product => {
      if (product.isActive === false) return false
      const mainCat = categories.find(cat => cat._id.toString() === product.mainCategory?.toString())
      const subCat = product.subCategory ? categories.find(cat => cat._id.toString() === product.subCategory?.toString()) : null
      if (mainCat && mainCat.isActive === false) return false
      if (subCat && subCat.isActive === false) return false
      return true
    })

    activeProducts.forEach((product) => {
      const productNameLower = product.name.toLowerCase()
      const productNameMatch = searchTerms.every(term => productNameLower.includes(term))

      if (product.hasVariants && product.variants) {
        product.variants.filter(v => v.isActive !== false).forEach((variant) => {
          const fullName = `${product.name} ${variant.colorName}`.toLowerCase()
          const variantMatch = searchTerms.every(term => fullName.includes(term))

          if (variant.moreDetails && variant.moreDetails.length > 0) {
            variant.moreDetails.filter(md => md.isActive !== false).forEach((sizeDetail) => {
              const sizeString = formatSize(sizeDetail.size)
              const fullNameWithSize = `${product.name} ${variant.colorName} ${sizeString}`.toLowerCase()
              const sizeMatch = searchTerms.every(term => fullNameWithSize.includes(term))

              if (productNameMatch || variantMatch || sizeMatch) {
                results.push({
                  productId: product._id,
                  productName: product.name,
                  variantId: variant._id,
                  colorName: variant.colorName,
                  sizeDetail: sizeDetail,
                  sizeString: sizeString,
                  image: variant.variantImage || product.image,
                  price: getDisplayPrice(product, variant, sizeDetail),
                  stock: sizeDetail.stock,
                  fullDisplayName: `${product.name} - ${variant.colorName} - ${sizeString}`
                })
              }
            })
          } else {
            if (productNameMatch || variantMatch) {
              results.push({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                colorName: variant.colorName,
                sizeDetail: null,
                sizeString: null,
                image: variant.variantImage || product.image,
                price: getDisplayPrice(product, variant, null),
                stock: variant.commonStock,
                fullDisplayName: `${product.name} - ${variant.colorName}`
              })
            }
          }
        })
      } else {
        if (productNameMatch) {
          results.push({
            productId: product._id,
            productName: product.name,
            variantId: null,
            colorName: null,
            sizeDetail: null,
            sizeString: null,
            image: product.image,
            price: getDisplayPrice(product, null, null),
            stock: product.stock,
            fullDisplayName: product.name
          })
        }
      }
    })

    setSearchResults(results)
    setShowSearchResults(true)
    setIsSearching(false)
  }, [debouncedSearchQuery, products, categories])

  const handleSearchResultClick = (result) => {
    navigate(`/product/${result.productId}`)
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const highlightMatchedText = (text, searchQuery) => {
    if (!searchQuery.trim()) return text

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0)
    let highlightedText = text

    const matches = []
    searchTerms.forEach(term => {
      let index = 0
      const lowerText = text.toLowerCase()
      while ((index = lowerText.indexOf(term, index)) !== -1) {
        matches.push({ start: index, end: index + term.length })
        index += term.length
      }
    })

    matches.sort((a, b) => a.start - b.start)
    const merged = []
    matches.forEach(match => {
      if (merged.length === 0 || merged[merged.length - 1].end < match.start) {
        merged.push(match)
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, match.end)
      }
    })

    if (merged.length === 0) return text

    const parts = []
    let lastIndex = 0

    merged.forEach(match => {
      if (match.start > lastIndex) {
        parts.push(text.substring(lastIndex, match.start))
      }
      parts.push(<strong key={`bold-${match.start}`} className="font-bold text-gray-900 dark:text-white">{text.substring(match.start, match.end)}</strong>)
      lastIndex = match.end
    })

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return <>{parts}</>
  }

  // Load product
useEffect(() => {
  const loadProduct = async () => {
    setLoadingProduct(true)
    setProductError(null)
    
    // First try to find in context
    const foundProduct = products.find(p => p._id === productId)
    
    if (foundProduct) {
      setProduct(foundProduct)
      if (foundProduct.hasVariants && foundProduct.variants && foundProduct.variants.length > 0) {
        const defaultVariant = foundProduct.variants.find(v => v.isDefault) || foundProduct.variants[0]
        setSelectedVariant(defaultVariant)
        if (defaultVariant.moreDetails && defaultVariant.moreDetails.length > 0) {
          setSelectedSize(defaultVariant.moreDetails[0])
        }
      }
      setLoadingProduct(false)
    } else {
      // If not in context, fetch from backend
      try {
        const response = await axios.get(
          `https://api.mouldmarket.in/api/product/${productId}`,
          { withCredentials: true }
        )
        
        if (response.status === 200 && response.data) {
          const fetchedProduct = response.data
          setProduct(fetchedProduct)
          
          if (fetchedProduct.hasVariants && fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            const defaultVariant = fetchedProduct.variants.find(v => v.isDefault) || fetchedProduct.variants[0]
            setSelectedVariant(defaultVariant)
            if (defaultVariant.moreDetails && defaultVariant.moreDetails.length > 0) {
              setSelectedSize(defaultVariant.moreDetails[0])
            }
          }
          setLoadingProduct(false)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setProductError("Failed to load product")
        setLoadingProduct(false)
      }
    }
  }
  
  loadProduct()
}, [productId, products])

  // Sync quantity with cart items
  useEffect(() => {
    if (itemInCart) {
      setQuantity(itemInCart.quantity)
    }
  }, [itemInCart?.quantity])

  if (loadingProduct) {
  return (
    <div className="min-h-screen bg-gray-50 w-screen overflow-x-hidden">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        isSearching={isSearching}
        onSearchResultClick={handleSearchResultClick}
        onClearSearch={clearSearch}
        highlightMatchedText={highlightMatchedText}
        handleSearchKeyPress={handleSearchKeyPress}
      />
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading product...</p>
        </div>
      </div>
    </div>
  )
}

if (productError || !product) {
  return (
    <div className="min-h-screen bg-gray-50 w-screen overflow-x-hidden">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        isSearching={isSearching}
        onSearchResultClick={handleSearchResultClick}
        onClearSearch={clearSearch}
        highlightMatchedText={highlightMatchedText}
        handleSearchKeyPress={handleSearchKeyPress}
      />
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            {productError || "Product not found"}
          </p>
          <button
  onClick={() => navigate('/')}
  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
>
  <ArrowLeft className="w-5 h-5" />
  <span className="font-medium">Back to Home</span>
</button>
        </div>
      </div>
    </div>
  )
}

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant)
    if (variant.moreDetails && variant.moreDetails.length > 0) {
      setSelectedSize(variant.moreDetails[0])
    }
    setCurrentImageIndex(0)
    setQuantity(1)
  }

  const handleSizeChange = (sizeDetail) => {
    setSelectedSize(sizeDetail)
    setQuantity(1)
  }

  const handleRemoveFromCart = () => {
  removeFromCart(cartKey)
  setQuantity(1)
}

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 1) {
      setQuantity(numValue)
    } else if (value === '') {
      setQuantity('')
    }
  }

  const handleAddToCartFromModal = async () => {
    if (product.hasVariants) {
      if (!selectedVariant || !selectedSize) {
        alert("Please select both color and size")
        return
      }
      const sizeString = formatSize(selectedSize.size)
      
      const variant = product.variants?.find((v) => v.colorName === selectedVariant.colorName)
      const sizeDetail = variant?.moreDetails?.find((md) => formatSize(md.size) === sizeString)
      const originalPrice = getOriginalPrice(product, variant, sizeDetail)
      const displayPrice = getDisplayPrice(product, variant, sizeDetail)
      const bulkPricing = getBulkPricing(product, variant, sizeDetail)
      const bulkPrice1Plus = bulkPricing.find(tier => tier.quantity === 1)
      const effectivePrice = bulkPrice1Plus ? bulkPrice1Plus.wholesalePrice : displayPrice

      const productData = {
        imageUrl: variant?.variantImage || product.image || "/placeholder.svg",
        productName: product.name,
        variantId: variant?._id || "",
        detailsId: sizeDetail?._id || "",
        sizeId: sizeDetail?.size?._id || "",
        price: originalPrice,
        discountedPrice: effectivePrice,
      }

      await addToCart(product._id, selectedVariant.colorName, sizeString, quantity, productData)
    } else {
      const originalPrice = getOriginalPrice(product, null, null)
      const displayPrice = getDisplayPrice(product, null, null)
      const bulkPricing = getBulkPricing(product, null, null)
      const bulkPrice1Plus = bulkPricing.find(tier => tier.quantity === 1)
      const effectivePrice = bulkPrice1Plus ? bulkPrice1Plus.wholesalePrice : displayPrice

      const productData = {
        imageUrl: product.image || "/placeholder.svg",
        productName: product.name,
        variantId: "",
        detailsId: "",
        sizeId: "",
        price: originalPrice,
        discountedPrice: effectivePrice,
      }

      await addToCart(product._id, null, null, quantity, productData)
    }
  }

  const getCurrentImages = () => {
    const images = []
    if (selectedVariant && selectedVariant.variantImage) {
      images.push(selectedVariant.variantImage)
    } else if (product.image) {
      images.push(product.image)
    }
    if (selectedSize && selectedSize.additionalImages) {
      images.push(...selectedSize.additionalImages)
    }
    if (product.additionalImages) {
      images.push(...product.additionalImages)
    }
    return images.filter(Boolean)
  }

  const currentImages = getCurrentImages()
  const currentImage = currentImages[currentImageIndex] || "/placeholder.svg"

  const displayPrice = getDisplayPrice(product, selectedVariant, selectedSize)
  const originalPrice = getOriginalPrice(product, selectedVariant, selectedSize)
  const hasActiveDiscount = isDiscountActive(product, selectedVariant, selectedSize)
  const bulkPricing = getBulkPricing(product, selectedVariant, selectedSize)
  const currentStock = selectedSize?.stock || selectedVariant?.commonStock || product.stock || 0

  const discountPercentage = hasActiveDiscount && originalPrice > displayPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0

  const effectiveUnitPrice = getEffectiveUnitPrice(quantity, bulkPricing, displayPrice)
  const totalPrice = effectiveUnitPrice * quantity

  return (
    <div className="min-h-screen bg-gray-50 w-screen overflow-x-hidden">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        isSearching={isSearching}
        onSearchResultClick={handleSearchResultClick}
        onClearSearch={clearSearch}
        highlightMatchedText={highlightMatchedText}
        handleSearchKeyPress={handleSearchKeyPress}
      />

      <CartModal
        getBulkPricing={getBulkPricing}
        getEffectiveUnitPrice={getEffectiveUnitPrice}
      />

      {/* Back Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Left Section - Images */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={getOptimizedImageUrl(currentImage, { width: 600 }) || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-64 sm:h-80 lg:h-96 object-contain rounded-xl cursor-pointer"
                  onClick={() => setSelectedImage(currentImage)}
                  loading="lazy"
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold dark:text-white">
                      {discountPercentage}% OFF
                    </span>
                  </div>
                )}

                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
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

              {product.hasVariants && product.variants && product.variants.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 dark:text-white">Variant Images</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.variants.filter(v => v.isActive !== false).map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleVariantChange(variant)}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedVariant?._id === variant._id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(variant.variantImage, { width: 100 }) || "/placeholder.svg"}
                          alt={variant.colorName}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Product Details */}
            <div className="space-y-4 sm:space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 dark:text-white break-words">{product.name}</h1>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 space-y-1">
                  {product.mainCategory && (
                    <p><span className="dark:text-white">Main Category: </span><span className="font-medium">
                      {typeof product.mainCategory === 'object'
                        ? product.mainCategory.categoryName
                        : categories.find(cat => cat._id === product.mainCategory)?.categoryName || product.mainCategory}
                    </span></p>
                  )}
                  {product.subCategory && (
                    <p><span className="dark:text-white">Sub Category: </span><span className="font-medium">
                      {typeof product.subCategory === 'object'
                        ? product.subCategory.categoryName
                        : categories.find(cat => cat._id === product.subCategory)?.categoryName || product.subCategory}
                    </span></p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
  <div>
    <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
      ₹ {effectiveUnitPrice.toFixed(2)}
    </span>
  </div>
  {(hasActiveDiscount && originalPrice > displayPrice) || (effectiveUnitPrice < originalPrice) ? (
    <span className="text-lg sm:text-xl text-gray-500 line-through dark:text-gray-400">
      ₹ {originalPrice.toFixed(2)}
    </span>
  ) : null}
</div>

              {product.hasVariants && product.variants && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 dark:text-white">
                    Color: {selectedVariant?.colorName || "Select Color"}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.variants.filter(v => v.isActive !== false).map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleVariantChange(variant)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant?._id === variant._id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
                        }`}
                      >
                        {variant.colorName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 dark:text-white">
                    Size: {selectedSize ? formatSize(selectedSize.size) : "Select Size"}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {selectedVariant.moreDetails.filter(md => md.isActive !== false).map((detail) => (
                      <button
                        key={detail._id}
                        onClick={() => handleSizeChange(detail)}
                        className={`p-2 sm:p-3 rounded-lg border text-left transition-colors ${
                          selectedSize?._id === detail._id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {formatSize(detail.size)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bulkPricing.filter(tier => tier.quantity > 1).length > 0 && (
  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
      Bulk Pricing Available
    </h4>
    <div className="space-y-2">
      {bulkPricing.filter(tier => tier.quantity > 1).map((tier, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{tier.quantity}+ pcs</span>
          <span className="font-semibold text-gray-900 dark:text-white">₹ {tier.wholesalePrice.toFixed(2)} each</span>
        </div>
      ))}
    </div>
  </div>
)}

              <>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 dark:text-white">
                    {itemInCart ? "Quantity in Cart" : "Quantity"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button
  onClick={() => {
    if (itemInCart) {
      updateQuantity(cartKey, -1)
    } else {
      quantity > 1 && setQuantity(quantity - 1)
    }
  }}
  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={currentStock === 0 || (itemInCart ? itemInCart.quantity <= 1 : quantity <= 1)}
>
  <Minus className="w-3 h-3 sm:w-4 sm:h-4 dark:text-gray-300" />
</button>
                      <input
  type="text"
  value={quantity}
  onChange={(e) => handleQuantityChange(e.target.value)}
  onBlur={(e) => {
    const val = e.target.value;
    const num = parseInt(val);
    
    if (val === '' || val === '0' || isNaN(num) || num < 1) {
      setQuantity(1);
      if (itemInCart && itemInCart.quantity !== 1) {
        const diff = 1 - itemInCart.quantity;
        updateQuantity(cartKey, diff);
      }
    } else if (num > currentStock) {
      setQuantity(currentStock);
      if (itemInCart && itemInCart.quantity !== currentStock) {
        const diff = currentStock - itemInCart.quantity;
        updateQuantity(cartKey, diff);
      }
    } else if (itemInCart && num !== itemInCart.quantity) {
      const diff = num - itemInCart.quantity;
      updateQuantity(cartKey, diff);
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }}
  disabled={currentStock === 0}
  className="w-12 sm:w-16 py-2 text-sm sm:text-base text-center border-0 focus:outline-none dark:bg-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
/>
                      <button
  onClick={() => {
    if (itemInCart) {
      updateQuantity(cartKey, 1)
    } else {
      currentStock > 0 && quantity < currentStock && setQuantity(quantity + 1)
    }
  }}
  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={currentStock === 0 || (itemInCart ? itemInCart.quantity >= currentStock : quantity >= currentStock)}
>
  <Plus className="w-3 h-3 sm:w-4 sm:h-4 dark:text-gray-300" />
</button>
                    </div>
                  </div>
                </div>

                {currentStock === 0 && (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Out of Stock
                  </div>
                )}

                {currentStock > 0 && currentStock <= 10 && (
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                    Only {currentStock} left in stock
                  </div>
                )}

               {itemInCart ? (
  <button
    onClick={handleRemoveFromCart}
    className="w-full bg-red-600 hover:bg-red-700 text-red-600 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-colors"
  >
    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
    Remove from Cart
  </button>
                ) : (
                  <button
  onClick={handleAddToCartFromModal}
  disabled={currentStock === 0 || quantity > currentStock || (product.hasVariants && (!selectedVariant || !selectedSize))}
  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-green-600 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-colors"
>
  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
  {currentStock === 0 ? 'Out of Stock' : `Add ${quantity} to Cart • ₹ ${totalPrice.toFixed(2)}`}
</button>
                )}
              </>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quality Assured</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fast Shipping</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Premium Quality</span>
                </div>
              </div>

              {product.productDetails && product.productDetails.length > 0 && (
                <div className="border-t pt-4 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 dark:text-white">Product Details</h3>
                  <div className="space-y-2">
                    {product.productDetails.map((detail) => (
                      <div key={detail._id} className="flex text-sm sm:text-base">
                        <span className="font-medium text-gray-700 w-24 sm:w-32 dark:text-white">{detail.key}:</span>
                        <span className="text-gray-600 dark:text-gray-400 flex-1">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative bg-white dark:bg-gray-900 rounded-lg p-4 max-w-[85vw] max-h-[85vh] shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Full size product image"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: '80vh' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}