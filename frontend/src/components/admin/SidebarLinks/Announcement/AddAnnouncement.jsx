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
      await axios.post('http://localhost:3000/api/announcement/add', formData);
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
    setLoading(true);
    try {
      // Force add with override (you'll need to add this endpoint)
      await axios.post('http://localhost:3000/api/announcement/add-with-override', formData);
      setSuccess('Announcement added successfully and set as default');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      setShowModal(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutDefault = async () => {
    setLoading(true);
    try {
      const dataWithoutDefault = { ...formData, isDefault: false };
      await axios.post('http://localhost:3000/api/announcement/add', dataWithoutDefault);
      setSuccess('Announcement added successfully (not as default)');
      setFormData({ text: '', startDate: '', endDate: '', isDefault: false });
      setShowModal(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Add Announcement</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Text</label>
          <textarea name="text" value={formData.text} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block">Start Date</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block">End Date</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
          <label className="ml-2">Set as Default</label>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Modal for default announcement conflict */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Default Announcement Already Exists</h3>
            <p className="mb-4">
              A default announcement already exists: "{existingDefault?.text}"
            </p>
            <p className="mb-6">Do you want to override it and make this new announcement the default?</p>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleOverrideDefault}
                className="bg-red-500 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                Yes, Override
              </button>
              <button 
                onClick={() => {
                  // Show second modal asking about continuing without default
                  if (confirm('Do you want to continue adding this announcement without making it default?')) {
                    handleContinueWithoutDefault();
                  } else {
                    setShowModal(false);
                  }
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAnnouncement;