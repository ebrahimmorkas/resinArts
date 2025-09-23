import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  Download,
  Star,
  StarOff
} from 'lucide-react';

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(null);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [defaultModal, setDefaultModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  // New state for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Filter and search functionality
  const filteredData = useMemo(() => {
    return announcements.filter(item =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(item.startDate).toLocaleDateString().includes(searchTerm.toLowerCase()) ||
      new Date(item.endDate).toLocaleDateString().includes(searchTerm.toLowerCase())
    );
  }, [announcements, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

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

  const getDefaultBadge = (isDefault) => {
    if (isDefault) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Star className="w-3 h-3 mr-1" />
          Default
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        <StarOff className="w-3 h-3 mr-1" />
        Regular
      </span>
    );
  };

  return (
    <div className="p-4 max-w-full">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Manage Your Announcements</h3>
              <p className="text-sm text-gray-500 mt-1">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">Loading announcements...</span>
          </div>
        ) : (
          <>
            {/* Table Container with Horizontal Scroll and Sticky Header */}
            <div className="overflow-hidden border-t border-gray-200">
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '80px' }}>
                        Sr No.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '300px' }}>
                        Announcement Text
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                        End Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                        Type
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '150px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((ann, index) => (
                      <tr key={ann._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900" style={{ minWidth: '300px' }}>
                          <div className="max-w-xs mx-auto">
                            <div className="truncate" title={ann.text}>
                              {ann.text}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                          {new Date(ann.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                          {new Date(ann.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                          <div className="flex justify-center">
                            {getDefaultBadge(ann.isDefault)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '150px' }}>
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(ann)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ann)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {!ann.isDefault && (
                              <button
                                onClick={() => handleSetDefault(ann)}
                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                                title="Set as Default"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? 'No announcements found matching your search.' : 'No announcements found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                {/* Items per page */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">entries per page</span>
                </div>

                {/* Pagination */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                      let pageNumber;
                      if (totalPages <= 7) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 4) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNumber = totalPages - 6 + index;
                      } else {
                        pageNumber = currentPage - 3 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
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