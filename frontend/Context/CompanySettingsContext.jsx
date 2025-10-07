import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CompanySettingsContext = createContext();

export const CompanySettingsProvider = ({ children }) => {
  const [companySettings, setCompanySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await axios.get('http://localhost:3000/api/company-settings/contact', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setCompanySettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setSettingsError(error.response?.data?.message || 'Failed to fetch company settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const value = {
    companySettings,
    loadingSettings,
    settingsError,
    refetchCompanySettings: fetchCompanySettings
  };

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
};