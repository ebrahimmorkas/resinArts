import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, Eye, X, Mail, Filter, AlertTriangle } from 'lucide-react';

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
  const [activeFilter, setActiveFilter] = useState('abandoned');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const initSocket = async () => {
      const token = localStorage.getItem('token');
      const { io } = await import('socket.io-client');
      socketRef.current = io('http://localhost:3000', { auth: { token }, transports: ['websocket', 'polling'] });
      socketRef.current.on('abandoned_cart_updated', (data) => {
        setAbandonedCarts(prev => {
          const idx = prev.findIndex(cart => cart._id === data.abandonedCart._id);
          if (idx !== -1) { const updated = [...prev]; updated[idx] = data.abandonedCart; return updated; }
          return [data.abandonedCart, ...prev];
        });
      });
      socketRef.current.on('abandoned_cart_removed', (data) => setAbandonedCarts(prev => prev.filter(cart => cart.user_id !== data.userId)));
      socketRef.current.on('abandoned_cart_deleted', (data) => setAbandonedCarts(prev => prev.filter(cart => cart._id !== data.cartId)));
      socketRef.current.on('abandoned_carts_deleted', (data) => setAbandonedCarts(prev => prev.filter(cart => !data.cartIds.includes(cart._id))));
    };
    initSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => { fetchAbandonedCarts(); }, []);

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true);
      const axios = (await import('axios')).default;
      const response = await axios.get('http://localhost:3000/api/abandoned-cart', { withCredentials: true });
      if (response.data.success) setAbandonedCarts(response.data.abandonedCarts);
    } catch (error) {
      showToast('Failed to fetch abandoned carts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let filtered = abandonedCarts;
    if (activeFilter === 'abandoned') {
      const fifteenMin = new Date(Date.now() - 15 * 60 * 1000);
      filtered = abandonedCarts.filter(cart => new Date(cart.createdAt || cart.last_updated) <= fifteenMin);
    }
    return filtered.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whatsapp_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [abandonedCarts, searchTerm, activeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, itemsPerPage, activeFilter]);

  const handleSelectAll = (e) => { setSelectedRows(e.target.checked ? currentData.map(item => item._id) : []); };
  const handleSelectRow = (id) => { setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]); };
  const handleView = (id) => { setSelectedCart(abandonedCarts.find(item => item._id === id)); setShowModal(true); };
  const openDeleteModal = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };

  const confirmDelete = async () => {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.delete(`http://localhost:3000/api/abandoned-cart/${deleteTarget}`, { withCredentials: true });
      if (response.data.success) { showToast('Cart deleted successfully', 'success'); setShowDeleteModal(false); setDeleteTarget(null); }
    } catch (error) {
      showToast('Failed to delete cart', 'error');
    }
  };

  const openDeleteMultipleModal = () => { if (selectedRows.length > 0) setShowDeleteMultipleModal(true); };

  const confirmDeleteMultiple = async () => {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.post('http://localhost:3000/api/abandoned-cart/delete-multiple', { ids: selectedRows }, { withCredentials: true });
      if (response.data.success) { setSelectedRows([]); showToast(`${selectedRows.length} cart(s) deleted`, 'success'); setShowDeleteMultipleModal(false); }
    } catch (error) {
      showToast('Failed to delete carts', 'error');
    }
  };

  const handleSendReminder = async (id) => {
    try {
      setSendingEmail(id);
      showToast('Sending email...', 'info');
      const axios = (await import('axios')).default;
      const response = await axios.post(`http://localhost:3000/api/abandoned-cart/send-reminder/${id}`, {}, { withCredentials: true });
      if (response.data.success) showToast('Email sent successfully!', 'success');
      else showToast(response.data.message || 'Failed to send email', 'error');
    } catch (error) {
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(null);
    }
  };

  const calculateCartTotal = (cartItems) => cartItems.reduce((total, item) => total + (item.discounted_price * item.quantity), 0);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {toast.message}
          </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Abandoned Carts</h3>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length}</p>
              </div>
              {selectedRows.length > 0 && (
                <button onClick={openDeleteMultipleModal} className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-white">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Selected ({selectedRows.length})
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setActiveFilter('abandoned')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeFilter === 'abandoned' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
                  <Filter className="w-4 h-4 inline mr-2" />Abandoned ({abandonedCarts.filter(c => new Date(c.createdAt || c.last_updated) <= new Date(Date.now() - 15 * 60 * 1000)).length})
                </button>
                <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeFilter === 'all' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
                  All ({abandonedCarts.length})
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-80" />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden border-t border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="dark:text-white px-6 py-3 text-center bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'60px'}}><input type="checkbox" checked={currentData.length > 0 && selectedRows.length === currentData.length} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 rounded" /></th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'80px'}}>Sr No.</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'150px'}}>Name</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'200px'}}>Email</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'140px'}}>WhatsApp</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'140px'}}>Phone</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'120px'}}>Items</th>
                  <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'140px'}}>Time</th>
                  {selectedRows.length === 0 && <th className="dark:text-white px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b" style={{minWidth:'180px'}}>Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                {currentData.length === 0 ? (
                  <tr><td colSpan={selectedRows.length === 0 ? 9 : 8} className="px-6 py-8 text-center text-gray-500">{activeFilter === 'abandoned' ? 'No abandoned carts (15+ mins)' : 'No carts'}</td></tr>
                ) : (
                  currentData.map((item, index) => {
                    const timeElapsed = Math.floor((Date.now() - new Date(item.createdAt || item.last_updated).getTime()) / 60000);
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <td className="dark:text-gray-400 px-6 py-4 text-center"><input type="checkbox" checked={selectedRows.includes(item._id)} onChange={() => handleSelectRow(item._id)} className="w-4 h-4 text-blue-600 rounded" /></td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-900">{startIndex + index + 1}</td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-900">{item.user_name}</td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-500">{item.email}</td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-500">{item.whatsapp_number || 'N/A'}</td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center text-gray-500">{item.phone_number || 'N/A'}</td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{item.cart_items.length} items</span></td>
                        <td className="dark:text-gray-400 px-6 py-4 text-sm text-center"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${timeElapsed < 15 ? 'bg-green-100 text-green-800' : timeElapsed < 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{timeElapsed < 60 ? `${timeElapsed}m` : `${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m`}</span></td>
                        {selectedRows.length === 0 && (
                          <td className="px-6 py-4 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => handleView(item._id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="View"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleSendReminder(item._id)} disabled={sendingEmail === item._id} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50" title="Email"><Mail className="w-4 h-4" /></button>
                              <button onClick={() => openDeleteModal(item._id)} className="dark:text-white p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
        <div className="px-6 py-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-400">Show</span>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-400">per page</span>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="inline-flex items-center px-3 py-2 border rounded-md text-sm disabled:opacity-50">
                <ChevronLeft className="w-4 h-4 mr-1" />Previous
              </button>
              <div className="flex space-x-1">
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  let p = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                  return <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-2 text-sm rounded-md ${currentPage === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:bg-gray-800'}`}>{p}</button>;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="inline-flex items-center px-3 py-2 border rounded-md text-sm disabled:opacity-50">
                Next<ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between"><div><h3 className="text-lg font-semibold">Cart Details</h3><p className="text-sm text-gray-500">{selectedCart.user_name}</p></div><button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button></div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"><h4 className="text-sm font-medium mb-3">Customer Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-600 dark:text-gray-400">Email:</span><span className="ml-2">{selectedCart.email}</span></div>
                  <div><span className="text-gray-600 dark:text-gray-400">Phone:</span><span className="ml-2">{selectedCart.phone_number || 'N/A'}</span></div>
                  <div><span className="text-gray-600 dark:text-gray-400">WhatsApp:</span><span className="ml-2">{selectedCart.whatsapp_number || 'N/A'}</span></div>
                  <div><span className="text-gray-600 dark:text-gray-400">Updated:</span><span className="ml-2">{new Date(selectedCart.last_updated).toLocaleString()}</span></div>
                </div>
              </div>
              <h4 className="text-sm font-medium mb-3">Cart Items</h4>
              <div className="space-y-4">
                {selectedCart.cart_items.map((item, i) => (
                  <div key={i} className="flex space-x-4 p-4 border rounded-lg">
                    <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">{item.product_name}</h5>
                      {item.variant_name && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Variant: {item.variant_name}</p>}
                      {item.size && <p className="text-xs text-gray-600 dark:text-gray-400">Size: {item.size}</p>}
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{item.discounted_price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Total: ₹{(item.discounted_price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg"><div className="flex justify-between"><span className="font-semibold dark:text-black">Cart Total:</span><span className="text-lg font-bold text-blue-600">₹{calculateCartTotal(selectedCart.cart_items).toFixed(2)}</span></div></div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end"><button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button></div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div><h3 className="text-lg font-semibold">Delete Cart</h3></div></div>
            <div className="px-6 py-4"><p className="text-sm text-gray-600 dark:text-gray-400">Delete this cart? This will also clear user's cart items. Cannot be undone.</p></div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:bg-gray-800">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMultipleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div><h3 className="text-lg font-semibold">Delete Multiple</h3></div></div>
            <div className="px-6 py-4"><p className="text-sm text-gray-600 dark:text-gray-400">Delete {selectedRows.length} cart(s)? This will also clear users' cart items. Cannot be undone.</p></div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowDeleteMultipleModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:bg-gray-800">Cancel</button>
              <button onClick={confirmDeleteMultiple} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbandonedCart;