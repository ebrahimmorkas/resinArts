import React, { useContext } from 'react';
import { X } from 'lucide-react';
import { CompanySettingsContext } from '../../../../Context/CompanySettingsContext';

const PolicyModal = ({ isOpen, type, onClose }) => {
  const { companySettings } = useContext(CompanySettingsContext);

  if (!isOpen) return null;

  const getPolicyTitle = (type) => {
    switch(type) {
      case 'privacy': return 'Privacy Policy';
      case 'terms': return 'Terms and Conditions';
      case 'shipping': return 'Shipping Policy';
      case 'return': return 'Return Policy';
      case 'refund': return 'Refund Policy';
      case 'about': return 'About Us';
      default: return 'Policy';
    }
  };

  const getPolicyContent = (type) => {
    if (!companySettings) return 'Content not available.';
    
    switch(type) {
      case 'privacy':
        return companySettings.privacyPolicy || 'Privacy Policy content not available.';
      case 'terms':
        return companySettings.termsAndConditions || 'Terms and Conditions not available.';
      case 'shipping':
        return companySettings.shippingPolicy || 'Shipping Policy not available.';
      case 'return':
        return companySettings.returnPolicy || 'Return Policy not available.';
      case 'refund':
        return companySettings.refundPolicy || 'Refund Policy not available.';
      case 'about':
        return companySettings.aboutUs || 'About us not available.';
      default:
        return 'Content not available.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPolicyTitle(type)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className="prose prose-sm sm:prose lg:prose-lg max-w-none text-gray-700 dark:text-gray-400"
            dangerouslySetInnerHTML={{ __html: getPolicyContent(type) }}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-black rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 dark:text-white"
          >
            <X className="w-5 h-5" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;