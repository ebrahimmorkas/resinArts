import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Users, Info, Archive } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('https://api.simplyrks.cloud');

// Loading Spinner Component
const LoadingSpinner = ({ message = "Processing..." }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
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
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>Processing...</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
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
            <Icon className="w-5 h-5 text-purple-500" />
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

export default function BulkUploadCategories() {
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '', details: '' });
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    socket.on('categoryUploadProgress', (data) => {
      setProgress(data);
    });

    return () => {
      socket.off('categoryUploadProgress');
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
      const response = await fetch('https://api.simplyrks.cloud/api/category/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setResponse(data);
      setProgress(null);
      showToast('Categories uploaded successfully!', 'success');
    } catch (err) {
      const errorMessage = err.message || 'Upload failed.';
      setResponse(null);
      setProgress(null);
      showErrorModal(
        'Category Upload Failed',
        errorMessage,
        err.details || ''
      );
    } finally {
      setIsLoading(false);
    }
  };

  const bothFilesSelected = excelFile && zipFile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isLoading && <LoadingSpinner message="Uploading Categories..." />}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Bulk Upload Categories
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Upload category data with images via Excel and ZIP file
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4" />
              <span>Excel + ZIP format</span>
            </div>
            <div className="flex items-center space-x-4">
    <button
      onClick={() => window.open('https://api.simplyrks.cloud/categories_sample.xlsx', '_blank')}
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
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload Categories</h2>
                <p className="text-white text-opacity-90 text-sm">Upload Excel file with category data and ZIP file with images</p>
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
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                      <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-200 text-sm font-medium">
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
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All category images</p>
                  </div>
                  
                  {!zipFile && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleZipChange}
                        className="hidden"
                      />
                      <div className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-all duration-200 text-sm font-medium">
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
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] shadow-md'
              }`}
            >
              {progress ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Upload Categories'
              )}
            </button>
            
            {/* Progress */}
            {progress && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-purple-100 dark:border-gray-700">
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
                        <span className="text-green-700 dark:text-green-300 font-medium">Total Categories:</span>
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