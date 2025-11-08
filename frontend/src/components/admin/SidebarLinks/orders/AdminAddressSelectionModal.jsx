import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader } from 'lucide-react';
import axios from 'axios';

const AdminAddressSelectionModal = ({ isOpen, onClose, onSelectAddress, currentAddressId, userId, currentAddress }) => {
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

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch user's data to get home address
      const userResponse = await axios.post(
        'http://localhost:3000/api/user/find-user',
        { userId },
        { withCredentials: true }
      );
      
      const userData = userResponse.data.userAddress;
      console.log( `userData ${userData}`)
      if (userData) {
        setUserHomeAddress({
          id: null,
          name: 'Home',
          state: userData.state,
          city: userData.city,
          pincode: userData.zipCode,
          full_address: userData.address
        });
      }

      // Fetch saved addresses from Address model
      // Note: Admin fetching user's addresses requires proper authorization
      const addressResponse = await axios.get(
        `http://localhost:3000/api/address/user/${userId}`,
        { withCredentials: true }
      );
      
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Delivery Address</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Note about manual shipping price update */}
  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-sm text-yellow-800 dark:text-yellow-200">
      <strong>Note:</strong> If your shipping price location is not present in the system, you will need to manually update the shipping price after changing the address.
    </p>
  </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Current Address Indicator */}
              {currentAddress && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Current Delivery Address:</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {currentAddress.name} - {currentAddress.full_address}, {currentAddress.city}, {currentAddress.state} - {currentAddress.pincode}
                  </p>
                </div>
              )}

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
                  <p className="text-sm">No saved addresses found for this user.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedId === undefined}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-black dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Confirm Address Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAddressSelectionModal;