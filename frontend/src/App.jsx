import { useState } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Signup from './pages/client/Signup';
import Login from './pages/client/Login';
import AdminPanel from './pages/admin/AdminPanel';
import Home from './pages/client/Home';
import OrdersPanel from './components/admin/SidebarLinks/orders/OrdersPanel';

function App() {
  return (
      <Routes>
        <Route path='/auth/signup' element={<Signup />} />
        <Route path='/auth/login' element={<Login />} />
        <Route path='/admin/panel' element={<AdminPanel />} />
        <Route path='/' element={<Home />} />
        <Route path='/admin' element={<OrdersPanel />} />
      </Routes>
  );
}

export default App;
