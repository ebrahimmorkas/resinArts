// Context/FreeCashContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const FreeCashContext = createContext();

export const FreeCashProvider = ({ children }) => {
  const [loadingFreeCash, setLoadingFreeCash] = useState(false);
  const [freeCashErrors, setFreeCashErrors] = useState(null);
  const [freeCash, setFreeCash] = useState(null); // Stores available free cash
  const { user } = useContext(AuthContext);

  // Fetch free cash eligibility
  const checkFreeCashEligibility = async () => {
    if (!user?.id) return;

    // Check localStorage first
    const cachedFreeCash = localStorage.getItem(`freeCash_${user.id}`);
    if (cachedFreeCash) {
      setFreeCash(JSON.parse(cachedFreeCash));
      return;
    }

    setLoadingFreeCash(true);
    try {
      const res = await axios.get('http://localhost:3000/api/free-cash/check-eligibility', {
        withCredentials: true,
      });
      setFreeCash(res.data.freeCash || null);
      setFreeCashErrors(null);
      if (res.data.freeCash) {
        localStorage.setItem(`freeCash_${user.id}`, JSON.stringify(res.data.freeCash));
      }
    } catch (err) {
      setFreeCashErrors(err.response?.data?.message || 'Error fetching free cash');
      setFreeCash(null);
    } finally {
      setLoadingFreeCash(false);
    }
  };

  // Clear free cash cache on order placement or logout
  const clearFreeCashCache = () => {
    if (user?.id) {
      localStorage.removeItem(`freeCash_${user.id}`);
      setFreeCash(null);
    }
  };

  // Fetch free cash when user logs in
  useEffect(() => {
    if (user?.id) {
      checkFreeCashEligibility();
    }
  }, [user?.id]);

  return (
    <FreeCashContext.Provider
      value={{
        loadingFreeCash,
        setLoadingFreeCash,
        freeCashErrors,
        setFreeCashErrors,
        freeCash,
        checkFreeCashEligibility,
        clearFreeCashCache,
      }}
    >
      {children}
    </FreeCashContext.Provider>
  );
};

