import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader } from 'lucide-react';
import axios from 'axios';

const AddressSelectionModal = ({ isOpen, onClose, onSelectAddress, currentAddressId, userId }) => {
  const [addresses, setAddresses] = useState([]);
  const [userHomeAddress, setUserHomeAddress] = useState(null);
  const [selectedId, setSelectedId] = useState(currentAddressId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  if (isOpen && userId) {
    fetchAddresses();
  }
}, [isOpen, userId]);

// useEffect to set initial selection based on currentAddressId
useEffect(() => {
  if (isOpen && currentAddressId !== undefined) {
    setSelectedId(currentAddressId);
  }
}, [isOpen, currentAddressId]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch user's home address from User model
      const userResponse = await axios.get('http://localhost:3000/api/user/profile', {
        withCredentials: true
      });
      
      const user = userResponse.data.user;
      setUserHomeAddress({
        id: null, // null means home address
        name: 'Home',
        state: user.state,
        city: user.city,
        pincode: user.zip_code,
        full_address: user.address
      });

      // Fetch saved addresses from Address model
      const addressResponse = await axios.get('http://localhost:3000/api/address', {
        withCredentials: true
      });
      
      setAddresses(addressResponse.data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (addressData) => {
    setSelectedId(addressData.id);
  };

  const handleConfirm = () => {
    if (selectedId === null) {
      // Home address selected
      onSelectAddress(userHomeAddress);
    } else {
      // Custom address selected
      const selected = addresses.find(addr => addr._id === selectedId);
      if (selected) {
        onSelectAddress({
          id: selected._id,
          name: selected.name,
          state: selected.state,
          city: selected.city,
          pincode: selected.pincode,
          full_address: selected.full_address
        });
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Delivery Address</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Home Address (from User model) */}
              {userHomeAddress && (
                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedId === null
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === null}
                    onChange={() => handleSelect(userHomeAddress)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">{userHomeAddress.name}</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {userHomeAddress.full_address}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userHomeAddress.city}, {userHomeAddress.state} - {userHomeAddress.pincode}
                    </p>
                  </div>
                </label>
              )}

              {/* Saved Addresses (from Address model) */}
              {addresses.map((address) => (
                <label
                  key={address._id}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedId === address._id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === address._id}
                    onChange={() => handleSelect({ id: address._id })}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{address.name}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {address.full_address}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                </label>
              ))}

              {/* No saved addresses */}
              {addresses.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No saved addresses found.</p>
                  <p className="text-xs mt-1">You can add addresses from your profile.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedId === undefined}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectionModal;