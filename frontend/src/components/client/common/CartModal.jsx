import { useContext, useState } from "react"
import { X, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useCart } from "../../../../Context/CartContext"
import { ProductContext } from "../../../../Context/ProductContext"
import { CategoryContext } from "../../../../Context/CategoryContext"
import { FreeCashContext } from "../../../../Context/FreeCashContext"
import { getOptimizedImageUrl } from "../../../utils/imageOptimizer"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ConfirmationModal from "../Home/ConfirmationModal"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../../../../Context/AuthContext"

export default function CartModal() {
  
  // Add this helper function inside the component (after the state declarations)
  const getEffectiveUnitPrice = (quantity, bulkPricing, basePrice) => {
    if (!bulkPricing || bulkPricing.length === 0) return basePrice;
    let effectivePrice = basePrice;
    for (let i = bulkPricing.length - 1; i >= 0; i--) {
      if (quantity >= bulkPricing[i].quantity) {
        effectivePrice = bulkPricing[i].wholesalePrice;
        break;
      }
    }
    return effectivePrice;
  };

  const getBulkPricing = (product, variant, sizeDetail) => {
 // Priority: sizeDetail → variant → product
   if (sizeDetail?.bulkPricingCombinations?.length) {
     return sizeDetail.bulkPricingCombinations.map(bp => ({
       quantity: bp.quantity,
       wholesalePrice: bp.wholesalePrice
     }));
   }
   if (variant?.commonBulkPricingCombinations?.length) {
     return variant.commonBulkPricingCombinations.map(bp => ({
       quantity: bp.quantity,
       wholesalePrice: bp.wholesalePrice
     }));
   }
   if (product?.bulkPricing?.length) {
     return product.bulkPricing.map(bp => ({
       quantity: bp.quantity,
       wholesalePrice: bp.wholesalePrice
     }));
   }
   return [];
 };
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const { products } = useContext(ProductContext)
  const { categories } = useContext(CategoryContext)
  const { freeCash } = useContext(FreeCashContext)
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    applyFreeCash,
    setApplyFreeCash,
    loading: cartLoading,
    error: cartError,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getUniqueCartItemsCount,
    getTotalItemsCount,
    clearCart,
    clearFreeCashCache,
    checkFreeCashEligibility,
  } = useCart()

  const [isProcessing, setIsProcessing] = useState(false)
  const [showClearCartModal, setShowClearCartModal] = useState(false)

  const handleCartCheckout = async () => {
  try {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', '/')
      localStorage.setItem('checkoutIntent', 'true')
      navigate('/auth/login')
      return
    }

    console.log('Cart Items being sent to checkout:', JSON.stringify(cartItems, null, 2));

    const res = await axios.post(
      'https://api.simplyrks.cloud/api/order/place-order',
      cartItems,
      {
        withCredentials: true,
        timeout: 10000,
      }
    )

    if (res.status === 201) {
      // Clear cart and other operations after successful order
      try {
        await clearCart()
        if (clearFreeCashCache) await clearFreeCashCache()
        if (checkFreeCashEligibility) await checkFreeCashEligibility()
      } catch (clearError) {
        console.warn("Error clearing cart data:", clearError)
        // Don't throw - order was successful
      }

      setIsCartOpen(false)

      toast.success('Order placed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  } catch (error) {
    console.error("Checkout error:", error)
    // Only show error if order placement failed (not 201 status)
    if (error.response?.status !== 201) {
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  } finally {
    setIsProcessing(false)
  }
}

  const handleUpdateQuantity = async (cartKey, change) => {
    await updateQuantity(cartKey, change)
  }

  const handleRemoveFromCart = async (cartKey) => {
    await removeFromCart(cartKey)
  }

  const handleClearCart = async () => {
    setShowClearCartModal(true)
  }

  const confirmClearCart = async () => {
    await clearCart()
    toast.success('Cart cleared successfully!', {
      position: "top-right",
      autoClose: 2000,
    })
  }

  const totalFreeCashApplied = Object.values(cartItems).reduce((sum, item) => sum + (item.cashApplied || 0), 0)
  const cartTotal = getCartTotal()
  const validAboveAmount = freeCash?.valid_above_amount || 50
  const isAllProducts = freeCash?.is_cash_applied_on__all_products || false

  const category = freeCash?.category ? categories.find(cat => cat._id.toString() === freeCash.category.toString()) : null
  const subCategory = freeCash?.sub_category ? categories.find(cat => cat._id.toString() === freeCash.sub_category.toString()) : null
  const categoryName = category?.categoryName || null
  const subCategoryName = subCategory?.categoryName || null

  const endDateFormatted = freeCash?.end_date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(freeCash.end_date))
    : "No expiry"

  const hasEligibleProduct = Object.values(cartItems).some((item) => {
    if (isAllProducts) return true
    const product = products.find((p) => p._id === item.productId)
    if (!product) return false

    const isMainCategoryMatch = category && product.mainCategory &&
      product.mainCategory.toString() === freeCash.category.toString()
    const isSubCategoryMatch = !subCategory || (product.subCategory &&
      product.subCategory.toString() === freeCash.sub_category.toString())

    return isMainCategoryMatch && isSubCategoryMatch
  })

  const isFreeCashDisabled = cartTotal < validAboveAmount || (!isAllProducts && !hasEligibleProduct)

  let localCartTotal = 0
  const cartEntries = Object.entries(cartItems)
  cartEntries.forEach(([cartKey, item]) => {
    const product = products.find((p) => p._id === item.productId)
    if (!product) {
      localCartTotal += ((item.discountedPrice || item.price) * item.quantity) - (item.cashApplied || 0)
      return
    }

    const variant = product.variants?.find((v) => v._id === item.variantId)
    const sizeDetail = variant?.moreDetails?.find((md) => md._id === item.detailsId)
    const bulkPricing = getBulkPricing(product, variant, sizeDetail)
    const basePrice = item.discountedPrice || item.price
    const effectiveUnit = getEffectiveUnitPrice(item.quantity, bulkPricing, basePrice)
    const subtotal = effectiveUnit * item.quantity
    localCartTotal += subtotal - (item.cashApplied || 0)
  })

  return (
    <>
      <div className={`fixed inset-0 z-50 ${isCartOpen ? "block" : "hidden"}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
        <div className="absolute right-0 top-0 h-full w-full sm:max-w-md md:max-w-lg bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h2>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  {getTotalItemsCount()} items • {getUniqueCartItemsCount()} products
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {cartLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4 dark:text-white">Loading cart...</p>
              </div>
            )}

            {cartError && (
              <div className="text-center py-8">
                <p className="text-red-500 dark:text-gary-400">{cartError}</p>
              </div>
            )}

            {Object.keys(cartItems).length === 0 && !cartLoading ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg dark:text-white">Your cart is empty</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:text-gray-400"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Free Cash Section */}
                {freeCash && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 dark:bg-gray-700 dark:bg-none">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={applyFreeCash}
                        onChange={(e) => {
                          setApplyFreeCash(e.target.checked)
                        }}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isFreeCashDisabled}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Apply Free Cash (₹{freeCash.amount.toFixed(2)} available)
                        </span>
                        <p className="text-xs text-gray-600 mt-1 dark:text-gray-400">
                          Valid above ₹{validAboveAmount}
                        </p>
                        {!isAllProducts && (
                          <p className="text-xs text-gray-600 mt-1 dark:text-gray-400">
                            {categoryName && `Category: ${categoryName}`}
                            {subCategoryName && ` • ${subCategoryName}`}
                          </p>
                        )}
                        {isAllProducts && (
                          <p className="text-xs text-gray-600 mt-1 dark:text-gray-400">Eligible for all products</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 dark:text-white">Expires: {endDateFormatted}</p>
                        {isFreeCashDisabled && (
                          <p className="text-xs text-red-600 mt-2 font-medium dark:text-white">
                            {cartTotal < validAboveAmount
                              ? `Minimum cart value ₹${validAboveAmount} required`
                              : !hasEligibleProduct
                              ? `No eligible products in cart`
                              : ""}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                {/* Cart Items */}
                {cartEntries.map(([cartKey, item]) => {
  // Use bulk pricing stored in cart item instead of fetching from products
  const bulkPricing = item.bulkPricing || []
  const basePrice = item.discountedPrice || item.price
  const effectiveUnit = getEffectiveUnitPrice(item.quantity, bulkPricing, basePrice)

                  return (
                    <div key={cartKey} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-3 sm:gap-4">
                        <img
                          src={getOptimizedImageUrl(item.imageUrl, { width: 100 }) || "/placeholder.svg"}
                          alt={item.productName}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-contain flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate dark:text-white">
                            {item.productName}
                          </h3>
                          {(item.colorName || item.sizeString) && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 dark:text-gray-400">
                              {item.colorName && item.sizeString
                                ? `${item.colorName} • ${item.sizeString}`
                                : item.colorName || item.sizeString}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-base sm:text-lg font-bold ${effectiveUnit < basePrice ? "text-green-600" : "text-blue-600"}`}>
                              ₹{effectiveUnit.toFixed(2)}
                            </span>
                            {effectiveUnit < basePrice && (
                              <span className="text-xs sm:text-sm text-gray-500 line-through dark:text-gray-400">
                                ₹{basePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.cashApplied > 0 && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Free Cash: -₹{item.cashApplied.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => handleRemoveFromCart(cartKey)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-white"
                            disabled={cartLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
  <button
    onClick={() => handleUpdateQuantity(cartKey, -1)}
    className="p-1 hover:bg-white rounded transition-colors dark:hover:bg-gray-600"
    disabled={cartLoading}
  >
    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
  </button>
  <input
    type="number"
    value={item.quantity}
    onChange={(e) => {
      const val = e.target.value;
      if (val === '') {
        // Temporarily allow empty for editing
        return;
      }
      const num = Number.parseInt(val);
      if (!isNaN(num) && num >= 1) {
        const diff = num - item.quantity;
        if (diff !== 0) {
          handleUpdateQuantity(cartKey, diff);
        }
      }
    }}
    onBlur={(e) => {
      if (e.target.value === '' || e.target.value === '0') {
        // If empty or 0, reset to 1
        const diff = 1 - item.quantity;
        if (diff !== 0) {
          handleUpdateQuantity(cartKey, diff);
        }
      }
    }}
    onKeyPress={(e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    }}
    disabled={cartLoading}
    className="font-semibold text-sm sm:text-base w-12 sm:w-14 text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
  />
  <button
    onClick={() => handleUpdateQuantity(cartKey, 1)}
    className="p-1 hover:bg-white rounded transition-colors dark:hover:bg-gray-600"
    disabled={cartLoading}
  >
    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
  </button>
</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          {Object.keys(cartItems).length > 0 && !cartLoading && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6">
              {totalFreeCashApplied > 0 && (
                <div className="flex justify-between items-center mb-3 text-green-600">
                  <span className="text-sm font-medium">Free Cash Applied:</span>
                  <span className="text-sm font-bold">-₹{totalFreeCashApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-2xl font-bold text-blue-600">₹{localCartTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-blue-600 py-3 sm:py-4 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg"
                  disabled={cartLoading || isProcessing}
                  onClick={async () => {
                    setIsProcessing(true)
                    await handleCartCheckout()
                    setIsProcessing(false)
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:text-gray-400"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Checkout
                    </>
                  )}
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={cartLoading}
                  className="w-full bg-red-600 dark:text-gray-400 hover:bg-red-700 disabled:bg-gray-400 text-red-600 py-2.5 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showClearCartModal}
          onClose={() => setShowClearCartModal(false)}
          onConfirm={confirmClearCart}
          title="Clear Cart?"
          message="Are you sure you want to remove all items from your cart? This action cannot be undone."
          confirmText="Clear Cart"
          cancelText="Cancel"
          type="danger"
        />
      </div>
      <ToastContainer 
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop={false}
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="light"
/>
    </>
  )
}