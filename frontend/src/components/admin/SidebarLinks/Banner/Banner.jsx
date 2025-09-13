import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [formData, setFormData] = useState({
    image: null,
    startDate: '',
    endDate: '',
    isDefault: false,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://resinarts.onrender.com/api/banner/fetch-banners');
      setBanners(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    const data = new FormData();
    if (formData.image) data.append('image', formData.image);
    data.append('startDate', formData.startDate);
    data.append('endDate', formData.endDate);
    data.append('isDefault', formData.isDefault);
    data.append('isActive', formData.isActive);

    try {
      await axios.post('https://resinarts.onrender.com/api/banner/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setError(null);
      fetchBanners();
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setLoading(true);
    try {
      await axios.delete(`https://resinarts.onrender.com/api/banner/delete/${id}`);
      setError(null);
      fetchBanners();
    } catch (err) {
      setError('Failed to delete banner');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add New Banner</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            required
            className="border p-2 w-full"
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
            className="border p-2 w-full"
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
            className="border p-2 w-full"
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
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium">Active</label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Banner'}
        </button>
      </form>

      <h2 className="text-2xl font-bold mb-4">All Banners</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Image</th>
              <th className="py-2 px-4 border-b">Start Date</th>
              <th className="py-2 px-4 border-b">End Date</th>
              <th className="py-2 px-4 border-b">Default</th>
              <th className="py-2 px-4 border-b">Active</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner._id}>
                <td className="py-2 px-4 border-b">
                  <img
                    src={banner.image}
                    alt="Banner"
                    className="w-24 h-auto"
                  />
                </td>
                <td className="py-2 px-4 border-b">{new Date(banner.startDate).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">{new Date(banner.endDate).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">{banner.isDefault ? 'Yes' : 'No'}</td>
                <td className="py-2 px-4 border-b">{banner.isActive ? 'Yes' : 'No'}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="bg-red-600 text-white py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Banner;