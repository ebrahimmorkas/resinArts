import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AnnouncementContext = createContext();

export const AnnouncementProvider = ({ children }) => {
  const [announcement, setAnnouncement] = useState('');
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [announcementError, setAnnouncementError] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
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
          currentText = activeAnnouncements[0].text; // Assume no overlaps, take first
        } else {
          const defaultAnnouncement = res.data.find(a => a.isDefault);
          if (defaultAnnouncement) {
            currentText = defaultAnnouncement.text;
          }
        }
        
        setAnnouncement(currentText);
        setAnnouncementError(null);
      } catch (error) {
        setAnnouncementError('Error fetching announcement');
        console.error(error);
      } finally {
        setLoadingAnnouncement(false);
      }
    };
    
    fetchAnnouncement();
  }, []);

  return (
    <AnnouncementContext.Provider value={{ announcement, loadingAnnouncement, announcementError }}>
      {children}
    </AnnouncementContext.Provider>
  );
};