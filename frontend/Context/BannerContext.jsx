import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const BannerContext = createContext();

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);

  const fetchBanners = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/banner/fetch-banners');
      const now = new Date();
      let activeBanners = res.data.filter(banner => banner.isActive && new Date(banner.startDate) <= now && new Date(banner.endDate) >= now);
      if (activeBanners.length === 0) {
        activeBanners = res.data.filter(banner => banner.isDefault);
      }
      setBanners(activeBanners.map(banner => banner.image));
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  useEffect(() => {
    if (banners.length === 0) {
      fetchBanners();
    }
  }, []);

  return (
    <BannerContext.Provider value={{ banners, fetchBanners }}>
      {children}
    </BannerContext.Provider>
  );
};