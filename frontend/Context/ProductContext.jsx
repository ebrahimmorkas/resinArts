import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Check cache for this specific page
      const cacheKey = `productsCache_page_${page}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_time`);
      
      if (cachedData && cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        // Use cache if less than 5 minutes old
        if (cacheAge < 300000) {
          const cached = JSON.parse(cachedData);
          if (append) {
            setProducts(prev => [...prev, ...cached.products]);
          } else {
            setProducts(cached.products);
          }
          setHasMore(cached.hasMore);
          setTotalCount(cached.totalCount);
          setCurrentPage(page);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }

      const response = await axios.get(
        `http://localhost:3000/api/product/all?page=${page}&limit=50`,
        { withCredentials: true }
      );
      
      const { products: productsData, hasMore: moreAvailable, totalCount: total } = response.data;
      
      // Cache this page
      sessionStorage.setItem(cacheKey, JSON.stringify({
        products: productsData,
        hasMore: moreAvailable,
        totalCount: total
      }));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      
      if (append) {
        setProducts(prev => [...prev, ...productsData]);
      } else {
        setProducts(productsData);
      }
      
      setHasMore(moreAvailable);
      setTotalCount(total);
      setCurrentPage(page);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching products");
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, fetchProducts]);

  const refreshProducts = useCallback(() => {
    // Clear all product caches
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('productsCache_page_')) {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_time`);
      }
    }
    setProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts(1, false);
  }, []);

  const contextValue = useMemo(
    () => ({ 
      products, 
      setProducts, 
      fetchProducts, 
      loadMoreProducts,
      refreshProducts,
      loading, 
      loadingMore,
      error,
      hasMore,
      totalCount
    }),
    [products, loading, loadingMore, error, hasMore, totalCount, loadMoreProducts, refreshProducts, setProducts, fetchProducts]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};