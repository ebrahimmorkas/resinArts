import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  X,
  Mail,
  Filter
} from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

const AbandonedCart = () => {
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [activeFilter, setActiveFilter] = useState('abandoned'); // 'all' or 'abandoned'
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    socketRef.current = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected for abandoned carts');
    });

    socketRef.current.on('abandoned_cart_updated', (data) => {
      console.log('Abandoned cart updated:', data);
      setAbandonedCarts(prev => {
        const existingIndex = prev.findIndex(cart => cart._id === data.abandonedCart._id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = data.abandonedCart;
          return updated;
        } else {
          return [data.abandonedCart, ...prev];
        }
      });
    });

    socketRef.current.on('abandoned_cart_removed', (data) => {
      console.log('Abandoned cart removed:', data);
      setAbandonedCarts(prev => prev.filter(cart => cart.user_id !== data.userId));
    });

    socketRef.current.on('abandoned_cart_deleted', (data) => {
      console.log('Abandoned cart deleted by admin:', data);
      setAbandonedCarts(prev => prev.filter(cart => cart._id !== data.cartId));
    });

    socketRef.current.on('abandoned_carts_deleted', (data) => {
      console.log('Multiple abandoned carts deleted:', data);
      setAbandonedCarts(prev => prev.filter(cart => !data.cartIds.includes(cart._id)));
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch abandoned carts on mount
  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const fetchAbandonedCarts = async () => {
  try {
    setLoading(true);
    const response = await axios.get('http://localhost:3000/api/abandoned-cart', {
      withCredentials: true
    });
    if (response.data.success) {
      setAbandonedCarts(response.data.abandonedCarts);
    }
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
  } finally {
    setLoading(false);
  }
};

  // Filter data based on active filter and search
  const filteredData = useMemo(() => {
    let filtered = abandonedCarts;

    // Apply 15-minute filter for "abandoned" tab
    if (activeFilter === 'abandoned') {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      filtered = abandonedCarts.filter(cart => {
        const cartDate = new Date(cart.createdAt || cart.last_updated);
        return cartDate <= fifteenMinutesAgo;
      });
    }

    // Apply search filter
    return filtered.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whatsapp_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [abandonedCarts, searchTerm, activeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, activeFilter]);

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(currentData.map(item => item._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle view cart
  const handleView = async (id) => {
    const cart = abandonedCarts.find(item => item._id === id);
    setSelectedCart(cart);
    setShowModal(true);
  };

  // Handle delete single cart
  const handleDelete = async (id) => {
  if (!window.confirm('Are you sure you want to delete this abandoned cart?')) {
    return;
  }

  try {
    const response = await axios.delete(`http://localhost:3000/api/abandoned-cart/${id}`, {
      withCredentials: true
    });
    if (response.data.success) {
      alert('Abandoned cart deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting cart:', error);
    alert('Failed to delete abandoned cart');
  }
};

  // Handle delete multiple carts
  const handleDeleteSelected = async () => {
  if (selectedRows.length === 0) return;
  
  if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} abandoned cart(s)?`)) {
    return;
  }

  try {
    const response = await axios.post('http://localhost:3000/api/abandoned-cart/delete-multiple', 
      { ids: selectedRows },
      { withCredentials: true }
    );
    if (response.data.success) {
      setSelectedRows([]);
      alert(`${selectedRows.length} abandoned cart(s) deleted successfully`);
    }
  } catch (error) {
    console.error('Error deleting carts:', error);
    alert('Failed to delete abandoned carts');
  }
};

  // Handle send reminder email
  const handleSendReminder = async (id) => {
  try {
    setSendingEmail(id);
    const response = await axios.post(`http://localhost:3000/api/abandoned-cart/send-reminder/${id}`, 
      {},
      { withCredentials: true }
    );
    if (response.data.success) {
      alert('Reminder email sent successfully');
    } else {
      alert(response.data.message || 'Failed to send reminder email');
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    alert('Failed to send reminder email: ' + (error.response?.data?.message || error.message));
  } finally {
    setSendingEmail(null);
  }
};

  // Calculate cart total
  const calculateCartTotal = (cartItems) => {
    return cartItems.reduce((total, item) => total + (item.discounted_price * item.quantity), 0);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCart(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading abandoned carts...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Title and Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Abandoned Carts</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                </p>
              </div>
              
              {/* Delete Selected Button */}
              {selectedRows.length > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRows.length})
                </button>
              )}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveFilter('abandoned')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'abandoned'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Filter className="w-4 h-4 inline mr-2" />
                  Abandoned ({abandonedCarts.filter(cart => {
                    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                    const cartDate = new Date(cart.createdAt || cart.last_updated);
                    return cartDate <= fifteenMinutesAgo;
                  }).length})
                </button>
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({abandonedCarts.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden border-t border-gray-200">
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-center bg-gray-50 border-b border-gray-200" style={{ minWidth: '60px' }}>
                    <input
                      type="checkbox"
                      checked={currentData.length > 0 && selectedRows.length === currentData.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '80px' }}>
                    Sr No.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '150px' }}>
                    User Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '200px' }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                    Items Count
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                    Time Elapsed
                  </th>
                  {selectedRows.length === 0 && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '180px' }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={selectedRows.length === 0 ? 9 : 8} className="px-6 py-8 text-center text-gray-500">
                      {activeFilter === 'abandoned' 
                        ? 'No abandoned carts found (older than 15 minutes)'
                        : 'No carts found'}
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => {
                    const timeElapsed = Math.floor((Date.now() - new Date(item.createdAt || item.last_updated).getTime()) / 60000);
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center" style={{ minWidth: '60px' }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(item._id)}
                            onChange={() => handleSelectRow(item._id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '150px' }}>
                          {item.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500" style={{ minWidth: '200px' }}>
                          {item.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500" style={{ minWidth: '140px' }}>
                          {item.whatsapp_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500" style={{ minWidth: '140px' }}>
                          {item.phone_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.cart_items.length} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '140px' }}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            timeElapsed < 15 ? 'bg-green-100 text-green-800' :
                            timeElapsed < 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {timeElapsed < 60 ? `${timeElapsed}m` : `${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m`}
                          </span>
                        </td>
                        {selectedRows.length === 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '180px' }}>
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleView(item._id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="View Cart"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSendReminder(item._id)}
                                disabled={sendingEmail === item._id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                title="Send Reminder Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
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
                  })
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
      </div>

      {/* Modal for viewing cart details */}
      {showModal && selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cart Details</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedCart.user_name}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {/* User Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedCart.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 text-gray-900">{selectedCart.phone_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">WhatsApp:</span>
                    <span className="ml-2 text-gray-900">{selectedCart.whatsapp_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedCart.last_updated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <h4 className="text-sm font-medium text-gray-900 mb-3">Cart Items</h4>
              <div className="space-y-4">
                {selectedCart.cart_items.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">{item.product_name}</h5>
                      {item.variant_name && (
                        <p className="text-xs text-gray-600 mt-1">Variant: {item.variant_name}</p>
                      )}
                      {item.size && (
                        <p className="text-xs text-gray-600">Size: {item.size}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{item.discounted_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Total: ₹{(item.discounted_price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Total */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Cart Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{calculateCartTotal(selectedCart.cart_items).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbandonedCart;