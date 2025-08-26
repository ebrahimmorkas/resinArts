import React, { useState, useEffect } from 'react'
import Navbar from '../../components/admin/Navbar'
import Sidebar from '../../components/admin/Sidebar'
import AddProduct from '../../components/admin/SidebarLinks/AddProduct';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  const [user, setUser] = useState(null);
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
    <div className="min-h-screen bg-slate-50">
      {/* Pass the toggle function to Navbar */}
      <Navbar onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
      
      {/* Pass the state and close function to Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Your main content goes here */}
      <main className="w-screen my-8">
        {/* <AddProduct></AddProduct> */}
        {/* <AddCategory></AddCategory> */}
        {/* <OrdersPanel></OrdersPanel> */}
        {/* <OrdersAccepted></OrdersAccepted> */}
        {/* <RestockPanel></RestockPanel> */}
        {/* <AllProducts></AllProducts> */}
        {/* <Orders></Orders> */}
        {/* <Users></Users> */}
        <Discount></Discount>
      </main>
    </div>
  )
}

export default AdminPanel