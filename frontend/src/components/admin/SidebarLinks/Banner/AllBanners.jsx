import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BannerContext } from '../../../../../Context/BannerContext';

const AllBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  
  // Get context to refresh banner display after operations
  const { fetchBanners: refreshDisplayBanners } = useContext(BannerContext);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/banner/fetch-banners', {
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

  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setBannerToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    
    setDeletingId(bannerToDelete._id);
    setShowDeleteModal(false);
    
    try {
      await axios.delete(`http://localhost:3000/api/banner/delete/${bannerToDelete._id}`, {
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
      setError(err.response?.data?.message || 'Failed to delete banner');
      console.error('Delete banner error:', err);
    } finally {
      setDeletingId(null);
      setBannerToDelete(null);
    }
  };

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

  if (loading && !deletingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">All Banners</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-indigo-600 font-medium text-lg">Loading banners...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">All Banners</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {banners.length === 0 && !loading ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl text-gray-500 mb-2">No banners found</p>
          <p className="text-gray-400">Add your first banner to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-lg">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Image</th>
                <th className="py-3 px-4 text-left">Start Date</th>
                <th className="py-3 px-4 text-left">End Date</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Default</th>
                {/* Removed Active column completely */}
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr 
                  key={banner._id} 
                  className={`hover:bg-indigo-50 transition duration-200 ${
                    isExpired(banner.endDate) ? 'bg-red-50' : 
                    isActive(banner.startDate, banner.endDate) ? 'bg-green-50' : 'bg-yellow-50'
                  }`}
                >
                  <td className="py-3 px-4 border-b">
                    <img
                      src={banner.image}
                      alt="Banner"
                      className="w-24 h-16 object-cover rounded-lg shadow-md"
                    />
                  </td>
                  <td className="py-3 px-4 border-b">{formatDate(banner.startDate)}</td>
                  <td className="py-3 px-4 border-b">{formatDate(banner.endDate)}</td>
                  <td className="py-3 px-4 border-b">
                    {isExpired(banner.endDate) ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                        Expired
                      </span>
                    ) : isActive(banner.startDate, banner.endDate) ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        Scheduled
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {banner.isDefault ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  {/* Removed Active column data */}
                  <td className="py-3 px-4 border-b">
                    <button
                      onClick={() => openDeleteModal(banner)}
                      disabled={deletingId === banner._id}
                      className="bg-red-600 text-white py-1.5 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition duration-200 flex items-center space-x-2 min-w-[100px]"
                    >
                      {deletingId === banner._id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-sm">Delete</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Banner</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              {bannerToDelete && (
                <div className="mb-4">
                  <img
                    src={bannerToDelete.image}
                    alt="Banner to delete"
                    className="w-full h-32 object-cover rounded-md shadow-sm"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Period:</span> {formatDate(bannerToDelete.startDate)} - {formatDate(bannerToDelete.endDate)}
                  </p>
                </div>
              )}
              
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
                  Delete Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Loading Overlay for Deleting */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-red-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-700 font-semibold">Deleting Banner</p>
              <p className="text-sm text-gray-500 mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBanners;