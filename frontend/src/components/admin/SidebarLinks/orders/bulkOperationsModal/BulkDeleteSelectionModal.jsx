import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

function BulkDeleteSelectionModal({ isOpen, onClose, onConfirm, ordersByStatus }) {
  const [expandedStatuses, setExpandedStatuses] = useState({});
  const [selectedOrders, setSelectedOrders] = useState({});

  // Reset state when modal opens or ordersByStatus changes
  React.useEffect(() => {
    if (isOpen && Object.keys(ordersByStatus).length > 0) {
      // Initialize expanded statuses
      const initialExpanded = Object.keys(ordersByStatus).reduce((acc, status) => {
        acc[status] = true;
        return acc;
      }, {});
      setExpandedStatuses(initialExpanded);

      // Initialize selected orders (all checked by default)
      const initialSelection = Object.values(ordersByStatus)
        .flat()
        .reduce((acc, order) => {
          acc[order.orderId] = true;
          return acc;
        }, {});
      setSelectedOrders(initialSelection);
    }
  }, [isOpen, ordersByStatus]);

  if (!isOpen) return null;

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
  const allOrders = Object.values(ordersByStatus).flat();
  const allSelected = allOrders.every(order => selectedOrders[order.orderId]);
  const newSelection = {};
  allOrders.forEach(order => {
    newSelection[order.orderId] = !allSelected;
  });
  setSelectedOrders(newSelection);
};

  const handleConfirm = () => {
    const selectedOrderIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
    onConfirm(selectedOrderIds);
  };

  const allOrders = Object.values(ordersByStatus).flat();
const allSelected = allOrders.every(order => selectedOrders[order.orderId]);
  const selectedCount = Object.values(selectedOrders).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Orders to Delete</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCount} order(s) selected
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Warning:</strong> Your selected orders contain orders with different statuses. Deselect the ones you don't want to delete.
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
            {Object.keys(ordersByStatus).map((status) => (
              <div key={status} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Status Header */}
<div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800">
  <div className="flex items-center space-x-3 flex-1">
    <input
      type="checkbox"
      checked={ordersByStatus[status].every(order => selectedOrders[order.orderId])}
      onChange={(e) => {
        e.stopPropagation();
        const newSelection = { ...selectedOrders };
        ordersByStatus[status].forEach(order => {
          newSelection[order.orderId] = e.target.checked;
        });
        setSelectedOrders(newSelection);
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
    />
    <span className="text-sm font-semibold text-gray-900 dark:text-white">
      {status} ({ordersByStatus[status].length})
    </span>
  </div>
  <button
    onClick={() => toggleStatus(status)}
    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
  >
    {expandedStatuses[status] ? (
      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    )}
  </button>
</div>

                {/* Orders List */}
                {expandedStatuses[status] && (
                  <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
                    {ordersByStatus[status].map((order) => (
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
                         <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
  {order.userName}
</div>
<div className="text-xs text-gray-500 dark:text-gray-400 break-all mb-1">
  Order ID: {order.orderId}
</div>
<div className="text-xs text-gray-500 dark:text-gray-400">
  {order.email}
</div>
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
              Delete ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteSelectionModal;