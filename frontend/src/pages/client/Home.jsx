import React, { useState, useEffect, useRef, useContext, useMemo, useCallback, memo, lazy, Suspense } from "react"
import { ProductContext } from "../../../Context/ProductContext"
import { useCart } from "../../../Context/CartContext"
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CategoryContext } from "../../../Context/CategoryContext"
import { FreeCashContext } from "../../../Context/FreeCashContext"
import { CompanySettingsContext } from "../../../Context/CompanySettingsContext"
import { DiscountContext } from "../../../Context/DiscountContext"
import { BannerContext } from "../../../Context/BannerContext"
import { useFavorites } from "../../../Context/FavoritesContext"
import { getOptimizedImageUrl } from "../../utils/imageOptimizer"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from "../../components/client/common/Navbar"
import Footer from "../../components/client/common/Footer";
const CartModal = lazy(() => import("../../components/client/common/CartModal"))
// Keep all other imports like icons, etc.
import {
  ChevronDown, ChevronLeft, ChevronRight, X, Plus, Minus, Eye, Check, Heart, Palette, Trash2, Package, Share2, MessageCircle, Star, Shield, Truck, Instagram, Facebook, ArrowUp,
} from "lucide-react"
import axios from "axios";
import { AuthContext } from "../../../Context/AuthContext"
// import { DiscountContext } from "../../../Context/DiscountContext";
// import { BannerContext } from "../../../Context/BannerContext";
import { AnnouncementContext } from "../../../Context/AnnouncementContext"
// import { getOptimizedImageUrl } from "../../utils/imageOptimizer"
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from "../../components/client/Home/ConfirmationModal";


export default function Home() {
  // STEP 1: Get auth context FIRST (before any other hooks)
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // STEP 2: Redirect admin to admin panel
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      navigate('/admin/panel', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // STEP 3: Show loading while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // STEP 4: If admin, don't render anything (will redirect)
  if (user?.role === 'admin') {
    return null;
  }

  // STEP 5: Now it's safe to use user-specific contexts
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    applyFreeCash,
    setApplyFreeCash,
    loading: cartLoading,
    error: cartError,
    addToCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getUniqueCartItemsCount,
    getTotalItemsCount,
    clearCart,
  } = useCart()

  const { freeCash, loadingFreeCash, freeCashErrors, clearFreeCashCache, checkFreeCashEligibility } = useContext(FreeCashContext);

  // const navigate = useNavigate();

// Add this updated handleCartCheckout function to your Home.jsx
// Replace the existing handleCartCheckout function with this:

const handleCartCheckout = async () => {
  try {
    if (!user?.id) {
      localStorage.setItem('redirectAfterLogin', '/');
      localStorage.setItem('checkoutIntent', 'true');
      navigate('/auth/login');
      return;
    }

    console.log('Cart Items being sent to checkout:', JSON.stringify(cartItems, null, 2));

    // Send cart data directly without transformation
    const res = await axios.post(
      'https://api.simplyrks.cloud/api/order/place-order', 
      cartItems, 
      {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      }
    );
    
    if (res.status === 201) {
      // Clear cart and update states in parallel
      await Promise.all([
        clearCart(),
        clearFreeCashCache(),
        checkFreeCashEligibility(),
      ]);
      
      setIsCartOpen(false);
      
      const { toast } = await import('react-toastify');
      toast.success('Order placed successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  } catch (error) {
    console.error("Checkout error:", error);
    const { toast } = await import('react-toastify');
    toast.error(error.response?.data?.message || 'Failed to place order. Please try again.', {
      position: "top-right",
      autoClose: 3000,
    });
  }
};

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState(["all"])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "")
  const [categoryFilteredProducts, setCategoryFilteredProducts] = useState([])
const [categoryHasMore, setCategoryHasMore] = useState(false)
const [categoryLoadingMore, setCategoryLoadingMore] = useState(false)
const [categoryTotalCount, setCategoryTotalCount] = useState(0)
const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
const [categoryLoading, setCategoryLoading] = useState(false)
  // Handle search from URL parameter
// Handle search from URL parameter
useEffect(() => {
  const searchFromUrl = searchParams.get('search');
  if (searchFromUrl) {
    setSearchQuery(searchFromUrl);
    setShowSearchSection(true);
    setShowSearchResults(false); // Close the dropdown
    
    // Remove the search param from URL and scroll to results
    setTimeout(() => {
      searchParams.delete('search');
      setSearchParams(searchParams, { replace: true });
      
      // Scroll to search results section
      document.getElementById('search-results-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 300); // Increased timeout to ensure DOM is ready
  }
}, []);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([])
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null)
  const [selectedCategoryIdForFilter, setSelectedCategoryIdForFilter] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const { discountData, loadingDiscount, loadingErrors, isDiscountAvailable } = useContext(DiscountContext);
  const { announcement, loadingAnnouncement, announcementError } = useContext(AnnouncementContext);
  const { companySettings, loadingSettings, settingsError } = useContext(CompanySettingsContext);
  const { categories, loadingCategories, categoriesErrors } = useContext(CategoryContext);
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchSection, setShowSearchSection] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [categoriesScrollPosition, setCategoriesScrollPosition] = useState(0);
const categoriesContainerRef = useRef(null);
  
  // Scroll to top functionality
useEffect(() => {
  const handleScroll = () => {
    if (window.pageYOffset > 300) {
      setShowScrollTop(true)
    } else {
      setShowScrollTop(false)
    }
  }

  

  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Infinite scroll observer
const observerTarget = useRef(null);
const categoryObserverTarget = useRef(null);

const contextData = useContext(ProductContext) || { 
  products: [], 
  loading: false, 
  error: null,
  loadMoreProducts: () => {},
  hasMore: false,
  loadingMore: false,
  totalCount: 0
}
const { 
  products, 
  loading, 
  error, 
  loadMoreProducts, 
  hasMore, 
  loadingMore,
  totalCount,
    currentPage  
} = contextData

// Memoize context values to prevent unnecessary re-renders
const memoizedCartItems = useMemo(() => cartItems, [cartItems]);
const memoizedCategories = useMemo(() => categories, [categories]);
const memoizedProducts = useMemo(() => products, [products]);
useEffect(() => {
  const target = observerTarget.current;
  console.log("IntersectionObserver Setup - target exists:", !!target);
  if (!target) return;

  const observer = new IntersectionObserver(
    (entries) => {
      console.log("Observer triggered:", {
        isIntersecting: entries[0].isIntersecting,
        hasMore,
        loadingMore,
        currentPage,
        productsLength: products.length
      });
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        console.log('🔄 Loading more products...');
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
  console.log('🔄 Loading more products...');
  loadMoreProducts(selectedCategoryIdForFilter);
}
      }
    },
    { 
      threshold: 0.1,
      rootMargin: '100px'
    }
  );

  observer.observe(target);
  console.log("Observer attached to target");

  return () => {
    console.log("Observer disconnected");
    observer.disconnect();
  };
}, [hasMore, loadingMore, loadMoreProducts, currentPage, products.length, selectedCategoryIdForFilter]);

// Category infinite scroll observer
useEffect(() => {
  if (!selectedCategoryIdForFilter) return;
  
  const target = categoryObserverTarget.current;
  if (!target) return;

  const observer = new IntersectionObserver(
    async (entries) => {
      if (entries[0].isIntersecting && categoryHasMore && !categoryLoadingMore) {
        console.log('🔄 Loading more category products...', {
          currentPage: categoryCurrentPage,
          hasMore: categoryHasMore
        });
        
        try {
          setCategoryLoadingMore(true);
          const nextPage = categoryCurrentPage + 1;
          const response = await axios.get(
            `http://localhost:3000/api/product/all?page=${nextPage}&limit=50&categoryId=${selectedCategoryIdForFilter}`,
            { withCredentials: true }
          );
          
          console.log("More category products loaded:", response.data);
          
          setCategoryFilteredProducts(prev => [...prev, ...response.data.products]);
          setCategoryHasMore(response.data.hasMore);
          setCategoryCurrentPage(nextPage);
          setCategoryLoadingMore(false);
        } catch (error) {
          console.error("Error loading more category products:", error);
          setCategoryLoadingMore(false);
        }
      }
    },
    { threshold: 0.1, rootMargin: '100px' }
  );

  observer.observe(target);
  return () => observer.disconnect();
}, [selectedCategoryIdForFilter, categoryHasMore, categoryLoadingMore, categoryCurrentPage]);

 
  // console.log("Products from context:", contextData)
  // Memoize expensive computations
  // console.log("Products from context:", contextData)

  // Refs for scrolling to sections
  const categoriesRef = useRef(null)
  const justArrivedRef = useRef(null)
  const restockedRef = useRef(null)
  const revisedRatesRef = useRef(null)
  const outOfStockRef = useRef(null)
  const { setUser } = useContext(AuthContext)

  // Context for favorites
  const { toggleFavorite, isFavorite } = useFavorites()

const handleSearch = useCallback((query) => {
  setSearchQuery(query)
  
  if (!query.trim()) {
    setSearchResults([])
    setShowSearchResults(false)
    return
  }
}, [])

// Debounce search query
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]);

const formatSize = (sizeObj) => {
    if (!sizeObj) return "N/A"
    if (typeof sizeObj === "string") return sizeObj
    if (sizeObj.length && sizeObj.breadth && sizeObj.height) {
      const unit = sizeObj.unit || "cm"
      return `${sizeObj.length} × ${sizeObj.breadth} × ${sizeObj.height} ${unit}`
    }
    return "N/A"
  }

// Perform search with debounced query using backend API
useEffect(() => {
  if (!debouncedSearchQuery.trim()) {
    setSearchResults([]);
    setShowSearchResults(false);
    return;
  }

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      const response = await axios.get(
        `https://api.simplyrks.cloud/api/product/search?query=${encodeURIComponent(debouncedSearchQuery)}`,
        { withCredentials: true }
      );
      
      const backendResults = response.data.results || [];
      
      // Format results to match your existing structure
      const formattedResults = backendResults.map(result => {
        const sizeString = result.sizeDetail ? formatSize(result.sizeDetail.size) : null;
        
        return {
          productId: result.productId,
          productName: result.productName,
          variantId: result.variantId,
          colorName: result.colorName,
          sizeDetail: result.sizeDetail,
          sizeString: sizeString,
          image: result.image,
          price: result.price,
          stock: result.stock,
          fullDisplayName: result.colorName 
            ? `${result.productName} - ${result.colorName}${sizeString ? ` - ${sizeString}` : ''}`
            : result.productName
        };
      });
      
      setSearchResults(formattedResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  performSearch();
}, [debouncedSearchQuery]);

// Function that will listen the event -> clicking of enter key
const handleSearchKeyPress = (e) => {
  if (e.key === 'Enter' && searchQuery.trim()) {
    if (searchResults.length === 0) {
      // If no results, scroll to all products section
      setShowSearchSection(false)
      setShowSearchResults(false)
      setTimeout(() => {
        document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      // If results exist, show search section
      setShowSearchSection(true)
      setShowSearchResults(false)
      setTimeout(() => {
        document.getElementById('search-results-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }
}

const clearSearch = () => {
  setSearchQuery('')
  setSearchResults([])
  setShowSearchResults(false)
  setShowSearchSection(false)
}

// Helper function that will highlight the matching text
const highlightMatchedText = (text, searchQuery) => {
  if (!searchQuery.trim()) return text
  
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0)
  let highlightedText = text
  
  // Create a map of matches with their positions
  const matches = []
  searchTerms.forEach(term => {
    let index = 0
    const lowerText = text.toLowerCase()
    while ((index = lowerText.indexOf(term, index)) !== -1) {
      matches.push({ start: index, end: index + term.length })
      index += term.length
    }
  })
  
  // Sort and merge overlapping matches
  matches.sort((a, b) => a.start - b.start)
  const merged = []
  matches.forEach(match => {
    if (merged.length === 0 || merged[merged.length - 1].end < match.start) {
      merged.push(match)
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, match.end)
    }
  })
  
  // Build the result with bold tags
  if (merged.length === 0) return text
  
  const parts = []
  let lastIndex = 0
  
  merged.forEach(match => {
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start))
    }
    parts.push(<strong key={`bold-${match.start}`} className="font-bold text-gray-900 dark:text-white">{text.substring(match.start, match.end)}</strong>)
    lastIndex = match.end
  })
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return <>{parts}</>
}

// const handleSearchResultClick = (result) => {
//   const product = products.find(p => p._id === result.productId)
//   if (product) {
//     // Store the selected variant and size info to pass to modal
//     const selectedVariantInfo = {
//       variantId: result.variantId,
//       colorName: result.colorName,
//       sizeDetailId: result.sizeDetail?._id
//     }
//     setSelectedProduct({ ...product, preSelectedVariant: selectedVariantInfo })
//     setShowSearchResults(false)
//   }
// }

const handleSearchResultClick = (result) => {
  navigate(`/product/${result.productId}`)
  setShowSearchResults(false)
  setSearchQuery("")
}

const getFilteredProducts = useMemo(() => {
  // Memoize this expensive filtering operation
  let activeProducts = products.filter(product => {
    // Check if product is active
    if (product.isActive === false) {
      return false;
    }

    // Find the mainCategory and subCategory
    const mainCat = categories.find(cat => cat._id.toString() === product.mainCategory?._id?.toString() || cat._id.toString() === product.mainCategory?.toString());
    const subCat = product.subCategory ? categories.find(cat => cat._id.toString() === product.subCategory?._id?.toString() || cat._id.toString() === product.subCategory?.toString()) : null;

    // Filter out if mainCategory is inactive
    if (mainCat && mainCat.isActive === false) {
      return false;
    }

    // Filter out if subCategory is inactive
    if (subCat && subCat.isActive === false) {
      return false;
    }

    return true;
  });

  // Apply search query filtering if present
  if (!searchQuery.trim()) {
    return activeProducts;
  }

  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
  return activeProducts.filter(product => {
    const productNameLower = product.name.toLowerCase();
    const nameMatch = searchTerms.every(term => productNameLower.includes(term));

    const variantMatch = product.variants?.some(v => {
      const fullName = `${product.name} ${v.colorName}`.toLowerCase();
      return searchTerms.every(term => fullName.includes(term));
    });

    return nameMatch || variantMatch;
  });
}, [memoizedProducts, memoizedCategories, searchQuery]); // Only recalculate when these change

  // Close dropdowns of search when clicking outside
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.relative.flex-1')) {
      setShowSearchResults(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.relative.flex-1')) {
      setShowSearchResults(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  const isDiscountActive = (product, variant = null, sizeDetail = null) => {
    let discountStartDate, discountEndDate

    if (sizeDetail && sizeDetail.discountStartDate && sizeDetail.discountEndDate) {
      discountStartDate = sizeDetail.discountStartDate
      discountEndDate = sizeDetail.discountEndDate
    } else if (product.discountStartDate && product.discountEndDate) {
      discountStartDate = product.discountStartDate
      discountEndDate = product.discountEndDate
    } else {
      return false
    }

    const now = new Date()
    const startDate = new Date(discountStartDate)
    const endDate = new Date(discountEndDate)
    return now >= startDate && now <= endDate
  }

  const isNew = (product) => {
    if (!product.createdAt) return false;
    const createdDate = new Date(product.createdAt);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    return createdDate >= threeDaysAgo && createdDate <= now;
  }

  const isRecentlyRestocked = (product, variant = null, sizeDetail = null) => {
    let lastRestockedAt

    if (sizeDetail && sizeDetail.lastRestockedAt) {
      lastRestockedAt = sizeDetail.lastRestockedAt
    } else if (product.lastRestockedAt) {
      lastRestockedAt = product.lastRestockedAt
    } else {
      return false
    }

    const restockDate = new Date(lastRestockedAt)
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    return restockDate >= twoDaysAgo && restockDate <= now
  }

  const isOutOfStock = (product) => {
    if (!product.hasVariants) {
      return product.stock === 0;
    } else {
      return product.variants.every((variant) => {
        if (variant.commonStock !== undefined) {
          return variant.commonStock === 0;
        } else {
          return variant.moreDetails.every((detail) => detail.stock === 0);
        }
      });
    }
  }

  const isOutOfStockForBadge = (product, variant = null, sizeDetail = null) => {
    if (sizeDetail) {
      return sizeDetail.stock === 0;
    }
    if (variant && variant.commonStock !== undefined) {
      return variant.commonStock === 0;
    }
    return product.stock === 0;
  }

  const getOriginalPrice = (product, variant = null, sizeDetail = null) => {
    if (sizeDetail && sizeDetail.price) {
      return parseFloat(sizeDetail.price) || 0;
    }
    if (variant && variant.commonPrice) {
      return parseFloat(variant.commonPrice) || 0;
    }
    if (product.price && product.price !== "" && product.price !== null) {
      return parseFloat(product.price) || 0;
    }
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.moreDetails && firstVariant.moreDetails.length > 0) {
        return parseFloat(firstVariant.moreDetails[0].price) || 0;
      }
    }
    return 0;
  }

  const getDisplayPrice = (product, variant = null, sizeDetail = null) => {
    const originalPrice = getOriginalPrice(product, variant, sizeDetail);
    let effectivePrice = originalPrice;

    if (isDiscountActive(product, variant, sizeDetail)) {
      if (sizeDetail && sizeDetail.discountPrice) {
        effectivePrice = parseFloat(sizeDetail.discountPrice) || effectivePrice;
      } else if (product.discountPrice) {
        effectivePrice = parseFloat(product.discountPrice) || effectivePrice;
      }
    }

    const discount = getApplicableDiscount(product);
    if (discount) {
      effectivePrice = effectivePrice * (1 - discount.discountPercentage / 100);
    }

    return parseFloat(effectivePrice.toFixed(2));
  }

  const getBulkPricing = (product, variant = null, sizeDetail = null) => {
    let bulkPricing = [];
    
    if (sizeDetail) {
      if (isDiscountActive(product, variant, sizeDetail) && sizeDetail.discountBulkPricing) {
        bulkPricing = sizeDetail.discountBulkPricing;
      } else if (sizeDetail.bulkPricingCombinations) {
        bulkPricing = sizeDetail.bulkPricingCombinations;
      }
    } else if (isDiscountActive(product) && product.discountBulkPricing) {
      bulkPricing = product.discountBulkPricing;
    } else if (product.bulkPricing) {
      bulkPricing = product.bulkPricing;
    }

    const discount = getApplicableDiscount(product);
    if (discount) {
      bulkPricing = bulkPricing.map(tier => ({
        ...tier,
        wholesalePrice: parseFloat((tier.wholesalePrice * (1 - discount.discountPercentage / 100)).toFixed(2))
      }));
    }

    return bulkPricing;
  }

  const getEffectiveUnitPrice = (quantity, bulkPricing, basePrice) => {
    if (bulkPricing.length === 0) return basePrice;
    let effectivePrice = basePrice;
    for (let i = bulkPricing.length - 1; i >= 0; i--) {
      if (quantity >= bulkPricing[i].quantity) {
        effectivePrice = bulkPricing[i].wholesalePrice;
        break;
      }
    }
    return effectivePrice;
  }

  const activeDiscounts = useMemo(() => {
  const now = new Date();
  return discountData.filter(discount => {
    const start = new Date(discount.startDate);
    const end = new Date(discount.endDate);
    return now >= start && now <= end && discount.isActive;
  });
}, [discountData]);

const getApplicableDiscount = useCallback((product) => {
  for (const discount of activeDiscounts) {
    if (discount.applicableToAll ||
      (discount.selectedMainCategory && product.categoryPath?.includes(discount.selectedMainCategory)) ||
      (discount.selectedSubCategory && product.categoryPath?.includes(discount.selectedSubCategory))
    ) {
      return discount;
    }
  }
  return null;
}, [activeDiscounts]);

  // Helper function to build nested category tree from flat array
const buildCategoryTree = (categories) => {
  const categoryMap = {};
  const tree = [];

  // Create a map of all categories
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat, subcategories: [] };
  });

  // Build the tree structure
  categories.forEach(cat => {
    if (cat.parent_category_id) {
      const parent = categoryMap[cat.parent_category_id];
      if (parent) {
        parent.subcategories.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });

  return tree;
};

// Helper function to find all descendant category IDs (recursive)
const getAllDescendantCategoryIds = (categoryId, categoriesTree) => {
  const ids = [categoryId];
  
  const findInTree = (cats) => {
    for (const cat of cats) {
      if (cat._id === categoryId) {
        const collectIds = (c) => {
          ids.push(c._id);
          if (c.subcategories && c.subcategories.length > 0) {
            c.subcategories.forEach(collectIds);
          }
        };
        if (cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach(collectIds);
        }
        return true;
      }
      if (cat.subcategories && cat.subcategories.length > 0) {
        if (findInTree(cat.subcategories)) return true;
      }
    }
    return false;
  };
  
  const categoriesTree_built = buildCategoryTree(categories);
  findInTree(categoriesTree_built);
  return ids;
};

// Helper function to build category path from ID
const categoryPathCache = useMemo(() => new Map(), [categories]);

const buildCategoryPathFromId = useCallback((categoryId) => {
  if (categoryPathCache.has(categoryId)) {
    return categoryPathCache.get(categoryId);
  }
  
  const path = [];
  let currentCat = categories.find(cat => cat._id === categoryId);
  
  while (currentCat) {
    path.unshift(currentCat);
    if (currentCat.parent_category_id) {
      currentCat = categories.find(cat => cat._id === currentCat.parent_category_id);
    } else {
      currentCat = null;
    }
  }
  
  categoryPathCache.set(categoryId, path);
  return path;
}, [categories, categoryPathCache]);

// Helper function to get immediate children of a category
const getCategoryChildren = (categoryId) => {
  if (!categoryId) {
    return categories.filter(cat => !cat.parent_category_id);
  }
  return categories.filter(cat => cat.parent_category_id === categoryId);
};

// Function that will handle logout
const handleLogout = async () => {
    try {
      await axios.post('https://api.simplyrks.cloud/api/auth/logout', {}, { withCredentials: true });
      
      // Clear all session caches
      sessionStorage.clear();
      
      setUser(null);
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getProductBadge = (product, variant = null, sizeDetail = null) => {
    if (isOutOfStockForBadge(product, variant, sizeDetail)) {
      return { text: "Out of Stock", color: "bg-red-500" }
    }
    if (isDiscountActive(product, variant, sizeDetail)) {
      return { text: "Revised Rate", color: "bg-orange-500" }
    }
    if (getApplicableDiscount(product)) {
      return { text: "DISCOUNTED", color: "bg-red-500" }
    }
    if (isRecentlyRestocked(product, variant, sizeDetail)) {
      return { text: "Restocked", color: "bg-green-500" }
    }
    if (isNew(product)) {
      return { text: "New", color: "bg-blue-500" }
    }
    return null
  }

  const generateCartKey = (productId, colorName = null, sizeString = null) => {
    return `${productId}-${colorName || "default"}-${sizeString || "default"}`
  }

  const parseCartKey = (cartKey) => {
    const [productId, colorName, sizeString] = cartKey.split("-")
    return {
      productId: productId,
      colorName: colorName === "default" ? null : colorName,
      sizeString: sizeString === "default" ? null : sizeString,
    }
  }

  const handleAddToCart = async (productId, colorName = null, sizeString = null, quantity = 1) => {
  
  const product = products.find((p) => p._id === productId);
  if (!product) return;

  const variant = product.variants?.find((v) => v.colorName === colorName);
  const sizeDetail = variant?.moreDetails?.find((md) => formatSize(md.size) === sizeString);

  console.log('Variant found:', variant);
  console.log('Variant ID:', variant?._id);
  console.log('SizeDetail found:', sizeDetail);
  console.log('SizeDetail ID:', sizeDetail?._id);

  const originalPrice = getOriginalPrice(product, variant, sizeDetail);
  const displayPrice = getDisplayPrice(product, variant, sizeDetail);

  // Get bulk pricing and check for 1+ tier
  const bulkPricing = getBulkPricing(product, variant, sizeDetail);
  const bulkPrice1Plus = bulkPricing.find(tier => tier.quantity === 1);
  
  // Use 1+ bulk price if available, otherwise use display price
  const effectivePrice = bulkPrice1Plus ? bulkPrice1Plus.wholesalePrice : displayPrice;

const productData = {
    imageUrl: variant?.variantImage || product.image || "/placeholder.svg",
    productName: product.name,
    variantId: variant?._id || "",
    detailsId: sizeDetail?._id || "",
    sizeId: sizeDetail?.size?._id || "",
    price: originalPrice,
    discountedPrice: effectivePrice, // Use effective price which includes 1+ bulk pricing
  };

  await addToCart(productId, colorName, sizeString, quantity, productData);
  
};

  const handleUpdateQuantity = async (cartKey, change) => {
  
  await updateQuantity(cartKey, change);
};

  const handleRemoveFromCart = async (cartKey) => {
  
  await removeFromCart(cartKey);
};

const handleCategoryClick = async (category) => {
  if (selectedCategory === category.categoryName) {
    // Clear category selection
    setSelectedCategory(null);
    setSelectedCategoryPath([]);
    setSelectedFilters(['all']);
    setSelectedCategoryIdForFilter(null);
    setCategoryFilteredProducts([]);
    setCategoryHasMore(false);
    setCategoryTotalCount(0);
    setCategoryCurrentPage(1);
    
    setTimeout(() => {
      document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100);
  } else {
    // Set new category
    setSelectedCategory(category.categoryName);
    const path = buildCategoryPathFromId(category._id);
    setSelectedCategoryPath(path);
    setSelectedFilters((prev) => prev.filter(f => f !== 'all'));
    setSelectedCategoryIdForFilter(category._id);
    
    // Clear and fetch category products
    setCategoryFilteredProducts([]);
    setCategoryCurrentPage(1);
    
    try {
  setCategoryLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/product/all?page=1&limit=50&categoryId=${category._id}`,
        { withCredentials: true }
      );
      
      console.log("Category products loaded:", response.data);
      
      setCategoryFilteredProducts(response.data.products);
      setCategoryHasMore(response.data.hasMore);
      setCategoryTotalCount(response.data.totalCount);
      setCategoryCurrentPage(1);
setCategoryLoading(false);
      
      setTimeout(() => {
        document.getElementById('selected-category-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100);
  } catch (error) {
  console.error("Error fetching category products:", error);
  setCategoryLoading(false);
}
  }
}

const handleFilterChange = (filter) => {
  const wasSelected = selectedFilters.includes(filter);

  setSelectedFilters((prev) => {
    if (filter === "all") {
      setSelectedCategory(null);
      setSelectedCategoryPath([]);
      return ["all"];
    }
    const newFilters = prev.filter((f) => f !== "all");
    if (newFilters.includes(filter)) {
      const filtered = newFilters.filter((f) => f !== filter);
      return filtered.length === 0 ? ["all"] : filtered;
    }
    return [...newFilters, filter];
  });

  // Scroll after state updates
  setTimeout(() => {
    if (filter === "all") {
      const allProductsSection = document.getElementById("all-products-section");
      if (allProductsSection) {
        allProductsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else if (filter === "just-arrived") {
      justArrivedRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (filter === "restocked") {
      restockedRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (filter === "revised-rates") {
      revisedRatesRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (filter === "out-of-stock") {
      outOfStockRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, 100);
};

const scrollCategories = (direction) => {
  const container = categoriesContainerRef.current;
  if (!container) return;

  const scrollAmount = 200; // Adjust this value to control scroll distance
  const newPosition =
    direction === "left"
      ? Math.max(0, categoriesScrollPosition - scrollAmount)
      : categoriesScrollPosition + scrollAmount;

  container.scrollLeft = newPosition;
  setCategoriesScrollPosition(newPosition);
};

  const handleToggleFavorite = async (productId) => {
  const result = await toggleFavorite(productId);
  if (!result.success && result.message) {
    const { toast } = await import('react-toastify');
    toast.error(result.message, {
      position: "top-right",
      autoClose: 2000,
    });
    
    if (result.message.includes('login')) {
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    }
  }
};

  const handleShare = async (product, variant = null) => {
    const productUrl = `${window.location.origin}/product/${product._id}${variant ? `?variant=${variant.colorName}` : ""}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.name}`,
          url: productUrl,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl)
        alert("Product link copied to clipboard!")
      } catch (err) {
        console.log("Error copying to clipboard:", err)
      }
    }
  }

  const handleWhatsAppShare = (product, variant = null) => {
    const productUrl = `${window.location.origin}/product/${product._id}${variant ? `?variant=${variant.colorName}` : ""}`
    const message = `Check out this ${product.name}: ${productUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // Filter main categories (those without a parent_category_id)
  const mainCategories = useMemo(
  () => categories.filter(category => 
    !category.parent_category_id && category.isActive !== false
  ),
  [categories]
);

  // Sort products by price if price-low-to-high filter is selected

  const sortProductsByPrice = (products) => {
    if (selectedFilters.includes("price-low-to-high")) {
      return [...products].sort((a, b) => {
        const priceA = getDisplayPrice(a, a.variants?.[0], a.variants?.[0]?.moreDetails?.[0]);
        const priceB = getDisplayPrice(b, b.variants?.[0], b.variants?.[0]?.moreDetails?.[0]);
        return priceA - priceB;
      });
    }
    return products;
  };

  // Memoize expensive computations - MOVED HERE AFTER ALL FUNCTIONS ARE DEFINED
  const filteredProductsList = getFilteredProducts; // Already memoized above

const justArrivedProductsList = useMemo(() => {
  const filtered = filteredProductsList.filter((product) => isNew(product) && !isOutOfStock(product));
  return sortProductsByPrice(filtered);
}, [filteredProductsList, selectedFilters]);
  const restockedProductsList = useMemo(() => {
    const filtered = filteredProductsList.filter((product) => !isOutOfStock(product) && (
      isRecentlyRestocked(product) ||
      product.variants?.some((variant) =>
        variant.moreDetails?.some((sizeDetail) => isRecentlyRestocked(product, variant, sizeDetail)),
      )
    ));
    return sortProductsByPrice(filtered);
  }, [filteredProductsList, selectedFilters]);
  const revisedRatesProductsList = useMemo(() => {
    const filtered = filteredProductsList.filter((product) => !isOutOfStock(product) && (
      isDiscountActive(product) ||
      product.variants?.some((variant) =>
        variant.moreDetails?.some((sizeDetail) => isDiscountActive(product, variant, sizeDetail)),
      )
    ));
    return sortProductsByPrice(filtered);
  }, [filteredProductsList, selectedFilters]);
  const outOfStockProductsList = useMemo(() => {
    const filtered = filteredProductsList.filter(isOutOfStock);
    return sortProductsByPrice(filtered);
  }, [filteredProductsList, selectedFilters]);

  if (loadingDiscount || loadingCategories || loadingFreeCash) {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading products...</p>
      </div>
    </div>
  );
}

if (categoriesErrors || freeCashErrors) {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-3">
        <p className="text-red-600 dark:text-red-400 text-lg font-medium">Error: {categoriesErrors || freeCashErrors}</p>
      </div>
    </div>
  );
}

// Sticky Category Navigation Bar Component
const CategoryNavigationBar = () => {
  if (selectedCategoryPath.length === 0) return null;

  const categoriesTree = buildCategoryTree(categories);
  const currentCategory = selectedCategoryPath[selectedCategoryPath.length - 1];
  const mainCategory = selectedCategoryPath[0];
  const subCategoryOptions = getCategoryChildren(currentCategory._id);

const handleMainCategoryChange = async (categoryId) => {
  if (!categoryId) {
    setSelectedCategory(null);
    setSelectedCategoryPath([]);
    setSelectedCategoryIdForFilter(null);
    setCategoryFilteredProducts([]);
    setCategoryHasMore(false);
    setCategoryTotalCount(0);
    setCategoryCurrentPage(1);
    return;
  }
  
  const newPath = buildCategoryPathFromId(categoryId);
  setSelectedCategory(newPath[newPath.length - 1].categoryName);
  setSelectedCategoryPath(newPath);
  setSelectedCategoryIdForFilter(categoryId);
  
  // Fetch products for new category
  try {
    setCategoryLoading(true);
    const response = await axios.get(
      `http://localhost:3000/api/product/all?page=1&limit=50&categoryId=${categoryId}`,
      { withCredentials: true }
    );
    
    setCategoryFilteredProducts(response.data.products);
    setCategoryHasMore(response.data.hasMore);
    setCategoryTotalCount(response.data.totalCount);
    setCategoryCurrentPage(1);
    setCategoryLoading(false);
  } catch (error) {
    console.error("Error fetching category products:", error);
    setCategoryLoading(false);
  }
};

  const handleSubCategoryChange = async (categoryId) => {
  if (!categoryId) return;
  
  const newPath = buildCategoryPathFromId(categoryId);
  setSelectedCategory(newPath[newPath.length - 1].categoryName);
  setSelectedCategoryPath(newPath);
  setSelectedCategoryIdForFilter(categoryId);
  
  // Fetch products for new subcategory
  try {
    setCategoryLoading(true);
    const response = await axios.get(
      `http://localhost:3000/api/product/all?page=1&limit=50&categoryId=${categoryId}`,
      { withCredentials: true }
    );
    
    setCategoryFilteredProducts(response.data.products);
    setCategoryHasMore(response.data.hasMore);
    setCategoryTotalCount(response.data.totalCount);
    setCategoryCurrentPage(1);
    setCategoryLoading(false);
  } catch (error) {
    console.error("Error fetching category products:", error);
    setCategoryLoading(false);
  }
};

  const handleBreadcrumbClick = (index) => {
    const newPath = selectedCategoryPath.slice(0, index + 1);
    setSelectedCategory(newPath[newPath.length - 1].categoryName);
    setSelectedCategoryPath(newPath);
  };

  return (
  <div className="sticky top-16 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-4 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Path:</span>
            {selectedCategoryPath.map((cat, index) => (
              <div key={cat._id} className="flex items-center gap-2">
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="text-blue-600 hover:text-blue-800 text-xs transition-colors hover:underline dark:text-white"
                >
                  {cat.categoryName}
                </button>
                {index < selectedCategoryPath.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Category Dropdowns and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Main Category Dropdown */}
              <div className="flex-1 sm:min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Main Category
                </label>
                <select
                  value={mainCategory._id}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-sm"
                >
                  {mainCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Category Dropdown */}
              {subCategoryOptions.length > 0 && (
                <div className="flex-1 sm:min-w-[200px]">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Sub Category
                  </label>
                  <select
                    value={currentCategory._id}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-sm"
                  >
                    <option value={currentCategory._id}>
                      {currentCategory.categoryName} (Current)
                    </option>
                    {subCategoryOptions.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="dark:text-white flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4" />
                Go to Categories
              </button>
              <button
onClick={() => {
  setSelectedCategory(null);
  setSelectedCategoryPath([]);
  setSelectedFilters(['all']);
  setSelectedCategoryIdForFilter(null);
  setCategoryFilteredProducts([]);
  setCategoryHasMore(false);
  setCategoryTotalCount(0);
  setCategoryCurrentPage(1);
  setTimeout(() => {
    document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-red-600 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap dark:text-gray-400"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const BannerCarousel = React.memo(() => {
    const { banners, loadingBanner, Bannerserror } = useContext(BannerContext);
    const [currentBanner, setCurrentBanner] = useState(0);

    useEffect(() => {
      if (banners.length > 1) {
        const interval = setInterval(() => {
          setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
      }
    }, [banners.length]);

    useEffect(() => {
      setCurrentBanner(0);
    }, [banners]);

    return (
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentBanner * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <img
  src={getOptimizedImageUrl(banner, { width: 1200, quality: 'auto' })}
  alt={`Banner ${index + 1}`}
  className="w-full h-full object-contain"
  loading="eager"
  onError={(e) => {
    console.error('Image failed to load:', banner);
    e.target.src = "/placeholder.svg";
  }}
/>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center text-white">
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-900/80 hover:bg-white dark:bg-gray-900 dark:text-white p-2 rounded-full transition-colors duration-200"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:text-white dark:bg-gray-900/80 hover:bg-white dark:bg-gray-900 p-2 rounded-full transition-colors duration-200"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === currentBanner ? "bg-white dark:bg-gray-900" : "bg-white dark:bg-gray-900/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  });

  const ProductCard = React.memo(({ product, forcedBadge = null }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedVariant, setSelectedVariant] = useState(
  product.variants?.find(v => v.isActive !== false) || null
)
    const [selectedSizeDetail, setSelectedSizeDetail] = useState(
  selectedVariant?.moreDetails?.find(md => md.isActive !== false) || null
)
    const [addQuantity, setAddQuantity] = useState(1)
    const [showDetails, setShowDetails] = useState(false)
    const [localQuantity, setLocalQuantity] = useState({})

    // Use ref to store initial selections to prevent resets
    const initialVariantRef = useRef(product.variants?.[0] || null)
    const initialSizeDetailRef = useRef(selectedVariant?.moreDetails?.[0] || null)
    const inputRef = useRef(null)


    useEffect(() => {
  if (selectedVariant && selectedVariant.moreDetails) {
    const activeSizes = selectedVariant.moreDetails.filter(md => md.isActive !== false);
    if (activeSizes.length > 0) {
      if (!selectedSizeDetail || !activeSizes.includes(selectedSizeDetail)) {
        setSelectedSizeDetail(activeSizes[0])
      }
    }
  }
}, [selectedVariant, selectedSizeDetail])

    const badge = forcedBadge || getProductBadge(product, selectedVariant, selectedSizeDetail)

    const originalPrice = getOriginalPrice(product, selectedVariant, selectedSizeDetail);
    const displayPrice = getDisplayPrice(product, selectedVariant, selectedSizeDetail);

    const isDiscounted = displayPrice < originalPrice;
    const strikePrice = isDiscounted ? originalPrice : null;

    let bulkPricing = getBulkPricing(product, selectedVariant, selectedSizeDetail);
    const isBulkDiscounted = isDiscountActive(product, selectedVariant, selectedSizeDetail) || getApplicableDiscount(product);

    const getVariantAndSizeCount = () => {
  const activeVariants = product.variants?.filter(v => v.isActive !== false) || []
  const variantCount = activeVariants.length
  
  const totalSizes = activeVariants.reduce((total, variant) => {
    const activeSizes = variant.moreDetails?.filter(md => md.isActive !== false) || []
    return total + activeSizes.length
  }, 0)
  
  return { variantCount, totalSizes }
}

    const { variantCount, totalSizes } = getVariantAndSizeCount()

    const hasVariants = product.variants && product.variants.length > 0
    const isSimpleProduct = !hasVariants

    const getCurrentImages = () => {
      const images = []

      if (selectedVariant && selectedVariant.variantImage) {
        images.push(selectedVariant.variantImage)
      } else if (product.image) {
        images.push(product.image)
      }

      if (selectedSizeDetail && selectedSizeDetail.additionalImages) {
        images.push(...selectedSizeDetail.additionalImages)
      }

      if (product.additionalImages) {
        images.push(...product.additionalImages)
      }

      return images.filter(Boolean)
    }

    const currentImages = getCurrentImages()
    const currentImage = currentImages[currentImageIndex] || "/placeholder.svg"

    const handleVariantSelect = (variant) => {
      setSelectedVariant(variant)
      setCurrentImageIndex(0)
    }

    const handleSizeSelect = (sizeDetail) => {
      setSelectedSizeDetail(sizeDetail)
      setCurrentImageIndex(0)
    }

    const handleImageNavigation = (direction) => {
      if (currentImages.length <= 1) return

      if (direction === "next") {
        setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
      }
    }

    const handleAddToCartWithQuantity = async () => {
      if (isSimpleProduct) {
        await handleAddToCart(product._id, null, null, addQuantity)
      } else {
        if (!selectedVariant || !selectedSizeDetail) return
        const sizeString = formatSize(selectedSizeDetail.size)
        await handleAddToCart(product._id, selectedVariant.colorName, sizeString, addQuantity)
      }
      setAddQuantity(1)
    }

    const currentStock = selectedSizeDetail ? selectedSizeDetail.stock : (selectedVariant ? selectedVariant.commonStock : product.stock) || 0

    return (
 <div 
  className="bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group w-full cursor-pointer"
  onClick={() => navigate(`/product/${product._id}`)}
>
        <div className="relative">
          <div className="relative">
           <img
  src={getOptimizedImageUrl(currentImage, { width: 400, quality: 60 }) || "/placeholder.svg"}
  alt={product.name}
  className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300 cursor-pointer"
  loading="lazy"
  decoding="async"
/>

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageNavigation("prev")
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageNavigation("next")
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity dark:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {currentImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white dark:bg-gray-900" : "bg-white dark:bg-gray-900/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {badge && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${badge.color}`}>{badge.text}</span>
            </div>
          )}

          <div className="absolute top-2 right-2 flex flex-col items-center gap-2">
  <button
  onClick={(e) => {
    e.stopPropagation();
    handleToggleFavorite(product._id);
  }}
  className={`p-1 rounded-full transition-colors ${
    isFavorite(product._id)
      ? "bg-red-500 text-blue-600"
      : "bg-white dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:text-red-500"
  }`}
>
  <Heart className={`w-4 h-4 ${isFavorite(product._id) ? "fill-current" : ""}`} />
</button>
  <button
    onClick={(e) => {
      e.stopPropagation()
      handleShare(product, selectedVariant)
    }}
    className="p-1 rounded-full bg-white dark:bg-gray-900/90 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
    title="Share product"
  >
    <Share2 className="w-4 h-4" />
  </button>
</div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold -800 dark:text-gray-100 mb-2 line-clamp-2">{product.name}</h3>

         <div className="flex items-center gap-2 mb-3">
  {(() => {
    const bulkPrice1Plus = bulkPricing.find(tier => tier.quantity === 1);
    const showBulkPrice = bulkPrice1Plus && bulkPrice1Plus.wholesalePrice < displayPrice;
    
    if (showBulkPrice) {
      return (
        <>
          <span className="text-lg font-bold text-gray-900 dark:text-white">₹ {bulkPrice1Plus.wholesalePrice.toFixed(2)}</span>
          <span className="text-sm text-gray-500 line-through dark:text-gray-400">₹ {displayPrice.toFixed(2)}</span>
        </>
      );
    } else {
      return (
        <>
          <span className="text-lg font-bold text-gray-900 dark:text-white">₹ {displayPrice.toFixed(2)}</span>
          {strikePrice && (
            <span className="text-sm text-gray-500 line-through dark:text-gray-400">₹ {strikePrice.toFixed(2)}</span>
          )}
        </>
      );
    }
  })()}
</div>

          {/* <div className="mb-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Stock: {currentStock} available
            </span>
          </div> */}

          {bulkPricing.filter(tier => tier.quantity > 1).length > 0 && (
  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Bulk Pricing:</p>
    <div className="space-y-1">
      {bulkPricing.filter(tier => tier.quantity > 1).map((tier, index) => (
        <div key={index} className="flex justify-between text-xs">
          <span>{tier.quantity}+ pcs</span>
          <span className="font-semibold">₹ {tier.wholesalePrice.toFixed(2)} each</span>
        </div>
      ))}
    </div>
  </div>
)}

          {hasVariants && (
            <>
              {!showDetails ? (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Variants:</span>
                      <span className="font-medium">{variantCount} colors</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sizes:</span>
                      <span className="font-medium">{totalSizes} options</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 space-y-3">
                  <div className="mb-2">
  <span className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Variants:</span>
  <div className="flex gap-1 flex-wrap">
    {product.variants?.filter(v => v.isActive !== false).map((variant, index) => (
      <button
        key={index}
        onClick={(e) => {
          e.stopPropagation();
          handleVariantSelect(variant);
        }}
        className={`w-10 h-10 rounded-md border-2 overflow-hidden transition-all ${
          selectedVariant?.colorName === variant.colorName
            ? "border-blue-500 scale-105 shadow-md"
            : "border-gray-300 hover:border-gray-400"
        }`}
        title={variant.colorName}
      >
        <img
          src={getOptimizedImageUrl(variant.variantImage || product.image, { width: 100 }) || "/placeholder.svg"}
          alt={variant.colorName}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </button>
    ))}
  </div>
</div>

                  {selectedVariant && selectedSizeDetail && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>
                        Color: <span className="font-medium capitalize">{selectedVariant.colorName}</span>
                      </div>
                      <div>
                        Size: <span className="font-medium">{formatSize(selectedSizeDetail.size)}</span>
                      </div>
                    </div>
                  )}

                  {selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.filter(md => md.isActive !== false).length > 1 && (
  <div>
    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Available Sizes:</span>
    <div className="flex gap-1 flex-wrap">
      {selectedVariant.moreDetails.filter(md => md.isActive !== false).map((sizeDetail, index) => (
                          <button
                            key={index}
                            onClick={() => handleSizeSelect(sizeDetail)}
                            className={`px-2 py-1 text-xs rounded border ${
                              selectedSizeDetail === sizeDetail
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {formatSize(sizeDetail.size)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkPricing.length > 0 && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {isBulkDiscounted
                          ? "Discounted Bulk Pricing:"
                          : "Bulk Pricing:"}
                      </p>
                      <div className="space-y-1">
                        {bulkPricing.map((tier, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{tier.quantity}+ pcs</span>
                            <span className="font-semibold">₹ {tier.wholesalePrice.toFixed(2)} each</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
  {/* Check if item is in cart */}
  {(() => {
    const cartKey = isSimpleProduct 
      ? `${product._id}-default-default`
      : selectedVariant && selectedSizeDetail
        ? `${product._id}-${selectedVariant.colorName}-${formatSize(selectedSizeDetail.size)}`
        : null;
    
    const itemInCart = cartKey ? cartItems[cartKey] : null;
    
    return itemInCart ? (
  // Item is in cart - show quantity controls and remove button
  <>
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">In Cart:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateQuantity(cartKey, -1);
          }}
          className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
  ref={inputRef}
  type="number"
  value={localQuantity[cartKey] !== undefined ? localQuantity[cartKey] : itemInCart.quantity}
  onChange={(e) => {
    e.stopPropagation();
    const val = e.target.value;
    setLocalQuantity(prev => ({ ...prev, [cartKey]: val }));
  }}
  onBlur={(e) => {
    const val = e.target.value;
    const num = Number.parseInt(val);
    
    if (val === '' || val === '0' || isNaN(num) || num < 1) {
      // Reset to 1
      const diff = 1 - itemInCart.quantity;
      if (diff !== 0) {
        handleUpdateQuantity(cartKey, diff);
      }
      setLocalQuantity(prev => {
        const newState = { ...prev };
        delete newState[cartKey];
        return newState;
      });
    } else if (num !== itemInCart.quantity) {
      // Update quantity
      const diff = num - itemInCart.quantity;
      handleUpdateQuantity(cartKey, diff);
      setLocalQuantity(prev => {
        const newState = { ...prev };
        delete newState[cartKey];
        return newState;
      });
    } else {
      // Same value, just clear local state
      setLocalQuantity(prev => {
        const newState = { ...prev };
        delete newState[cartKey];
        return newState;
      });
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }}
  onClick={(e) => e.stopPropagation()}
  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm font-semibold"
/>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateQuantity(cartKey, 1);
          }}
          className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveFromCart(cartKey);
          }}
          className="dark:text-white w-full bg-red-600 hover:bg-red-700 text-red-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Remove from Cart
        </button>
      </>
    ) : (
      // Item not in cart - show add to cart controls
      <>
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
            >
              <Minus className="w-3 h-3" />
            </button>
           <input
  type="number"
  value={addQuantity}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '') {
      setAddQuantity('');
    } else {
      const num = Number.parseInt(val);
      if (!isNaN(num) && num >= 1) {
        setAddQuantity(num);
      }
    }
  }}
  onBlur={(e) => {
    if (e.target.value === '' || e.target.value === '0') {
      setAddQuantity(1);
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      if (e.target.value === '' || e.target.value === '0') {
        setAddQuantity(1);
      }
      handleAddToCartWithQuantity();
    }
  }}
  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
/>
            <button
              onClick={() => setAddQuantity(addQuantity + 1)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {hasVariants && (
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedVariantProduct(product)}
              className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1"
            >
              <Palette className="w-4 h-4" />
              Variants
            </button>
          </div>
        )}

        <button
          onClick={handleAddToCartWithQuantity}
          disabled={hasVariants && (!selectedVariant || !selectedSizeDetail)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-green-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Add {addQuantity} to Cart
        </button>
      </>
    );
  })()}
</div>
        </div>
      </div>
    )
 }, (prevProps, nextProps) => {
  // Return true to PREVENT re-render (props are equal)
  // Return false to ALLOW re-render (props changed)
  
  if (prevProps.product._id !== nextProps.product._id) return false;
  if (prevProps.forcedBadge?.text !== nextProps.forcedBadge?.text) return false;
  if (prevProps.product.name !== nextProps.product.name) return false;
  if (prevProps.product.price !== nextProps.product.price) return false;
  
  // Don't re-render for other changes
  return true;
});

  

  const ProductModal = ({ product, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  // Initialize with default variant and first size
  useEffect(() => {
    if (product.hasVariants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
      if (defaultVariant.moreDetails && defaultVariant.moreDetails.length > 0) {
        setSelectedSize(defaultVariant.moreDetails[0]);
      }
    }
  }, [product]);

  // Check if discount is valid
  const isDiscountValid = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  // Calculate discount percentage
  const getDiscountPercentage = (originalPrice, discountPrice) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    if (value === '' || (!isNaN(value) && parseInt(value) >= 1)) {
      setQuantity(value === '' ? '' : parseInt(value));
    }
  };

  // Handle variant change
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    if (variant.moreDetails && variant.moreDetails.length > 0) {
      setSelectedSize(variant.moreDetails[0]);
    }
    setQuantity(1);
  };

  const currentPrice = selectedSize?.discountPrice && isDiscountValid(selectedSize.discountStartDate, selectedSize.discountEndDate) 
    ? selectedSize.discountPrice 
    : selectedSize?.price;

  const originalPrice = selectedSize?.price;
  const hasDiscount = selectedSize?.discountPrice && isDiscountValid(selectedSize.discountStartDate, selectedSize.discountEndDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl my-8 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-900 hover:bg-gray-100 p-2 rounded-full shadow-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
          {/* Left Section - Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative">
              <img
                src={selectedVariant?.variantImage || product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-96 lg:h-[500px] object-contain rounded-2xl"
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {getDiscountPercentage(originalPrice, currentPrice)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Variant Images */}
            {product.hasVariants && product.variants && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => handleVariantChange(variant)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedVariant?._id === variant._id ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img
  src={getOptimizedImageUrl(variant.variantImage, { width: 100 }) || "/placeholder.svg"}
  alt={variant.colorName}
  className="w-full h-full object-contain"
  loading="lazy"
/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Product Details */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{product.categoryPath}</p>
            </div>

            {/* Rating and Reviews - Static for now */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">(4.8) • Reviews</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹ {currentPrice || getDisplayPrice(product, selectedVariant, selectedSize)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  ₹ {originalPrice}
                </span>
              )}
            </div>

            {/* Color Selection */}
            {product.hasVariants && product.variants && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Color</h3>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => handleVariantChange(variant)}
                      className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                        selectedVariant?._id === variant._id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {variant.colorName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedVariant && selectedVariant.moreDetails && selectedVariant.moreDetails.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedVariant.moreDetails.map((detail) => (
                    <button
                      key={detail._id}
                      onClick={() => setSelectedSize(detail)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedSize?._id === detail._id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">
                        {formatSize(detail.size)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ₹ {detail.discountPrice && isDiscountValid(detail.discountStartDate, detail.discountEndDate) 
                          ? detail.discountPrice 
                          : detail.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-16 py-2 text-center border-0 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const maxStock = selectedSize?.stock || product.stock || 100;
                      if (quantity < maxStock) setQuantity(quantity + 1);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {selectedSize?.stock || product.stock || 0} available
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={async () => {
                if (product.hasVariants && selectedVariant && selectedSize) {
                  const sizeString = formatSize(selectedSize.size);
                  await handleAddToCart(product._id, selectedVariant.colorName, sizeString, quantity);
                } else if (!product.hasVariants) {
                  await handleAddToCart(product._id, null, null, quantity);
                }
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-green-600 py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart • ₹ {((currentPrice || getDisplayPrice(product, selectedVariant, selectedSize)) * quantity).toFixed(2)}
            </button>

            {/* Product Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">Quality Assured</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">Fast Shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-700">Premium Quality</span>
              </div>
            </div>

            {/* Product Details */}
            {product.productDetails && product.productDetails.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Product Details</h3>
                <div className="space-y-2">
                  {product.productDetails.map((detail) => (
                    <div key={detail._id} className="flex">
                      <span className="font-medium text-gray-700 w-32">{detail.key}:</span>
                      <span className="text-gray-600 dark:text-gray-400">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


  const VariantModal = ({ product, onClose }) => {
    const [selectedVariant, setSelectedVariant] = useState(
  product.variants?.find(v => v.isActive !== false) || null
)
    const [selectedSizeDetail, setSelectedSizeDetail] = useState(
  selectedVariant?.moreDetails?.find(md => md.isActive !== false) || null
)
    const [localQuantityToAdd, setLocalQuantityToAdd] = useState(1)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const modalRef = useRef(null)

    useEffect(() => {
      const modal = modalRef.current
      if (modal) {
        modal.scrollTop = 0
        modal.style.overflowY = 'auto'
        modal.style.overscrollBehavior = 'contain'

        const inputs = modal.querySelectorAll('input, button, select')
        inputs.forEach((el) => el.setAttribute('tabindex', '-1'))

        modal.focus()
      }
    }, [])

    useEffect(() => {
  if (selectedVariant && selectedVariant.moreDetails) {
    const activeSizes = selectedVariant.moreDetails.filter(md => md.isActive !== false);
    if (activeSizes.length > 0) {
      if (!selectedSizeDetail || !activeSizes.includes(selectedSizeDetail)) {
        setSelectedSizeDetail(activeSizes[0])
      }
    }
  }
}, [selectedVariant, selectedSizeDetail])

    if (!product) return null

    const handleVariantSelect = (variant) => {
      setSelectedVariant(variant)
      setCurrentImageIndex(0)
    }

    const handleSizeSelect = (sizeDetail) => {
      setSelectedSizeDetail(sizeDetail)
      setCurrentImageIndex(0)
    }

    const handleAddToCartFromModal = async () => {
      if (!selectedVariant || !selectedSizeDetail) return

      const sizeString = formatSize(selectedSizeDetail.size)
      await handleAddToCart(product._id, selectedVariant.colorName, sizeString, localQuantityToAdd)
      setLocalQuantityToAdd(1)
      onClose()
    }

    const getCurrentImages = () => {
      const images = []

      if (selectedVariant && selectedVariant.variantImage) {
        images.push(selectedVariant.variantImage)
      }

      if (selectedSizeDetail && selectedSizeDetail.additionalImages) {
        images.push(...selectedSizeDetail.additionalImages)
      }

      if (product.additionalImages) {
        images.push(...product.additionalImages)
      }

      return images.filter(Boolean)
    }

    const currentImages = getCurrentImages()
    const currentImage = currentImages[currentImageIndex] || "/placeholder.svg"
    const displayPrice = getDisplayPrice(product, selectedVariant, selectedSizeDetail)
    const bulkPricing = getBulkPricing(product, selectedVariant, selectedSizeDetail)

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col focus:outline-none"
          tabIndex="0"
        >
          <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
            <h2 className="text-xl font-bold -800 dark:text-gray-100">Select Variants</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="mb-4">
              <div className="relative mb-4">
                <img
  src={getOptimizedImageUrl(currentImage, { width: 400 }) || "/placeholder.svg"}
  alt={`${product.name} - ${selectedVariant?.colorName || "default"} variant`}
  className="w-full h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
  style={{ maxHeight: '200px' }}
  onClick={() => setSelectedImage(currentImage)}
  loading="lazy"
/>

                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
                      }
                      className="dark:text-white absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-black p-1 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)}
                      className="dark:text-white absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-black p-1 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {currentImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white dark:bg-gray-900" : "bg-white dark:bg-gray-900/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-2xl font-bold text-blue-600">₹ {displayPrice.toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Color: {selectedVariant?.colorName || "Select Color"}</h4>
              <div className="flex gap-3 flex-wrap">
                {product.variants?.filter(v => v.isActive !== false).map((variant, index) => {
                  const isSelected = selectedVariant?.colorName === variant.colorName

                  return (
                    <button
                      key={index}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all overflow-hidden ${
                        isSelected ? "border-blue-500 scale-105 shadow-lg" : "border-gray-300 hover:border-gray-400"
                      }`}
                      title={variant.colorName}
                    >
                      <img
  src={getOptimizedImageUrl(variant.variantImage, { width: 100 }) || "/placeholder.svg"}
  alt={variant.colorName}
  className="w-full h-full object-contain rounded-lg"
  loading="lazy"
/>
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <div className="bg-white dark:bg-gray-900 rounded-full p-1 shadow-md">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedVariant && selectedVariant.moreDetails && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">
                  Size: {selectedSizeDetail ? formatSize(selectedSizeDetail.size) : "Select Size"}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedVariant.moreDetails.filter(md => md.isActive !== false).map((sizeDetail, index) => (
                    <button
                      key={index}
                      onClick={() => handleSizeSelect(sizeDetail)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedSizeDetail === sizeDetail
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {formatSize(sizeDetail.size)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSizeDetail && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold -800 dark:text-gray-100 mb-2">Selected Variant Details</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Price: <span className="font-semibold">₹ {displayPrice.toFixed(2)}</span>
                  </div>
                  {/* <div>
                    Stock: <span className="font-semibold">${selectedSizeDetail.stock} available</span>
                  </div> */}
                  {selectedSizeDetail.optionalDetails?.map((detail, index) => (
                    <div key={index}>
                      {detail.key}: <span className="font-semibold">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkPricing.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold -800 dark:text-gray-100 mb-2">
                  {isDiscountActive(product, selectedVariant, selectedSizeDetail)
                    ? "Discounted Bulk Pricing"
                    : "Bulk Pricing"}
                </h4>
                <div className="space-y-2">
                  {bulkPricing.map((tier, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{tier.quantity}+ pcs</span>
                      <span className="font-semibold">₹ {tier.wholesalePrice.toFixed(2)} each</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(() => {
  const cartKey = selectedVariant && selectedSizeDetail
    ? `${product._id}-${selectedVariant.colorName}-${formatSize(selectedSizeDetail.size)}`
    : null;
  
  const itemInCart = cartKey ? cartItems[cartKey] : null;
  
  return itemInCart ? (
    <>
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">In Cart:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdateQuantity(cartKey, -1)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
  type="number"
  value={itemInCart.quantity}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '') return;
    const num = Number.parseInt(val);
    if (!isNaN(num) && num >= 1) {
      const diff = num - itemInCart.quantity;
      if (diff !== 0) {
        handleUpdateQuantity(cartKey, diff);
      }
    }
  }}
  onBlur={(e) => {
    if (e.target.value === '' || e.target.value === '0') {
      const diff = 1 - itemInCart.quantity;
      if (diff !== 0) {
        handleUpdateQuantity(cartKey, diff);
      }
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }}
  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm font-semibold"
/>
          <button
            onClick={() => handleUpdateQuantity(cartKey, 1)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <button
        onClick={() => handleRemoveFromCart(cartKey)}
        className="dark:text-white w-full bg-red-600 hover:bg-red-700 text-red-600 py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Remove from Cart
      </button>
    </>
  ) : (
    <>
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocalQuantityToAdd(Math.max(1, localQuantityToAdd - 1))}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
          >
            <Minus className="w-3 h-3" />
          </button>
        <input
  type="number"
  value={localQuantityToAdd}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '') {
      setLocalQuantityToAdd('');
    } else {
      const num = Number.parseInt(val);
      if (!isNaN(num) && num >= 1) {
        setLocalQuantityToAdd(num);
      }
    }
  }}
  onBlur={(e) => {
    if (e.target.value === '' || e.target.value === '0') {
      setLocalQuantityToAdd(1);
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      if (e.target.value === '' || e.target.value === '0') {
        setLocalQuantityToAdd(1);
      }
      handleAddToCartFromModal();
    }
  }}
  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
/>
          <button
            onClick={() => setLocalQuantityToAdd(localQuantityToAdd + 1)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!selectedVariant || !selectedSizeDetail ? (
        <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-center">
          Please select both color and size
        </div>
      ) : (
        <button
          onClick={handleAddToCartFromModal}
          disabled={selectedSizeDetail.stock === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-green-600 py-3 px-6 rounded-lg font-medium transition-colors duration-200"
        >
          Add {localQuantityToAdd} to Cart - {selectedVariant.colorName}, {formatSize(selectedSizeDetail.size)}
        </button>
      )}
    </>
  );
})()}<div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLocalQuantityToAdd(Math.max(1, localQuantityToAdd - 1))}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
  type="number"
  value={localQuantityToAdd}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '') {
      setLocalQuantityToAdd('');
    } else {
      const num = Number.parseInt(val);
      if (!isNaN(num) && num >= 1) {
        setLocalQuantityToAdd(num);
      }
    }
  }}
  onBlur={(e) => {
    if (e.target.value === '' || e.target.value === '0') {
      setLocalQuantityToAdd(1);
    }
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      if (e.target.value === '' || e.target.value === '0') {
        setLocalQuantityToAdd(1);
      }
      handleAddToCartFromModal();
    }
  }}
  className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
/>
                <button
                  onClick={() => setLocalQuantityToAdd(localQuantityToAdd + 1)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 dark:text-gray-400"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {!selectedVariant || !selectedSizeDetail ? (
              <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-medium text-center">
                Please select both color and size
              </div>
            ) : (
              <button
                onClick={handleAddToCartFromModal}
                disabled={selectedSizeDetail.stock === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-green-600 py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Add {localQuantityToAdd} to Cart - {selectedVariant.colorName}, {formatSize(selectedSizeDetail.size)}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="relative bg-white dark:bg-gray-900 rounded-lg p-4 max-w-[85vw] max-h-[85vh] shadow-2xl">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-black rounded-full p-2 shadow-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Full size product image"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )
  }

// This modal will be opened and all the details of the product will be displayed whenever the user clicks anywhere on the product

// ProductDetailsModal was here


// CartModal was here

const getJustArrivedProducts = () => {
  const filteredProducts = getFilteredProducts.filter((product) => isNew(product) && !isOutOfStock(product));
  return sortProductsByPrice(filteredProducts);
}

const getRestockedProducts = () => {
  const filteredProducts = getFilteredProducts.filter((product) => !isOutOfStock(product) && (
      isRecentlyRestocked(product) ||
      product.variants?.some((variant) =>
        variant.moreDetails?.some((sizeDetail) => isRecentlyRestocked(product, variant, sizeDetail)),
      )
    ));
  return sortProductsByPrice(filteredProducts);
}

const getRevisedRatesProducts = () => {
  const filteredProducts = getFilteredProducts.filter((product) => !isOutOfStock(product) && (
      isDiscountActive(product) ||
      product.variants?.some((variant) =>
        variant.moreDetails?.some((sizeDetail) => isDiscountActive(product, variant, sizeDetail)),
      )
    ));
  return sortProductsByPrice(filteredProducts);
}

const getOutOfStockProducts = () => {
  const filteredProducts = getFilteredProducts.filter(isOutOfStock);
  return sortProductsByPrice(filteredProducts);
}

  const filterOptions = [
    { key: "all", label: "All Products" },
  ];

if (justArrivedProductsList.length > 0) {
    filterOptions.push({ key: "just-arrived", label: "Just Arrived" });
  }

  if (revisedRatesProductsList.length > 0) {
    filterOptions.push({ key: "revised-rates", label: "Revised Rates" });
  }

  if (restockedProductsList.length > 0) {
    filterOptions.push({ key: "restocked", label: "Restocked Items" });
  }

  if (outOfStockProductsList.length > 0) {
    filterOptions.push({ key: "out-of-stock", label: "Out of Stock" });
  }

  filterOptions.push({ key: "price-low-to-high", label: "Price: Low to High" });

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-screen overflow-x-hidden flex flex-col">
    <Navbar
      searchQuery={searchQuery}
      setSearchQuery={handleSearch}
      searchResults={searchResults}
      showSearchResults={showSearchResults}
      setShowSearchResults={setShowSearchResults}
      isSearching={isSearching}
      onSearchResultClick={handleSearchResultClick}
      onClearSearch={clearSearch}
      highlightMatchedText={highlightMatchedText}
      handleSearchKeyPress={handleSearchKeyPress}
    />

    {isCartOpen && (
  <Suspense fallback={<div />}>
    <CartModal
      getBulkPricing={getBulkPricing}
      getEffectiveUnitPrice={getEffectiveUnitPrice}
    />
  </Suspense>
)}

      <BannerCarousel />

      <div className="w-screen overflow-x-hidden px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <section className="mb-12 overflow-hidden" ref={categoriesRef} id="categories-section">
  <h2 className="text-2xl font-bold -800 mb-6 dark:text-black">
    Shop by Categories
  </h2>
  
  <div className="relative group">
    {/* Left Arrow Button - Hidden on Mobile */}
    <button
      onClick={() => scrollCategories("left")}
      className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      disabled={categoriesScrollPosition === 0}
      aria-label="Scroll categories left"
    >
      <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>

    {/* Categories Container */}
    <div
      ref={categoriesContainerRef}
      className="flex gap-4 overflow-x-auto scroll-smooth custom-scrollbar pb-2 px-1 dark:text-black"
      style={{
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
      }}
      onScroll={(e) => {
        setCategoriesScrollPosition(e.target.scrollLeft);
      }}
    >
      {mainCategories.map((category) => (
        <div
          key={category._id}
          onClick={() => handleCategoryClick(category)}
          className="flex-shrink-0 text-center cursor-pointer group/item transition-all duration-200 dark:text-black"
        >
          <div
  className={`bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center mb-2 group-hover/item:shadow-xl transition-all duration-300 overflow-hidden relative ${
    selectedCategory === category.categoryName
      ? "ring-4 ring-blue-500 shadow-xl scale-110"
      : ""
  }`}
  style={{
    width: '104px',
    height: '104px',
  }}
>
            <img
              src={
                getOptimizedImageUrl(category.image, { width: 100 }) ||
                "/placeholder.svg"
              }
              alt={`${category.categoryName} category`}
              className="w-full h-full object-contain rounded-full"
              loading="lazy"
            />
            {selectedCategory === category.categoryName && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-blue-600 bg-white dark:bg-gray-900 rounded-full p-1" />
              </div>
            )}
          </div>
          <p
            className={`text-xs sm:text-sm font-medium transition-colors duration-200 text-center leading-tight px-2 max-w-[100px] line-clamp-2 ${
              selectedCategory === category.categoryName
                ? "text-blue-600 font-bold"
                : "text-gray-700 group-hover/item:text-blue-600 dark:text-gray-300"
            }`}
          >
            {category.categoryName}
          </p>
        </div>
      ))}
    </div>

    {/* Right Arrow Button - Hidden on Mobile */}
    <button
      onClick={() => scrollCategories("right")}
      className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
      aria-label="Scroll categories right"
    >
      <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  </div>

  {/* Professional Custom Scrollbar Styles */}
  <style>{`
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      height: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
      margin: 0 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      border-radius: 10px;
      transition: background 0.3s ease;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to right, #2563eb, #7c3aed);
    }
    
    /* Dark mode scrollbar */
    .dark .custom-scrollbar {
      scrollbar-color: #4b5563 #1f2937;
    }
    
    .dark .custom-scrollbar::-webkit-scrollbar-track {
      background: #1f2937;
    }
    
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(to right, #60a5fa, #a78bfa);
    }
    
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
    }
  `}</style>
</section>

        <section className="mb-8">
          <h2 className="text-xl font-bold -800mb-4 text-center dark:text-black">Filters</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {filterOptions.map((filter) => (
              <button
  key={filter.key}
  onClick={() => handleFilterChange(filter.key)}
  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
    selectedFilters.includes(filter.key)
      ? "bg-white dark:bg-gray-900 text-blue-600 shadow-lg scale-105"
      : "bg-white dark:bg-gray-900 text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 hover:border-blue-300"
  }`}
>
  {selectedFilters.includes(filter.key) && <Check className="w-4 h-4" />}
  {filter.label}
</button>
            ))}
          </div>
        </section>
        <CategoryNavigationBar />
           {showSearchSection && searchQuery && (
  <section className="mb-12" id="search-results-section">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold -800 dark:text-black">
        Results for: "{searchQuery}"
      </h2>
      <button
        onClick={clearSearch}
        className="text-sm text-gray-600 dark:text-gray-400 hover:-800 flex items-center gap-1"
      >
        <X className="w-4 h-4" />
        Clear Search
      </button>
    </div>
    {getFilteredProducts.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
        {sortProductsByPrice(filteredProductsList).map((product) => (
          <ProductCard key={`search-${product._id}`} product={product} />
        ))}
      </div>
    ) : (
      <div className="text-center py-32 min-h-[50vh]">
        <p className="text-gray-500 text-lg">No products found for "{searchQuery}"</p>
        <button
          onClick={clearSearch}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium dark:text-gray-400"
        >
          Clear search and browse all products
        </button>
      </div>
    )}
  </section>
)}

  {selectedCategoryPath.length > 0 && (
  <section className="mb-12" id="selected-category-section">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold -800 dark:text-black">{selectedCategory}</h2>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Showing {categoryFilteredProducts.length} of {categoryTotalCount} products
      </span>
    </div>
    {categoryLoading ? (
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    ) : categoryFilteredProducts.length > 0 ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
          {sortProductsByPrice(categoryFilteredProducts).map((product) => (
            <ProductCard key={`category-${product._id}`} product={product} />
          ))}
        </div>
        
        {/* Category infinite scroll trigger */}
        {categoryHasMore && (
          <div ref={categoryObserverTarget} className="flex justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading more products...</p>
            </div>
          </div>
        )}
        
        {!categoryHasMore && categoryFilteredProducts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">You've reached the end! 🎉</p>
          </div>
        )}
      </>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <Package className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold -800 dark:text-gray-100 mb-2">No Products Available</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We couldn't find any products in the "{selectedCategory}" category at the moment.
        </p>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSelectedCategoryPath([]);
            setSelectedFilters(['all']);
            setSelectedCategoryIdForFilter(null);
            setCategoryFilteredProducts([]);
            setCategoryHasMore(false);
            setCategoryTotalCount(0);
            setCategoryCurrentPage(1);
          }}
          className="dark:text-gray-400 px-6 py-3 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          Browse All Products
        </button>
      </div>
    )}
  </section>
)}

        {justArrivedProductsList.length > 0 && (
          <section className="mb-12" ref={justArrivedRef}>
            <h2 className="text-2xl font-bold -80 mb-6 dark:text-black">Just Arrived</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {justArrivedProductsList
                .slice(0, 10)
                .map((product) => (
                  <ProductCard key={`just-arrived-${product._id}`} product={product} forcedBadge={{ text: "New", color: "bg-blue-500" }} />
                ))}
            </div>
          </section>
        )}

        {restockedProductsList.length > 0 && (
          <section className="mb-12" ref={restockedRef}>
            <h2 className="text-2xl font-bold -800 dark:text-gray-100 mb-6">Restocked Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {restockedProductsList.map((product) => (
                <ProductCard key={`restocked-${product._id}`} product={product} forcedBadge={{ text: "Restocked", color: "bg-green-500" }} />
              ))}
            </div>
          </section>
        )}

        {revisedRatesProductsList.length > 0 && (
          <section className="mb-12" ref={revisedRatesRef}>
            <h2 className="text-2xl font-bold -800 dark:text-gray-100 mb-6">Revised Rates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {revisedRatesProductsList.map((product) => (
                <ProductCard key={`revised-rates-${product._id}`} product={product} forcedBadge={{ text: "Revised Rate", color: "bg-orange-500" }} />
              ))}
            </div>
          </section>
        )}

        {outOfStockProductsList.length > 0 && (
          <section className="mb-12" ref={outOfStockRef}>
            <h2 className="text-2xl font-bold -800 dark:text-black mb-6">Out of Stock</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {outOfStockProductsList.map((product) => (
                <ProductCard key={`out-of-stock-${product._id}`} product={product} forcedBadge={{ text: "Out of Stock", color: "bg-red-500" }} />
              ))}
            </div>
          </section>
        )}

        <section id="all-products-section">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold -800 dark:text-black">All Products</h2>
    <span className="text-sm text-gray-600 dark:text-gray-400">
      Showing {filteredProductsList.length} of {totalCount} products
    </span>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
    {sortProductsByPrice(filteredProductsList).map((product) => (
      <ProductCard key={product._id} product={product} />
    ))}
  </div>
  
  {/* Infinite scroll triggers */}
  {hasMore && (
    <div ref={observerTarget} className="flex justify-center py-8">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">Loading more products...</p>
      </div>
    </div>
  )}
  
  {!hasMore && filteredProductsList.length > 0 && (
    <div className="text-center py-8">
      <p className="text-gray-600 dark:text-gray-400">You've reached the end! 🎉</p>
    </div>
  )}
</section>
      </div>

      <Footer />

      {/* {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />} */}
      {selectedVariantProduct && (
  <VariantModal product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} />
)}
{selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}
      {selectedVariantProduct && (
        <VariantModal product={selectedVariantProduct} onClose={() => setSelectedVariantProduct(null)} />
      )}
      {selectedImage && <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />}

{/* Scroll to Top Button */}
{showScrollTop && (
  <button
    onClick={scrollToTop}
    // className="fixed bottom-8 right-8 bg-blue-600 hover:bg-black-700 text-black-600 p-3 rounded-full shadow-lg transition-all duration-300 z-40 hover:scale-110"
    className="fixed bottom-8 right-8 bg-blue-600 border-2 border-black text-black-600 p-3 rounded-full shadow-lg transition-all duration-300 z-40 hover:scale-110"
    aria-label="Scroll to top"
  >
    <ArrowUp className="w-6 h-6" />
  </button>
)}
<ToastContainer />
    </div>
  )
}