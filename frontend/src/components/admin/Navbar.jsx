import React, { useState, useContext, useEffect, useRef } from 'react';
import { Menu, Bell, User, RefreshCw, ChevronDown, LogOut, UserCircle, X, Eye } from 'lucide-react';
import { AuthContext } from '../../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const prevNotificationsOpenRef = useRef(false);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const socket = io('http://localhost:3000', {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
    });

    socket.on('newOrderNotification', (notification) => {
      console.log('Received newOrderNotification event:', notification);
      if (notification && notification.id && notification.time) {
        setNotifications((prev) => [
          {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            time: new Date(notification.time).toLocaleTimeString(),
            unread: notification.unread,
            orderId: notification.orderId,
            type: notification.type,
          },
          ...prev,
        ]);
      } else {
        console.error('Invalid notification received:', notification);
      }
    });

    socket.on('abandonedCartNotification', (notification) => {
      console.log('Received abandonedCartNotification event:', notification);
      setNotifications((prev) => {
        // Check if notification already exists
        const existingIndex = prev.findIndex(n => n.abandonedCartId === notification.abandonedCartId);
        
        const newNotif = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          time: new Date(notification.time).toLocaleTimeString(),
          unread: notification.unread,
          type: notification.type,
          abandonedCartId: notification.abandonedCartId,
          userId: notification.userId,
          itemCount: notification.itemCount,
          customerName: notification.customerName,
          whatsappNumber: notification.whatsappNumber,
          cartItems: notification.cartItems,
        };

        if (existingIndex !== -1) {
          // Update existing notification
          const updated = [...prev];
          updated[existingIndex] = newNotif;
          return updated;
        } else {
          // Add new notification
          return [newNotif, ...prev];
        }
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
    });

    return () => {
      console.log('Disconnecting Socket.IO');
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/notifications/all', {
          withCredentials: true,
        });
        const fetchedNotifications = response.data.notifications.map((notif) => ({
          id: notif._id,
          title: notif.title,
          message: notif.message,
          time: new Date(notif.time).toLocaleTimeString(),
          unread: notif.unread,
          orderId: notif.orderId,
          productId: notif.productId,
          type: notif.type || 'order',
          abandonedCartId: notif.abandonedCartId,
          userId: notif.userId,
          itemCount: notif.itemCount,
          customerName: notif.customerName,
          whatsappNumber: notif.whatsappNumber,
          cartItems: notif.cartItems,
        }));
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (notificationsOpen && !prevNotificationsOpenRef.current && notifications.length > 0) {
      setViewedNotifications((prev) => {
        const newSet = new Set(prev);
        notifications.forEach((notif) => {
          if (!newSet.has(notif.id)) {
            newSet.add(notif.id);
          }
        });
        return newSet;
      });
    }
    prevNotificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/delete/${notificationId}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      setViewedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('http://localhost:3000/api/notifications/mark-all-read', {}, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.map((notif) => ({ ...notif, unread: false })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewCart = (notification) => {
    setSelectedCart({
      _id: notification.abandonedCartId,
      user_name: notification.customerName,
      email: '', // Not available in notification
      phone_number: '', // Not available in notification
      whatsapp_number: notification.whatsappNumber,
      last_updated: notification.time,
      cart_items: notification.cartItems || [],
    });
    setShowCartModal(true);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'abandonedCart') {
      navigate('/admin/panel/abandoned-cart');
      setNotificationsOpen(false);
    }
  };

  const calculateCartTotal = (cartItems) => {
    return cartItems.reduce((total, item) => total + (item.discounted_price * item.quantity), 0);
  };

  const unreadCount = notifications.filter((notif) => notif.unread).length;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span className={`block h-0.5 w-6 bg-gray-600 rounded-full transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''} group-hover:bg-blue-600`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-600 rounded-full transition-all duration-300 ${isSidebarOpen ? 'opacity-0' : ''} group-hover:bg-blue-600`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-600 rounded-full transition-all duration-300 ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''} group-hover:bg-blue-600`}></span>
                </div>
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div className="text-xl font-bold text-gray-900 hidden sm:block">Mould Market</div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8 justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Admin Panel</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                title="Refresh Page"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                <div className="relative">
                  <button
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">Ebrahim Kanchwala</div>
                      <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">Ebrahim Kanchwala</p>
                        <p className="text-xs text-gray-500">mouldmarket.com</p>
                      </div>
                      <div className="py-1">
                        <a href="/admin/panel/profile/update" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                          <UserCircle className="w-4 h-4 mr-3" />Profile Settings
                        </a>
                        <a href="/admin/panel/settings/account" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                          <User className="w-4 h-4 mr-3" />Account Settings
                        </a>
                        <div className="border-t border-gray-200 my-1"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                          <LogOut className="w-4 h-4 mr-3" />Sign Out
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3 border-t border-gray-200">
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Admin Panel</h1>
          </div>
        </div>
      </nav>

      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Notifications ({notifications.length})</h3>
              <button onClick={() => setNotificationsOpen(false)} className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto h-full">
              {notifications.length > 0 ? (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                        notification.unread
                          ? notification.type === 'lowStock'
                            ? 'bg-blue-50 border-l-4 border-l-black'
                            : notification.type === 'outOfStock'
                            ? 'bg-blue-50 border-l-4 border-l-red-500'
                            : notification.type === 'abandonedCart'
                            ? 'bg-green-50 border-l-4 border-l-green-500'
                            : 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 flex items-center justify-center shadow-md z-10"
                        title="Delete notification"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="pr-12">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 pr-2">{notification.title}</h4>
                          <div className="flex items-center space-x-2">
                            {notification.unread && <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>}
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${viewedNotifications.has(notification.id) ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {viewedNotifications.has(notification.id) ? 'read' : 'new'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2
                        whitespace-pre-wrap">{notification.message}</p>
                        
                        {notification.type === 'abandonedCart' && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-700 space-y-1">
                              <p><span className="font-semibold">Customer:</span> {notification.customerName}</p>
                              <p><span className="font-semibold">WhatsApp:</span> {notification.whatsappNumber || 'N/A'}</p>
                              <p><span className="font-semibold">Items:</span> {notification.itemCount}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewCart(notification); }}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Cart
                            </button>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 border border-blue-200"
                      >
                        Mark all as read ({unreadCount})
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await axios.delete('http://localhost:3000/api/notifications/clear-all', {
                            withCredentials: true,
                          });
                          setNotifications([]);
                          setViewedNotifications(new Set());
                        } catch (error) {
                          console.error('Error clearing notifications:', error);
                        }
                      }}
                      className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200 border border-red-200"
                    >
                      Clear all notifications
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No notifications</p>
                  <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Cart Modal */}
      {showCartModal && selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Abandoned Cart Details</h3>
                <p className="text-sm text-gray-500">{selectedCart.user_name}</p>
              </div>
              <button onClick={() => setShowCartModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Customer Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-600">Name:</span><span className="ml-2">{selectedCart.user_name}</span></div>
                  <div><span className="text-gray-600">WhatsApp:</span><span className="ml-2">{selectedCart.whatsapp_number || 'N/A'}</span></div>
                </div>
              </div>
              <h4 className="text-sm font-medium mb-3">Cart Items</h4>
              <div className="space-y-4">
                {selectedCart.cart_items.map((item, i) => (
                  <div key={i} className="flex space-x-4 p-4 border rounded-lg">
                    <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">{item.product_name}</h5>
                      {item.variant_name && <p className="text-xs text-gray-600 mt-1">Variant: {item.variant_name}</p>}
                      {item.size && <p className="text-xs text-gray-600">Size: {item.size}</p>}
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{item.discounted_price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Total: ₹{(item.discounted_price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">Cart Total:</span>
                  <span className="text-lg font-bold text-green-600">₹{calculateCartTotal(selectedCart.cart_items).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button onClick={() => setShowCartModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {profileDropdownOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
      )}
    </>
  );
};

export default Navbar;