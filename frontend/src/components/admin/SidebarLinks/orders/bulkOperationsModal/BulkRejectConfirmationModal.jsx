import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

function BulkRejectConfirmationModal({ isOpen, onClose, onConfirm, ordersToConfirm }) {
  const [expandedStatuses, setExpandedStatuses] = useState({
    Pending: true,
    Accepted: true,
    Confirm: true
  });
  const [selectedOrders, setSelectedOrders] = useState(
    ordersToConfirm.reduce((acc, order) => {
      acc[order.orderId] = true;
      return acc;
    }, {})
  );

  if (!isOpen) return null;

  // Group orders by status
  const groupedOrders = ordersToConfirm.reduce((acc, order) => {
    if (!acc[order.status]) {
      acc[order.status] = [];
    }
    acc[order.status].push(order);
    return acc;
  }, {});

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const toggleOrder = (orderId) => {
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleAll = () => {
    const allSelected = Object.keys(selectedOrders).every(id => selectedOrders[id]);
    const newSelection = {};
    ordersToConfirm.forEach(order => {
      newSelection[order.orderId] = !allSelected;
    });
    setSelectedOrders(newSelection);
  };

  const handleConfirm = () => {
    const selectedOrderIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
    onConfirm(selectedOrderIds);
  };

  const allSelected = Object.keys(selectedOrders).every(id => selectedOrders[id]);
  const selectedCount = Object.values(selectedOrders).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Rejection</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select orders to reject ({selectedCount} selected)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Unselect the orders you don't want to reject. All selected orders will be rejected when you click "Reject".
            </p>
          </div>

          {/* Select All Checkbox */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
          </div>

          {/* Orders grouped by status */}
          <div className="space-y-3">
            {Object.keys(groupedOrders).map((status) => (
              <div key={status} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Status Header */}
                <button
                  onClick={() => toggleStatus(status)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {status} ({groupedOrders[status].length})
                  </span>
                  {expandedStatuses[status] ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {/* Orders List */}
                {expandedStatuses[status] && (
                  <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
                    {groupedOrders[status].map((order) => (
                      <label
                        key={order.orderId}
                        className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders[order.orderId] || false}
                          onChange={() => toggleOrder(order.orderId)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.userName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              #{order.orderNumber}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {order.email}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-red-600 text-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkRejectConfirmationModal;