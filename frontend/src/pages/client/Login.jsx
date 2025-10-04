import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

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
            // Trigger cart opening after navigation (you may need to adjust this based on your state management)
            setTimeout(() => {
              // This will be handled by the cart context after login
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
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-cover bg-center bg-no-repeat p-0">
      <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Mouldmarket</h2>
        <p className="text-center text-gray-600 mb-8">Sign in to your creative marketplace</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessages && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
              {errorMessages}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              placeholder="••••••••"
            />
            <div className="mt-2 text-left">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700">
                Show Password
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="text-center">
            <a href="/forgot-password" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Forgot Password?
            </a>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-purple-600 hover:text-purple-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;