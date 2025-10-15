import { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const FreeCashContext = createContext();

export const FreeCashProvider = ({ children }) => {
  const [loadingFreeCash, setLoadingFreeCash] = useState(false);
  const [freeCashErrors, setFreeCashErrors] = useState(null);
  const [freeCash, setFreeCash] = useState(null);
  const { user } = useContext(AuthContext);

  // Memoized check function
  const checkFreeCashEligibility = useCallback(async () => {
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
        sessionStorage.setItem(`freeCash_${user.id}`, JSON.stringify(freeCashData));
      } else {
        sessionStorage.removeItem(`freeCash_${user.id}`);
      }
    } catch (err) {
      console.error('Error fetching free cash:', err);
      setFreeCashErrors(err.response?.data?.message || 'Error fetching free cash');
      setFreeCash(null);
      if (user?.id) {
        sessionStorage.removeItem(`freeCash_${user.id}`);
      }
    } finally {
      setLoadingFreeCash(false);
    }
  }, [user?.id]);

  const clearFreeCashCache = useCallback(() => {
    if (user?.id) {
      sessionStorage.removeItem(`freeCash_${user.id}`);
      setFreeCash(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      const cachedFreeCash = sessionStorage.getItem(`freeCash_${user.id}`);
      if (cachedFreeCash) {
        try {
          const parsedFreeCash = JSON.parse(cachedFreeCash);
          const now = new Date();
          if (!parsedFreeCash.is_cash_used &&
              !parsedFreeCash.is_cash_expired &&
              new Date(parsedFreeCash.end_date) >= now) {
            setFreeCash(parsedFreeCash);
            setLoadingFreeCash(false);
            return; // Don't fetch if cache is valid
          } else {
            sessionStorage.removeItem(`freeCash_${user.id}`);
          }
        } catch (error) {
          sessionStorage.removeItem(`freeCash_${user.id}`);
        }
      }
      checkFreeCashEligibility();
    } else {
      setFreeCash(null);
      setLoadingFreeCash(false);
    }
  }, [user?.id, checkFreeCashEligibility]);

  const contextValue = useMemo(
    () => ({
      loadingFreeCash,
      setLoadingFreeCash,
      freeCashErrors,
      setFreeCashErrors,
      freeCash,
      checkFreeCashEligibility,
      clearFreeCashCache,
    }),
    [loadingFreeCash, freeCashErrors, freeCash, checkFreeCashEligibility, clearFreeCashCache]
  );

  return (
    <FreeCashContext.Provider value={contextValue}>
      {children}
    </FreeCashContext.Provider>
  );
};