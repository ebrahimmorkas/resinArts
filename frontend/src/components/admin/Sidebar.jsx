import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  List,
  TrendingUp,
  DollarSign,
  Eye,
  UserCheck,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Store,
  Clock,
  Map,
  User
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/admin/panel/dashboard',
      badge: null
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: '24',
      submenu: [
        { id: 'all-products', label: 'All Products', icon: List, href: '/admin/panel/products' },
        { id: 'add-product', label: 'Add Product', icon: Plus, href: '/admin/panel/products/add' },
        { id: 'edit-products', label: 'Edit Products', icon: Edit3, href: '/admin/panel/products/edit' },
        { id: 'categories', label: 'Categories', icon: List, href: '/admin/panel/products/categories' },
        { id: 'restock', label: 'Restock', icon: Package, href: '/admin/panel/products/restock' },
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      badge: '8',
      badgeColor: 'bg-red-500',
      submenu: [
        { id: 'all-orders', label: 'All Orders', icon: List, href: '/admin/panel/orders' },
        { id: 'pending-orders', label: 'Pending Orders', icon: Clock, href: '/admin/panel/orders/pending' },
        { id: 'shipped-orders', label: 'Shipped Orders', icon: Truck, href: '/admin/panel/orders/shipped' },
        { id: 'completed-orders', label: 'Completed Orders', icon: UserCheck, href: '/admin/panel/orders/completed' },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      submenu: [
        { id: 'sales-report', label: 'Sales Report', icon: TrendingUp, href: '/admin/panel/analytics/sales' },
        { id: 'revenue', label: 'Revenue', icon: DollarSign, href: '/admin/panel/analytics/revenue' },
        { id: 'product-performance', label: 'Product Performance', icon: Eye, href: '/admin/panel/analytics/products' },
        { id: 'customer-insights', label: 'Customer Insights', icon: Users, href: '/admin/panel/analytics/customers' },
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: '156',
      href: '/admin/panel/customers'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      badge: '12',
      badgeColor: 'bg-yellow-500',
      href: '/admin/panel/reviews'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: '5',
      badgeColor: 'bg-blue-500',
      href: '/admin/panel/messages'
    },
    {
      id: 'shipping',
      label: 'Shipping',
      icon: Truck,
      submenu: [
        { id: 'shipping-zones', label: 'Shipping Zones', icon: Map, href: '/admin/panel/shipping/zones' },
        { id: 'shipping-rates', label: 'Shipping Rates', icon: DollarSign, href: '/admin/panel/shipping/rates' },
        { id: 'tracking', label: 'Tracking', icon: Eye, href: '/admin/panel/shipping/tracking' },
      ]
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      submenu: [
        { id: 'transactions', label: 'Transactions', icon: List, href: '/admin/panel/payments/transactions' },
        { id: 'payouts', label: 'Payouts', icon: DollarSign, href: '/admin/panel/payments/payouts' },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, href: '/admin/panel/payments/methods' },
      ]
    },
    {
      id: 'store',
      label: 'Store Settings',
      icon: Store,
      submenu: [
        { id: 'store-info', label: 'Store Information', icon: Settings, href: '/admin/panel/store/info' },
        { id: 'store-appearance', label: 'Appearance', icon: Edit3, href: '/admin/panel/store/appearance' },
        { id: 'store-policies', label: 'Policies', icon: Shield, href: '/admin/panel/store/policies' },
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      submenu: [
        { id: 'account-settings', label: 'Account Settings', icon: User, href: '/admin/panel/settings/account' },
        { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/panel/settings/notifications' },
        { id: 'security', label: 'Security', icon: Shield, href: '/admin/panel/settings/security' },
      ]
    },
    {
      id: 'discount',
      label: 'Discount',
      icon: DollarSign,
      href: '/admin/panel/discount'
    },
    {
      id: 'banner',
      label: 'Banner',
      icon: DollarSign,
      submenu: [
        { id: 'all-banners', label: 'All banners', icon: List, href: '/admin/panel/banner/all' },
        { id: 'add-banner', label: 'Add banner', icon: Plus, href: '/admin/panel/banner/add' },
      ]
    },
    {
      id: 'announcement',
      label: 'Announcement',
      icon: DollarSign,
      submenu: [
        { id: 'all-announcements', label: 'All Announcements', icon: List, href: '/admin/panel/announcement/all' },
        { id: 'add-announcement', label: 'Add Announcement', icon: Plus, href: '/admin/panel/announcement/add' },
      ]
    },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/admin/panel/help' },
    { id: 'logout', label: 'Logout', icon: LogOut, href: '/logout', danger: true },
  ];

  const MenuItem = ({ item, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];
    const Icon = item.icon;

    return (
      <div className="w-full">
        {item.href ? (
          <NavLink
            to={item.href}
            className={({ isActive }) => `flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-300 group ${
              level > 0 ? 'pl-12 py-2' : ''
            } ${
              item.danger 
                ? 'hover:bg-red-500/20 text-gray-200 hover:text-red-400' 
                : isActive
                  ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-200'
                  : 'hover:bg-indigo-500/10 text-gray-200 hover:text-indigo-300'
            } rounded-lg mx-2 my-1 shadow-sm hover:shadow-md`}
            onClick={() => {
              onClose(); // Close sidebar on mobile
            }}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''} transition-transform duration-300 group-hover:scale-110`} />
              <span className={`font-medium ${level > 0 ? 'text-sm' : ''}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className={`px-2 py-1 text-xs rounded-full text-white ${
                  item.badgeColor || 'bg-indigo-600'
                } transform group-hover:scale-105 transition-transform duration-300`}>
                  {item.badge}
                </span>
              )}
            </div>
          </NavLink>
        ) : (
          <div
            className={`flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-300 group ${
              level > 0 ? 'pl-12 py-2' : ''
            } ${
              item.danger 
                ? 'hover:bg-red-500/20 text-gray-200 hover:text-red-400' 
                : 'hover:bg-indigo-500/10 text-gray-200 hover:text-indigo-300'
            } cursor-pointer rounded-lg mx-2 my-1 shadow-sm hover:shadow-md`}
            onClick={hasSubmenu ? () => toggleSubmenu(item.id) : undefined}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''} transition-transform duration-300 group-hover:scale-110`} />
              <span className={`font-medium ${level > 0 ? 'text-sm' : ''}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className={`px-2 py-1 text-xs rounded-full text-white ${
                  item.badgeColor || 'bg-indigo-600'
                } transform group-hover:scale-105 transition-transform duration-300`}>
                  {item.badge}
                </span>
              )}
            </div>
            {hasSubmenu && (
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 transform group-hover:rotate-180" />
                ) : (
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 transform group-hover:translate-x-1" />
                )}
              </div>
            )}
          </div>
        )}

        {hasSubmenu && isExpanded && (
          <div className="bg-gray-800/20 border-l-2 border-indigo-500/30 ml-6">
            {item.submenu.map((subItem) => (
              <MenuItem key={subItem.id} item={subItem} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity duration-500"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-gray-900 to-indigo-900 shadow-2xl transform transition-transform duration-500 ease-in-out z-50 border-r border-indigo-500/30 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-500/30 bg-gray-900/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">SellerHub</h2>
              <p className="text-sm text-indigo-300 font-medium">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-indigo-600/50 text-indigo-300 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-900">
          <nav className="py-4 px-2">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
            
            {/* Bottom Menu Items */}
            <div className="border-t border-indigo-500/30 bg-gray-800/20 mt-4">
              <div className="py-2">
                {bottomMenuItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-500/30 bg-gray-900/50 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-indigo-300 font-medium">© 2025 SellerHub</p>
            <p className="text-xs text-indigo-400 mt-1">v2.2.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;