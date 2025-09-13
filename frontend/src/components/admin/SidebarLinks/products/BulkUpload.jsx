// frontend/src/components/BulkUpload.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('https://resinarts.onrender.com'); // Assuming your backend server is at port 3000 and has socket.io set up

const BulkUpload = () => {
  const [productFile, setProductFile] = useState(null);
  const [categoryFile, setCategoryFile] = useState(null);
  const [productResponse, setProductResponse] = useState(null);
  const [categoryResponse, setCategoryResponse] = useState(null);
  const [productProgress, setProductProgress] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState(null);
  const [productError, setProductError] = useState(null);
  const [categoryError, setCategoryError] = useState(null);

  useEffect(() => {
    // Listen for product upload progress
    socket.on('productUploadProgress', (data) => {
      setProductProgress(data);
    });

    // Listen for category upload progress
    socket.on('categoryUploadProgress', (data) => {
      setCategoryProgress(data);
    });

    // Cleanup on unmount
    return () => {
      socket.off('productUploadProgress');
      socket.off('categoryUploadProgress');
    };
  }, []);

  const handleProductFileChange = (e) => {
    setProductFile(e.target.files[0]);
    setProductResponse(null);
    setProductError(null);
    setProductProgress(null);
  };

  const handleCategoryFileChange = (e) => {
    setCategoryFile(e.target.files[0]);
    setCategoryResponse(null);
    setCategoryError(null);
    setCategoryProgress(null);
  };

  const handleProductSubmit = async () => {
    if (!productFile) {
      setProductError('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', productFile);

    try {
      const res = await axios.post('https://resinarts.onrender.com/api/product/bulk-upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProductResponse(res.data);
      setProductError(null);
    } catch (err) {
      setProductError(err.response?.data?.message || 'Upload failed.');
      setProductResponse(null);
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryFile) {
      setCategoryError('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', categoryFile);

    try {
      const res = await axios.post('https://resinarts.onrender.com/api/category/bulk-upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCategoryResponse(res.data);
      setCategoryError(null);
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Upload failed.');
      setCategoryResponse(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bulk Upload</h1>

      {/* Product Upload Section */}
      <section>
        <h2>Upload Products</h2>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleProductFileChange}
        />
        <button onClick={handleProductSubmit}>Upload Product File</button>

        {productProgress && (
          <div>
            <p>Progress: {productProgress.processed} / {productProgress.total}</p>
            <p>Success: {productProgress.successCount} | Failed: {productProgress.failCount}</p>
          </div>
        )}

        {productResponse && (
          <div>
            <h3>Response:</h3>
            <pre>{JSON.stringify(productResponse, null, 2)}</pre>
          </div>
        )}

        {productError && (
          <div style={{ color: 'red' }}>
            <p>Error: {productError}</p>
          </div>
        )}
      </section>

      {/* Category Upload Section */}
      <section style={{ marginTop: '40px' }}>
        <h2>Upload Categories</h2>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleCategoryFileChange}
        />
        <button onClick={handleCategorySubmit}>Upload Category File</button>

        {categoryProgress && (
          <div>
            <p>Progress: {categoryProgress.processed} / {categoryProgress.total}</p>
            <p>Success: {categoryProgress.successCount} | Failed: {categoryProgress.failCount}</p>
          </div>
        )}

        {categoryResponse && (
          <div>
            <h3>Response:</h3>
            <pre>{JSON.stringify(categoryResponse, null, 2)}</pre>
          </div>
        )}

        {categoryError && (
          <div style={{ color: 'red' }}>
            <p>Error: {categoryError}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BulkUpload;