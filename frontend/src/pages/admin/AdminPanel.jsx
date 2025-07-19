import React, { useState } from 'react'
import Navbar from '../../components/admin/Navbar'
import Sidebar from '../../components/admin/Sidebar'
import AddProduct from '../../components/admin/SidebarLinks/AddProduct';

function AdminPanel() {
  // State to manage sidebar open/close
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <main className="w-screen bg-red-700
      ">
        <AddProduct></AddProduct>
      </main>
    </div>
  )
}

export default AdminPanel