import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/banner/fetch-banners');
      setBanners(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch banners');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3000/api/banner/delete/${id}`);
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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">All Banners</h2>
      {loading && <p className="text-center text-indigo-600">Loading...</p>}
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="overflow-x-auto shadow-2xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Image</th>
              <th className="py-3 px-4 text-left">Start Date</th>
              <th className="py-3 px-4 text-left">End Date</th>
              <th className="py-3 px-4 text-left">Default</th>
              <th className="py-3 px-4 text-left">Active</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner._id} className="hover:bg-indigo-50 transition duration-200">
                <td className="py-3 px-4 border-b">
                  <img
                    src={banner.image}
                    alt="Banner"
                    className="w-24 h-auto rounded-lg shadow-md"
                  />
                </td>
                <td className="py-3 px-4 border-b">{new Date(banner.startDate).toLocaleDateString()}</td>
                <td className="py-3 px-4 border-b">{new Date(banner.endDate).toLocaleDateString()}</td>
                <td className="py-3 px-4 border-b">{banner.isDefault ? 'Yes' : 'No'}</td>
                <td className="py-3 px-4 border-b">{banner.isActive ? 'Yes' : 'No'}</td>
                <td className="py-3 px-4 border-b">
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700 transition duration-200"
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

export default AllBanners;