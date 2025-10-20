import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import { BannerContext } from '../../../../../Context/BannerContext';

const AddBanner = () => {
  const [formData, setFormData] = useState({
    image: null,
    startDate: '',
    endDate: '',
    isDefault: false
    // Removed isActive completely
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Get fetchBanners function from context to refresh banners after adding
  const { fetchBanners } = useContext(BannerContext);
  
  // Ref for file input to reset it
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      image: null,
      startDate: '',
      endDate: '',
      isDefault: false
      // Removed isActive
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear any existing messages
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const data = new FormData();
    if (formData.image) data.append('image', formData.image);
    data.append('startDate', formData.startDate);
    data.append('endDate', formData.endDate);
    data.append('isDefault', formData.isDefault);
    // Removed isActive from form data

    try {
      const response = await axios.post('https://api.simplyrks.cloud/api/banner/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      
      // Check if banner was auto-set as default
      const message = response.data.autoSetDefault 
        ? 'Banner added successfully and automatically set as default (first banner)!'
        : 'Banner added successfully!';
      
      setSuccess(message);
      
      // Refresh banners in context to show new banner immediately
      if (fetchBanners) {
        fetchBanners();
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add banner');
      console.error('Banner upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-2xl relative">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Add New Banner</h2>
      
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-600 font-medium text-sm">{success}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-400">
            Image <span className="text-red-500 dark:text-gray-400">*</span>
          </label>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              accept="image/*"
            />
            <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Upload an image file (JPG, PNG, GIF)</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-400">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-400">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            disabled={loading}
            min={formData.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            disabled={loading}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
          />
          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-400">
            Set as Default Banner
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6 dark:text-gray-400">
          Default banners are shown when no active banners are available. First banner is automatically set as default.
        </p>
        
        {/* Removed Active Banner checkbox completely */}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center font-medium"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Banner...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Banner
            </>
          )}
        </button>
      </form>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-80 flex items-center justify-center rounded-xl z-20">
          <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-gray-700 font-semibold mb-2">Uploading Banner</p>
            <p className="text-sm text-gray-500">Please wait while we process your image...</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBanner;