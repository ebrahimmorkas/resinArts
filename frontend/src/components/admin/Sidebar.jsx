import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  User,
  Tag,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

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
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: '24',
      submenu: [
        { id: 'all-products', label: 'All Products', icon: List, href: '/admin/panel/products' },
        { id: 'add-product', label: 'Add Product', icon: Plus, href: '/admin/panel/products/add' },
        { id: 'bulk-upload', label: 'Bulk Upload', icon: Package, href: '/admin/panel/products/b' },
      ]
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Package,
      badge: '24',
      submenu: [
        { id: 'all-categories', label: 'All categories', icon: List, href: '/admin/panel/categories/all' },
        { id: 'add-category', label: 'Add Category', icon: Plus, href: '/admin/panel/categories/add' },
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
        { id: 'completed-orders', label: 'Completed Orders', icon: UserCheck, href: '/admin/panel/orders/completed' },
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
      id: 'discount',
      label: 'Discount',
      icon: Tag,
      href: '/admin/panel/discount'
    },
    {
      id: 'banner',
      label: 'Banner',
      icon: Eye,
      submenu: [
        { id: 'all-banners', label: 'All Banners', icon: List, href: '/admin/panel/banner/all' },
        { id: 'add-banner', label: 'Add Banner', icon: Plus, href: '/admin/panel/banner/add' },
      ]
    },
    {
      id: 'announcement',
      label: 'Announcement',
      icon: Bell,
      submenu: [
        { id: 'all-announcements', label: 'All Announcements', icon: List, href: '/admin/panel/announcement/all' },
        { id: 'add-announcement', label: 'Add Announcement', icon: Plus, href: '/admin/panel/announcement/add' },
      ]
    },
     {
      id: 'store',
      label: 'Company Settings',
      icon: Store,
      href: '/admin/panel/company-settings',
      // submenu: [
      //   { id: 'store-info', label: 'Store Information', icon: Settings, href: '/admin/panel/store/info' },
      //   { id: 'store-appearance', label: 'Appearance', icon: Edit3, href: '/admin/panel/store/appearance' },
      //   { id: 'store-policies', label: 'Policies', icon: Shield, href: '/admin/panel/store/policies' },
      // ]
    },
    {
      id: 'abandonedCart',
      label: 'Abandoned Cart',
      icon: ShoppingCart,
      href: '/admin/panel/abandoned-cart',
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
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      submenu: [
        { id: 'account-settings', label: 'Account Settings', icon: User, href: '/admin/panel/settings/account' },
        { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/panel/settings/notifications' },
        { id: 'security', label: 'Security', icon: Shield, href: '/admin/panel/settings/security' },
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

    // Handle menu items with href (clickable links)
    if (item.href && !hasSubmenu) {
      const isExactMatch = location.pathname === item.href;
      
      return (
        <div className="w-full">
          <NavLink
            to={item.href}
            end
            className={`flex items-center justify-between w-full px-3 py-2 text-left transition-all duration-200 ${
              level > 0 ? 'pl-8 py-2' : ''
            } ${
              item.danger 
                ? 'hover:bg-red-50 text-gray-600 dark:text-gray-400 hover:text-red-600' 
                : isExactMatch
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 dark:bg-gray-800 hover:text-gray-900'
            } rounded-md mx-2 my-0.5`}
            onClick={onClose}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''} ${
                item.danger ? 'text-gray-400' : isExactMatch ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${level > 0 ? 'text-sm' : ''}`}>
                {item.label}
              </span>
            </div>
            {item.badge && (
              <span className={`px-2 py-1 text-xs rounded-full text-white ${
                item.badgeColor || 'bg-blue-600'
              }`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        </div>
      );
    }

    // Handle menu items with submenus or no href
    return (
      <div className="w-full">
        <div
          className={`flex items-center justify-between w-full px-3 py-2 text-left transition-all duration-200 ${
            level > 0 ? 'pl-8 py-2' : ''
          } ${
            item.danger 
              ? 'hover:bg-red-50 text-gray-600 dark:text-gray-400 hover:text-red-600' 
              : 'text-gray-700 hover:bg-gray-50 dark:bg-gray-800 hover:text-gray-900'
          } ${hasSubmenu ? 'cursor-pointer' : ''} rounded-md mx-2 my-0.5`}
          onClick={hasSubmenu ? () => toggleSubmenu(item.id) : undefined}
        >
          <div className="flex items-center space-x-3 flex-1">
            <Icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''} text-gray-400`} />
            <span className={`font-medium ${level > 0 ? 'text-sm' : ''}`}>
              {item.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className={`px-2 py-1 text-xs rounded-full text-white ${
                item.badgeColor || 'bg-blue-600'
              }`}>
                {item.badge}
              </span>
            )}
            {hasSubmenu && (
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>

        {hasSubmenu && isExpanded && (
          <div className="bg-gray-50 dark:bg-gray-800 border-l-2 border-blue-200 ml-4 mt-1 mb-2">
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
      {/* Overlay - Much lighter */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Increased width to 400px */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mould Market</h2>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <nav className="p-2">
            <div className="space-y-1">
              {bottomMenuItems.map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Ebrahim Kanchwala</p>
              <p className="text-xs text-gray-500">mouldmarket.com</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;