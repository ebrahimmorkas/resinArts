import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

function BulkDeleteConfirmationModal({ isOpen, onClose, onConfirm, orderCount }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Deletion</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete <strong>{orderCount}</strong> selected order(s)? This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteConfirmationModal;