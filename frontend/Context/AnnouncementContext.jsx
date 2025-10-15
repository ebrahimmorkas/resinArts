import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const AnnouncementContext = createContext();

export const AnnouncementProvider = ({ children }) => {
  const [announcement, setAnnouncement] = useState('');
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [announcementError, setAnnouncementError] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        // Check cache first
        const cachedData = sessionStorage.getItem('announcementCache');
        const cacheTimestamp = sessionStorage.getItem('announcementCacheTime');
        
        if (cachedData && cacheTimestamp) {
          const now = Date.now();
          const cacheAge = now - parseInt(cacheTimestamp);
          
          // Use cache if less than 2 minutes old
          if (cacheAge < 120000) {
            setAnnouncement(cachedData);
            setLoadingAnnouncement(false);
            return;
          }
        }

        const res = await axios.get('https://api.simplyrks.cloud/api/announcement/all', {
          withCredentials: true
        });
       
        const now = new Date();
        const activeAnnouncements = res.data.filter(a =>
          !a.isDefault &&
          new Date(a.startDate) <= now &&
          new Date(a.endDate) >= now
        );
       
        let currentText = '';
        if (activeAnnouncements.length > 0) {
          currentText = activeAnnouncements[0].text;
        } else {
          const defaultAnnouncement = res.data.find(a => a.isDefault);
          if (defaultAnnouncement) {
            currentText = defaultAnnouncement.text;
          }
        }
       
        setAnnouncement(currentText);
        setAnnouncementError(null);
        
        // Cache the data
        sessionStorage.setItem('announcementCache', currentText);
        sessionStorage.setItem('announcementCacheTime', Date.now().toString());
        
      } catch (error) {
        setAnnouncementError('Error fetching announcement');
        console.error(error);
      } finally {
        setLoadingAnnouncement(false);
      }
    };
   
    fetchAnnouncement();
  }, []);

  const contextValue = useMemo(
    () => ({ announcement, loadingAnnouncement, announcementError }),
    [announcement, loadingAnnouncement, announcementError]
  );

  return (
    <AnnouncementContext.Provider value={contextValue}>
      {children}
    </AnnouncementContext.Provider>
  );
};