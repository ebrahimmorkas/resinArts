import React from 'react';
import { X, Table } from 'lucide-react';

const ViewPriceChartModal = ({ isOpen, onClose, product }) => {
  if (!isOpen) return null;

  const staticDimensions = product?.staticDimensions || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Table className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Price Chart
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {staticDimensions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                      Dimensions
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staticDimensions.map((dim, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {dim.length} × {dim.breadth}
                        {dim.height && ` × ${dim.height}`} cm
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                        ₹{dim.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {dim.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No price chart available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPriceChartModal;