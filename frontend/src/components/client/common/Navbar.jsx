import { useState, useContext, useEffect, useRef } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, ShoppingCart, ChevronDown, X, Settings, Package, LogOut, Heart } from "lucide-react"
import axios from "axios"
import { AuthContext } from "../../../../Context/AuthContext"
import { useCart } from "../../../../Context/CartContext"
import { CompanySettingsContext } from "../../../../Context/CompanySettingsContext"
import { AnnouncementContext } from "../../../../Context/AnnouncementContext"
import { ProductContext } from "../../../../Context/ProductContext"
import { CategoryContext } from "../../../../Context/CategoryContext"
import { getOptimizedImageUrl } from "../../../utils/imageOptimizer"

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  showSearchResults, 
  setShowSearchResults,
  isSearching,
  onSearchResultClick,
  onClearSearch,
  highlightMatchedText,
  handleSearchKeyPress
}) {
  const { user, setUser } = useContext(AuthContext)
  const { getUniqueCartItemsCount, setIsCartOpen } = useCart()
  const { companySettings, loadingSettings } = useContext(CompanySettingsContext)
  const { announcement, loadingAnnouncement, announcementError } = useContext(AnnouncementContext)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const profileDropdownRef = useRef(null)

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setIsProfileOpen(false)
    }
  }

  if (isProfileOpen) {
    document.addEventListener('mousedown', handleClickOutside)
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [isProfileOpen])

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true })
      sessionStorage.clear()
      setUser(null)
      navigate('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {!loadingAnnouncement && !announcementError && announcement && (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center w-full z-50">
          <p className="text-sm font-medium">{announcement}</p>
        </div>
      )}

      <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* First Row - Logo, Profile, Cart */}
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 h-full">
              <Link to="/" className="flex-shrink-0">
                {loadingSettings ? (
                  <div className="h-12 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <img
                    src={getOptimizedImageUrl(companySettings?.companyLogo, { width: 200 }) || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=60&fit=crop"}
                    alt={companySettings?.companyName || "Company Logo"}
                    className="h-12 w-auto object-contain"
                    loading="eager"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=60&fit=crop"
                    }}
                  />
                )}
              </Link>
            </div>

            {/* Search Bar - Desktop Only */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4 relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={onClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="search-results-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                        <p className="text-sm font-semibold text-gray-700 dark:text-white">
                          Results for: "{searchQuery}" ({searchResults.length})
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                          Press Enter to see all results in main section
                        </p>
                      </div>
                      <div className="py-2">
                        {searchResults.map((result, index) => (
                          <button
                            key={`${result.productId}-${result.variantId}-${index}`}
                            onClick={() => onSearchResultClick(result)}
                            className="w-full px-4 py-3 hover:bg-gray-50 dark:bg-gray-800 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0 dark:text-white"
                          >
                            <img
                              src={getOptimizedImageUrl(result.image, { width: 100 }) || "/placeholder.svg"}
                              alt={result.productName}
                              className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                              loading="lazy"
                            />
                            <div className="flex-1 text-left">
                              <p className="text-gray-900 text-sm dark:text-gray-400">
                                {highlightMatchedText(result.fullDisplayName, searchQuery)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold text-blue-600">
                                  ₹{result.price.toFixed(2)}
                                </span>
                                {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Stock: {result.stock}
                                </span> */}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-white">
                      No results for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile and Cart */}
            <div className="flex items-center space-x-4">
              <div className="relative profile-dropdown" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors duration-200 dark:text-white"
                >
                  <User className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg py-2 z-50">
                    {user ? (
                      <>
                        <Link
                          to="/user/update-profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Edit Profile
                        </Link>
                        <Link
  to="/favorites" 
  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
  onClick={() => setIsProfileOpen(false)}
>
  <Heart className="w-4 h-4" />
  My Favorites
</Link>
                        <Link
                          to={`/orders/${user.id}`}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors dark:text-gra-400"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            setIsProfileOpen(false)
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/auth/login"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LogOut className="w-4 h-4 rotate-180" />
                          Login
                        </Link>
                        <Link
                          to="/auth/signup"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-gray-700 hover:text-blue-600 transition-colors duration-200 dark:text-white"
              >
                <ShoppingCart className="h-6 w-6" />
                {getUniqueCartItemsCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getUniqueCartItemsCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Second Row - Search Bar (Mobile Only) */}
          <div className="md:hidden pb-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={onClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Mobile Search Results Dropdown */}
            {showSearchResults && (
              <div className="search-results-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 border border-gray-200 dark:border-gray-700 left-0 right-0">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-white">
                        Results for: "{searchQuery}" ({searchResults.length})
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                        Press Enter to see all results in main section
                      </p>
                    </div>
                    <div className="py-2">
                      {searchResults.map((result, index) => (
                        <button
  key={`${result.productId}-${result.variantId}-${index}`}
  onClick={(e) => {
      console.log('MOBILE CLICK TRIGGERED', result.productId);
    e.preventDefault();
    e.stopPropagation();
    onSearchResultClick(result);
  }}
  className="w-full px-4 py-3 hover:bg-gray-50 dark:bg-gray-800 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
  type="button"
>
                          <img
                            src={getOptimizedImageUrl(result.image, { width: 100 }) || "/placeholder.svg"}
                            alt={result.productName}
                            className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-gray-900 text-sm dark:text-gray-400">
                              {highlightMatchedText(result.fullDisplayName, searchQuery)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold text-blue-600">
                                ₹{result.price.toFixed(2)}
                              </span>
                              {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                                Stock: {result.stock}
                              </span> */}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-black">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}