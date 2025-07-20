import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, ChevronLeft, ChevronRight, Star, Heart, Eye, X, Plus, Minus, Trash2, LogOut, Package, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [notification, setNotification] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const categoriesRef = useRef(null);
  const navigate = useNavigate();

  // Sample product data
  const products = [
    { id: 1, name: "Ocean Wave Coasters Set", price: 29.99, category: "coasters", rating: 4.8, reviews: 124, image: "🌊", isFeatured: true, isNew: true },
    { id: 2, name: "Galaxy Wall Art Panel", price: 89.99, category: "wall-art", rating: 4.9, reviews: 87, image: "🌌", isFeatured: true, isNew: false },
    { id: 3, name: "Crystal Drop Earrings", price: 24.99, category: "jewelry", rating: 4.7, reviews: 203, image: "💎", isFeatured: true, isNew: true },
    { id: 4, name: "Marble Effect Serving Tray", price: 45.99, category: "trays", rating: 4.6, reviews: 156, image: "🍽️", isFeatured: true, isNew: false },
    { id: 5, name: "Forest Scene Keychain", price: 12.99, category: "keychains", rating: 4.8, reviews: 94, image: "🌲", isFeatured: false, isNew: true },
    { id: 6, name: "Flower Pressed Bookmark", price: 8.99, category: "bookmarks", rating: 4.5, reviews: 67, image: "🌸", isFeatured: false, isNew: false },
    { id: 7, name: "Sunset Gradient Coasters", price: 32.99, category: "coasters", rating: 4.9, reviews: 178, image: "🌅", isFeatured: true, isNew: false },
    { id: 8, name: "Abstract Rainbow Wall Art", price: 124.99, category: "wall-art", rating: 5.0, reviews: 45, image: "🌈", isFeatured: true, isNew: true },
    { id: 9, name: "Geometric Pendant Necklace", price: 39.99, category: "jewelry", rating: 4.7, reviews: 112, image: "⬡", isFeatured: false, isNew: false },
    { id: 10, name: "Gold Leaf Serving Tray", price: 67.99, category: "trays", rating: 4.8, reviews: 89, image: "🍃", isFeatured: true, isNew: true },
    { id: 11, name: "Mountain Landscape Keychain", price: 14.99, category: "keychains", rating: 4.6, reviews: 76, image: "🏔️", isFeatured: false, isNew: false },
    { id: 12, name: "Butterfly Garden Bookmark", price: 10.99, category: "bookmarks", rating: 4.4, reviews: 52, image: "🦋", isFeatured: false, isNew: true },
    { id: 13, name: "Celestial Phone Case", price: 18.99, category: "phone-cases", rating: 4.6, reviews: 89, image: "📱", isFeatured: false, isNew: true },
    { id: 14, name: "Geometric Candle Holder", price: 28.99, category: "candles", rating: 4.7, reviews: 156, image: "🕯️", isFeatured: false, isNew: false },
    { id: 15, name: "Ocean Waves Ring Dish", price: 22.99, category: "dishes", rating: 4.8, reviews: 73, image: "🌀", isFeatured: false, isNew: true }
  ];

  const categories = [
    { id: 'all', name: 'All Products', icon: '🎨', count: products.length },
    { id: 'coasters', name: 'Coasters', icon: '☕', count: products.filter(p => p.category === 'coasters').length },
    { id: 'wall-art', name: 'Wall Art', icon: '🖼️', count: products.filter(p => p.category === 'wall-art').length },
    { id: 'jewelry', name: 'Jewelry', icon: '💎', count: products.filter(p => p.category === 'jewelry').length },
    { id: 'trays', name: 'Serving Trays', icon: '🍽️', count: products.filter(p => p.category === 'trays').length },
    { id: 'keychains', name: 'Keychains', icon: '🔑', count: products.filter(p => p.category === 'keychains').length },
    { id: 'bookmarks', name: 'Bookmarks', icon: '📚', count: products.filter(p => p.category === 'bookmarks').length },
    { id: 'phone-cases', name: 'Phone Cases', icon: '📱', count: products.filter(p => p.category === 'phone-cases').length },
    { id: 'candles', name: 'Candle Holders', icon: '🕯️', count: products.filter(p => p.category === 'candles').length },
    { id: 'dishes', name: 'Ring Dishes', icon: '🌀', count: products.filter(p => p.category === 'dishes').length }
  ];

  const announcements = [
    "🎉 FREE SHIPPING on orders over $75! | New Resin Art Collection Available Now! 🎨",
    "✨ Limited Time: 20% OFF all Wall Art pieces! Use code WALL20 ✨",
    "🆕 Just Added: Custom Resin Art Commissions Now Available! 🎨",
    "💝 Perfect Gifts: Resin Jewelry Starting at $24.99! 💎"
  ];

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = products.filter(product => product.isFeatured);
  const newProducts = products.filter(product => product.isNew);

  // Add to cart functionality
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    
    setNotification(`✅ ${product.name} added to cart!`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Update cart item quantity
  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== productId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalCartValue = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Function to handle the logout
  const handleLogout = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/logout', {}, {
        withCredentials: true,
      });
      navigate('/auth/login');
    } catch(err) {
      console.log(err);
    }

  }

  // Cycle through announcements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement(prev => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Use effect for checking whether user is login or not
  useEffect(() => {
    const checkLogin = async () => {
      try{
        const res = await axios.get(
          'http://localhost:3000/api/auth/me',
          {withCredentials: true}
        );
        setUser(res.data.user);
      } catch(err) {
        setUser(null);
        navigate('/auth/login');
      }
    }
    checkLogin();
  }, [])
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll categories
  const scrollCategories = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = categoriesRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      categoriesRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Scroll to latest arrivals
  const scrollToLatestArrivals = () => {
    const element = document.getElementById('latest-arrivals');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const ProductCard = ({ product, isLarge = false }) => (
    <div className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}`}>
      {product.isNew && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          NEW
        </div>
      )}
      
      <div className={`relative bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 ${isLarge ? 'h-64 sm:h-80' : 'h-48'} flex items-center justify-center text-4xl overflow-hidden`}>
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <span className={`filter drop-shadow-lg ${isLarge ? 'text-4xl sm:text-6xl' : 'text-4xl sm:text-6xl'}`}>{product.image}</span>
        
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-red-500" />
          </button>
          <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className={`p-3 sm:p-4 ${isLarge ? 'md:p-6' : ''}`}>
        <h3 className={`font-bold text-gray-800 mb-2 ${isLarge ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'} line-clamp-2`}>
          {product.name}
        </h3>
        
        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600 ml-2">({product.reviews})</span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 ${isLarge ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
            ${product.price}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg text-xs sm:text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  // Cart Sidebar Component
  const CartSidebar = () => (
    <div className={`fixed inset-0 z-50 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isCartOpen ? 'opacity-50' : 'opacity-0'}`}
        onClick={() => setIsCartOpen(false)}
      ></div>
      
      {/* Cart Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Shopping Cart ({getTotalCartItems()})</h3>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-lg flex items-center justify-center text-2xl">
                    {item.image}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-sm text-gray-500">${item.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Total: ${getTotalCartValue().toFixed(2)}</span>
            </div>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors">
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg animate-pulse text-sm sm:text-base">
          {notification}
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 sm:py-3 px-4 text-xs sm:text-sm font-medium overflow-hidden">
        <div className="animate-pulse">
          {announcements[currentAnnouncement]}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                ArtisanResin
              </h1>
            </div>

            {/* Search Bar - Hidden on mobile, shown on larger screens */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/90 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Search */}
              <div className="lg:hidden">
                <button className="p-2 text-gray-700 hover:text-purple-600 transition-colors">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  className="profile-button p-2 text-gray-700 hover:text-purple-600 transition-colors"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Settings className="w-4 h-4 mr-3" />
                      Manage Profile
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Package className="w-4 h-4 mr-3" />
                      Orders
                    </a>
                    <hr className="my-1" />
                    <a onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </a>
                  </div>
                )}
              </div>
              
              {/* Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {getTotalCartItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getTotalCartItems()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Stunning{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Resin Art
            </span>{' '}
            Creations
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Discover handcrafted resin masterpieces that bring color and elegance to your space. 
            From functional coasters to breathtaking wall art.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
              Shop Now
            </button>
            <button 
              onClick={scrollToLatestArrivals}
              className="border-2 border-purple-600 text-purple-600 px-6 py-3 sm:px-8 sm:py-3 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition-all duration-200"
            >
              Explore Latest Arrivals
            </button>
          </div>
        </div>
      </section>

      {/* New Arrivals Banner */}
      <section className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-8 sm:py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">✨ New Arrivals This Week ✨</h3>
          <p className="text-base sm:text-lg opacity-90">
            Check out our latest collection of Ocean Wave Coasters & Galaxy Wall Art
          </p>
        </div>
      </section>

      {/* Categories with Scroll */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8" id="categories">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Shop by Category
          </h3>
          
          <div className="relative">
            {/* Scroll Buttons */}
            <button 
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <button 
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Scrollable Categories */}
            <div 
              ref={categoriesRef}
              className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 px-8 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 p-4 sm:p-6 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 min-w-[120px] sm:min-w-[140px] ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl'
                      : 'bg-white shadow-lg hover:shadow-xl text-gray-700'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-2">{category.icon}</div>
                  <h4 className="font-semibold text-xs sm:text-sm mb-1 leading-tight">{category.name}</h4>
                  <p className="text-xs opacity-75">({category.count} items)</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8" id="products">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {selectedCategory === 'all' ? 'Featured Products' : categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} products
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} isLarge={index === 0 && filteredProducts.length > 1} />
            ))}
          </div>

          {filteredProducts.length > 8 && (
            <div className="text-center mt-8 sm:mt-12">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                Load More Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section id="latest-arrivals" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            🆕 Latest Arrivals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {newProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {newProducts.length > 8 && (
            <div className="text-center mt-8 sm:mt-12">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                View All New Arrivals
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Stay Updated with New Collections</h3>
          <p className="text-purple-100 mb-6 sm:mb-8 text-base sm:text-lg">
            Be the first to know about new arrivals, special offers, and exclusive resin art pieces.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-purple-300 outline-none"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
              Subscribe Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                ArtisanResin
              </h4>
              <p className="text-gray-300 text-sm sm:text-base">
                Creating handcrafted resin art pieces that blend functionality with beauty. 
                Each piece is unique and made with love.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold text-purple-400 mb-4 text-base sm:text-lg">Quick Links</h5>
              <ul className="space-y-2">
                {['Home', 'Products', 'Categories', 'About Us', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-purple-400 mb-4 text-base sm:text-lg">Customer Service</h5>
              <ul className="space-y-2">
                {['Contact Us', 'Shipping Info', 'Returns', 'Size Guide', 'FAQ'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-purple-400 mb-4 text-base sm:text-lg">Connect With Us</h5>
              <ul className="space-y-2">
                {['Instagram', 'Facebook', 'Pinterest', 'Email Newsletter'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              &copy; 2025 ArtisanResin. All rights reserved. | Made with ❤️ for art lovers
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;