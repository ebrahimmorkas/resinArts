import React, { useState } from 'react';
import { Menu, Bell, User, ShoppingCart, Search, Settings } from 'lucide-react';

const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-xl fixed top-0 left-0 right-0 z-40 border-b border-indigo-500/30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu */}
            <button
              onClick={onMenuClick}
              className="text-white hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 rounded-lg p-2 transition-all duration-300 hover:bg-indigo-600/50 shadow-sm hover:shadow-md"
            >
              <Menu className="w-6 h-6 transform hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight hidden sm:block">
                SellerHub
              </div>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 transition-colors duration-300 ${
                  searchFocus ? 'text-indigo-400' : 'text-gray-300'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Search products, orders..."
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="block w-full pl-10 pr-3 py-2 border border-indigo-500/50 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search */}
            <button className="md:hidden text-gray-300 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-600/50 transition-all duration-300 shadow-sm hover:shadow-md">
              <Search className="w-5 h-5 transform hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="text-gray-300 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-600/50 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50">
                <Bell className="w-5 h-5 transform hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  3
                </span>
              </button>
            </div>

            {/* Settings */}
            <button className="hidden sm:block text-gray-300 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-600/50 transition-all duration-300 shadow-sm hover:shadow-md">
              <Settings className="w-5 h-5 transform hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-3 border-l border-indigo-500/50 pl-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-white">John Seller</div>
                <div className="text-xs text-indigo-300">Premium Account</div>
              </div>
              <div className="relative">
                <button className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-300" />
          </div>
          <input
            type="text"
            placeholder="Search products, orders..."
            className="block w-full pl-9 pr-3 py-2 border border-indigo-500/50 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm transition-all duration-300 shadow-sm hover:shadow-md"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;