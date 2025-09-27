import React, { useState, useContext } from 'react';
import { Menu, Bell, User, RefreshCw, ChevronDown, LogOut, UserCircle, X, Trash2 } from 'lucide-react';
import { AuthContext } from '../../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Order Received', message: 'Order #1234 has been placed', time: '2 mins ago', unread: true },
    { id: 2, title: 'Low Stock Alert', message: 'iPhone 15 Pro Max is running low', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment Processed', message: 'Payment of $299.99 has been processed', time: '3 hours ago', unread: false },
    { id: 4, title: 'New Customer Registered', message: 'Sarah Johnson has created an account', time: '5 hours ago', unread: false },
  ]);
  const {setUser} = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    await axios.post('https://api.simplyrks.cloud/api/auth/logout', {}, { withCredentials: true });
    setUser(null);
    navigate('/auth/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

  const handleRefresh = () => {
    window.location.reload();
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
  };

  const unreadCount = notifications.filter(notif => notif.unread).length;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section - Menu & Logo */}
            <div className="flex items-center space-x-4">
              {/* Beautiful Hamburger Menu */}
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

              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div className="text-xl font-bold text-gray-900 hidden sm:block">
                  Mould Market
                </div>
              </div>
            </div>

            {/* Center - Admin Panel Title */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {/* Admin panel    --> text over here */}
                </h1>
              </div>
            </div>

            {/* Right Section - Actions & Profile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Refresh Button */}
              <button 
                onClick={handleRefresh}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                title="Refresh Page"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Notifications */}
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

              {/* Profile */}
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

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">Ebrahim Kanchwala</p>
                        <p className="text-xs text-gray-500">mouldmarket.com</p>
                      </div>
                      <div className="py-1">
                        <a href="/admin/panel/settings/account" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                          <UserCircle className="w-4 h-4 mr-3" />
                          Profile Settings
                        </a>
                        <a href="/admin/panel/settings/account" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                          <User className="w-4 h-4 mr-3" />
                          Account Settings
                        </a>
                        <div className="border-t border-gray-200 my-1"></div>
                        <a href="#" onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Admin Panel Title */}
        <div className="md:hidden px-4 pb-3 border-t border-gray-200">
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
        </div>
      </nav>

      {/* Windows-style Notifications Panel */}
      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Notifications ({notifications.length})</h3>
              <button 
                onClick={() => setNotificationsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto h-full">
              {notifications.length > 0 ? (
                <>
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${notification.unread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                      
                      {/* ALWAYS VISIBLE DELETE BUTTON - TOP RIGHT */}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 flex items-center justify-center shadow-md z-10"
                        title="Delete notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Content with padding to avoid delete button */}
                      <div className="pr-12">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 pr-2">{notification.title}</h4>
                          {notification.unread && (
                            <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Action Buttons */}
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
                      onClick={() => setNotifications([])}
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

      {/* Click outside to close profile dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;