import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Package, Users, Info } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Assuming your backend server is at port 3000 and has socket.io set up

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center space-x-3 min-w-80 max-w-md transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : type === 'error' 
        ? 'bg-red-500 text-white' 
        : 'bg-blue-500 text-white'
    }`}>
      {type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Error Modal Component
const ErrorModal = ({ isOpen, onClose, title, message, details }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-4">{message}</p>
          {details && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{details}</pre>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Progress Component
const ProgressBar = ({ progress }) => {
  const percentage = progress ? Math.round((progress.processed / progress.total) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Processing...</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
        </div>
      </div>
      {progress && (
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Processed: {progress.processed} / {progress.total}</span>
          <span className="text-green-600">Success: {progress.successCount}</span>
          <span className="text-red-600">Failed: {progress.failCount}</span>
        </div>
      )}
    </div>
  );
};

// Upload Section Component
const UploadSection = ({ 
  title, 
  icon: Icon, 
  file, 
  onFileChange, 
  onSubmit, 
  progress, 
  response, 
  error,
  gradientFrom = "from-blue-500",
  gradientTo = "to-blue-600"
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileChange({ target: { files: [files[0]] } });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-6 text-white`}>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-white text-opacity-90 text-sm">Upload your {title.toLowerCase()} data</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : file 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              file ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {file ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div>
              <span className="text-lg font-semibold text-gray-700">
                {file ? file.name : isDragOver ? 'Drop file here' : 'Drag & drop or click to upload'}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: XLSX, CSV • Maximum size: 10MB
              </p>
            </div>
            
            {!file && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Browse Files
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* File Info */}
        {file && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFileChange({ target: { files: [] } })}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Upload Button */}
        <button
          onClick={onSubmit}
          disabled={!file || progress}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
            !file || progress
              ? 'bg-gray-400 cursor-not-allowed'
              : `bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] shadow-md`
          }`}
        >
          {progress ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Upload ${title}`
          )}
        </button>
        
        {/* Progress */}
        {progress && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <ProgressBar progress={progress} />
          </div>
        )}
        
        {/* Success Response */}
        {response && !progress && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-800 text-lg">Upload Successful! 🎉</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center bg-white bg-opacity-50 rounded-lg p-3">
                    <span className="text-green-700 font-medium">Total Records:</span>
                    <span className="text-green-800 font-bold">{response.totalRecords || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white bg-opacity-50 rounded-lg p-3">
                    <span className="text-green-700 font-medium">Successfully Processed:</span>
                    <span className="text-green-800 font-bold">{response.successfulInserts || response.success || 'N/A'}</span>
                  </div>
                  {response.failures > 0 && (
                    <div className="flex justify-between items-center bg-white bg-opacity-50 rounded-lg p-3">
                      <span className="text-orange-700 font-medium">Failed Records:</span>
                      <span className="text-orange-800 font-bold">{response.failures}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkUpload = () => {
  const [productFile, setProductFile] = useState(null);
  const [categoryFile, setCategoryFile] = useState(null);
  const [productResponse, setProductResponse] = useState(null);
  const [categoryResponse, setCategoryResponse] = useState(null);
  const [productProgress, setProductProgress] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState(null);
  const [productError, setProductError] = useState(null);
  const [categoryError, setCategoryError] = useState(null);
  
  // UI state
  const [toast, setToast] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });

  useEffect(() => {
    socket.on('productUploadProgress', (data) => {
      setProductProgress(data);
    });

    socket.on('categoryUploadProgress', (data) => {
      setCategoryProgress(data);
    });

    return () => {
      socket.off('productUploadProgress');
      socket.off('categoryUploadProgress');
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const showErrorModal = (title, message, details = '') => {
    setErrorModal({ isOpen: true, title, message, details });
  };

  const handleProductFileChange = (e) => {
    const file = e.target.files[0];
    setProductFile(file || null);
    setProductResponse(null);
    setProductError(null);
    setProductProgress(null);
  };

  const handleCategoryFileChange = (e) => {
    const file = e.target.files[0];
    setCategoryFile(file || null);
    setCategoryResponse(null);
    setCategoryError(null);
    setCategoryProgress(null);
  };

  const handleProductSubmit = async () => {
    if (!productFile) {
      showErrorModal('No File Selected', 'Please select a product file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', productFile);

    try {
      const res = await axios.post('http://localhost:3000/api/product/bulk-upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProductResponse(res.data);
      setProductError(null);
      setProductProgress(null);
      showToast('Products uploaded successfully! 🎉', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Upload failed.';
      setProductError(errorMessage);
      setProductResponse(null);
      setProductProgress(null);
      showErrorModal(
        'Product Upload Failed', 
        errorMessage,
        err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''
      );
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryFile) {
      showErrorModal('No File Selected', 'Please select a category file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', categoryFile);

    try {
      const res = await axios.post('http://localhost:3000/api/category/bulk-upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCategoryResponse(res.data);
      setCategoryError(null);
      setCategoryProgress(null);
      showToast('Categories uploaded successfully! 🎉', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Upload failed.';
      setCategoryError(errorMessage);
      setCategoryResponse(null);
      setCategoryProgress(null);
      showErrorModal(
        'Category Upload Failed', 
        errorMessage,
        err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Bulk Upload Manager
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Streamline your data import process with our advanced upload system
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>Supports XLSX & CSV formats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Product Upload */}
          <UploadSection
            title="Products"
            icon={Package}
            file={productFile}
            onFileChange={handleProductFileChange}
            onSubmit={handleProductSubmit}
            progress={productProgress}
            response={productResponse}
            error={productError}
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
          />

          {/* Category Upload */}
          <UploadSection
            title="Categories"
            icon={Users}
            file={categoryFile}
            onFileChange={handleCategoryFileChange}
            onSubmit={handleCategorySubmit}
            progress={categoryProgress}
            response={categoryResponse}
            error={categoryError}
            gradientFrom="from-purple-500"
            gradientTo="to-purple-600"
          />
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 text-center border-b border-gray-100">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <FileSpreadsheet className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">File Format Guidelines</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Ensure your files follow the correct format for successful uploads and optimal processing
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-900">Product File Requirements</h4>
                </div>
                <ul className="text-blue-800 space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Excel (.xlsx) or CSV (.csv) format supported</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Maximum file size: 10MB per upload</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Include all required product fields</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ensure data validation before upload</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-purple-900">Category File Requirements</h4>
                </div>
                <ul className="text-purple-800 space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Excel (.xlsx) or CSV (.csv) format supported</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Maximum file size: 10MB per upload</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Include all required category fields</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Check for duplicate entries</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '', details: '' })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </div>
  );
};

export default BulkUpload;