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
      setError('Failed to add announcement');
      console.error(err);
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
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </form>
    </div>
  );
};

export default AddAnnouncement;