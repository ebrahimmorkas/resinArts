import React, { useState } from 'react';
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
      href: '/dashboard',
      badge: null
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: '24',
      submenu: [
        { id: 'all-products', label: 'All Products', icon: List, href: '/products' },
        { id: 'add-product', label: 'Add Product', icon: Plus, href: '/products/add' },
        { id: 'edit-products', label: 'Edit Products', icon: Edit3, href: '/products/edit' },
        { id: 'categories', label: 'Categories', icon: List, href: '/products/categories' },
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      badge: '8',
      badgeColor: 'bg-red-500',
      submenu: [
        { id: 'all-orders', label: 'All Orders', icon: List, href: '/orders' },
        { id: 'pending-orders', label: 'Pending Orders', icon: Clock, href: '/orders/pending' },
        { id: 'shipped-orders', label: 'Shipped Orders', icon: Truck, href: '/orders/shipped' },
        { id: 'completed-orders', label: 'Completed Orders', icon: UserCheck, href: '/orders/completed' },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      submenu: [
        { id: 'sales-report', label: 'Sales Report', icon: TrendingUp, href: '/analytics/sales' },
        { id: 'revenue', label: 'Revenue', icon: DollarSign, href: '/analytics/revenue' },
        { id: 'product-performance', label: 'Product Performance', icon: Eye, href: '/analytics/products' },
        { id: 'customer-insights', label: 'Customer Insights', icon: Users, href: '/analytics/customers' },
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: '156',
      href: '/customers'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      badge: '12',
      badgeColor: 'bg-yellow-500',
      href: '/reviews'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: '5',
      badgeColor: 'bg-blue-500',
      href: '/messages'
    },
    {
      id: 'shipping',
      label: 'Shipping',
      icon: Truck,
      submenu: [
        { id: 'shipping-zones', label: 'Shipping Zones', icon: Map, href: '/shipping/zones' },
        { id: 'shipping-rates', label: 'Shipping Rates', icon: DollarSign, href: '/shipping/rates' },
        { id: 'tracking', label: 'Tracking', icon: Eye, href: '/shipping/tracking' },
      ]
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      submenu: [
        { id: 'transactions', label: 'Transactions', icon: List, href: '/payments/transactions' },
        { id: 'payouts', label: 'Payouts', icon: DollarSign, href: '/payments/payouts' },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, href: '/payments/methods' },
      ]
    },
    {
      id: 'store',
      label: 'Store Settings',
      icon: Store,
      submenu: [
        { id: 'store-info', label: 'Store Information', icon: Settings, href: '/store/info' },
        { id: 'store-appearance', label: 'Appearance', icon: Edit3, href: '/store/appearance' },
        { id: 'store-policies', label: 'Policies', icon: Shield, href: '/store/policies' },
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      submenu: [
        { id: 'account-settings', label: 'Account Settings', icon: User, href: '/settings/account' },
        { id: 'notifications', label: 'Notifications', icon: Bell, href: '/settings/notifications' },
        { id: 'security', label: 'Security', icon: Shield, href: '/settings/security' },
      ]
    },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { id: 'logout', label: 'Logout', icon: LogOut, href: '/logout', danger: true },
  ];

  const MenuItem = ({ item, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];
    const Icon = item.icon;

    return (
      <div className="w-full">
        <div
          className={`flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-200 group ${
            level > 0 ? 'pl-12 py-2' : ''
          } ${
            item.danger 
              ? 'hover:bg-red-500/10 text-slate-300 hover:text-red-400' 
              : 'hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400'
          } ${
            hasSubmenu ? 'cursor-pointer' : ''
          }`}
          onClick={hasSubmenu ? () => toggleSubmenu(item.id) : undefined}
        >
          <div className="flex items-center space-x-3 flex-1">
            <Icon className={`w-5 h-5 ${level > 0 ? 'w-4 h-4' : ''} transition-colors duration-200`} />
            <span className={`font-medium ${level > 0 ? 'text-sm' : ''}`}>
              {item.label}
            </span>
            {item.badge && (
              <span className={`px-2 py-1 text-xs rounded-full text-white ${
                item.badgeColor || 'bg-emerald-500'
              }`}>
                {item.badge}
              </span>
            )}
          </div>
          {hasSubmenu && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </div>
          )}
        </div>

        {hasSubmenu && isExpanded && (
          <div className="bg-slate-800/50 border-l-2 border-emerald-500/20 ml-6">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-r border-slate-700 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SellerHub</h2>
              <p className="text-sm text-slate-400">Seller Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <nav className="py-4">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
            
            {/* Bottom Menu Items in scrollable area */}
            <div className="border-t border-slate-700 bg-slate-800/50 mt-4">
              <div className="py-2">
                {bottomMenuItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-slate-500">© 2024 SellerHub</p>
            <p className="text-xs text-slate-500 mt-1">v2.1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;