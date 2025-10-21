import React, { useState, useContext, useImperativeHandle, forwardRef } from "react";
import { CompanySettingsContext } from "../../../../Context/CompanySettingsContext";
import { X } from "lucide-react";

const PolicyModal = forwardRef((props, ref) => {
  const { companySettings } = useContext(CompanySettingsContext);
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: '', content: '' });

  const openPolicyModal = (type) => {
    if (!companySettings) return;
    
    let content = '';
    switch(type) {
      case 'privacy':
        content = companySettings.privacyPolicy || 'Privacy Policy content not available.';
        break;
      case 'terms':
        content = companySettings.termsAndConditions || 'Terms and Conditions not available.';
        break;
      case 'shipping':
        content = companySettings.shippingPolicy || 'Shipping Policy not available.';
        break;
      case 'return':
        content = companySettings.returnPolicy || 'Return Policy not available.';
        break;
      case 'refund':
        content = companySettings.refundPolicy || 'Refund Policy not available.';
        break;
      case 'about':
        content = companySettings?.aboutUs || 'About us not available.';
        break;
      default:
        content = 'Content not available.';
    }
    
    setPolicyModal({ isOpen: true, type, content });
  };

  // Expose openPolicyModal to parent via ref
  useImperativeHandle(ref, () => ({
    openPolicyModal,
  }));

  return (
    <>
      {policyModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setPolicyModal({ isOpen: false, type: '', content: '' })}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold mb-4 capitalize">
              {policyModal.type} Policy
            </h2>
            <div className="prose prose-sm max-w-none">
              {policyModal.content}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default PolicyModal;