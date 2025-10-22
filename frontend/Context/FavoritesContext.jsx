import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load favorites on mount (only product IDs for performance)
  useEffect(() => {
    if (user?.id) {
      loadFavoritesFromCache();
    } else {
      setFavorites(new Set());
      sessionStorage.removeItem('userFavorites');
    }
  }, [user?.id]);

  const loadFavoritesFromCache = () => {
    const cached = sessionStorage.getItem('userFavorites');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setFavorites(new Set(parsed));
      } catch (e) {
        sessionStorage.removeItem('userFavorites');
      }
    }
  };

  const toggleFavorite = useCallback(async (productId) => {
    if (!user?.id) {
      // Redirect to login or show message
      return { success: false, message: 'Please login to add favorites' };
    }

    const isFavorited = favorites.has(productId);
    
    // Optimistic update
    const newFavorites = new Set(favorites);
    if (isFavorited) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
    sessionStorage.setItem('userFavorites', JSON.stringify([...newFavorites]));

    try {
      const endpoint = isFavorited ? '/remove' : '/add';
      await axios.post(
        `http://localhost:3000/api/favourites${endpoint}`,
        { productId },
        { withCredentials: true }
      );

      return { success: true };
    } catch (error) {
      // Rollback on error
      setFavorites(favorites);
      sessionStorage.setItem('userFavorites', JSON.stringify([...favorites]));
      
      console.error('Toggle favorite error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update favorites' 
      };
    }
  }, [favorites, user?.id]);

  const isFavorite = useCallback((productId) => {
    return favorites.has(productId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
    sessionStorage.removeItem('userFavorites');
  }, []);

  const contextValue = useMemo(
    () => ({
      favorites,
      loading,
      error,
      toggleFavorite,
      isFavorite,
      clearFavorites,
      favoritesCount: favorites.size
    }),
    [favorites, loading, error, toggleFavorite, isFavorite, clearFavorites]
  );

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};