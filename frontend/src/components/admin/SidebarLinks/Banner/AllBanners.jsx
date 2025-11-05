import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { BannerContext } from '../../../../../Context/BannerContext';
import { 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  Download,
  ArrowLeft
} from 'lucide-react';

const AllBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState(null);
  const [error, setError] = useState(null);
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  
  // Default Update Modal States
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [bannerToUpdateDefault, setBannerToUpdateDefault] = useState(null);
  const [newDefaultStatus, setNewDefaultStatus] = useState(false);
  
  // Error Modal States
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  
  // Get context to refresh banner display after operations
  const { fetchBanners: refreshDisplayBanners } = useContext(BannerContext);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const isActive = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= now && end >= now;
  };

  const getStatusBadge = (startDate, endDate) => {
    if (isExpired(endDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
          Expired
        </span>
      );
    } else if (isActive(startDate, endDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          Live
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
          Scheduled
        </span>
      );
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://api.mouldmarket.in/api/banner/fetch-banners', {
        withCredentials: true
      });
      setBanners(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  const filteredData = useMemo(() => {
    return banners.filter(banner =>
      formatDate(banner.startDate).toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(banner.endDate).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isExpired(banner.endDate) ? 'expired' : 
       isActive(banner.startDate, banner.endDate) ? 'live' : 'scheduled').includes(searchTerm.toLowerCase()) ||
      (banner.isDefault ? 'default' : 'non-default').includes(searchTerm.toLowerCase())
    );
  }, [banners, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Handle default checkbox click
  const handleDefaultCheckboxClick = (banner) => {
    setBannerToUpdateDefault(banner);
    setNewDefaultStatus(!banner.isDefault);
    setShowDefaultModal(true);
  };

  // Confirm default status update
  const confirmDefaultUpdate = async () => {
    if (!bannerToUpdateDefault) return;
    
    setUpdatingDefaultId(bannerToUpdateDefault._id);
    setShowDefaultModal(false);
    
    try {
      await axios.put(`https://api.mouldmarket.in/api/banner/update-default/${bannerToUpdateDefault._id}`, {
        isDefault: newDefaultStatus
      }, {
        withCredentials: true
      });
      
      setError(null);
      
      // Refresh the banner list
      await fetchBanners();
      
      // Also refresh the context banners for display
      if (refreshDisplayBanners) {
        refreshDisplayBanners();
      }
      
    } catch (err) {
      if (err.response?.data?.error === 'LAST_DEFAULT_BANNER') {
        setErrorModalMessage('Cannot remove default status. At least one default banner must exist to ensure banners are always available when others expire.');
        setShowErrorModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to update banner default status');
      }
      console.error('Update default error:', err);
    } finally {
      setUpdatingDefaultId(null);
      setBannerToUpdateDefault(null);
    }
  };

  // Close default modal
  const closeDefaultModal = () => {
    setBannerToUpdateDefault(null);
    setShowDefaultModal(false);
  };

  // Handle delete button click
  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setBannerToDelete(null);
    setShowDeleteModal(false);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    
    setDeletingId(bannerToDelete._id);
    setShowDeleteModal(false);
    
    try {
      await axios.delete(`https://api.mouldmarket.in/api/banner/delete/${bannerToDelete._id}`, {
        withCredentials: true
      });
      
      setError(null);
      
      // Refresh the banner list
      await fetchBanners();
      
      // Also refresh the context banners for display
      if (refreshDisplayBanners) {
        refreshDisplayBanners();
      }
      
    } catch (err) {
      if (err.response?.data?.error === 'LAST_DEFAULT_BANNER_DELETE') {
        setErrorModalMessage('Cannot delete this banner because it is the only default banner. At least one default banner must exist to ensure banners are always available when others expire.');
        setShowErrorModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to delete banner');
      }
      console.error('Delete banner error:', err);
    } finally {
      setDeletingId(null);
      setBannerToDelete(null);
    }
  };

  if (loading && !deletingId && !updatingDefaultId) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button className="dark:text-white inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">Banner Management</h2>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-blue-600 font-medium text-lg">Loading banners...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors dark:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">Banner Management</h2>
        </div>
      </div>
      
      {/* Professional Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Banners</h3>
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
                  placeholder="Search banners, dates, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-300 rounded-md flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Table Container with Horizontal Scroll and Sticky Header */}
        <div className="overflow-hidden border-t border-gray-200 dark:border-gray-700">
          {banners.length === 0 && !loading ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-500 mb-2">No banners found</p>
              <p className="text-gray-400">Add your first banner to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '80px' }}>
                      Sr No.
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '160px' }}>
                      Image
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '140px' }}>
                      Start Date
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '140px' }}>
                      End Date
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Status
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '100px' }}>
                      Default
                    </th>
                    <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {currentData.map((banner, index) => (
                    <tr key={banner._id} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:hover:bg-gray-700">
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '160px' }}>
                        <div className="flex justify-center">
                          <img
                            src={banner.image}
                            alt="Banner"
                            className="w-24 h-16 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '140px' }}>
                        {formatDate(banner.startDate)}
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '140px' }}>
                        {formatDate(banner.endDate)}
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                        {getStatusBadge(banner.startDate, banner.endDate)}
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '100px' }}>
                        <div className="flex items-center justify-center">
                          {updatingDefaultId === banner._id ? (
                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <input
                              type="checkbox"
                              checked={banner.isDefault}
                              onChange={() => handleDefaultCheckboxClick(banner)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          )}
                        </div>
                      </td>
                      <td className="dark:text-gray-400 px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openDeleteModal(banner)}
                            disabled={deletingId === banner._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deletingId === banner._id ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <Trash2 className="w-4 h-4 dark:text-white" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Table Footer with Pagination */}
        {banners.length > 0 && (
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
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
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
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Default Status Update Confirmation Modal */}
      {showDefaultModal && bannerToUpdateDefault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Update Default Status</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Change banner default setting</p>
                </div>
              </div>
              
              <div className="mb-4">
                <img
                  src={bannerToUpdateDefault.image}
                  alt="Banner to update"
                  className="w-full h-32 object-cover rounded-md shadow-sm"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span className="font-medium">Period:</span> {formatDate(bannerToUpdateDefault.startDate)} - {formatDate(bannerToUpdateDefault.endDate)}
                </p>
              </div>
              
              <p className="text-gray-700 mb-6">
                {newDefaultStatus 
                  ? "Do you want to make this banner a default banner? Default banners are shown when no other banners are active."
                  : "Do you want to remove this banner from default banners? Default banners are shown when no other banners are active."
                }
              </p>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={closeDefaultModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDefaultUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && bannerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Banner</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-4">
                <img
                  src={bannerToDelete.image}
                  alt="Banner to delete"
                  className="w-full h-32 object-cover rounded-md shadow-sm"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span className="font-medium">Period:</span> {formatDate(bannerToDelete.startDate)} - {formatDate(bannerToDelete.endDate)}
                </p>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this banner? This will permanently remove it from your website and cannot be undone.
              </p>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal (for last default banner restrictions) */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Action Not Allowed</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Default banner requirement</p>
                </div>
              </div>
              
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-yellow-800">{errorModalMessage}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <p className="mb-2"><strong>Why is this required?</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Default banners ensure your website always has banners to display</li>
                  <li>When all scheduled banners expire, default banners are shown</li>
                  <li>This prevents your website from having no banners at all</li>
                </ul>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Loading Overlay for Operations */}
      {(deletingId || updatingDefaultId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-700 font-semibold">
                {deletingId ? 'Deleting Banner' : 'Updating Banner'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBanners;