import { createContext, useState, useEffect, useMemo, useCallback, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const FreeCashContext = createContext();

export const FreeCashProvider = ({ children }) => {
  const [freeCash, setFreeCash] = useState(null);
  const [loadingFreeCash, setLoadingFreeCash] = useState(false);
  const [freeCashErrors, setFreeCashErrors] = useState(null);
  const { user } = useContext(AuthContext);

  const fetchFreeCash = useCallback(async () => {
    // Don't fetch if user is not logged in
    if (!user?.id) {
      setFreeCash(null);
      setLoadingFreeCash(false);
      return;
    }

    try {
      setLoadingFreeCash(true);
      
      // Check cache first
      const cacheKey = `freeCash_${user.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_time`);
      
      if (cachedData && cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        // Use cache if less than 2 minutes old
        if (cacheAge < 120000) {
          const parsedFreeCash = JSON.parse(cachedData);
          
          // Validate cached data is still valid
          const nowDate = new Date();
          if (!parsedFreeCash.is_cash_used &&
              !parsedFreeCash.is_cash_expired &&
              new Date(parsedFreeCash.end_date) >= nowDate) {
            setFreeCash(parsedFreeCash);
            setLoadingFreeCash(false);
            return;
          } else {
            // Cache is invalid, remove it
            sessionStorage.removeItem(cacheKey);
            sessionStorage.removeItem(`${cacheKey}_time`);
          }
        }
      }

      const response = await axios.get(
        "https://api.simplyrks.cloud/api/free-cash/check-eligibility",
        { 
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.status === 200 && response.data.freeCash) {
        const freeCashData = response.data.freeCash;
        setFreeCash(freeCashData);
        
        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify(freeCashData));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } else {
        setFreeCash(null);
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_time`);
      }
      
      setFreeCashErrors(null);
    } catch (err) {
      console.error("Error fetching free cash:", err);
      setFreeCashErrors(err.response?.data?.message || "Error fetching free cash");
      setFreeCash(null);
      
      // Clear cache on error
      if (user?.id) {
        const cacheKey = `freeCash_${user.id}`;
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_time`);
      }
    } finally {
      setLoadingFreeCash(false);
    }
  }, [user?.id]);

  const clearFreeCashCache = useCallback(() => {
    if (user?.id) {
      const cacheKey = `freeCash_${user.id}`;
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(`${cacheKey}_time`);
      setFreeCash(null);
    }
  }, [user?.id]);

  const checkFreeCashEligibility = useCallback(async () => {
    clearFreeCashCache();
    await fetchFreeCash();
  }, [fetchFreeCash, clearFreeCashCache]);

  useEffect(() => {
    if (user?.id) {
      fetchFreeCash();
    } else {
      setFreeCash(null);
      setLoadingFreeCash(false);
    }
  }, [user?.id, fetchFreeCash]);

  const contextValue = useMemo(
    () => ({
      freeCash,
      loadingFreeCash,
      setLoadingFreeCash,
      freeCashErrors,
      setFreeCashErrors,
      clearFreeCashCache,
      checkFreeCashEligibility,
    }),
    [freeCash, loadingFreeCash, freeCashErrors, clearFreeCashCache, checkFreeCashEligibility]
  );

  return (
    <FreeCashContext.Provider value={contextValue}>
      {children}
    </FreeCashContext.Provider>
  );
};