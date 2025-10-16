import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, Package, CheckCircle } from 'lucide-react';

const OverrideProductsModal = ({ isOpen, onClose, products, onOverride, isProcessing }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  if (!isOpen) return null;

  const handleCheckboxChange = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.productId));
    }
  };

  const handleOverride = () => {
    onOverride(selectedProducts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Products Already Exist
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select products to override with new data
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  disabled={isProcessing}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                Select All ({products.length} products)
              </span>
            </label>
          </div>

          {/* Product List */}
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.productId}
                className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedProducts.includes(product.productId)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.productId)}
                    onChange={() => handleCheckboxChange(product.productId)}
                    disabled={isProcessing}
                    className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                </div>

                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {product.categoryPath || 'No category'}
                  </p>
                  {product.hasVariants && (
                    <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded-full">
                      {product.variantsCount} variant{product.variantsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                  <RefreshCw className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Overriding Products...
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we update the products
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedProducts.length}
              </span> of {products.length} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={selectedProducts.length === 0 || isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Override Selected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverrideProductsModal;