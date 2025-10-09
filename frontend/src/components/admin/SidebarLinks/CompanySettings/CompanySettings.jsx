import React, { useState, useEffect, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { ChevronDown, ChevronUp, Save, Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  
  const editor1 = useRef(null);
  const editor2 = useRef(null);
  const editor3 = useRef(null);
  const editor4 = useRef(null);
  const editor5 = useRef(null);
  const editor6 = useRef(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
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
    termsAndConditions: '',
    aboutUs: '',
    receiveOrderEmails: true,
    lowStockAlertThreshold: 10,
    receiveLowStockEmail: false,
    receiveOutOfStockEmail: false
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

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
      const response = await fetch('https://api.simplyrks.cloud/api/company-settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
        if (data.data.companyLogo) {
          setLogoPreview(data.data.companyLogo);
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error(error.message || 'Failed to fetch settings');
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.adminName || !formData.adminEmail) {
      toast.error('Admin Name and Email are required');
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('adminName', formData.adminName);
      formDataToSend.append('adminWhatsappNumber', formData.adminWhatsappNumber);
      formDataToSend.append('adminPhoneNumber', formData.adminPhoneNumber);
      formDataToSend.append('adminAddress', formData.adminAddress);
      formDataToSend.append('adminCity', formData.adminCity);
      formDataToSend.append('adminState', formData.adminState);
      formDataToSend.append('adminPincode', formData.adminPincode);
      formDataToSend.append('adminEmail', formData.adminEmail);
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('instagramId', formData.instagramId);
      formDataToSend.append('facebookId', formData.facebookId);
      formDataToSend.append('privacyPolicy', formData.privacyPolicy);
      formDataToSend.append('returnPolicy', formData.returnPolicy);
      formDataToSend.append('shippingPolicy', formData.shippingPolicy);
      formDataToSend.append('refundPolicy', formData.refundPolicy);
      formDataToSend.append('termsAndConditions', formData.termsAndConditions);
      formDataToSend.append('aboutUs', formData.aboutUs);
      formDataToSend.append('receiveOrderEmails', formData.receiveOrderEmails);
      formDataToSend.append('lowStockAlertThreshold', formData.lowStockAlertThreshold);
      formDataToSend.append('receiveLowStockEmail', formData.receiveLowStockEmail);
      formDataToSend.append('receiveOutOfStockEmail', formData.receiveOutOfStockEmail);
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await fetch('https://api.simplyrks.cloud/api/company-settings', {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Company settings updated successfully!');
        setFormData(data.data);
        if (data.data.companyLogo) {
          setLogoPreview(data.data.companyLogo);
        }
        setLogoFile(null);
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const accordions = [
    {
      title: 'Personal Information',
      content: (
        <div className="p-4 space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Logo</h3>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {logoPreview || formData.companyLogo ? (
                    <img
                      src={logoPreview || formData.companyLogo}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-center border border-blue-200 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Choose Logo</span>
                    </div>
                  </label>
                  
                  {(formData.companyLogo || logoPreview) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview('');
                        setFormData(prev => ({
                          ...prev,
                          companyLogo: ''
                        }));
                      }}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  PNG or JPG. Max size: 5MB. Image will be saved when you click "Save Settings"
                </p>
                {logoFile && (
                  <p className="text-xs text-green-600 font-medium">
                    Selected: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>

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
    },
    {
      title: 'About Us',
      content: (
        <div className="p-4">
          <JoditEditor
            ref={editor6}
            value={formData.aboutUs}
            config={editorConfig}
            onBlur={newContent => handleEditorChange(newContent, 'aboutUs')}
            onChange={() => {}}
          />
        </div>
      )
    },
    {
      title: 'General Settings',
      content: (
        <div className="p-4">
          <div className="space-y-4">
            {/* Email Notification Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="receiveOrderEmails" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Receive emails when order is placed
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Get notified via email whenever a new order is placed on your store
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="receiveOrderEmails"
                    name="receiveOrderEmails"
                    checked={formData.receiveOrderEmails}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Low Stock Alert Threshold */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label htmlFor="lowStockAlertThreshold" className="text-sm font-medium text-gray-700 block mb-2">
                Show low stock alert after
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="lowStockAlertThreshold"
                  name="lowStockAlertThreshold"
                  value={formData.lowStockAlertThreshold}
                  onChange={handleInputChange}
                  min="0"
                  max="1000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter number of items"
                />
                <span className="text-sm text-gray-600">items</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Low stock alert will be triggered when product stock falls below this number
              </p>
            </div>

            {/* Receive Low Stock Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="receiveLowStockEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Receive low stock emails
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Get notified when product stock falls below the threshold
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="receiveLowStockEmail"
                    name="receiveLowStockEmail"
                    checked={formData.receiveLowStockEmail}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Receive Out Of Stock Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="receiveOutOfStockEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Receive out of stock emails
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Get notified when product stock becomes zero
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="receiveOutOfStockEmail"
                    name="receiveOutOfStockEmail"
                    checked={formData.receiveOutOfStockEmail}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
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

          <form onSubmit={handleSubmit}>
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
                        ? 'max-h-[800px] opacity-100 overflow-auto'
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
                type="submit"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;