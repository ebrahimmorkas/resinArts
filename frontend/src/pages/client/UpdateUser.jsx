import React, { useState, useEffect, useContext } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../../../Context/AuthContext'; // Adjust path as needed
import axios from 'axios';

const UpdateUser = () => {
    const { user: currentUser } = useContext(AuthContext);
    
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        whatsapp_number: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Load user profile data
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                setIsLoadingData(true);
                const response = await axios.get('https://api.simplyrks.cloud/api/user/profile', {
    withCredentials: true // Send HTTP-only cookies
});

                // Log the full response for debugging
                console.log('GET API Response:', response.data);

                // Check if response.data.user exists
                if (!response.data.user) {
                    throw new Error(response.data.message || 'User data not found in response');
                }

                const userData = response.data.user;
                
                setFormData({
                    first_name: userData.first_name || '',
                    middle_name: userData.middle_name || '',
                    last_name: userData.last_name || '',
                    email: userData.email || '',
                    phone_number: userData.phone_number || '',
                    whatsapp_number: userData.whatsapp_number || '',
                    address: userData.address || '',
                    city: userData.city || '',
                    state: userData.state || '',
                    zip_code: userData.zip_code || '',
                    password: '',
                    confirmPassword: ''
                });
            } catch (error) {
                console.error('Error loading profile:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile data';
                showToast(errorMessage, 'error');
            } finally {
                setIsLoadingData(false);
            }
        };

        if (currentUser) {
            loadUserProfile();
        }
    }, [currentUser]);

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'first_name':
                if (!value.trim()) {
                    newErrors[name] = 'First name is required';
                } else if (value.length < 2) {
                    newErrors[name] = 'First name must be at least 2 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors[name] = 'First name can only contain letters and spaces';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'last_name':
                if (!value.trim()) {
                    newErrors[name] = 'Last name is required';
                } else if (value.length < 2) {
                    newErrors[name] = 'Last name must be at least 2 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors[name] = 'Last name can only contain letters and spaces';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'middle_name':
                if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors[name] = 'Middle name can only contain letters and spaces';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'email':
                if (!value.trim()) {
                    newErrors[name] = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors[name] = 'Please enter a valid email address';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'phone_number':
                if (!value.trim()) {
                    newErrors[name] = 'Phone number is required';
                } else if (!/^\d{10}$/.test(value.replace(/\s+/g, ''))) {
                    newErrors[name] = 'Phone number must be 10 digits';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'whatsapp_number':
                if (!value.trim()) {
                    newErrors[name] = 'WhatsApp number is required';
                } else if (!/^\d{10}$/.test(value.replace(/\s+/g, ''))) {
                    newErrors[name] = 'WhatsApp number must be 10 digits';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'address':
                if (!value.trim()) {
                    newErrors[name] = 'Address is required';
                } else if (value.length < 10) {
                    newErrors[name] = 'Address must be at least 10 characters';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'city':
                if (!value.trim()) {
                    newErrors[name] = 'City is required';
                } else if (value.length < 2) {
                    newErrors[name] = 'City must be at least 2 characters';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'state':
                if (!value.trim()) {
                    newErrors[name] = 'State is required';
                } else if (value.length < 2) {
                    newErrors[name] = 'State must be at least 2 characters';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'zip_code':
                if (!value.trim()) {
                    newErrors[name] = 'ZIP code is required';
                } else if (!/^\d{6}$/.test(value)) {
                    newErrors[name] = 'ZIP code must be 6 digits';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'password':
                if (value && value.length < 6) {
                    newErrors[name] = 'Password must be at least 6 characters';
                } else if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    newErrors[name] = 'Password must contain uppercase, lowercase and number';
                } else {
                    delete newErrors[name];
                }
                break;

            case 'confirmPassword':
                if (value && value !== formData.password) {
                    newErrors[name] = 'Passwords do not match';
                } else {
                    delete newErrors[name];
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Real-time validation
        validateField(name, value);
        
        // Also validate confirmPassword if password changed
        if (name === 'password' && formData.confirmPassword) {
            validateField('confirmPassword', formData.confirmPassword);
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all required fields
        const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'whatsapp_number', 'address', 'city', 'state', 'zip_code'];
        let hasErrors = false;

        requiredFields.forEach(field => {
            if (!formData[field] || !formData[field].trim()) {
                validateField(field, formData[field]);
                hasErrors = true;
            }
        });

        // Validate optional fields that have values
        if (formData.middle_name) {
            validateField('middle_name', formData.middle_name);
        }
        if (formData.password) {
            validateField('password', formData.password);
            validateField('confirmPassword', formData.confirmPassword);
        }

        // Check for errors
        if (hasErrors || Object.keys(errors).length > 0) {
            showToast('Please fix all errors before submitting', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // Prepare data for submission (exclude confirmPassword)
            const submitData = { ...formData };
            delete submitData.confirmPassword;
            
            // Remove empty password field if not changing password
            if (!submitData.password || !submitData.password.trim()) {
                delete submitData.password;
            }

            // Log the data being sent for debugging
            console.log('PUT Request Data:', submitData);

            const response = await axios.put('https://api.simplyrks.cloud/api/user/update-profile', submitData, {
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Send HTTP-only cookies
});
            showToast(response.data.message || 'Profile updated successfully!', 'success');
            
            // Clear password fields after successful update
            setFormData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const Toast = ({ show, message, type }) => {
        if (!show) return null;
        
        return (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
                type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
                {message}
            </div>
        );
    };

    // Show loading spinner while fetching data
    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-lg text-gray-700">Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
            <Toast {...toast} />
            
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Update Profile</h1>
                                <p className="text-blue-100">Keep your information up to date</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="p-8 space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.first_name 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter first name"
                                    />
                                    {errors.first_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.middle_name 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter middle name"
                                    />
                                    {errors.middle_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.middle_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.last_name 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter last name"
                                    />
                                    {errors.last_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.email 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.phone_number 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        WhatsApp Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="whatsapp_number"
                                        value={formData.whatsapp_number}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.whatsapp_number 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2`}
                                        placeholder="Enter WhatsApp number"
                                    />
                                    {errors.whatsapp_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.whatsapp_number}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                Address Information
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                            errors.address 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:outline-none focus:ring-2 resize-none`}
                                        placeholder="Enter full address"
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                                errors.city 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:outline-none focus:ring-2`}
                                            placeholder="Enter city"
                                        />
                                        {errors.city && (
                                            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                                errors.state 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:outline-none focus:ring-2`}
                                            placeholder="Enter state"
                                        />
                                        {errors.state && (
                                            <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ZIP Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="zip_code"
                                            value={formData.zip_code}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                                                errors.zip_code 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:outline-none focus:ring-2`}
                                            placeholder="Enter ZIP code"
                                        />
                                        {errors.zip_code && (
                                            <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                                Change Password (Optional)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
                                                errors.password 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:outline-none focus:ring-2`}
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
                                                errors.confirmPassword 
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:outline-none focus:ring-2`}
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center ${
                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Updating...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Save className="h-5 w-5 mr-2" />
                                        Update Profile
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateUser;