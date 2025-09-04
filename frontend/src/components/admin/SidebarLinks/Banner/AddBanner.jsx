import React, { useState } from 'react';
import axios from 'axios';

const AddBanner = () => {
  const [formData, setFormData] = useState({
    image: null,
    startDate: '',
    endDate: '',
    isDefault: false,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
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
    data.append('isActive', formData.isActive);

    try {
      await axios.post('http://localhost:3000/api/banner/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Banner added successfully!');
      setFormData({
        image: null,
        startDate: '',
        endDate: '',
        isDefault: false,
        isActive: true,
      });
    } catch (err) {
      setError('Failed to add banner');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Add New Banner</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            accept="image/*"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label className="text-sm font-medium">Set as Default</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label className="text-sm font-medium">Active</label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition duration-200"
        >
          {loading ? 'Adding...' : 'Add Banner'}
        </button>
      </form>
    </div>
  );
};

export default AddBanner;