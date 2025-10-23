import React from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown, Package, DollarSign, Truck } from 'lucide-react';

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  orderData, 
  oldOrderData,
  onEditShipping 
}) {
  if (!isOpen) return null;

  const { products, newPrice, newShippingPrice, newTotalPrice } = orderData;
  const { oldPrice, oldShippingPrice, oldTotalPrice } = oldOrderData;

  // Handle pending shipping price
  const isShippingPending = newShippingPrice === 'Pending' || newShippingPrice === 'Pending';
  const isOldTotalPending = oldTotalPrice === 'Pending';
  
  // Calculate price difference only if both are numbers
  let priceDifference = 0;
  let isIncrease = false;
  let isDecrease = false;
  
  if (!isShippingPending && !isOldTotalPending) {
    const oldTotal = typeof oldTotalPrice === 'string' && oldTotalPrice !== 'Pending' 
      ? parseFloat(oldTotalPrice) 
      : parseFloat(oldTotalPrice || 0);
    const newTotal = typeof newTotalPrice === 'string' && newTotalPrice !== 'Pending'
      ? parseFloat(newTotalPrice)
      : parseFloat(newTotalPrice || 0);
    
    priceDifference = newTotal - oldTotal;
    isIncrease = priceDifference > 0;
    isDecrease = priceDifference < 0;
  }

  const getShippingDisplay = () => {
    if (newShippingPrice === 'Pending') {
      return <span className="text-yellow-600 dark:text-yellow-400 font-medium">Pending (Manual Entry Required)</span>;
    } else if (newShippingPrice === 0) {
      return <span className="text-green-600 dark:text-green-400 font-medium">Free Shipping 🎉</span>;
    } else {
      return <span className="font-medium">₹{parseFloat(newShippingPrice).toFixed(2)}</span>;
    }
  };

  const showReuse = oldShippingPrice !== null && 
                     oldShippingPrice !== undefined && 
                     oldShippingPrice !== 'Pending' &&
                     !isShippingPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Confirm Order Changes</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Change Alert - Only show if not pending */}
          {!isShippingPending && priceDifference !== 0 && (
            <div className={`p-4 rounded-lg border-2 ${
              isIncrease 
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            }`}>
              <div className="flex items-center space-x-3">
                {isIncrease ? (
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    isIncrease 
                      ? 'text-orange-800 dark:text-orange-300' 
                      : 'text-green-800 dark:text-green-300'
                  }`}>
                    {isIncrease ? 'Price Increase' : 'Price Decrease'}
                  </p>
                  <p className={`text-lg font-bold ${
                    isIncrease 
                      ? 'text-orange-900 dark:text-orange-200' 
                      : 'text-green-900 dark:text-green-200'
                  }`}>
                    {isIncrease ? '+' : '-'}₹{Math.abs(priceDifference).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Shipping Alert */}
          {isShippingPending && (
            <div className="p-4 rounded-lg border-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Shipping Price Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Manual shipping price entry will be required after confirming changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Updated Products List */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Updated Order Items</h3>
            </div>
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.product_name}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{product.product_name}</h4>
                      {product.variant_name && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Variant: {product.variant_name}</p>
                      )}
                      {product.size && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Size: {product.size}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Qty: </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{product.quantity}</span>
                          <span className="text-gray-600 dark:text-gray-400 mx-1">×</span>
                          <span className="font-semibold text-gray-900 dark:text-white">₹{parseFloat(product.price).toFixed(2)}</span>
                        </div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          ₹{parseFloat(product.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Comparison */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                Price Comparison
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <div className="flex items-center space-x-3">
                  <span className="line-through text-gray-400">₹{parseFloat(oldPrice).toFixed(2)}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{parseFloat(newPrice).toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  Shipping:
                </span>
                <div className="flex items-center space-x-3">
                  <span className="line-through text-gray-400">
                    {oldShippingPrice === 'Pending' ? 'Pending' : oldShippingPrice === 0 ? 'Free' : `₹${parseFloat(oldShippingPrice).toFixed(2)}`}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {getShippingDisplay()}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                  <div className="flex items-center space-x-3">
                    <span className="line-through text-gray-400 text-base">
                      {oldTotalPrice === 'Pending' ? 'Pending' : `₹${parseFloat(oldTotalPrice).toFixed(2)}`}
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {newTotalPrice === 'Pending' ? 'Pending' : `₹${parseFloat(newTotalPrice).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Actions - Only show if shipping is NOT pending */}
          {!isShippingPending && (
            <div className="flex flex-wrap gap-3">
              {showReuse && (
                <button
                  onClick={() => onEditShipping('reuse', oldShippingPrice)}
                  className="flex-1 min-w-[150px] px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Reuse Old Shipping (₹{oldShippingPrice === 0 ? '0' : parseFloat(oldShippingPrice).toFixed(2)})
                </button>
              )}
              <button
                onClick={() => onEditShipping('free')}
                className="flex-1 min-w-[150px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Free Shipping
              </button>
              <button
                onClick={() => onEditShipping('edit')}
                className="flex-1 min-w-[150px] px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Edit Shipping Price
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;