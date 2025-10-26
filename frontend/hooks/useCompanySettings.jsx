import { useEffect, useContext } from 'react';
import { CompanySettingsContext } from '../Context/CompanySettingsContext';

const useCompanySettings = () => {
  const { companySettings, loadingSettings, settingsError } = useContext(CompanySettingsContext);

  useEffect(() => {
    console.log('CompanySettingsContext State:', { companySettings, loadingSettings, settingsError });
    if (!loadingSettings && !settingsError && companySettings) {
      const { companyName, companyLogo } = companySettings;

      // Update document title
      document.title = companyName || 'My E-Commerce';

      // Update favicon
      if (companyLogo) {
        let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'icon';
        link.href = companyLogo;
        document.head.appendChild(link);
      }
    }
  }, [companySettings, loadingSettings, settingsError]);

  return companySettings || { companyName: '', companyLogo: '' };
};

export default useCompanySettings;