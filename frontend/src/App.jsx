import { useState } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Signup from './pages/client/Signup';
import Login from './pages/client/Login';
import AdminPanel from './pages/admin/AdminPanel';
import Home from './pages/client/Home';
import Orders from './pages/client/Orders';
import OrdersPanel from './components/admin/SidebarLinks/orders/OrdersPanel';
import ProtectedRoute from './protectedRoutes';
import UpdateUser from './pages/client/UpdateUser';

function App() {
  return (
      <Routes>
        <Route path='/auth/signup' element={<Signup />} />
        <Route path='/auth/login' element={<Login />} />
        <Route path='/admin/panel/*' element={
          <ProtectedRoute allowedRole="admin">
            <AdminPanel />
          </ProtectedRoute>
          } />
        <Route path='/' element={
            <ProtectedRoute allowedRole="user">
              <Home />
            </ProtectedRoute>
          } />
        <Route path='/user/update-profile' element={
            <ProtectedRoute allowedRole="user">
              <UpdateUser />
            </ProtectedRoute>
          } />
        <Route path='/orders/:userId' element={
            <ProtectedRoute allowedRole="user">
              <Orders />
            </ProtectedRoute>
          } />
          
        
        <Route path='/admin' element={<OrdersPanel />} />
      </Routes>
  );
}

export default App;
