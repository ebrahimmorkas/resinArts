"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, MapPin, Mail, Phone, User, Lock, X, Check } from "lucide-react"
import axios from "axios"
import { Link } from "react-router-dom"

// Indian States and Cities data
const indianStatesAndCities = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Tirupati",
    "Kadapa",
    "Anantapur",
    "Eluru",
  ],
  "Arunachal Pradesh": [
    "Itanagar",
    "Naharlagun",
    "Pasighat",
    "Tezpur",
    "Bomdila",
    "Ziro",
    "Along",
    "Tezu",
    "Changlang",
    "Khonsa",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur",
    "Bongaigaon",
    "Karimganj",
    "Sivasagar",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia",
    "Darbhanga",
    "Bihar Sharif",
    "Arrah",
    "Begusarai",
    "Katihar",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Korba",
    "Bilaspur",
    "Durg",
    "Rajnandgaon",
    "Jagdalpur",
    "Raigarh",
    "Ambikapur",
    "Mahasamund",
  ],
  Goa: [
    "Panaji",
    "Vasco da Gama",
    "Margao",
    "Mapusa",
    "Ponda",
    "Bicholim",
    "Curchorem",
    "Sanquelim",
    "Valpoi",
    "Pernem",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Gandhinagar",
    "Anand",
    "Navsari",
  ],
  Haryana: [
    "Faridabad",
    "Gurgaon",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Dharamshala",
    "Solan",
    "Mandi",
    "Palampur",
    "Baddi",
    "Nahan",
    "Paonta Sahib",
    "Sundernagar",
    "Chamba",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Phusro",
    "Hazaribagh",
    "Giridih",
    "Ramgarh",
    "Medininagar",
  ],
  Karnataka: [
    "Bangalore",
    "Mysore",
    "Hubli",
    "Mangalore",
    "Belgaum",
    "Gulbarga",
    "Davanagere",
    "Bellary",
    "Bijapur",
    "Shimoga",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Malappuram",
    "Kannur",
    "Kasaragod",
  ],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Amravati",
    "Kolhapur",
    "Sangli",
  ],
  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
    "Churachandpur",
    "Kakching",
    "Ukhrul",
    "Senapati",
    "Tamenglong",
    "Jiribam",
    "Moreh",
  ],
  Meghalaya: [
    "Shillong",
    "Tura",
    "Cherrapunji",
    "Jowai",
    "Baghmara",
    "Nongpoh",
    "Mawkyrwat",
    "Resubelpara",
    "Ampati",
    "Williamnagar",
  ],
  Mizoram: [
    "Aizawl",
    "Lunglei",
    "Saiha",
    "Champhai",
    "Kolasib",
    "Serchhip",
    "Mamit",
    "Lawngtlai",
    "Saitual",
    "Khawzawl",
  ],
  Nagaland: [
    "Kohima",
    "Dimapur",
    "Mokokchung",
    "Tuensang",
    "Wokha",
    "Zunheboto",
    "Phek",
    "Kiphire",
    "Longleng",
    "Peren",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Bhadrak",
    "Baripada",
    "Jharsuguda",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Firozpur",
    "Batala",
    "Pathankot",
    "Moga",
  ],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  Sikkim: [
    "Gangtok",
    "Namchi",
    "Geyzing",
    "Mangan",
    "Jorethang",
    "Nayabazar",
    "Rangpo",
    "Singtam",
    "Pakyong",
    "Ravangla",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Vellore",
    "Erode",
    "Thoothukkudi",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Khammam",
    "Karimnagar",
    "Ramagundam",
    "Mahbubnagar",
    "Nalgonda",
    "Adilabad",
    "Suryapet",
  ],
  Tripura: [
    "Agartala",
    "Dharmanagar",
    "Udaipur",
    "Kailasahar",
    "Belonia",
    "Khowai",
    "Ambassa",
    "Ranir Bazar",
    "Sonamura",
    "Kumarghat",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Allahabad",
    "Bareilly",
    "Aligarh",
    "Moradabad",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
    "Kotdwar",
    "Manglaur",
    "Herbertpur",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Habra",
    "Kharagpur",
  ],
  Delhi: [
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "Central Delhi",
    "North East Delhi",
    "North West Delhi",
    "South East Delhi",
    "South West Delhi",
  ],
}

const OTPModal = ({ isOpen, onClose, type, onVerify, isVerifying }) => {
  const [otp, setOtp] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onVerify(otp)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Verify {type === "email" ? "Email" : "Phone Number"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Enter the 6-digit OTP sent to your {type === "email" ? "email address" : "phone number"}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-center text-lg font-mono tracking-widest"
          />

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || isVerifying}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SearchableDropdown = ({ options, value, onChange, placeholder, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-left bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-2 text-left hover:bg-purple-50 focus:bg-purple-50 focus:outline-none transition-colors"
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
  )
}

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showconfirm_password, setShowconfirm_password] = useState(false)
  const [errorMessages, setErrorMessages] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLocationFetching, setIsLocationFetching] = useState(false)
  const [manualLocationEntered, setManualLocationEntered] = useState(false)

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [showEmailOTP, setShowEmailOTP] = useState(false)
  const [showPhoneOTP, setShowPhoneOTP] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)

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
  })

  const [sameAsPhone, setSameAsPhone] = useState(false)

  // Check if manual location fields have been entered
  useEffect(() => {
    const hasManualLocation = formData.state || formData.city || formData.zip_code || formData.address
    setManualLocationEntered(hasManualLocation)
  }, [formData.state, formData.city, formData.zip_code, formData.address])

  useEffect(() => {
    if (sameAsPhone) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: prev.phone_number,
      }))
    }
  }, [sameAsPhone, formData.phone_number])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errorMessages) {
      setErrorMessages("")
    }
  }

  const handleStateChange = (selectedState) => {
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: "",
    }))
  }

  const handleCityChange = (selectedCity) => {
    setFormData((prev) => ({
      ...prev,
      city: selectedCity,
    }))
  }

  const handleSameAsPhoneChange = (e) => {
    const isChecked = e.target.checked
    setSameAsPhone(isChecked)

    if (isChecked) {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: prev.phone_number,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        whatsapp_number: "",
      }))
    }
  }

  const handleVerifyEmail = () => {
    if (!formData.email) {
      setErrorMessages("Please enter your email address first")
      return
    }
    setShowEmailOTP(true)
    console.log("Sending OTP to email:", formData.email)
  }

  const handleVerifyPhone = () => {
    if (!formData.phone_number) {
      setErrorMessages("Please enter your phone number first")
      return
    }
    setShowPhoneOTP(true)
    console.log("Sending OTP to phone: +91" + formData.phone_number)
  }

  const handleEmailOTPVerify = async (otp) => {
    setIsVerifyingEmail(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Verifying email OTP:", otp)
      setEmailVerified(true)
      setShowEmailOTP(false)
      setIsVerifyingEmail(false)
    } catch (error) {
      setErrorMessages("Invalid OTP. Please try again.")
      setIsVerifyingEmail(false)
    }
  }

  const handlePhoneOTPVerify = async (otp) => {
    setIsVerifyingPhone(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Verifying phone OTP:", otp)
      setPhoneVerified(true)
      setShowPhoneOTP(false)
      setIsVerifyingPhone(false)
    } catch (error) {
      setErrorMessages("Invalid OTP. Please try again.")
      setIsVerifyingPhone(false)
    }
  }

  const handleFetchLocation = () => {
    console.log("Fetch location button clicked - functionality disabled for now")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessages("")

    try {
      const res = await axios.post("https://resinarts.onrender.com/api/auth/register", formData)
      console.log(res.data)
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      if (err.response && err.response.data) {
        setErrorMessages(err.response.data.message)
      } else {
        setErrorMessages("Something went wrong. Please try again.")
      }
    }
  }

  const availableCities = formData.state ? indianStatesAndCities[formData.state] || [] : []

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* HEADER SECTION - ALWAYS VISIBLE */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Mouldmarket</h2>
          <p className="text-gray-600 text-lg">Join our creative marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Messages */}
          {errorMessages && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{errorMessages}</div>
          )}

          {/* Name Fields */}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              {!emailVerified ? (
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all whitespace-nowrap"
                >
                  Verify Email
                </button>
              ) : (
                <div className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                  <Check className="w-5 h-5 mr-2" />
                  Verified
                </div>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Numbers</label>

            <div className="flex flex-col lg:flex-row gap-4 mb-3">
              {/* Phone Number */}
              <div className="flex-1">
                <label htmlFor="phone_number" className="block text-xs font-medium text-gray-600 mb-1">
                  Phone Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex">
                    <div className="flex items-center px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700 font-medium h-10">
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
                        className="w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-r-lg border-l-0 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                      />
                    </div>
                  </div>
                  {!phoneVerified ? (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all whitespace-nowrap"
                    >
                      Verify
                    </button>
                  ) : (
                    <div className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                      <Check className="w-5 h-5 mr-2" />
                      Verified
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="flex-1">
                <label htmlFor="whatsapp_number" className="block text-xs font-medium text-gray-600 mb-1">
                  WhatsApp Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700 font-medium h-10">
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
                      className={`w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-r-lg border-l-0 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors ${
                        sameAsPhone ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all whitespace-nowrap ml-2"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sameAsPhone"
                checked={sameAsPhone}
                onChange={handleSameAsPhoneChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="sameAsPhone" className="ml-2 text-sm text-gray-700">
                Phone number is same as WhatsApp number
              </label>
            </div>
          </div>

          {/* Location Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Details</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <SearchableDropdown
                  options={Object.keys(indianStatesAndCities)}
                  value={formData.state}
                  onChange={handleStateChange}
                  placeholder="Select State"
                  searchPlaceholder="Search states..."
                />
              </div>
              <div>
                <SearchableDropdown
                  options={availableCities}
                  value={formData.city}
                  onChange={handleCityChange}
                  placeholder={formData.state ? "Select City" : "Select state first"}
                  searchPlaceholder="Search cities..."
                />
              </div>
              <input
                type="text"
                name="zip_code"
                placeholder="ZIP Code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
            <textarea
              name="address"
              placeholder="Full Address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors resize-none mb-4"
            />

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleFetchLocation}
              disabled={manualLocationEntered || isLocationFetching}
              className={`w-full px-6 py-2 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                manualLocationEntered || isLocationFetching
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
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
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showconfirm_password ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="Confirm Password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowconfirm_password(!showconfirm_password)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showconfirm_password ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-purple-600 hover:text-purple-800 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
