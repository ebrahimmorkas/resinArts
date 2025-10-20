import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from '../../components/admin/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import AddProduct from '../../components/admin/SidebarLinks/AddProduct';
import AddCategory from '../../components/admin/SidebarLinks/AddCategory';
// import OrdersPanel from '../../components/admin/SidebarLinks/orders/OrdersPanel';
// import OrdersAccepted from '../../components/admin/SidebarLinks/orders/OrdersAccepted';
// import RestockPanel from '../../components/admin/SidebarLinks/products/RestockPanel';
import AllProducts from '../../components/admin/SidebarLinks/products/AllProducts';
import Orders from '../../components/admin/SidebarLinks/orders/Orders';
import Users from '../../components/admin/SidebarLinks/users/Users';
import Discount from '../../components/admin/SidebarLinks/Discount/Discount';
import AddBanner from '../../components/admin/SidebarLinks/Banner/AddBanner';
import AllBanners from '../../components/admin/SidebarLinks/Banner/AllBanners';
import AddAnnouncement from '../../components/admin/SidebarLinks/Announcement/AddAnnouncement';
import AllAnnouncement from '../../components/admin/SidebarLinks/Announcement/AllAnnouncement';
import BulkUpload from '../../components/admin/SidebarLinks/products/BulkUpload';
import AllCategories from '../../components/admin/SidebarLinks/Category/AllCategories';
import EditProduct from '../../components/admin/SidebarLinks/products/EditProduct';
import BulkEditProducts from '../../components/admin/SidebarLinks/products/BulkEditProducts';
import CompanySettings from '../../components/admin/SidebarLinks/CompanySettings/CompanySettings';
import AbandonedCart from '../../components/admin/SidebarLinks/AbandonedCart/AbandonedCart';
import AdminProfileUpdate from './AdminProfileUpdate';
import BulkUploadCategories from '../../components/admin/SidebarLinks/Category/BulkUploadCategories';
import BulkUploadProducts from '../../components/admin/SidebarLinks/products/BulkUploadProducts';

function AdminPanel() {
  // State to manage sidebar open/close - starts closed
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Pass the toggle function to Navbar */}
      <Navbar onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
      
      {/* Pass the state and close function to Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content with routes - Full width always, no overlay interference */}
      <div className="pt-16 min-h-screen w-screen">
        <main className="p-4 sm:p-6 w-full min-w-full">
          <div className="w-full min-w-full overflow-x-hidden">
            <Routes>
              <Route index element={<Orders />} /> {/* Default route for /admin/panel */}
              <Route path="dashboard" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Dashboard Component</div>} />

              {/* Start Product routes */}
              <Route path="products" element={<AllProducts />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="products/bulk-upload" element={<BulkUploadProducts />} />
              <Route path="products/bulk-edit/:ids" element={<BulkEditProducts />} />
              {/* End of product routes */}

              {/* Start of orders routes */}
              <Route path="orders" element={<Orders />} />
              {/* End of orders routes */}
              {/* <Route path="orders/pending" element={<OrdersPanel />} /> */}
              {/* <Route path="orders/completed" element={<OrdersAccepted />} /> */}

              {/* Start of customers routes */}
              <Route path="customers" element={<Users />} />
              {/* End of customers routes */}

              {/* Start of discount routes */}
              <Route path="discount" element={<Discount />} />
              {/* End of discount routes */}

              {/* Start of banners routes */}
              <Route path="banner/add" element={<AddBanner />} />
              <Route path="banner/all" element={<AllBanners />} />
              {/* End of banners routes */}

              {/* Start of banners routes */}
              <Route path="announcement/add" element={<AddAnnouncement />} />
              <Route path="announcement/all" element={<AllAnnouncement />} />
              {/* End of banners routes */}

              {/* Start of categories routes */}
              <Route path="categories/add" element={<AddCategory />} />
              <Route path="categories/all" element={<AllCategories />} />
              <Route path="categories/bulk-upload" element={<BulkUploadCategories />} />
              {/* End of categories routes */}

              {/* Start of company settings routes */}
              <Route path="company-settings" element={<CompanySettings />} />
              {/* End of company settings routes */}
              
              {/* Start of abandoned cart routes */}
              <Route path="abandoned-cart" element={<AbandonedCart />} />
              {/* End of abandoned cart routes */}

              {/* Start of update admin profile */}
              <Route path="profile/update" element={<AdminProfileUpdate />} />
              {/* End of update admin profile */}

              {/* Additional routes for new menu items */}
              {/* <Route path="analytics/sales" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Sales Report Component</div>} />
              <Route path="analytics/revenue" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Revenue Component</div>} />
              <Route path="analytics/products" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Product Performance Component</div>} />
              <Route path="analytics/customers" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Customer Insights Component</div>} />
              
              <Route path="shipping/zones" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Shipping Zones Component</div>} />
              <Route path="shipping/rates" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Shipping Rates Component</div>} />
              <Route path="shipping/tracking" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Tracking Component</div>} />
              
              <Route path="payments/transactions" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Transactions Component</div>} />
              <Route path="payments/payouts" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Payouts Component</div>} />
              <Route path="payments/methods" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Payment Methods Component</div>} /> */}
              
              <Route path="store/info" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Store Information Component</div>} />
              <Route path="store/appearance" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Store Appearance Component</div>} />
              <Route path="store/policies" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Store Policies Component</div>} />
            
              <Route path="settings/notifications" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Notifications Settings Component</div>} />
              <Route path="settings/security" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Security Settings Component</div>} />
              
              <Route path="help" element={<div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full">Help & Support Component</div>} />
              
              {/* Fallback route */}
              <Route path="*" element={<Orders />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;