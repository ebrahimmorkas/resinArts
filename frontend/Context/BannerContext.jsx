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
     
      const res = await axios.get('https://api.simplyrks.cloud/api/banner/fetch-banners', {
        withCredentials: true
      });
     
      console.log('Raw banner data:', res.data);
     
      const now = new Date();
     
      // Simple filtering - just get banners that are in date range
      let validBanners = res.data.filter(banner => {
        const startDate = new Date(banner.startDate);
        const endDate = new Date(banner.endDate);
        const isInDateRange = startDate <= now && endDate >= now;
       
        console.log(`Banner ${banner._id}:`, {
          startDate: startDate.toDateString(),
          endDate: endDate.toDateString(),
          now: now.toDateString(),
          isInDateRange
        });
       
        return isInDateRange;
      });
     
      console.log('Valid banners in date range:', validBanners);
     
      // If no banners in date range, get default banners
      if (validBanners.length === 0) {
        validBanners = res.data.filter(banner => banner.isDefault);
        console.log('Using default banners:', validBanners);
      }
     
      // If still no banners, use all banners
      if (validBanners.length === 0) {
        validBanners = res.data;
        console.log('Using all banners:', validBanners);
      }
     
      // Extract image URLs
      const bannerImages = validBanners.map(banner => banner.image);
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
  }, []);

  // Function to refetch banners (useful after adding/deleting banners)
  const refetchBanners = () => {
    console.log('Refetching banners from context...');
    fetchBanners();
  };

  return (
    <BannerContext.Provider value={{
      banners,
      fetchBanners: refetchBanners,
      loadingBanners,
      bannersError
    }}>
      {children}
    </BannerContext.Provider>
  );
};