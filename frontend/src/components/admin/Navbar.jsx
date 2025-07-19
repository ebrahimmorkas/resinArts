import React, { useState } from 'react';
import { Menu, Bell, User, ShoppingCart, Search, Settings } from 'lucide-react';
import AddProduct from './SidebarLinks/AddProduct';

const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const [searchFocus, setSearchFocus] = useState(false);

  return (
    <>
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg fixed top-0 left-0 right-0 z-40 border-b border-slate-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu */}
            <button
              onClick={onMenuClick}
              className="text-white hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 rounded-md p-2 transition-all duration-200 hover:bg-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl font-bold text-white hidden sm:block">
                SellerHub
              </div>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-5 h-5 transition-colors duration-200 ${
                  searchFocus ? 'text-emerald-400' : 'text-slate-400'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Search products, orders..."
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search */}
            <button className="md:hidden text-slate-300 hover:text-emerald-400 p-2 rounded-md hover:bg-slate-700 transition-all duration-200">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="text-slate-300 hover:text-emerald-400 p-2 rounded-md hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* Settings */}
            <button className="hidden sm:block text-slate-300 hover:text-emerald-400 p-2 rounded-md hover:bg-slate-700 transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-3 border-l border-slate-600 pl-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-white">John Seller</div>
                <div className="text-xs text-slate-400">Premium Account</div>
              </div>
              <div className="relative">
                <button className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white hover:from-emerald-500 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50">
                  <User className="w-4 h-4" />
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
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products, orders..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-sm"
          />
        </div>
      </div>
    </nav>
      
      </>
  );
};

export default Navbar;