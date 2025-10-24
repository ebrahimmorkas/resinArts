import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

function BulkShippingPriceModal({ isOpen, onClose, onConfirm, orderCount }) {
  const [shippingPrice, setShippingPrice] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const price = parseFloat(shippingPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid shipping price (0 or greater)');
      return;
    }

    onConfirm(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Update Shipping Price</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter shipping price to update for <strong>{orderCount}</strong> selected order(s).
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="shippingPrice" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Shipping Price (₹)
            </label>
            <input
              type="number"
              id="shippingPrice"
              value={shippingPrice}
              onChange={(e) => {
                setShippingPrice(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter shipping price"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Shipping Price
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkShippingPriceModal;