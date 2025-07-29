import { useState } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Signup from './pages/client/Signup';
import Login from './pages/client/Login';
import AdminPanel from './pages/admin/AdminPanel';
import Home from './pages/client/Home';
import OrdersPanel from './components/admin/SidebarLinks/orders/OrdersPanel';
import ProtectedRoute from './protectedRoutes';


function App() {
  return (
      <Routes>
        <Route path='/auth/signup' element={<Signup />} />
        <Route path='/auth/login' element={<Login />} />
        <Route path='/admin/panel' element={
          <ProtectedRoute allowedRole="admin">
            <AdminPanel />
          </ProtectedRoute>
          } />
        <Route path='/' element={
            <ProtectedRoute allowedRole="user">
              <Home />
            </ProtectedRoute>
          } />
        <Route path='/admin' element={<OrdersPanel />} />
      </Routes>
  );
}

export default App;
