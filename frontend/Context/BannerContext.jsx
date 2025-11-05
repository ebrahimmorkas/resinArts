import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const BannerContext = createContext();

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [bannersError, setBannersError] = useState(null);

  const fetchBanners = async () => {
    try {
      setLoadingBanners(true);
      setBannersError(null);
      
      // Check sessionStorage cache first
      const cachedData = sessionStorage.getItem('bannersCache');
      const cacheTimestamp = sessionStorage.getItem('bannersCacheTime');
      
      if (cachedData && cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        // Use cache if less than 2 minutes old (banners change less frequently)
        if (cacheAge < 120000) {
          setBanners(JSON.parse(cachedData));
          setLoadingBanners(false);
          return;
        }
      }
     
      const res = await axios.get('https://api.mouldmarket.in/api/banner/fetch-banners', {
        withCredentials: true
      });
     
      const now = new Date();
     
      let validBanners = res.data.filter(banner => {
        const startDate = new Date(banner.startDate);
        const endDate = new Date(banner.endDate);
        return startDate <= now && endDate >= now;
      });
     
      if (validBanners.length === 0) {
        validBanners = res.data.filter(banner => banner.isDefault);
      }
     
      if (validBanners.length === 0) {
        validBanners = res.data;
      }
     
      const bannerImages = validBanners.map(banner => banner.image);
      setBanners(bannerImages);
      
      // Cache the data
      sessionStorage.setItem('bannersCache', JSON.stringify(bannerImages));
      sessionStorage.setItem('bannersCacheTime', Date.now().toString());
     
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBannersError(error.message);
      setBanners(["/placeholder.svg"]);
    } finally {
      setLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const refetchBanners = () => {
    // Clear cache when manually refetching
    sessionStorage.removeItem('bannersCache');
    sessionStorage.removeItem('bannersCacheTime');
    fetchBanners();
  };

  const contextValue = useMemo(
    () => ({
      banners,
      fetchBanners: refetchBanners,
      loadingBanners,
      bannersError
    }),
    [banners, loadingBanners, bannersError]
  );

  return (
    <BannerContext.Provider value={contextValue}>
      {children}
    </BannerContext.Provider>
  );
};