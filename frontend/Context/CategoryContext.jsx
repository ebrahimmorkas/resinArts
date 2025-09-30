import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesErrors, setCategoriesErrors] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "https://api.simplyrks.cloud/api/category/fetch-categories",
          { withCredentials: true }
        );
        setCategoriesErrors("");
        setCategories(res.data.categories);
      } catch (error) {
        console.log("Problem while fetching categories " + error.message);
        setCategoriesErrors(error.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []); // 👈 run only once on mount

  return (
  <CategoryContext.Provider
    value={{ categories, setCategories, loadingCategories, categoriesErrors }}
  >
    {children}
  </CategoryContext.Provider>
);
};
