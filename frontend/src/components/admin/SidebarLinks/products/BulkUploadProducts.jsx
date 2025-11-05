import React, { useState, useEffect, useContext } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Package, Info, Archive } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import { ProductContext } from '../../../../../Context/ProductContext';
import OverrideProductsModal from './OverrideProductsModal';

const socket = io('https://api.mouldmarket.in');

// Loading Spinner Component
const LoadingSpinner = ({ message = "Processing..." }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{message}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Please wait while we process your request...</p>
      </div>
    </div>
  );
};

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
      {type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 text-black dark:text-white hover:text-gray-200 transition-colors"
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
          {details && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{details}</pre>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>Processing...</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white dark:bg-gray-900 opacity-20 animate-pulse"></div>
        </div>
      </div>
      {progress && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>Processed: {progress.processed} / {progress.total}</span>
          <span className="text-green-600">Success: {progress.successCount}</span>
          <span className="text-red-600">Failed: {progress.failCount}</span>
        </div>
      )}
    </div>
  );
};

// File Upload Card Component
const FileUploadCard = ({ file, onRemove, icon: Icon, label }) => {
  if (!file) return null;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function BulkUploadProducts() {
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [overrideModal, setOverrideModal] = useState({ isOpen: false, products: [] });
const [isOverriding, setIsOverriding] = useState(false);
const [pendingUploadData, setPendingUploadData] = useState(null);
  const { fetchProducts } = useContext(ProductContext);

  useEffect(() => {
    socket.on('productUploadProgress', (data) => {
      setProgress(data);
    });

    return () => {
      socket.off('productUploadProgress');
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const showErrorModal = (title, message, details = '') => {
    setErrorModal({ isOpen: true, title, message, details });
  };

  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    setExcelFile(file || null);
    setResponse(null);
    setProgress(null);
  };

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    setZipFile(file || null);
    setResponse(null);
    setProgress(null);
  };

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
  };

  const handleSubmit = async () => {
  if (!excelFile || !zipFile) {
    showErrorModal('Missing Files', 'Please select both Excel file and images ZIP file.');
    return;
  }

  setIsLoading(true);

  const formData = new FormData();
  formData.append('excelFile', excelFile);
  formData.append('imagesZip', zipFile);

  try {
    const res = await axios.post('https://api.mouldmarket.in/api/product/bulk-upload', formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setIsLoading(false);

    // Check if there are products that already exist
    if (res.data.existingProducts && res.data.existingProducts.length > 0) {
      // Store the upload data for later use
      setPendingUploadData({ formData, excelFile: excelFile, zipFile: zipFile });
      
      // Set partial response
      setResponse(res.data);
      setProgress(null);
      
      // Show override modal
      setOverrideModal({
        isOpen: true,
        products: res.data.existingProducts
      });
      
      // Show partial success message
      if (res.data.results?.successCount > 0) {
        showToast(
          `${res.data.results.successCount} products uploaded. ${res.data.existingProducts.length} products already exist.`,
          'info'
        );
      } else {
        showToast(
          `${res.data.existingProducts.length} products already exist. Please select which to override.`,
          'info'
        );
      }
    } else {
      // All products uploaded successfully
      setResponse(res.data);
      setProgress(null);
      showToast('Products uploaded successfully!', 'success');
      
      setTimeout(() => {
        fetchProducts();
      }, 2000);
    }
  } catch (err) {
    setIsLoading(false);
    const errorMessage = err.response?.data?.message || 'Upload failed.';
    setResponse(null);
    setProgress(null);
    showErrorModal(
      'Product Upload Failed',
      errorMessage,
      err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''
    );
  }
};

const handleOverrideProducts = async (selectedProductIds) => {
  if (selectedProductIds.length === 0) {
    showToast('Please select at least one product to override', 'error');
    return;
  }

  setIsOverriding(true);

  try {
    const formData = new FormData();
    formData.append('excelFile', pendingUploadData.excelFile);
    formData.append('imagesZip', pendingUploadData.zipFile);
    formData.append('productIds', JSON.stringify(selectedProductIds));

    const res = await axios.post('https://api.mouldmarket.in/api/product/bulk-override', formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setIsOverriding(false);
    setOverrideModal({ isOpen: false, products: [] });
    setPendingUploadData(null);
    
    // Clear cache and refresh products
    sessionStorage.removeItem('productsCache');
    sessionStorage.removeItem('productsCacheTime');
    await fetchProducts();
    
    // Combine results if there were successful uploads before
    if (response) {
      const combinedResults = {
        ...res.data,
        results: {
          ...res.data.results,
          successCount: (response.results?.successCount || 0) + res.data.results.successCount,
          totalProcessed: (response.results?.totalProcessed || 0) + res.data.results.totalProcessed
        }
      };
      setResponse(combinedResults);
    } else {
      setResponse(res.data);
    }

    showToast(`${res.data.results.successCount} products overridden successfully!`, 'success');
  } catch (err) {
    setIsOverriding(false);
    const errorMessage = err.response?.data?.message || 'Override failed.';
    showErrorModal(
      'Override Failed',
      errorMessage,
      err.response?.data ? JSON.stringify(err.response.data, null, 2) : ''
    );
  }
};

  const bothFilesSelected = excelFile && zipFile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isLoading && <LoadingSpinner message="Uploading Products..." />}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Package className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Bulk Upload Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Upload product data with images via Excel and ZIP file
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4" />
              <span>Excel + ZIP format</span>
            </div>
            <div className="flex items-center space-x-4">
  <button
    onClick={() => window.open('https://api.mouldmarket.in/products_sample.xlsx', '_blank')}
    className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200 text-sm font-medium"
  >
    <FileSpreadsheet className="w-5 h-5 mr-2" />
    Download Sample
  </button>
</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload Products</h2>
                <p className="text-white text-opacity-90 text-sm">Upload Excel file with product data and ZIP file with images</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Upload Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Excel File Upload */}
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                  excelFile 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-3">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    excelFile ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {excelFile ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <FileSpreadsheet className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Excel File</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">XLSX or CSV</p>
                  </div>
                  
                  {!excelFile && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={handleExcelChange}
                        className="hidden"
                      />
                      <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 text-sm font-medium">
                        Browse
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* ZIP File Upload */}
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                  zipFile 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-3">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                    zipFile ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {zipFile ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Archive className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Images ZIP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All product images</p>
                  </div>
                  
                  {!zipFile && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleZipChange}
                        className="hidden"
                      />
                      <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 text-sm font-medium">
                        Browse
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Files Info */}
            {(excelFile || zipFile) && (
              <div className="space-y-3">
                <FileUploadCard 
                  file={excelFile}
                  onRemove={() => handleExcelChange({ target: { files: [] } })}
                  icon={FileSpreadsheet}
                  label="Excel File"
                />
                <FileUploadCard 
                  file={zipFile}
                  onRemove={() => handleZipChange({ target: { files: [] } })}
                  icon={Archive}
                  label="Images ZIP"
                />
              </div>
            )}
            
            {/* Upload Button */}
            <button
              onClick={handleSubmit}
              disabled={!bothFilesSelected || isLoading || progress}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
                !bothFilesSelected || isLoading || progress
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] shadow-md'
              }`}
            >
              {progress ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Upload Products'
              )}
            </button>
            
            {/* Progress */}
            {progress && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
                <ProgressBar progress={progress} />
              </div>
            )}
            
            {/* Success Response */}
            {response && !progress && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:from-opacity-20 dark:to-emerald-900 dark:to-opacity-20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-800 dark:text-green-300 text-lg">Upload Successful!</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg p-3">
                        <span className="text-green-700 dark:text-green-300 font-medium">Total Products:</span>
                        <span className="text-green-800 dark:text-green-300 font-bold">{response.results?.totalProcessed || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg p-3">
                        <span className="text-green-700 dark:text-green-300 font-medium">Successful:</span>
                        <span className="text-green-800 dark:text-green-300 font-bold">{response.results?.successCount || 'N/A'}</span>
                      </div>
                      {response.results?.failCount > 0 && (
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg p-3">
                          <span className="text-orange-700 dark:text-orange-300 font-medium">Failed:</span>
                          <span className="text-orange-800 dark:text-orange-300 font-bold">{response.results.failCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Override Products Modal */}
      <OverrideProductsModal
        isOpen={overrideModal.isOpen}
        onClose={() => {
          setOverrideModal({ isOpen: false, products: [] });
          setPendingUploadData(null);
        }}
        products={overrideModal.products}
        onOverride={handleOverrideProducts}
        isProcessing={isOverriding}
      />

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
}