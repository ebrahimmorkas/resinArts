import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddAnnouncement from './AddAnnouncement';

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(null);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [defaultModal, setDefaultModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
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

  const handleDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setOperationLoading('delete');
    try {
      await axios.delete(`http://localhost:3000/api/announcement/delete/${selectedAnnouncement._id}`);
      setDeleteModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement');
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditModal(true);
  };

  const handleUpdate = async (updatedData) => {
    setOperationLoading('update');
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, updatedData);
      setEditModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to update announcement');
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleSetDefault = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDefaultModal(true);
  };

  const confirmSetDefault = async () => {
    setOperationLoading('default');
    try {
      await axios.put(`http://localhost:3000/api/announcement/update/${selectedAnnouncement._id}`, { 
        ...selectedAnnouncement,
        isDefault: true 
      });
      setDefaultModal(false);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to set default');
      console.error(err);
    } finally {
      setOperationLoading(null);
    }
  };

  return (
    <div className="p-4">
      <AddAnnouncement onSuccess={fetchAnnouncements} />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">All Announcements</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span>Loading announcements...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Sr No</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Text</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Start Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">End Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Default</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann, index) => (
                  <tr key={ann._id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2 max-w-xs truncate" title={ann.text}>
                      {ann.text}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(ann.startDate).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(ann.endDate).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={ann.isDefault}
                        disabled={ann.isDefault}
                        onChange={() => handleSetDefault(ann)}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEdit(ann)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          title="Edit"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(ann)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          title="Delete"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No announcements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Announcement</h3>
            <EditForm 
              initialData={selectedAnnouncement} 
              onSubmit={handleUpdate} 
              onCancel={() => setEditModal(false)}
              loading={operationLoading === 'update'}
            />
          </div>
        </div>
      )}

      {/* Default Confirmation Modal */}
      {defaultModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-blue-600">Set as Default</h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to make this announcement the default? This will override the current default announcement.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={confirmSetDefault}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                disabled={operationLoading === 'default'}
              >
                {operationLoading === 'default' ? 'Processing...' : 'Yes, Set as Default'}
              </button>
              <button 
                onClick={() => setDefaultModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                disabled={operationLoading === 'default'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Delete Announcement</h3>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete this announcement?
            </p>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="text-sm font-medium">"{selectedAnnouncement?.text}"</p>
            </div>
            <p className="mb-6 text-red-600 text-sm">This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                disabled={operationLoading === 'delete'}
              >
                {operationLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                onClick={() => setDeleteModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                disabled={operationLoading === 'delete'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global loading overlay */}
      {operationLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span>
              {operationLoading === 'update' && 'Updating announcement...'}
              {operationLoading === 'delete' && 'Deleting announcement...'}
              {operationLoading === 'default' && 'Setting as default...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const EditForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    startDate: initialData.startDate.slice(0, 10),
    endDate: initialData.endDate.slice(0, 10)
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If making it default, skip date validations
    if (formData.isDefault && !initialData.isDefault) {
      onSubmit(formData);
      return;
    }

    // Date validation for non-default announcements or existing default (text only changes)
    if (!formData.isDefault || initialData.isDefault) {
      // Validate dates only if not currently default (dates can be edited)
      if (!initialData.isDefault) {
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
          setError('Start date must be before end date');
          return;
        }

        // Check for overlapping announcements
        try {
          const response = await axios.get('http://localhost:3000/api/announcement/all');
          const announcements = response.data;
          
          const overlapping = announcements.find(ann => 
            ann._id !== initialData._id && // Exclude current announcement
            !ann.isDefault && // Only check non-default announcements
            (
              // New announcement starts within existing range
              (new Date(ann.startDate) <= new Date(formData.startDate) && new Date(ann.endDate) >= new Date(formData.startDate)) ||
              // New announcement ends within existing range
              (new Date(ann.startDate) <= new Date(formData.endDate) && new Date(ann.endDate) >= new Date(formData.endDate)) ||
              // New announcement completely covers existing range
              (new Date(formData.startDate) <= new Date(ann.startDate) && new Date(formData.endDate) >= new Date(ann.endDate))
            )
          );

          if (overlapping) {
            setError(`Announcement dates overlap with existing announcement: "${overlapping.text}"`);
            return;
          }
        } catch (err) {
          setError('Error checking for overlapping announcements');
          return;
        }
      }
    }

    onSubmit(formData);
  };

  const isDefault = initialData.isDefault;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
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
          disabled={isDefault}
          className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDefault ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {isDefault && (
          <p className="text-xs text-gray-500 mt-1">
            Start date cannot be edited for default announcements
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">End Date</label>
        <input 
          type="date" 
          name="endDate" 
          value={formData.endDate} 
          onChange={handleChange} 
          required 
          disabled={isDefault}
          className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isDefault ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {isDefault && (
          <p className="text-xs text-gray-500 mt-1">
            End date cannot be edited for default announcements
          </p>
        )}
      </div>
      
      <div className="flex items-center">
        <input 
          type="checkbox" 
          name="isDefault" 
          checked={formData.isDefault} 
          onChange={handleChange}
          disabled={isDefault}
          className={`mr-2 ${isDefault ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <label className={`text-sm font-medium ${isDefault ? 'text-gray-500' : ''}`}>
          Set as Default
        </label>
        {isDefault && (
          <span className="text-xs text-gray-500 ml-2">(Cannot uncheck default)</span>
        )}
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button 
          type="submit" 
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating...
            </>
          ) : (
            'Update'
          )}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AllAnnouncements;