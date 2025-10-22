import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, Trash2, ShoppingCart, Package, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../../components/client/common/Navbar';
import Footer from '../../components/client/common/Footer';
import { useFavorites } from '../../../Context/FavoritesContext';
import { useCart } from '../../../Context/CartContext';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { toast } from 'react-toastify';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite, favoritesCount } = useFavorites();
  const { addToCart } = useCart();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  // Fetch favorites from backend
  const fetchFavorites = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await axios.get(
        `http://localhost:3000/api/favourites/list?page=${pageNum}&limit=${limit}`,
        { withCredentials: true }
      );

      const { favorites: newFavorites, pagination } = response.data;

      if (append) {
        setFavorites(prev => [...prev, ...newFavorites]);
      } else {
        setFavorites(newFavorites);
      }

      setHasMore(pageNum < pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch favorites error:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view favorites');
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFavorites(1, false);
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (productId) => {
    const result = await toggleFavorite(productId);
    if (result.success) {
      // Remove from local state immediately
      setFavorites(prev => prev.filter(fav => fav._id !== productId));
      toast.success('Removed from favorites', {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      toast.error(result.message || 'Failed to remove from favorites');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      if (!product.hasVariants) {
        await addToCart(product._id, null, null, 1, {
          imageUrl: product.image,
          productName: product.name,
          variantId: "",
          detailsId: "",
          sizeId: "",
          price: product.price || 0,
          discountedPrice: getDisplayPrice(product),
        });
        toast.success('Added to cart!');
      } else {
        // Navigate to product page for variant selection
        navigate(`/product/${product._id}`);
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const isDiscountActive = (product) => {
    if (!product.discountStartDate || !product.discountEndDate) return false;
    const now = new Date();
    const start = new Date(product.discountStartDate);
    const end = new Date(product.discountEndDate);
    return now >= start && now <= end;
  };

  const getDisplayPrice = (product) => {
    if (isDiscountActive(product) && product.discountPrice) {
      return parseFloat(product.discountPrice);
    }
    return parseFloat(product.price || 0);
  };

  const isNew = (product) => {
    if (!product.createdAt) return false;
    const createdDate = new Date(product.createdAt);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    return createdDate >= threeDaysAgo && createdDate <= now;
  };

  const isRestocked = (product) => {
    if (!product.lastRestockedAt) return false;
    const restockDate = new Date(product.lastRestockedAt);
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    return restockDate >= twoDaysAgo && restockDate <= now;
  };

  const getProductBadge = (product) => {
    if (isDiscountActive(product)) {
      return { text: "Sale", color: "bg-red-500" };
    }
    if (isRestocked(product)) {
      return { text: "Restocked", color: "bg-green-500" };
    }
    if (isNew(product)) {
      return { text: "New", color: "bg-blue-500" };
    }
    return null;
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFavorites(page + 1, true);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading favorites...</p>
          </div>
        </div>
      </>
    );
  }

  return (
  <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <div className="flex-1 w-screen px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
<div className="w-full max-w-7xl mx-auto mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-black flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
                My Favorites
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {favoritesCount} {favoritesCount === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
{favorites.length === 0 ? (
  <div className="w-full max-w-7xl mx-auto">
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-full p-8 mb-6">
                <Heart className="w-24 h-24 text-red-300 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No favorites yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
                Start adding products to your favorites by clicking the heart icon on any product
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Package className="w-5 h-5" />
                Browse Products
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {favorites.map((product) => {
                const badge = getProductBadge(product);
                const displayPrice = getDisplayPrice(product);
                const originalPrice = parseFloat(product.price || 0);
                const isDiscounted = displayPrice < originalPrice;

                return (
                  <div
                    key={product._id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {/* Image Container */}
                    <div className="relative">
                      <img
                        src={getOptimizedImageUrl(product.image, { width: 400, quality: 60 }) || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Badge */}
                      {badge && (
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(product._id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-900 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors group/btn"
                        title="Remove from favorites"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-current group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹ {displayPrice.toFixed(2)}
                        </span>
                        {isDiscounted && (
                          <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                            ₹ {originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Variant Info */}
                      {product.hasVariants && product.variants && (
                        <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                          {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'} available
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-green-600 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {product.hasVariants ? 'View Options' : 'Add to Cart'}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFavorite(product._id)}
                          className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

            {/* End Message */}
            {!hasMore && favorites.length > 0 && (
              <div className="text-center mt-12">
                <p className="text-gray-600 dark:text-gray-400">
                  You've reached the end! 🎉
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default FavoritesPage;