import React, { createContext, useState, useEffect } from 'react';
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
      
      const res = await axios.get('http://localhost:3000/api/banner/fetch-banners', {
        withCredentials: true // Add this for authentication
      });
      
      console.log('Raw banner data:', res.data); // Debug log
      
      const now = new Date();
      
      // Filter active banners first
      let activeBanners = res.data.filter(banner => {
        const isActive = banner.isActive;
        const startDate = new Date(banner.startDate);
        const endDate = new Date(banner.endDate);
        const isInDateRange = startDate <= now && endDate >= now;
        
        console.log(`Banner ${banner._id}:`, {
          isActive,
          startDate: startDate.toDateString(),
          endDate: endDate.toDateString(),
          now: now.toDateString(),
          isInDateRange
        });
        
        return isActive && isInDateRange;
      });
      
      console.log('Active banners:', activeBanners);
      
      // If no active banners, get default banners
      if (activeBanners.length === 0) {
        activeBanners = res.data.filter(banner => banner.isDefault && banner.isActive);
        console.log('Using default banners:', activeBanners);
      }
      
      // If still no banners, use all active banners regardless of date
      if (activeBanners.length === 0) {
        activeBanners = res.data.filter(banner => banner.isActive);
        console.log('Using all active banners:', activeBanners);
      }
      
      // Extract image URLs
      const bannerImages = activeBanners.map(banner => banner.image);
      console.log('Final banner images:', bannerImages);
      
      setBanners(bannerImages);
      
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBannersError(error.message);
      
      // Set a default banner if there's an error
      setBanners(["/placeholder.svg"]);
    } finally {
      setLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []); // Remove the condition, always fetch on mount

  // Function to refetch banners (useful after adding new banners)
  const refetchBanners = () => {
    fetchBanners();
  };

  return (
    <BannerContext.Provider value={{ 
      banners, 
      fetchBanners: refetchBanners, 
      loadingBanners, 
      bannersError,
      fetchBanners
    }}>
      {children}
    </BannerContext.Provider>
  );
};