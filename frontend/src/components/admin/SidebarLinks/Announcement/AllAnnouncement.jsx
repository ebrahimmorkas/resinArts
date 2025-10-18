import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  Download,
  Star,
  StarOff,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0 border rounded-lg shadow-lg ${getToastStyles()} transform transition-all duration-300 ease-in-out`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="rounded-md hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Professional Modal Wrapper
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl ${getSizeClasses()} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', loading = false, preview = null }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-600" />,
          iconBg: 'bg-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          iconBg: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start mb-6">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              {styles.icon}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
                {preview && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm font-medium text-gray-900">"{preview}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-900 text-base font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Modal Component
const ErrorModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title || "Error Occurred"}</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start mb-6">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(null);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [defaultModal, setDefaultModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // New state for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const showErrorModal = (title, message) => {
    setErrorModal({ open: true, title, message });
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/announcement/all');
      setAnnouncements(res.data);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch announcements';
      setError(errorMessage);
      showErrorModal('Fetch Error', errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  const filteredData = useMemo(() => {
    return announcements.filter(item =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(item.startDate).toLocaleDateString().includes(searchTerm.toLowerCase()) ||
      new Date(item.endDate).toLocaleDateString().includes(searchTerm.toLowerCase())
    );
  }, [announcements, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setOperationLoading('delete');
    try {
      await axios.delete(`http://localhost:3000/api/announcement/delete/${selectedAnnouncement._id}`);
      setDeleteModal(false);
      showToast('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete announcement';
      setError(errorMessage);
      showErrorModal('Delete Error', errorMessage);
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditModal(true);
  };

  const handleUpdate = async (updatedData) => {
    setOperationLoading('update');
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, updatedData);
      setEditModal(false);
      showToast('Announcement updated successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update announcement';
      setError(errorMessage);
      showErrorModal('Update Error', errorMessage);
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleSetDefault = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDefaultModal(true);
  };

  const confirmSetDefault = async () => {
    setOperationLoading('default');
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, { 
        ...selectedAnnouncement,
        isDefault: true 
      });
      setDefaultModal(false);
      showToast('Default announcement set successfully', 'success');
      fetchAnnouncements();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to set default';
      setError(errorMessage);
      showErrorModal('Default Setting Error', errorMessage);
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  const getDefaultBadge = (isDefault) => {
    if (isDefault) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Star className="w-3 h-3 mr-1" />
          Default
        </span>
      );
    }
    return (
      <span className="dark:text-black inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 -800 border border-gray-200 dark:border-gray-700">
        <StarOff className="w-3 h-3 mr-1 dark:text-black" />
        Regular
      </span>
    );
  };

  return (
    <div className="p-4 max-w-full">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: '' })} 
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Your Announcements</h3>
              <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="dark:text-white inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button className="dark:text-white inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading announcements...</span>
          </div>
        ) : (
          <>
            {/* Table Container with Horizontal Scroll and Sticky Header */}
            <div className="overflow-hidden border-t border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '80px' }}>
                        Sr No.
                      </th>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '300px' }}>
                        Announcement Text
                      </th>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                        Start Date
                      </th>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                        End Date
                      </th>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                        Type
                      </th>
                      <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '150px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                    {currentData.map((ann, index) => (
                      <tr key={ann._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 transition-colors">
                        <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                          {startIndex + index + 1}
                        </td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-900" style={{ minWidth: '300px' }}>
                          <div className="max-w-xs mx-auto">
                            <div className="truncate" title={ann.text}>
                              {ann.text}
                            </div>
                          </div>
                        </td>
                        <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                          {new Date(ann.startDate).toLocaleDateString()}
                        </td>
                        <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                          {new Date(ann.endDate).toLocaleDateString()}
                        </td>
                        <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                          <div className="flex justify-center">
                            {getDefaultBadge(ann.isDefault)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '150px' }}>
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(ann)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ann)}
                              className="dark:text-white p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {!ann.isDefault && (
                              <button
                                onClick={() => handleSetDefault(ann)}
                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                                title="Set as Default"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No announcements found matching your search.' : 'No announcements found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                {/* Items per page */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-400">Show</span>
                  <select
  value={itemsPerPage}
  onChange={(e) => setItemsPerPage(Number(e.target.value))}
  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
>
  <option value={5}>5</option>
  <option value={10}>10</option>
  <option value={25}>25</option>
  <option value={50}>50</option>
  <option value={100}>100</option>
</select>
                  <span className="text-sm text-gray-700 dark:text-gray-400">entries per page</span>
                </div>

                {/* Pagination */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="dark:text-gray-400 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                      let pageNumber;
                      if (totalPages <= 7) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 4) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNumber = totalPages - 6 + index;
                      } else {
                        pageNumber = currentPage - 3 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="dark:text-gray-400 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={editModal} 
        onClose={() => setEditModal(false)} 
        title="Edit Announcement"
        size="lg"
      >
        <EditForm 
          initialData={selectedAnnouncement} 
          onSubmit={handleUpdate} 
          onCancel={() => setEditModal(false)}
          loading={operationLoading === 'update'}
        />
      </Modal>

      {/* Default Confirmation Modal */}
      <ConfirmationModal
        isOpen={defaultModal}
        onClose={() => setDefaultModal(false)}
        onConfirm={confirmSetDefault}
        title="Set as Default"
        message="Are you sure you want to make this announcement the default? This will override the current default announcement."
        type="warning"
        loading={operationLoading === 'default'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        type="danger"
        loading={operationLoading === 'delete'}
        preview={selectedAnnouncement?.text}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />

      {/* Global loading overlay */}
      {operationLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl flex items-center shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span className="font-medium">
              {operationLoading === 'update' && 'Updating announcement...'}
              {operationLoading === 'delete' && 'Deleting announcement...'}
              {operationLoading === 'default' && 'Setting as default...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const EditForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    startDate: initialData.startDate.slice(0, 10),
    endDate: initialData.endDate.slice(0, 10)
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If making it default, skip date validations
    if (formData.isDefault && !initialData.isDefault) {
      onSubmit(formData);
      return;
    }

    // Date validation for non-default announcements or existing default (text only changes)
    if (!formData.isDefault || initialData.isDefault) {
      // Validate dates only if not currently default (dates can be edited)
      if (!initialData.isDefault) {
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
          setError('Start date must be before end date');
          return;
        }

        // Check for overlapping announcements
        try {
          const response = await axios.get('http://localhost:3000/api/announcement/all');
          const announcements = response.data;
          
          const overlapping = announcements.find(ann => 
            ann._id !== initialData._id && // Exclude current announcement
            !ann.isDefault && // Only check non-default announcements
            (
              // New announcement starts within existing range
              (new Date(ann.startDate) <= new Date(formData.startDate) && new Date(ann.endDate) >= new Date(formData.startDate)) ||
              // New announcement ends within existing range
              (new Date(ann.startDate) <= new Date(formData.endDate) && new Date(ann.endDate) >= new Date(formData.endDate)) ||
              // New announcement completely covers existing range
              (new Date(formData.startDate) <= new Date(ann.startDate) && new Date(formData.endDate) >= new Date(ann.endDate))
            )
          );

          if (overlapping) {
            setError(`Announcement dates overlap with existing announcement: "${overlapping.text}"`);
            return;
          }
        } catch (err) {
          setError('Error checking for overlapping announcements');
          return;
        }
      }
    }

    onSubmit(formData);
  };

  const isDefault = initialData.isDefault;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Text Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Announcement Text
          </label>
          <textarea 
            name="text" 
            value={formData.text} 
            onChange={handleChange} 
            required 
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Enter your announcement text..."
          />
        </div>

        {/* Date Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input 
              type="date" 
              name="startDate" 
              value={formData.startDate} 
              onChange={handleChange} 
              required 
              disabled={isDefault}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isDefault ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed text-gray-500' : ''
              }`}
            />
            {isDefault && (
              <p className="text-xs text-gray-500 mt-1">
                Start date cannot be edited for default announcements
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input 
              type="date" 
              name="endDate" 
              value={formData.endDate} 
              onChange={handleChange} 
              required 
              disabled={isDefault}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isDefault ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed text-gray-500' : ''
              }`}
            />
            {isDefault && (
              <p className="text-xs text-gray-500 mt-1">
                End date cannot be edited for default announcements
              </p>
            )}
          </div>
        </div>

        {/* Default Checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input 
              type="checkbox" 
              name="isDefault" 
              checked={formData.isDefault} 
              onChange={handleChange}
              disabled={isDefault}
              className={`w-4 h-4 text-blue-600 bg-white dark:bg-gray-900 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                isDefault ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            />
          </div>
          <div className="ml-3 text-sm">
            <label className={`font-medium ${isDefault ? 'text-gray-500' : 'text-gray-700'}`}>
              Set as Default Announcement
            </label>
            <p className="text-gray-500">
              {isDefault 
                ? 'This announcement is currently the default and cannot be unmarked.' 
                : 'Default announcements are shown when no other announcement is active.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating...
            </>
          ) : (
            'Update Announcement'
          )}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={loading}
          className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AllAnnouncements;