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

      // Determine if admin panel
      const isAdmin = window.location.pathname.includes('/admin');
      
      // Build URL
      const url = isAdmin 
        ? 'https://api.simplyrks.cloud/api/product/all?all=true'
        : `https://api.simplyrks.cloud/api/product/all?page=${page}&limit=50`;

      const response = await axios.get(url, { withCredentials: true });
      console.log("Fetch Response:", {
        page,
        products: response.data.products,
        hasMore: response.data.hasMore,
        totalCount: response.data.totalCount
      });
      
      const { products: productsData, hasMore: moreAvailable, totalCount: total } = response.data;
      
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
      console.log("Loading more, currentPage:", currentPage);
      fetchProducts(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loadingMore, fetchProducts]);

  const loadProductsToPage = useCallback(async (targetPage) => {
  if (targetPage <= 1) {
    return fetchProducts(1, false);
  }
  
  try {
    setLoading(true);
    const allProducts = [];
    
    for (let page = 1; page <= targetPage; page++) {
      const response = await axios.get(
        `https://api.simplyrks.cloud/api/product/all?page=${page}&limit=50`,
        { withCredentials: true }
      );
      
      allProducts.push(...response.data.products);
      
      if (page === targetPage) {
        setProducts(allProducts);
        setHasMore(response.data.hasMore);
        setTotalCount(response.data.totalCount);
        setCurrentPage(page);
      }
    }
    
    setLoading(false);
  } catch (err) {
    setError(err.response?.data?.message || "Error loading products");
    setLoading(false);
  }
}, []);

  const refreshProducts = useCallback(() => {
    setProducts([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [fetchProducts]);

  useEffect(() => {
  const isAdmin = window.location.pathname.includes('/admin');
  if (isAdmin) {
    // For admin, fetch all products at once
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://api.simplyrks.cloud/api/product/all?all=true', { 
          withCredentials: true 
        });
        
        setProducts(response.data.products);
        setHasMore(false); // No more products to load
        setTotalCount(response.data.totalCount || response.data.products.length);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching products");
        setLoading(false);
      }
    };
    fetchAllProducts();
  } else {
    // For home/client, use pagination
    fetchProducts(1, false);
  }
}, [fetchProducts]);

const contextValue = useMemo(
  () => ({ 
    products, 
    setProducts, 
    fetchProducts, 
    loadMoreProducts,
    loadProductsToPage,
    refreshProducts,
    loading, 
    loadingMore,
    error,
    hasMore,
    totalCount,
    currentPage
  }),
  [products, loading, loadingMore, error, hasMore, totalCount, currentPage, loadMoreProducts, loadProductsToPage, refreshProducts, fetchProducts]
);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};