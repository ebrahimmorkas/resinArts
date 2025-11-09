import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Navbar from '../../../components/client/common/Navbar';
import StickyFooter from '../../../components/client/common/StickyFooter';
import Footer from '../../../components/client/common/Footer';
import { AuthContext } from '../../../../Context/AuthContext';

const indianStatesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Ziro", "Along", "Tezu", "Changlang", "Khonsa"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"],
  Chhattisgarh: ["Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund"],
  Goa: ["Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Valpoi", "Pernem"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari"],
  Haryana: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundernagar", "Chamba"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
  Karnataka: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kasaragod"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Jiribam", "Moreh"],
  Meghalaya: ["Shillong", "Tura", "Cherrapunji", "Jowai", "Baghmara", "Nongpoh", "Mawkyrwat", "Resubelpara", "Ampati", "Williamnagar"],
  Mizoram: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Mamit", "Lawngtlai", "Saitual", "Khawzawl"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Batala", "Pathankot", "Moga"],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  Sikkim: ["Gangtok", "Namchi", "Geyzing", "Mangan", "Jorethang", "Nayabazar", "Rangpo", "Singtam", "Pakyong", "Ravangla"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
  Tripura: ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai", "Ambassa", "Ranir Bazar", "Sonamura", "Kumarghat"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"],
  Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Manglaur", "Herbertpur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"],
  Delhi: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "North East Delhi", "North West Delhi", "South East Delhi", "South West Delhi"],
};

const SearchableDropdown = ({ options, value, onChange, placeholder, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-left"
      >
        {value || placeholder}
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-300 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-gray-700 focus:outline-none transition-colors text-gray-900 dark:text-white"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UpdateAddress = () => {
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    city: '',
    pincode: '',
    full_address: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    fetchAddress();
  }, [user, navigate, id]);

  const fetchAddress = async () => {
    try {
      setIsFetching(true);
      const response = await axios.get(`http://localhost:3000/api/address/${id}`, {
        withCredentials: true
      });
      const address = response.data.address;
      setFormData({
        name: address.name,
        state: address.state,
        city: address.city,
        pincode: address.pincode,
        full_address: address.full_address
      });
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching address:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to fetch address');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleStateChange = (selectedState) => {
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: '',
    }));
  };

  const handleCityChange = (selectedCity) => {
    setFormData((prev) => ({
      ...prev,
      city: selectedCity,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.put(`http://localhost:3000/api/address/${id}`, formData, {
        withCredentials: true
      });
      navigate('/address/all');
    } catch (error) {
      console.error('Error updating address:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to update address');
      setIsLoading(false);
    }
  };

  const availableCities = formData.state ? indianStatesAndCities[formData.state] || [] : [];

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <StickyFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      
      <div className="flex-grow w-full py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/address/all')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Addresses
            </button>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Update Address</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Modify your address details</p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-8 w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              {/* Address Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="e.g., Home, Office, Friend's Place"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Give this address a unique name for easy identification
                </p>
              </div>

              {/* State and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <SearchableDropdown
                    options={Object.keys(indianStatesAndCities)}
                    value={formData.state}
                    onChange={handleStateChange}
                    placeholder="Select State"
                    searchPlaceholder="Search states..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <SearchableDropdown
                    options={availableCities}
                    value={formData.city}
                    onChange={handleCityChange}
                    placeholder={formData.state ? "Select City" : "Select state first"}
                    searchPlaceholder="Search cities..."
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Full Address */}
              <div>
                <label htmlFor="full_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Address *
                </label>
                <textarea
                  id="full_address"
                  name="full_address"
                  placeholder="Enter your complete address with house number, street name, and landmarks"
                  value={formData.full_address}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/address/all')}
                  className="flex-1 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Address'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <StickyFooter />
    </div>
  );
};

export default UpdateAddress;