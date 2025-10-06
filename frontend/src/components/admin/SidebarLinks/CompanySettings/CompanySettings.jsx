import React, { useState, useEffect, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState(null);
  
  const editor1 = useRef(null);
  const editor2 = useRef(null);
  const editor3 = useRef(null);
  const editor4 = useRef(null);
  const editor5 = useRef(null);
  
  const [formData, setFormData] = useState({
    adminName: '',
    adminWhatsappNumber: '',
    adminPhoneNumber: '',
    adminAddress: '',
    adminCity: '',
    adminState: '',
    adminPincode: '',
    adminEmail: '',
    instagramId: '',
    facebookId: '',
    privacyPolicy: '',
    returnPolicy: '',
    shippingPolicy: '',
    refundPolicy: '',
    termsAndConditions: ''
  });

  // Jodit Editor Configuration
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Start typing...',
      height: 400,
      toolbar: true,
      spellcheck: true,
      language: 'en',
      toolbarButtonSize: 'medium',
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'link',
        'table',
        '|',
        'fullsize',
        'source'
      ],
      uploader: {
        insertImageAsBase64URI: true
      },
      removeButtons: ['video', 'file'],
      disablePlugins: 'mobile'
    }),
    []
  );

  // Fetch existing settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('http://localhost:3000/api/company-settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        window.toast?.error?.(error.message || 'Failed to fetch settings');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditorChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const showToast = (message, type = 'success') => {
    // Using react-toastify
    if (window.toast) {
      if (type === 'success') {
        window.toast.success(message);
      } else {
        window.toast.error(message);
      }
    } else {
      alert(message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.adminName || !formData.adminEmail) {
      showToast('Admin Name and Email are required', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/company-settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Company settings updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to update settings', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const accordions = [
    {
      title: 'Personal Information',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Admin Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter admin name"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Admin Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter admin email"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number
            </label>
            <input
              type="text"
              name="adminWhatsappNumber"
              value={formData.adminWhatsappNumber}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter WhatsApp number"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="adminPhoneNumber"
              value={formData.adminPhoneNumber}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="adminAddress"
              value={formData.adminAddress}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="adminCity"
              value={formData.adminCity}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter city"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="adminState"
              value={formData.adminState}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter state"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              type="text"
              name="adminPincode"
              value={formData.adminPincode}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter pincode"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Instagram ID
            </label>
            <input
              type="text"
              name="instagramId"
              value={formData.instagramId}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Instagram ID"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Facebook ID
            </label>
            <input
              type="text"
              name="facebookId"
              value={formData.facebookId}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Facebook ID"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Privacy Policy',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor1}
            value={formData.privacyPolicy}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'privacyPolicy')}
            onChange={() => {}}
          />
        </div>
      )
    },
    {
      title: 'Return Policy',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor2}
            value={formData.returnPolicy}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'returnPolicy')}
            onChange={() => {}}
          />
        </div>
      )
    },
    {
      title: 'Shipping Policy',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor3}
            value={formData.shippingPolicy}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'shippingPolicy')}
            onChange={() => {}}
          />
        </div>
      )
    },
    {
      title: 'Refund Policy',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor4}
            value={formData.refundPolicy}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'refundPolicy')}
            onChange={() => {}}
          />
        </div>
      )
    },
    {
      title: 'Terms and Conditions',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor5}
            value={formData.termsAndConditions}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'termsAndConditions')}
            onChange={() => {}}
          />
        </div>
      )
    }
  ];

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-white">Company Settings</h1>
            <p className="mt-2 text-blue-100">Manage your company information and policies</p>
          </div>

          <div onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-4">
              {accordions.map((accordion, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-lg font-semibold text-gray-800">
                      {accordion.title}
                    </span>
                    {activeAccordion === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      activeAccordion === index
                        ? 'max-h-[700px] opacity-100 overflow-visible'
                        : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="bg-white border-t border-gray-200">
                      {accordion.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 sm:px-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;