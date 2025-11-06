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
import ForgotPassword from './pages/client/ForgotPassword';
import ResetPassword from './pages/client/ResetPassword';
import ProductDetailsPage from './pages/client/ProductDetailsPage';
import FavoritesPage from './pages/client/FavoritesPage';
import Addresses from './pages/client/address/Addresses';
import AddAddress from './pages/client/address/AddAddress';
import UpdateAddress from './pages/client/address/UpdateAddress';
import useCompanySettings from '../hooks/useCompanySettings';

function App() {
  useCompanySettings();

  return (
      <Routes>
        {/* Routes for login and signup */}
        <Route path='/auth/signup' element={<Signup />} />
        <Route path='/auth/login' element={<Login />} />

        {/* Routes for forgot and reset password */}
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
        
        {/* Admin routes - protected */}
        <Route path='/admin/panel/*' element={
          <ProtectedRoute allowedRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } />
        
        {/* Home route - PUBLIC (no protection) */}
        <Route path='/' element={<Home />} />
        {/* Product details route - PUBLIC */}
<Route path='/product/:productId' element={<ProductDetailsPage />} />
        
        {/* User-specific routes - protected */}
        <Route path='/user/update-profile' element={
          <ProtectedRoute allowedRole="user">
            <UpdateUser />
          </ProtectedRoute>
        } />

        <Route path="/favorites" element={
          <ProtectedRoute allowedRole="user">
            <FavoritesPage />
          </ProtectedRoute>
        } />
        
        <Route path='/orders/:userId' element={
          <ProtectedRoute allowedRole="user">
            <Orders />
          </ProtectedRoute>
        } />

{/* Start fo addresses routes */}
        <Route path="address/all" element={
          <ProtectedRoute allowedRole="user">
            <Addresses />
          </ProtectedRoute>
        } />
        <Route path="address/add" element={
          <ProtectedRoute allowedRole="user">
            <AddAddress />
          </ProtectedRoute>
        } />
        <Route path="address/update/:id" element={
          <ProtectedRoute allowedRole="user">
            <UpdateAddress />
          </ProtectedRoute>
        } />
        {/* End of addresses routes */}
        
        <Route path='/admin' element={<OrdersPanel />} />
      </Routes>
  );
}

export default App;