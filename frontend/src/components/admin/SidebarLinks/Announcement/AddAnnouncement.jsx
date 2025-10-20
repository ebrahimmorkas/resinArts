import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddAnnouncement = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    text: '',
    startDate: '',
    endDate: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingDefault, setExistingDefault] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else if (type === 'info') {
      toast.info(message, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('https://api.simplyrks.cloud/api/announcement/add', formData);
      showToast('Announcement added successfully! 🎉');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.status === 409 && formData.isDefault) {
        setExistingDefault(err.response.data.existingDefault);
        setShowModal(true);
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to add announcement');
        setShowErrorModal(true);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideDefault = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await axios.post('https://api.simplyrks.cloud/api/announcement/add-with-override', formData);
      showToast('Announcement added and set as default! ✅');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add announcement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutDefault = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const dataWithoutDefault = { ...formData, isDefault: false };
      await axios.post('https://api.simplyrks.cloud/api/announcement/add', dataWithoutDefault);
      showToast('Announcement added successfully! 📢');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add announcement');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOverride = () => {
    setShowModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalCancel = () => {
    setShowConfirmModal(false);
    showToast('Operation cancelled', 'info');
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Create Announcement
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Share important updates with your customers
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="space-y-6">
                {/* Announcement Text */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-white">
                    Announcement Message
                    <span className="text-red-500 ml-1 dark:text-white">*</span>
                  </label>
                  <div className="relative dark:text-gray-400">
                    <textarea 
                      name="text" 
                      value={formData.text} 
                      onChange={handleChange} 
                      required 
                      placeholder="Enter your announcement message..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none text-sm sm:text-base"
                      rows="4"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {formData.text.length} characters
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400">
                      Start Date
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="startDate" 
                        value={formData.startDate} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base" 
                      />
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400">
                      End Date
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="endDate" 
                        value={formData.endDate} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base" 
                      />
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Default Checkbox */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 dark:bg-gray-400">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center h-5">
                      <input 
                        type="checkbox" 
                        name="isDefault" 
                        checked={formData.isDefault} 
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900 cursor-pointer">
                        Set as Default Announcement
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 dark:text-black">
                        This announcement will be displayed as the primary notification
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Announcement...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Announcement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Error Occurred</h3>
                  </div>
                  <button 
                    onClick={closeErrorModal}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                </div>
                <button 
                  onClick={closeErrorModal}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for default announcement conflict */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Default Announcement Exists</h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">A default announcement already exists:</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
                  <p className="-800 dark:text-gray-100 font-medium">"{existingDefault?.text}"</p>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Do you want to override it and make this new announcement the default?
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleOverrideDefault}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Yes, Override'}
                  </button>
                  <button 
                    onClick={handleCancelOverride}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for continuing without default */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Continue Without Default?</h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Do you want to continue adding this announcement without making it the default?
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleContinueWithoutDefault}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Yes, Continue'}
                  </button>
                  <button 
                    onClick={handleFinalCancel}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimal Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Processing your request...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddAnnouncement;