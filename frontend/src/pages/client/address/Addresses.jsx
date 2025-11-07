import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Edit, Trash2, Plus, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import Navbar from '../../../components/client/common/Navbar';
import StickyFooter from '../../../components/client/common/StickyFooter';
import Footer from '../../../components/client/common/Footer';
import { AuthContext } from '../../../../Context/AuthContext';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
const [homeAddress, setHomeAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, addressId: null, addressName: '' });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    fetchAddresses();
  }, [user, navigate]);

  const fetchAddresses = async () => {
  try {
    setIsLoading(true);
    
    // Fetch user's home address
    const userResponse = await axios.get('http://localhost:3000/api/user/profile', {
      withCredentials: true
    });
    const userData = userResponse.data.user;
    setHomeAddress({
      name: 'Home',
      state: userData.state,
      city: userData.city,
      pincode: userData.zip_code,
      full_address: userData.address
    });
    
    // Fetch saved addresses
    const response = await axios.get('http://localhost:3000/api/address', {
      withCredentials: true
    });
    setAddresses(response.data.addresses);
    setErrorMessage('');
  } catch (error) {
    console.error('Error fetching addresses:', error);
    setErrorMessage(error.response?.data?.message || 'Failed to fetch addresses');
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async (addressId) => {
    try {
      await axios.delete(`http://localhost:3000/api/address/${addressId}`, {
        withCredentials: true
      });
      setAddresses(addresses.filter(addr => addr._id !== addressId));
      setDeleteConfirm({ show: false, addressId: null, addressName: '' });
      setErrorMessage('');
    } catch (error) {
      console.error('Error deleting address:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to delete address');
      setDeleteConfirm({ show: false, addressId: null, addressName: '' });
    }
  };

  const handleEdit = (addressId) => {
    navigate(`/address/update/${addressId}`);
  };

  const handleAddNew = () => {
    navigate('/address/add');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      
      <div className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your saved addresses</p>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Address
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Loading State */}
         {isLoading ? (
  <div className="flex justify-center items-center py-20">
    <Loader className="w-8 h-8 animate-spin text-blue-600" />
  </div>
) : !homeAddress && addresses.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No Addresses Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first address to get started</p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Address
              </button>
            </div>
          ) : (
  /* Address Cards Grid */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Home Address Card (Default) */}
    {homeAddress && (
      <div className="bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
        {/* Address Name Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
            <MapPin className="w-4 h-4" />
            {homeAddress.name}
          </span>
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
            Default
          </span>
        </div>

        {/* Address Details */}
        <div className="space-y-2 mb-6">
          <p className="text-gray-900 dark:text-white font-medium">{homeAddress.full_address}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {homeAddress.city}, {homeAddress.state}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            PIN: {homeAddress.pincode}
          </p>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            This is your default address from profile. Edit it from Profile Settings.
          </p>
        </div>
      </div>
    )}

    {/* Saved Addresses */}
    {addresses.map((address) => (
                <div
                  key={address._id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Address Name Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                      <MapPin className="w-4 h-4" />
                      {address.name}
                    </span>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-2 mb-6">
                    <p className="text-gray-900 dark:text-white font-medium">{address.full_address}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {address.city}, {address.state}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      PIN: {address.pincode}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(address._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, addressId: address._id, addressName: address.name })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Address</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the address "<span className="font-semibold">{deleteConfirm.addressName}</span>"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, addressId: null, addressName: '' })}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.addressId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <StickyFooter />
    </div>
  );
};

export default Addresses;