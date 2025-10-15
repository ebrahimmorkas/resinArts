import { createContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesErrors, setCategoriesErrors] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check sessionStorage cache first
        const cachedData = sessionStorage.getItem('categoriesCache');
        const cacheTimestamp = sessionStorage.getItem('categoriesCacheTime');
        
        if (cachedData && cacheTimestamp) {
          const now = Date.now();
          const cacheAge = now - parseInt(cacheTimestamp);
          
          // Use cache if less than 5 minutes old
          if (cacheAge < 300000) {
            setCategories(JSON.parse(cachedData));
            setLoadingCategories(false);
            return;
          }
        }

        const res = await axios.get(
          "https://api.simplyrks.cloud/api/category/fetch-categories",
          { withCredentials: true }
        );
        
        setCategoriesErrors("");
        const categoriesData = res.data.categories;
        setCategories(categoriesData);
        
        // Cache the data
        sessionStorage.setItem('categoriesCache', JSON.stringify(categoriesData));
        sessionStorage.setItem('categoriesCacheTime', Date.now().toString());
        
      } catch (error) {
        console.log("Problem while fetching categories " + error.message);
        setCategoriesErrors(error.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const contextValue = useMemo(
    () => ({ categories, setCategories, loadingCategories, categoriesErrors }),
    [categories, loadingCategories, categoriesErrors]
  );

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};