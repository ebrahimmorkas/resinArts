import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext.jsx";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!authLoading && user) {
        try {
          const response = await axios.get(
            "http://localhost:3000/api/product/all",
            { withCredentials: true } // Include cookies (JWT token)
          );
          setProducts(response.data.products);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || "Error fetching products");
          setLoading(false);
        }
      } else if (!authLoading && !user) {
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, authLoading]);

  return (
    <ProductContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductContext.Provider>
  );
};