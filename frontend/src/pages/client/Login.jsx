import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const navigate = useNavigate();
  const {setUser} = useAuth();

  // Check if user was redirected from checkout
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
        
        // Setting the global state of the user
        setUser(res.data.user);

        setLoading(false);
        
        // Check if there's a redirect intention or checkout intent
        const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
        const checkoutIntent = localStorage.getItem('checkoutIntent');
        
        // Clear the stored intents
        localStorage.removeItem('redirectAfterLogin');
        localStorage.removeItem('checkoutIntent');
        
        // Determine where to redirect
        if(res.data.user.role === 'admin') {
          navigate('/admin/panel');
        } else {
          // User role
          if (checkoutIntent === 'true') {
            // User was trying to checkout - redirect to home and open cart
            navigate('/');
            // Trigger cart opening after navigation
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openCartAfterLogin'));
            }, 500);
          } else if (redirectAfterLogin) {
            // Redirect to the stored location
            navigate(redirectAfterLogin);
          } else {
            // Default redirect to home
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Mouldmarket</h1>
            <p className="text-gray-600">Welcome back! Please login to your account</p>
          </div>

          {/* Checkout Message */}
          {checkoutMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{checkoutMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Messages */}
            {errorMessages && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errorMessages}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700">
                  Show Password
                </label>
              </div>
              <Link to="/auth/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
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