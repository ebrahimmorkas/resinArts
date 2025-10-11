import React, { useState, useEffect, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronUp, Save, Loader2, Upload, Trash2, Image as ImageIcon, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

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
    receiveOutOfStockEmail: false,
    shippingPriceSettings: {
    isManual: true,
    sameForAll: false,
    commonShippingPrice: 0,
    shippingType: 'city',
    shippingPrices: [],
    freeShipping: false,
    freeShippingAboveAmount: 0
  }
  });
  const [editingIndex, setEditingIndex] = useState(null);
const [editLocation, setEditLocation] = useState('');
const [editPrice, setEditPrice] = useState('');
const [uploadingExcel, setUploadingExcel] = useState(false);

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

  const handleShippingTypeChange = (e) => {
  const newType = e.target.value;
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      shippingType: newType
    }
  }));
};

const handleShippingToggle = (e) => {
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      isManual: e.target.checked,
      sameForAll: false,
      commonShippingPrice: 0
    }
  }));
};

const handleSameForAllToggle = (e) => {
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      sameForAll: e.target.checked
    }
  }));
};

const handleCommonShippingPriceChange = (e) => {
  const price = parseFloat(e.target.value) || 0;
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      commonShippingPrice: price
    }
  }));
};

const handleFreeShippingToggle = (e) => {
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      freeShipping: e.target.checked
    }
  }));
};

const handleFreeShippingAmountChange = (e) => {
  const amount = parseFloat(e.target.value) || 0;
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      freeShippingAboveAmount: amount
    }
  }));
};

const handleAddShippingPrice = () => {
  if (!editLocation || !editPrice) {
    toast.error('Please enter both location and price');
    return;
  }

  const priceNum = parseFloat(editPrice);
  if (isNaN(priceNum)) {
    toast.error('Price must be a valid number');
    return;
  }

  if (editingIndex !== null) {
    setFormData(prev => ({
      ...prev,
      shippingPriceSettings: {
        ...prev.shippingPriceSettings,
        shippingPrices: prev.shippingPriceSettings.shippingPrices.map((item, idx) =>
          idx === editingIndex ? { location: editLocation, price: priceNum } : item
        )
      }
    }));
    toast.success('Shipping price updated successfully!');
    setEditingIndex(null);
  } else {
    const duplicate = formData.shippingPriceSettings.shippingPrices.find(
      item => item.location.toLowerCase() === editLocation.toLowerCase()
    );
    if (duplicate) {
      toast.error(`${editLocation} already exists`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      shippingPriceSettings: {
        ...prev.shippingPriceSettings,
        shippingPrices: [
          ...prev.shippingPriceSettings.shippingPrices,
          { location: editLocation, price: priceNum }
        ]
      }
    }));
    toast.success('Shipping price added successfully!');
  }

  setEditLocation('');
  setEditPrice('');
};

const handleEditShippingPrice = (index) => {
  const item = formData.shippingPriceSettings.shippingPrices[index];
  setEditLocation(item.location);
  setEditPrice(item.price.toString());
  setEditingIndex(index);
};

const handleDeleteShippingPrice = (index) => {
  setFormData(prev => ({
    ...prev,
    shippingPriceSettings: {
      ...prev.shippingPriceSettings,
      shippingPrices: prev.shippingPriceSettings.shippingPrices.filter((_, i) => i !== index)
    }
  }));
  toast.success('Shipping price deleted successfully!');
};

const handleExcelUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validExtensions = ['.xlsx', '.xls'];
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!validExtensions.includes(fileExtension)) {
    toast.error('Please upload an Excel file (.xlsx or .xls)');
    return;
  }

  try {
    setUploadingExcel(true);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      toast.error('Excel file is empty');
      return;
    }

    const expectedHeader = formData.shippingPriceSettings.shippingType.charAt(0).toUpperCase() + 
                          formData.shippingPriceSettings.shippingType.slice(1);
    const headers = Object.keys(jsonData[0]);
    
    if (!headers[0] || !headers[1]) {
      toast.error('Excel must have at least 2 columns');
      return;
    }

    const locationHeader = headers[0];
    const priceHeader = headers[1];

    const newPrices = jsonData.map(row => ({
      location: String(row[locationHeader] || '').trim(),
      price: parseFloat(row[priceHeader]) || 0
    })).filter(item => item.location && !isNaN(item.price));

    if (newPrices.length === 0) {
      toast.error('No valid data found in Excel file');
      return;
    }

    setFormData(prev => ({
      ...prev,
      shippingPriceSettings: {
        ...prev.shippingPriceSettings,
        shippingPrices: newPrices
      }
    }));

    toast.success(`${newPrices.length} shipping prices imported successfully!`);
  } catch (error) {
    console.error('Excel upload error:', error);
    toast.error('Error processing Excel file. Please check the format.');
  } finally {
    setUploadingExcel(false);
    e.target.value = '';
  }
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
  formDataToSend.append('shippingPriceSettings', JSON.stringify(formData.shippingPriceSettings));

  if (logoFile) {
    formDataToSend.append('logo', logoFile);
  }

  const response = await axios.put(
    'http://localhost:3000/api/company-settings',
    formDataToSend,
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  if (response.data.success) {
    toast.success(response.data.message || 'Company settings updated successfully!');
    setFormData(response.data.data);
    if (response.data.data.company_logo) {
      setLogoPreview(response.data.data.company_logo);
    }
    setLogoFile(null);
  } else {
    toast.error(response.data.message || 'Failed to update settings');
  }
} catch (error) {
  const errorMessage = error.response?.data?.message || error.message || 'Failed to update settings';
  toast.error(errorMessage);
  console.error('Update error:', error);
} finally {
  setLoading(false);
}
  };

  const accordions = [
    {
      title: 'Personal Information',
      content: (
        <div className="p-4 space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold -800 dark:text-gray-100 mb-4">Company Logo</h3>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Low Stock Alert Threshold */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">items</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Low stock alert will be triggered when product stock falls below this number
              </p>
            </div>

            {/* Receive Low Stock Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Receive Out Of Stock Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )
    },
  {
  title: 'Shipping Price',
  content: (
    <div className="p-4">
      <div className="space-y-4">
        {/* Manual Shipping Price Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-b border-gray-200 pb-6">
          <div className="flex-1">
            <label htmlFor="isManualShipping" className="text-sm font-medium text-gray-700 cursor-pointer">
              Enter Shipping price manually
            </label>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, shipping price will be entered manually for each order
            </p>
          </div>
          <div className="ml-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isManualShipping"
                checked={formData.shippingPriceSettings.isManual}
                onChange={handleShippingToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Manual Pricing Options */}
        {formData.shippingPriceSettings.isManual && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Same For All Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="sameForAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Same shipping price for all products
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Apply a single shipping price to all orders
                </p>
              </div>
              <div className="ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="sameForAll"
                    checked={formData.shippingPriceSettings.sameForAll}
                    onChange={handleSameForAllToggle}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Common Shipping Price Input */}
            {formData.shippingPriceSettings.sameForAll && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label htmlFor="commonPrice" className="text-sm font-medium text-gray-700 block mb-2">
                  Enter Common Shipping Price
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">₹</span>
                  <input
                    type="number"
                    id="commonPrice"
                    placeholder="Enter shipping price"
                    value={formData.shippingPriceSettings.commonShippingPrice}
                    onChange={handleCommonShippingPriceChange}
                    min="0"
                    step="0.01"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This price will be applied to all orders
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Shipping Price Section */}
        {!formData.shippingPriceSettings.isManual && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Shipping Type Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Shipping Price according to</label>
              <select
                value={formData.shippingPriceSettings.shippingType}
                onChange={handleShippingTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="country">Country</option>
                <option value="state">State</option>
                <option value="city">City</option>
                <option value="zipcode">Zip Code</option>
              </select>
            </div>

            {/* Excel Upload Section */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">
                  Upload {formData.shippingPriceSettings.shippingType.charAt(0).toUpperCase() + formData.shippingPriceSettings.shippingType.slice(1)} Excel
                </label>
              </div>
              <label className="relative flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={uploadingExcel}
                  className="hidden"
                />
                {uploadingExcel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2">Excel should have 2 columns: {formData.shippingPriceSettings.shippingType} and Shipping Price</p>
            </div>

            {/* Add/Edit Shipping Price */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-gray-800">
                {editingIndex !== null ? 'Edit' : 'Add'} Shipping Price
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={formData.shippingPriceSettings.shippingType.charAt(0).toUpperCase() + formData.shippingPriceSettings.shippingType.slice(1)}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Shipping Price"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleAddShippingPrice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setEditLocation('');
                    setEditPrice('');
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Shipping Prices Table */}
            {formData.shippingPriceSettings.shippingPrices.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        {formData.shippingPriceSettings.shippingType.charAt(0).toUpperCase() + formData.shippingPriceSettings.shippingType.slice(1)}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Shipping Price (₹)</th>
                      <th className="px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.shippingPriceSettings.shippingPrices.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800">{item.location}</td>
                        <td className="px-4 py-2 text-gray-800">₹{item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditShippingPrice(index)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteShippingPrice(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {formData.shippingPriceSettings.shippingPrices.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">No shipping prices added yet</p>
              </div>
            )}
          </div>
        )}
        {/* Free Shipping Toggle - Appears Regardless of Manual/Dynamic */}
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-1">
              <label htmlFor="freeShipping" className="text-sm font-medium text-gray-700 cursor-pointer">
                Free Shipping
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Offer free shipping above a certain order amount
              </p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="freeShipping"
                  checked={formData.shippingPriceSettings.freeShipping}
                  onChange={handleFreeShippingToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Free Shipping Amount Input */}
          {formData.shippingPriceSettings.freeShipping && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <label htmlFor="freeShippingAmount" className="text-sm font-medium text-gray-700 block mb-2">
                Free Shipping Above Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">₹</span>
                <input
                  type="number"
                  id="freeShippingAmount"
                  placeholder="Enter amount"
                  value={formData.shippingPriceSettings.freeShippingAboveAmount}
                  onChange={handleFreeShippingAmountChange}
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Customers will get free shipping when their order total is above this amount
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
},
  ];

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-white">Company Settings</h1>
            <p className="mt-2 text-blue-100">Manage your company information and policies</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-4">
              {accordions.map((accordion, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-lg font-semibold -800 dark:text-gray-100">
                      {accordion.title}
                    </span>
                    {activeAccordion === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      activeAccordion === index
                        ? 'max-h-[800px] opacity-100 overflow-auto'
                        : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      {accordion.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-8">
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