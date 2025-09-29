import React, { useState, useMemo, useContext } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  Download,
  X,
  AlertTriangle,
  Loader2,
  FolderTree
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {CategoryContext} from '../../../../../Context/CategoryContext'

const AllCategories = () => {
  const { categories, loadingCategories, setCategories } = useContext(CategoryContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });
  const [hierarchyModal, setHierarchyModal] = useState({ isOpen: false, category: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Get only parent categories (where parent_category_id is null)
  const parentCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_category_id);
  }, [categories]);

  // Count immediate subcategories for each parent
  const getSubcategoryCount = (parentId) => {
    return categories.filter(cat => 
      cat.parent_category_id && 
      (typeof cat.parent_category_id === 'object' 
        ? cat.parent_category_id.$oid === parentId 
        : cat.parent_category_id === parentId)
    ).length;
  };

  // Build hierarchy for a category
  const buildHierarchy = (parentId) => {
    const children = categories.filter(cat => {
      if (!cat.parent_category_id) return false;
      const parentIdValue = typeof cat.parent_category_id === 'object' 
        ? cat.parent_category_id.$oid 
        : cat.parent_category_id;
      return parentIdValue === parentId;
    });

    return children.map(child => {
      const childId = typeof child._id === 'object' ? child._id.$oid : child._id;
      return {
        ...child,
        children: buildHierarchy(childId)
      };
    });
  };

  // Filter and search functionality
  const filteredData = useMemo(() => {
    return parentCategories.filter(item =>
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parentCategories, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Select all checkbox logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentData.map(item => typeof item._id === 'object' ? item._id.$oid : item._id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  // Individual checkbox logic
  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Open delete modal
  const handleDeleteClick = (category) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    setDeleteModal({
      isOpen: true,
      categoryId: categoryId,
      categoryName: category.categoryName,
      hasChildren: getSubcategoryCount(categoryId) > 0
    });
  };

  // Delete category
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `http://localhost:3000/api/category/delete-category/${deleteModal.categoryId}`,
        { withCredentials: true }
      );
      
      // Update categories in context
      setCategories(prev => prev.filter(cat => {
        const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
        return catId !== deleteModal.categoryId;
      }));
      
      toast.success('Category deleted successfully!');
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
      setSelectedRows([]);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    
    const selectedCategories = categories.filter(cat => {
      const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
      return selectedRows.includes(catId);
    });
    
    const hasChildren = selectedCategories.some(cat => {
      const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
      return getSubcategoryCount(catId) > 0;
    });

    setDeleteModal({
      isOpen: true,
      categoryId: selectedRows,
      categoryName: `${selectedRows.length} categories`,
      hasChildren: hasChildren,
      isBulk: true
    });
  };

  // View hierarchy
  const handleViewHierarchy = (category) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    const hierarchy = buildHierarchy(categoryId);
    setHierarchyModal({
      isOpen: true,
      category: { ...category, children: hierarchy }
    });
  };

  // Delete from hierarchy view
  const handleDeleteFromHierarchy = async (categoryId, categoryName) => {
    const hasChildren = categories.some(cat => {
      const parentIdValue = cat.parent_category_id 
        ? (typeof cat.parent_category_id === 'object' ? cat.parent_category_id.$oid : cat.parent_category_id)
        : null;
      return parentIdValue === categoryId;
    });

    setDeleteModal({
      isOpen: true,
      categoryId: categoryId,
      categoryName: categoryName,
      hasChildren: hasChildren,
      fromHierarchy: true
    });
  };

  // Render hierarchy tree
  const renderHierarchyTree = (category, level = 0) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={categoryId} className="mb-2">
        <div 
          className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-6' : ''}`}
          style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}
        >
          <div className="flex items-center space-x-3">
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.categoryName}
                className="w-10 h-10 object-cover rounded-md border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                <FolderTree className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{category.categoryName}</p>
              {hasChildren && (
                <p className="text-xs text-gray-500">{category.children.length} subcategories</p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDeleteFromHierarchy(categoryId, category.categoryName)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {hasChildren && (
          <div className="mt-2">
            {category.children.map(child => renderHierarchyTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Categories Management</h3>
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
              
              {/* Bulk Actions */}
              {selectedRows.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedRows.length})
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Table Container with Horizontal Scroll and Sticky Header */}
        <div className="overflow-hidden border-t border-gray-200">
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '60px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === currentData.length && currentData.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '80px' }}>
                    Sr No.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '100px' }}>
                    Image
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '180px' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                    Sub Categories
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                    Created At
                  </th>
                  {selectedRows.length === 0 && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '180px' }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item, index) => {
                  const categoryId = typeof item._id === 'object' ? item._id.$oid : item._id;
                  const subcategoryCount = getSubcategoryCount(categoryId);
                  const createdDate = new Date(item.createdAt.$date || item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={categoryId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '60px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(categoryId)}
                          onChange={() => handleSelectRow(categoryId)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '100px' }}>
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.categoryName}
                            className="w-12 h-12 object-cover rounded-md mx-auto border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md mx-auto flex items-center justify-center">
                            <FolderTree className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium" style={{ minWidth: '180px' }}>
                        {item.categoryName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '140px' }}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500" style={{ minWidth: '140px' }}>
                        {createdDate}
                      </td>
                      {selectedRows.length === 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '180px' }}>
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewHierarchy(item)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                              title="View Hierarchy"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Hierarchy
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
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
              </select>
              <span className="text-sm text-gray-700">entries per page</span>
            </div>

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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => !isDeleting && setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.categoryName}</span>?
                      </p>
                      {deleteModal.hasChildren && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>This category has subcategories. Deleting it will also delete all nested subcategories.</span>
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-3">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Modal */}
      {hierarchyModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setHierarchyModal({ isOpen: false, category: null })}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                      <FolderTree className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Category Hierarchy
                      </h3>
                      <p className="text-sm text-gray-500">
                        {hierarchyModal.category?.categoryName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHierarchyModal({ isOpen: false, category: null })}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {hierarchyModal.category && renderHierarchyTree(hierarchyModal.category)}
                  
                  {(!hierarchyModal.category?.children || hierarchyModal.category.children.length === 0) && (
                    <div className="text-center py-8">
                      <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No subcategories found</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setHierarchyModal({ isOpen: false, category: null })}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-700 text-sm">Processing...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AllCategories;