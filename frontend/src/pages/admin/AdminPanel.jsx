import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from '../../components/admin/Navbar';
import Sidebar from '../../components/admin/Sidebar';
import AddProduct from '../../components/admin/SidebarLinks/AddProduct';
import AddCategory from '../../components/admin/SidebarLinks/AddCategory';
import OrdersPanel from '../../components/admin/SidebarLinks/orders/OrdersPanel';
import OrdersAccepted from '../../components/admin/SidebarLinks/orders/OrdersAccepted';
import RestockPanel from '../../components/admin/SidebarLinks/products/RestockPanel';
import AllProducts from '../../components/admin/SidebarLinks/products/AllProducts';
import Orders from '../../components/admin/SidebarLinks/orders/Orders';
import Users from '../../components/admin/SidebarLinks/users/Users';
import Discount from '../../components/admin/SidebarLinks/Discount/Discount';

function AdminPanel() {
  // State to manage sidebar open/close
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
    <div className="min-h-screen bg-gray-50">
      {/* Pass the toggle function to Navbar */}
      <Navbar onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
      
      {/* Pass the state and close function to Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content with routes */}
      <main className="w-screen my-8">
        <Routes>
          <Route index element={<Orders />} /> {/* Default route for /admin/panel */}
          <Route path="dashboard" element={<div>Dashboard Component</div>} />
          <Route path="products" element={<AllProducts />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/categories" element={<AddCategory />} />
          <Route path="orders" element={<Orders />} /> {/* Route for /admin/panel/orders */}
          <Route path="orders/pending" element={<OrdersPanel />} />
          <Route path="orders/completed" element={<OrdersAccepted />} />
          <Route path="customers" element={<Users />} />
          <Route path="discount" element={<Discount />} />
          <Route path="products/restock" element={<RestockPanel />} />
          {/* Add more routes for other menu items as needed */}
          <Route path="*" element={<Orders />} /> {/* Fallback route */}
        </Routes>
      </main>
    </div>
  );
}

export default AdminPanel;