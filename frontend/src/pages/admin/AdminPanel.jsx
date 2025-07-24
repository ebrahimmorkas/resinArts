import React, { useState, useEffect } from 'react'
import Navbar from '../../components/admin/Navbar'
import Sidebar from '../../components/admin/Sidebar'
import AddProduct from '../../components/admin/SidebarLinks/AddProduct';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddCategory from '../../components/admin/SidebarLinks/AddCategory';

function AdminPanel() {
  // State to manage sidebar open/close
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async() => {
      try {
        const res = await axios.get(
          'http://localhost:3000/api/auth/me',
          {withCredentials: true},
        );
        console.log("You are logged in")
        setUser(res.data.user)
      } catch(err) {
        setUser(null);
        navigate('/auth/login');
      }

    }
    checkLogin();
  }, [])
  
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
        <AddProduct></AddProduct>
        {/* <AddCategory></AddCategory> */}
      </main>
    </div>
  )
}

export default AdminPanel