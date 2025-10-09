import { useState, useEffect } from "react";
import { Eye, EyeOff, MapPin, Mail, Phone, User, Lock, AlertCircle } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

// Indian States and Cities data
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
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left bg-white"
      >
        {value || placeholder}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-2 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none transition-colors"
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationFetching, setIsLocationFetching] = useState(false);
  const [manualLocationEntered, setManualLocationEntered] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    whatsapp_number: "",
    state: "",
    city: "",
    zip_code: "",
    address: "",
    password: "",
    confirm_password: "",
  });

  const [sameAsPhone, setSameAsPhone] = useState(false);

  // Check if manual location fields have been entered
  useEffect(() => {
    const hasManualLocation = formData.state || formData.city || formData.zip_code || formData.address;
    setManualLocationEntered(hasManualLocation);
  }, [formData.state, formData.city, formData.zip_code, formData.address]);

  useEffect(() => {
    if (sameAsPhone) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: prev.phone_number,
      }));
    }
  }, [sameAsPhone, formData.phone_number]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessages) {
      setErrorMessages("");
    }
  };

  const handleStateChange = (selectedState) => {
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: "",
    }));
  };

  const handleCityChange = (selectedCity) => {
    setFormData((prev) => ({
      ...prev,
      city: selectedCity,
    }));
  };

  const handleSameAsPhoneChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsPhone(isChecked);

    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: prev.phone_number,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: "",
      }));
    }
  };

  const handleFetchLocation = () => {
    console.log("Fetch location button clicked - functionality disabled for now");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessages("");

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setErrorMessages("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Register the user
      const registerRes = await axios.post("http://localhost:3000/api/auth/register", formData);
      
      // Auto-login after successful registration
      const loginRes = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      // Set user in context
      setUser(loginRes.data.user);
      
      setIsLoading(false);
      
      // Redirect based on role
      if (loginRes.data.user.role === 'admin') {
        navigate('/admin/panel');
      } else {
        navigate('/');
      }
    } catch (err) {
      setIsLoading(false);
      if (err.response && err.response.data) {
        setErrorMessages(err.response.data.message);
      } else {
        setErrorMessages("Something went wrong. Please try again.");
      }
    }
  };

  const availableCities = formData.state ? indianStatesAndCities[formData.state] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mouldmarket</h1>
            <p className="text-gray-600">Create your account and start shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Messages */}
            {errorMessages && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errorMessages}</p>
              </div>
            )}

            {/* Name Fields */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="middle_name"
                      name="middle_name"
                      placeholder="Middle Name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
              
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700 font-medium">
                      🇮🇳 +91
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        placeholder="Phone Number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-r-lg border-l-0 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number *
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700 font-medium">
                      🇮🇳 +91
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        id="whatsapp_number"
                        name="whatsapp_number"
                        placeholder="WhatsApp Number"
                        value={formData.whatsapp_number}
                        onChange={handleInputChange}
                        disabled={sameAsPhone}
                        required
                        className={`w-full pl-11 pr-4 py-3 border border-gray-300 rounded-r-lg border-l-0 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                          sameAsPhone ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  id="sameAsPhone"
                  checked={sameAsPhone}
                  onChange={handleSameAsPhoneChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="sameAsPhone" className="ml-2 text-sm text-gray-700">
                  Phone number is same as WhatsApp number
                </label>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <SearchableDropdown
                    options={Object.keys(indianStatesAndCities)}
                    value={formData.state}
                    onChange={handleStateChange}
                    placeholder="Select State"
                    searchPlaceholder="Search states..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <SearchableDropdown
                    options={availableCities}
                    value={formData.city}
                    onChange={handleCityChange}
                    placeholder={formData.state ? "Select City" : "Select state first"}
                    searchPlaceholder="Search cities..."
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    placeholder="ZIP Code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Enter your complete address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-gray-500 font-medium text-sm">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <button
                type="button"
                onClick={handleFetchLocation}
                disabled={manualLocationEntered || isLocationFetching}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  manualLocationEntered || isLocationFetching
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white focus:ring-4 focus:ring-green-200 shadow-lg shadow-green-500/30"
                }`}
              >
                <MapPin className="w-5 h-5" />
                {isLocationFetching ? "Fetching Location..." : "Fetch Current Location"}
              </button>
              {manualLocationEntered && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Location fields filled manually. Clear them to use auto-fetch.
                </p>
              )}
            </div>

            {/* Password Fields */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      placeholder="Confirm password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-6 mt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;