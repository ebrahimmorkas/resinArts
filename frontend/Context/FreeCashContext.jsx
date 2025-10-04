import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const FreeCashContext = createContext();

export const FreeCashProvider = ({ children }) => {
  const [loadingFreeCash, setLoadingFreeCash] = useState(false);
  const [freeCashErrors, setFreeCashErrors] = useState(null);
  const [freeCash, setFreeCash] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch free cash eligibility (only for logged-in users)
  const checkFreeCashEligibility = async () => {
    if (!user?.id) {
      setFreeCash(null);
      return;
    }
    
    setLoadingFreeCash(true);
    try {
      const res = await axios.get('https://api.simplyrks.cloud/api/free-cash/check-eligibility', {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
     
      const freeCashData = res.data.freeCash || null;
      setFreeCash(freeCashData);
      setFreeCashErrors(null);
     
      if (freeCashData) {
        localStorage.setItem(`freeCash_${user.id}`, JSON.stringify(freeCashData));
        console.log('Free cash found:', freeCashData);
      } else {
        localStorage.removeItem(`freeCash_${user.id}`);
        console.log('No valid free cash available');
      }
    } catch (err) {
      console.error('Error fetching free cash:', err);
      setFreeCashErrors(err.response?.data?.message || 'Error fetching free cash');
      setFreeCash(null);
      if (user?.id) {
        localStorage.removeItem(`freeCash_${user.id}`);
      }
    } finally {
      setLoadingFreeCash(false);
    }
  };

  // Clear free cash cache
  const clearFreeCashCache = () => {
    if (user?.id) {
      localStorage.removeItem(`freeCash_${user.id}`);
      setFreeCash(null);
    }
  };

  // Load cached free cash on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      const cachedFreeCash = localStorage.getItem(`freeCash_${user.id}`);
      if (cachedFreeCash) {
        try {
          const parsedFreeCash = JSON.parse(cachedFreeCash);
          // Verify it's still valid
          const now = new Date();
          if (!parsedFreeCash.is_cash_used &&
              !parsedFreeCash.is_cash_expired &&
              new Date(parsedFreeCash.end_date) >= now) {
            setFreeCash(parsedFreeCash);
          } else {
            localStorage.removeItem(`freeCash_${user.id}`);
          }
        } catch (error) {
          localStorage.removeItem(`freeCash_${user.id}`);
        }
      }
      // Always check for fresh data
      checkFreeCashEligibility();
    } else {
      // Guest user - no free cash
      setFreeCash(null);
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