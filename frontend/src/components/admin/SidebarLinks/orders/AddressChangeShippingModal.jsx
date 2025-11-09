import React, { useState, useEffect } from 'react';
import { X, DollarSign, RotateCcw } from 'lucide-react';

const AddressChangeShippingModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentShippingPrice, 
  newAddress 
}) => {
  const [shippingPrice, setShippingPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShippingPrice('');
      setError('');
    }
  }, [isOpen]);

  const handleUpdate = async () => {
    const price = parseFloat(shippingPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid shipping price (0 or greater)');
      return;
    }

    setIsLoading(true);
    await onConfirm(price);
    setIsLoading(false);
  };

  const handleReuse = async () => {
    setIsLoading(true);
    await onConfirm(currentShippingPrice);
    setIsLoading(false);
  };

  const handleFree = async () => {
    setIsLoading(true);
    await onConfirm(0);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-b border-orange-200 dark:border-orange-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Location Not Found</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Location Not Found:</strong> The selected address location is not configured in your shipping price settings. Please choose an option below.
            </p>
          </div>

          {/* New Address Display */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">New Address:</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {newAddress.name} - {newAddress.full_address}, {newAddress.city}, {newAddress.state} - {newAddress.pincode}
            </p>
          </div>

          {/* Current Shipping Price Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Current Shipping Price:</strong> ₹{currentShippingPrice.toFixed(2)}
            </p>
          </div>

          {/* Input Field */}
          <div className="mb-4">
            <label htmlFor="newShippingPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Shipping Price (₹)
            </label>
            <input
              type="number"
              id="newShippingPrice"
              value={shippingPrice}
              onChange={(e) => {
                setShippingPrice(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
              placeholder="Enter new shipping price"
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReuse}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Reuse current shipping price of ₹${currentShippingPrice}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reuse (₹{currentShippingPrice})
                </>
              )}
            </button>

            <button
              onClick={handleFree}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Make shipping free for this order"
            >
              {isLoading ? 'Processing...' : 'Free'}
            </button>

            <button
              onClick={handleUpdate}
              disabled={isLoading || !shippingPrice || parseFloat(shippingPrice) < 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Update with new shipping price"
            >
              {isLoading ? 'Processing...' : 'Update'}
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel (Revert Address)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressChangeShippingModal;