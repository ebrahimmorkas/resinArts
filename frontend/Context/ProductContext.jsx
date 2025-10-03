import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/product/all",
          { withCredentials: true } // Keep for potential user-specific features
        );
        setProducts(response.data.products);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching products");
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []); // Remove dependency on user/authLoading

  return (
    <ProductContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductContext.Provider>
  );
};