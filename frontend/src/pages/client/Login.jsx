import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {setUser} = useAuth();

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const formData = {
        email,
        password
    }

    try{
        const res = await axios.post(
          'https://api.simplyrks.cloud/api/auth/login', 
          formData,
          {withCredentials: true}
        )
        // Setting the global state of the user
        setUser(res.data.user);


        setLoading(false)
        if(res.data.user.role === 'admin') {
          navigate('/admin/panel');
        } else {
          navigate('/');
        }

    } catch(err) {
      setLoading(false)
      setPassword('');
        // console.log(err);
        if(err.response && err.response.data) {
          setErrorMessages(err.response.data.message);
        }
        else {
          setErrorMessages('Something went wrong. Please try again');
        }
    }
    
    console.log('Login submitted:', { email, password });
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 bg-cover bg-center bg-no-repeat p-0">
      <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* <div className="flex justify-center mb-6">
          <img src="/assets/mouldmarket-logo.png" alt="Mouldmarket Logo" className="h-16" />
        </div> */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Mouldmarket</h2>
        <p className="text-center text-gray-600 mb-8">Sign in to your creative marketplace</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className='bg-red-200 rounded py-4'>{errorMessages}</div>
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
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
          >
            Sign In
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
          {
            isLoading ? 'Signing in' : 'Sign up'
          }
            
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;