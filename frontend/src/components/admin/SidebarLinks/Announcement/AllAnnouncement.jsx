import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddAnnouncement from './AddAnnouncement';

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [defaultModal, setDefaultModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/announcement/all');
      setAnnouncements(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch announcements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/announcement/delete/${id}`);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement');
      console.error(err);
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditModal(true);
  };

  const handleUpdate = async (updatedData) => {
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, updatedData);
      setEditModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to update announcement');
      console.error(err);
    }
  };

  const handleSetDefault = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDefaultModal(true);
  };

  const confirmSetDefault = async () => {
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, { isDefault: true });
      setDefaultModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to set default');
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <AddAnnouncement onSuccess={fetchAnnouncements} />
      <h2 className="text-xl font-bold mb-4">All Announcements</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Text</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((ann, index) => (
            <tr key={ann._id}>
              <td>{index + 1}</td>
              <td>{ann.text}</td>
              <td>{new Date(ann.startDate).toLocaleDateString()}</td>
              <td>{new Date(ann.endDate).toLocaleDateString()}</td>
              <td>
                <input
                  type="checkbox"
                  checked={ann.isDefault}
                  disabled={ann.isDefault}
                  onChange={() => handleSetDefault(ann)}
                />
              </td>
              <td>
                <button onClick={() => handleEdit(ann)}>✏️</button>
                <button onClick={() => handleDelete(ann._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold mb-2">Edit Announcement</h3>
            <EditForm initialData={selectedAnnouncement} onSubmit={handleUpdate} onCancel={() => setEditModal(false)} />
          </div>
        </div>
      )}

      {defaultModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded">
            <p>Are you sure you want to make this announcement as default?</p>
            <button onClick={confirmSetDefault}>Update</button>
            <button onClick={() => setDefaultModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const EditForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label>Text</label>
        <textarea name="text" value={formData.text} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Start Date</label>
        <input type="date" name="startDate" value={formData.startDate.slice(0,10)} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>End Date</label>
        <input type="date" name="endDate" value={formData.endDate.slice(0,10)} onChange={handleChange} required className="w-full border p-2 rounded" />
      </div>
      <div className="flex items-center">
        <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
        <label className="ml-2">Set as Default</label>
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update</button>
      <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
    </form>
  );
};

export default AllAnnouncements;