import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { CompanySettingsContext } from '../../../Context/CompanySettingsContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const navigate = useNavigate();
  const {setUser} = useAuth();
  const { companySettings, loadingSettings } = useContext(CompanySettingsContext);

  useEffect(() => {
    const checkoutIntent = localStorage.getItem('checkoutIntent');
    if (checkoutIntent === 'true') {
      setCheckoutMessage("You're almost there! Log in to complete your purchase and track your order easily.");
    }
  }, []);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const formData = {
        email,
        password
    }

    try{
        const res = await axios.post(
          'http://localhost:3000/api/auth/login', 
          formData,
          {withCredentials: true}
        )
        
        setUser(res.data.user);
        sessionStorage.clear();
        setLoading(false);
        
        const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
        const checkoutIntent = localStorage.getItem('checkoutIntent');
        
        localStorage.removeItem('redirectAfterLogin');
        localStorage.removeItem('checkoutIntent');
        
        if(res.data.user.role === 'admin') {
          navigate('/admin/panel');
        } else {
          if (checkoutIntent === 'true') {
            navigate('/');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openCartAfterLogin'));
            }, 500);
          } else if (redirectAfterLogin) {
            navigate(redirectAfterLogin);
          } else {
            navigate('/');
          }
        }

    } catch(err) {
      setLoading(false);
      setPassword('');
      
      if(err.response && err.response.data) {
        setErrorMessages(err.response.data.message);
      } else {
        setErrorMessages('Something went wrong. Please try again');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600">
    {loadingSettings ? 'Loading...' : companySettings?.companyName || 'Online Shop'}
  </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to your account</p>
          </div>

          {/* Checkout Message */}
          {checkoutMessage && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">{checkoutMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Messages */}
            {errorMessages && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{errorMessages}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="name@example.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-blue-600 font-medium rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;