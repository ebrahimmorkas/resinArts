import React, { useState } from 'react';
import axios from 'axios';

const AddAnnouncement = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    text: '',
    startDate: '',
    endDate: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingDefault, setExistingDefault] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await axios.post('https://resinarts.onrender.com/api/announcement/add', formData);
      setSuccess('Announcement added successfully');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.status === 409 && formData.isDefault) {
        // Default announcement already exists
        setExistingDefault(err.response.data.existingDefault);
        setShowModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to add announcement');
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
      await axios.post('https://resinarts.onrender.com/api/announcement/add-with-override', formData);
      setSuccess('Announcement added successfully and set as default');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutDefault = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const dataWithoutDefault = { ...formData, isDefault: false };
      await axios.post('https://resinarts.onrender.com/api/announcement/add', dataWithoutDefault);
      setSuccess('Announcement added successfully (not as default)');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add announcement');
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
    setError('Operation cancelled by user');
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Add Announcement</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Text</label>
          <textarea 
            name="text" 
            value={formData.text} 
            onChange={handleChange} 
            required 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange} 
            required 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input 
            type="date" 
            name="endDate" 
            value={formData.endDate} 
            onChange={handleChange} 
            required 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            name="isDefault" 
            checked={formData.isDefault} 
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium">Set as Default</label>
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            'Add Announcement'
          )}
        </button>
      </form>

      {/* Modal for default announcement conflict */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Default Announcement Already Exists</h3>
            <p className="mb-2 text-gray-700">
              A default announcement already exists:
            </p>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="text-sm font-medium">"{existingDefault?.text}"</p>
            </div>
            <p className="mb-6 text-gray-700">Do you want to override it and make this new announcement the default?</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleOverrideDefault}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Yes, Override'}
              </button>
              <button 
                onClick={handleCancelOverride}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                disabled={loading}
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for continuing without default */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-blue-600">Continue Without Default?</h3>
            <p className="mb-6 text-gray-700">
              Do you want to continue adding this announcement without making it the default?
            </p>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleContinueWithoutDefault}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Yes, Continue'}
              </button>
              <button 
                onClick={handleFinalCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAnnouncement;