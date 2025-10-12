import { createContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      // Check sessionStorage cache first
      const cachedData = sessionStorage.getItem('productsCache');
      const cacheTimestamp = sessionStorage.getItem('productsCacheTime');
      
      if (cachedData && cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        // Use cache if less than 5 minutes old (300000ms)
        if (cacheAge < 300000) {
          setProducts(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }

      const response = await axios.get(
        "http://localhost:3000/api/product/all",
        { withCredentials: true }
      );
      
      const productsData = response.data.products || [];
      setProducts(productsData);
      
      // Cache the data
      sessionStorage.setItem('productsCache', JSON.stringify(productsData));
      sessionStorage.setItem('productsCacheTime', Date.now().toString());
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching products");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const contextValue = useMemo(
    () => ({ products, setProducts, fetchProducts, loading, error }),
    [products, loading, error]
  );

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};