import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

function BulkResultModal({ isOpen, onClose, results, operation }) {
  if (!isOpen) return null;

  const getSuccessKey = () => {
    switch (operation) {
      case 'accept': return 'accepted';
      case 'reject': return 'rejected';
      case 'confirm': return 'confirmed';
      case 'dispatch': return 'dispatched';
      case 'complete': return 'completed';
      case 'updateShipping': return 'updated';
      default: return 'success';
    }
  };

  const successKey = getSuccessKey();
  const successCount = results[successKey]?.length || 0;
  const hasIssues = 
    (results.insufficientStock?.length > 0) ||
    (results.invalidStatus?.length > 0) ||
    (results.shippingPending?.length > 0) ||
    (results.sufficientStock?.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`border-b px-6 py-4 flex justify-between items-center ${
          successCount > 0 && !hasIssues
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
        }`}>
          <div className="flex items-center space-x-3">
            {successCount > 0 && !hasIssues ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {successCount > 0 && !hasIssues ? 'Operation Successful' : 'Operation Completed with Issues'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {successCount} order(s) processed successfully
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Success Section */}
          {successCount > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-900 dark:text-green-300">
                  Successfully Processed ({successCount})
                </h3>
              </div>
              <div className="space-y-1">
                {results[successKey]?.map((item, index) => (
                  <div key={index} className="text-sm text-green-800 dark:text-green-300">
                    Order #{item.orderNumber}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insufficient Stock Section */}
          {results.insufficientStock?.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-red-900 dark:text-red-300">
                  Insufficient Stock ({results.insufficientStock.length})
                </h3>
              </div>
              <div className="space-y-1">
                {results.insufficientStock.map((item, index) => (
                  <div key={index} className="text-sm text-red-800 dark:text-red-300">
                    Order #{item.orderNumber} - {item.userName}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                These orders could not be processed due to insufficient stock.
              </p>
            </div>
          )}

          {/* Invalid Status Section */}
          {results.invalidStatus?.length > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                  Invalid Status ({results.invalidStatus.length})
                </h3>
              </div>
              <div className="space-y-1">
                {results.invalidStatus.map((item, index) => (
                  <div key={index} className="text-sm text-orange-800 dark:text-orange-300">
                    Order #{item.orderId.toString().substring(0, 8)} - Current Status: {item.currentStatus}
                    <div className="text-xs text-orange-700 dark:text-orange-400">{item.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Pending Section */}
          {results.shippingPending?.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                  Shipping Price Pending ({results.shippingPending.length})
                </h3>
              </div>
              <div className="space-y-1">
                {results.shippingPending.map((item, index) => (
                  <div key={index} className="text-sm text-blue-800 dark:text-blue-300">
                    Order #{item.orderNumber} - {item.userName}
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                These orders require manual shipping price entry. Please update shipping price individually.
              </p>
            </div>
          )}

          {/* Sufficient Stock (for reject operation) Section */}
          {results.sufficientStock?.length > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-300">
                  Requires Confirmation ({results.sufficientStock.length})
                </h3>
              </div>
              <div className="space-y-1">
                {results.sufficientStock.map((item, index) => (
                  <div key={index} className="text-sm text-purple-800 dark:text-purple-300">
                    Order #{item.orderNumber} - {item.userName} (Status: {item.status})
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-2">
                These orders have sufficient stock. Please confirm which ones to reject.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkResultModal;