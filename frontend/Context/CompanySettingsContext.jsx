import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

export const CompanySettingsContext = createContext();

export const CompanySettingsProvider = ({ children }) => {
  const [companySettings, setCompanySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const fetchCompanySettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      
      // Check cache first
      const cachedData = sessionStorage.getItem('companySettingsCache');
      const cacheTimestamp = sessionStorage.getItem('companySettingsCacheTime');
      
      if (cachedData && cacheTimestamp) {
        const now = Date.now();
        const cacheAge = now - parseInt(cacheTimestamp);
        
        // Use cache if less than 10 minutes old (settings rarely change)
        if (cacheAge < 600000) {
          setCompanySettings(JSON.parse(cachedData));
          setLoadingSettings(false);
          return;
        }
      }
     
      // Fetch both in parallel for speed
      const [contactResponse, policiesResponse] = await Promise.all([
        axios.get('https://api.simplyrks.cloud/api/company-settings/contact', {
          withCredentials: true
        }),
        axios.get('https://api.simplyrks.cloud/api/company-settings/policies', {
          withCredentials: true
        })
      ]);
     
      if (contactResponse.data.success && policiesResponse.data.success) {
        const mergedSettings = {
          ...contactResponse.data.data,
          ...policiesResponse.data.data
        };
        setCompanySettings(mergedSettings);
        
        // Cache the data
        sessionStorage.setItem('companySettingsCache', JSON.stringify(mergedSettings));
        sessionStorage.setItem('companySettingsCacheTime', Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setSettingsError(error.response?.data?.message || 'Failed to fetch company settings');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const refetchCompanySettings = useCallback(() => {
    // Clear cache when manually refetching
    sessionStorage.removeItem('companySettingsCache');
    sessionStorage.removeItem('companySettingsCacheTime');
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const value = useMemo(
    () => ({
      companySettings,
      loadingSettings,
      settingsError,
      refetchCompanySettings
    }),
    [companySettings, loadingSettings, settingsError, refetchCompanySettings]
  );

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
};