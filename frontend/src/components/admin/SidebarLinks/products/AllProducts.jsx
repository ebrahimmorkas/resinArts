import React, { useContext, useState, useEffect, useMemo } from "react";
import { Edit2, Trash2, X, Calendar, Clock, DollarSign, Check, Package, Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductContext } from '../../../../../Context/ProductContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

export default function AdminProductsPage() {
  const { products, loading, error } = useContext(ProductContext);

  // This will hold all the products which will be selected using checkbox
  const [selectedProducts, setSelectedProducts] = useState([]);
  // This will hold the product when user clicks the restock button
  const [restockProduct, setRestockProduct] = useState(null);
  // This will control the opening and closing of restock modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [multipleProductsToRestock, setMultipleProductsToRestock] = useState({});
  // Starting of state variables for revised rate functionality
  const [showRevisedRateModal, setShowRevisedRateModal] = useState(false);
  const [multipleProductsForRevisedRate, setMultipleProductsForRevisedRate] = useState({});
  const [RevisedRateProduct, setRevisedRateProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state variables for table functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [priceSort, setPriceSort] = useState('');
  const [stockSort, setStockSort] = useState('');
  // New state variables for view modals
  const [showViewStockModal, setShowViewStockModal] = useState(false);
  const [showViewPriceModal, setShowViewPriceModal] = useState(false);
  const [selectedProductForView, setSelectedProductForView] = useState(null);

  // Function to open view stock modal
  const openViewStockModal = (product) => {
    setSelectedProductForView(product);
    setShowViewStockModal(true);
  };

  // Function to open view price modal
  const openViewPriceModal = (product) => {
    setSelectedProductForView(product);
    setShowViewPriceModal(true);
  };

  // View Stock Modal Component
  const ViewStockModal = ({ product, onClose }) => {
    if (!product) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Stock Details - {product.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.variants.map(variant => (
                <div key={variant._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={variant.variantImage || getImageUrl(product)} 
                      alt={variant.colorName} 
                      className="w-16 h-16 rounded-lg object-cover" 
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{variant.colorName}</h3>
                      <p className="text-sm text-gray-500">Variant</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variant.moreDetails.map(details => (
                      <div key={details._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Size: {details.size.length}" × {details.size.breadth}" × {details.size.height}"
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Weight: {details.size.weight}kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{details.size.stock}</p>
                            <p className="text-xs text-gray-500">in stock</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            details.size.stock > 10 
                              ? 'bg-green-100 text-green-800' 
                              : details.size.stock > 0 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {details.size.stock > 10 ? 'In Stock' : details.size.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // View Price Modal Component
  const ViewPriceModal = ({ product, onClose }) => {
    if (!product) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Price Details - {product.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.variants.map(variant => (
                <div key={variant._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={variant.variantImage || getImageUrl(product)} 
                      alt={variant.colorName} 
                      className="w-16 h-16 rounded-lg object-cover" 
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{variant.colorName}</h3>
                      <p className="text-sm text-gray-500">Variant</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variant.moreDetails.map(details => (
                      <div key={details._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Size: {details.size.length}" × {details.size.breadth}" × {details.size.height}"
                          </p>
                          <p className="text-xs text-gray-500">Weight: {details.size.weight}kg</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Base Price:</span>
                            <span className="text-lg font-bold text-green-600">${details.price}</span>
                          </div>
                          
                          {details.discountPrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Discount Price:</span>
                              <span className="text-lg font-bold text-red-600">${details.discountPrice}</span>
                            </div>
                          )}
                          
                          {details.bulkPricing && details.bulkPricing.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Bulk Pricing:</p>
                              <div className="space-y-1">
                                {details.bulkPricing.map((bulk, index) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span className="text-gray-600">{bulk.quantity}+ items:</span>
                                    <span className="font-medium text-blue-600">${bulk.wholesalePrice}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Start of useEffect that will handle the selection and deselection of products selected through checkbox and also update state variable mutipleProductsToRestock
  useEffect(() => {
    console.log(selectedProducts)

    // Updating state variable for Restock
    const newMultipleProductsToRestock = {}
    selectedProducts.forEach(product => {
      newMultipleProductsToRestock[product._id] = {};
      if(product.hasVariants)  {
        // It has variants
        // Now creating the variant ID's
        product.variants.forEach(variant => {
          newMultipleProductsToRestock[product._id][variant._id] = {}
          // Now creating the size ID's
          variant.moreDetails.forEach(details => {
              newMultipleProductsToRestock[product._id][variant._id][details._id] = {};
              newMultipleProductsToRestock[product._id][variant._id][details._id][details.size._id] = "";
          });
        })  
      } else {
        // It does not have variants
        // Take the id and assign the stock
        newMultipleProductsToRestock[product._id] = {};
        newMultipleProductsToRestock[product._id]['stock'] = "";
      }
    });
    setMultipleProductsToRestock(newMultipleProductsToRestock);

    // Updating the state variable for Revised Rate
    const newMultipleProductsForRevisedRate = {}
    selectedProducts.forEach(product => {
      newMultipleProductsForRevisedRate[product._id] = {};
      if(product.hasVariants)  {
        // It has variants
        // Now creating the variant ID's
        product.variants.forEach(variant => {
          newMultipleProductsForRevisedRate[product._id][variant._id] = {}
          // Now creating the size ID's
          variant.moreDetails.forEach(details => {
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id] = {};
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id][details.size._id] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountStartDate"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountEndDate"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountPrice"] = "";
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["comeBackToOriginalPrice"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountBulkPricing"] = [];
          });
        }) 
      } else {
        // It does not have variants
        // Take the id and assign the stock
        newMultipleProductsForRevisedRate[product._id] = {};
        newMultipleProductsForRevisedRate[product._id]['price'] = "";
         newMultipleProductsForRevisedRate[product._id]["discountStartDate"] = null;
              newMultipleProductsForRevisedRate[product._id]["discountEndDate"] = null;
              newMultipleProductsForRevisedRate[product._id]["discountPrice"] = "";
              newMultipleProductsForRevisedRate[product._id]["comeBackToOriginalPrice"] = null; 
              newMultipleProductsForRevisedRate[product._id]["discountBulkPricing"] = [];
      }
    });
    setMultipleProductsForRevisedRate(newMultipleProductsForRevisedRate)
  }, [selectedProducts]);

  // Start of useEffect that will only pront state variable 'multipleProductsToRestock'
  useEffect(() => {
    console.log("Multiple products to restock")
    console.log(multipleProductsToRestock)
  }, [multipleProductsToRestock])

  // Start of useEffect that will only pront state variable 'multipleProductsForRevisedRate'
  useEffect(() => {
    console.log("Multiple products for revised rate")
    console.log(multipleProductsForRevisedRate)
  }, [multipleProductsForRevisedRate])

  // Function to check if product exists
  const doesProductExist = (product) => {
    return products.some((prod) => prod._id === product._id);
  };

  // Function to return the image URL
  const getImageUrl = (product) => {
    if (doesProductExist(product)) {
      if (product.image) {
        return product.image;
      } else {
        const defaultVariant = product.variants.find((variant) => variant.isDefault);
        return defaultVariant?.variantImage || "/placeholder.svg";
      }
    }
    return "/placeholder.svg";
  };

  // Function to count the number of size variants
  const getNumberOfSizeVariants = (product) => {
    const sizeLength = product.variants.map((variant) => variant.moreDetails.length);
    return sizeLength.reduce((sum, current) => sum + current, 0);
  };

  // Function to toggle checkbox selection
  const toggleCheckbox = (product) => {
    setSelectedProducts((prev) =>
      prev.some((prod) => prod._id === product._id)
        ? prev.filter((prod) => prod._id !== product._id)
        : [...prev, product]
    );
  };

  // Function to toggle select all
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredData.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredData);
    }
  };

  // Function to export products to Excel
  const exportToExcel = () => {
    const exportData = products.map((product, index) => ({
      'Sr No': index + 1,
      'Product Name': product.name,
      'Category': product.category,
      'Stock': product.hasVariants ? 'View Stock' : product.stock,
      'Color Variants': product.hasVariants ? product.variants.length : 0,
      'Size Variants': getNumberOfSizeVariants(product),
      'Price': product.hasVariants ? 'View Price' : product.price,
      'Created Date': new Date(product.createdAt).toLocaleDateString(),
      'Has Variants': product.hasVariants ? 'Yes' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_export.xlsx");
    toast.success('Products exported successfully!');
  };

  // Function to handle product deletion
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setIsLoading(true);
      try {
        const res = await axios.delete(`http://localhost:3000/api/product/${productId}`, {
          withCredentials: true
        });
        if (res.status === 200) {
          toast.success('Product deleted successfully!');
          // Refresh products list or remove from state
        }
      } catch (error) {
        toast.error('Failed to delete product!');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and search functionality
  const filteredData = useMemo(() => {
    let filtered = products.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply date filters
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(item => new Date(item.createdAt).toDateString() === today);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(item => new Date(item.createdAt).toDateString() === yesterday.toDateString());
    } else if (dateFilter === 'custom' && customDate) {
      filtered = filtered.filter(item => new Date(item.createdAt).toDateString() === new Date(customDate).toDateString());
    } else if (dateFilter === 'range' && customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Apply sorting
    if (priceSort === 'low-high') {
      filtered.sort((a, b) => {
        const priceA = a.hasVariants ? 0 : a.price;
        const priceB = b.hasVariants ? 0 : b.price;
        return priceA - priceB;
      });
    } else if (priceSort === 'high-low') {
      filtered.sort((a, b) => {
        const priceA = a.hasVariants ? 0 : a.price;
        const priceB = b.hasVariants ? 0 : b.price;
        return priceB - priceA;
      });
    }

    if (stockSort === 'low-high') {
      filtered.sort((a, b) => {
        const stockA = a.hasVariants ? 0 : a.stock;
        const stockB = b.hasVariants ? 0 : b.stock;
        return stockA - stockB;
      });
    } else if (stockSort === 'high-low') {
      filtered.sort((a, b) => {
        const stockA = a.hasVariants ? 0 : a.stock;
        const stockB = b.hasVariants ? 0 : b.stock;
        return stockB - stockA;
      });
    }

    return filtered;
  }, [products, searchTerm, dateFilter, customDate, customDateRange, priceSort, stockSort]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading products...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-red-600">Error loading products</div>
    </div>
  );

  // Loading Overlay Component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Processing...</p>
      </div>
    </div>
  );

  // Restock Modal Component
  const RestockModal = ({ product={}, onClose, selectedProducts=[], multipleToRestockInitial={} }) => {
    const [stockTextfield, setStockTextfield] = useState("");
    const [stateVariableForDataForSingleProductWithVariants, setStateVariableForDataForSingleProductWithVariants] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Start of function that will update only stock of only one product with and without variants
    const handleUpdateStock = async () => {
      setModalLoading(true);
      try {
        let dataToSend = {}
        if(product.hasVariants) {
          dataToSend = {
            productId: product._id,
            updatedStock: "",
            productData: stateVariableForDataForSingleProductWithVariants
          }
        } else {
        dataToSend = {
          productId: product._id,
          updatedStock: parseInt(stockTextfield),
          productData: {}
        };
      }
        const res = await axios.post(
          'http://localhost:3000/api/product/restock',
          dataToSend,
          { withCredentials: true }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success(`Stock updated successfully for ${product.name}`);
          setStockTextfield("");
          onClose();
        } else {
          toast.error("Failed to update stock!");
        }
      } catch (error) {
        toast.error("Error updating stock: " + error.message);
      } finally {
        setModalLoading(false);
      }
    };

    // Start of function for updating multiple stocks
    const handleUpdateMultipleStock = async (localMultipleToRestock) => {
      setModalLoading(true);
      try{
        const res = await axios.post('http://localhost:3000/api/product/mass-restock', localMultipleToRestock, {
          withCredentials: true,
        });
        if(res.status === 200) {
          toast.success("Multiple products restocked successfully!");
          onClose();
        } else {
          toast.error("Failed to update stock!");
        }
      } catch(err) {
        toast.error("Error updating stock!");
        console.error(err);
      } finally {
        setModalLoading(false);
      }
    };

    if (selectedProducts.length > 0) {
      const [localMultipleToRestock, setLocalMultipleToRestock] = useState(multipleToRestockInitial);
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Restock Multiple Products</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {Object.values(selectedProducts).map(product => {
                  return product.hasVariants ? 
                  (<div className="border border-gray-200 rounded-lg p-4" key={product._id}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Has Variants</p>
                      </div>
                    </div>
                    {product.variants.map(variant => {
                      return (<div key={variant._id} className="ml-4 space-y-3">
                        <h4 className="font-medium text-gray-800">Variant: {variant.colorName}</h4>
                        {variant.moreDetails.map(details => {
                          return (
                            <div key={details._id} className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm text-gray-600 mb-2">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                              <p className="text-sm text-gray-600 mb-2">Current stock: {details.size.stock}</p>
                              <input 
                                type="number"
                                min="0"
                                placeholder="Enter new stock quantity"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={localMultipleToRestock[product._id][variant._id][details._id][details.size._id]} 
                                onChange={(e) => {
                                  setLocalMultipleToRestock(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          [details.size._id]: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>)
                    })}
                  </div>) : 
                  (<div className="border border-gray-200 rounded-lg p-4" key={product._id}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Current Stock: {product.stock}</p>
                      </div>
                    </div>
                    <input 
                      type="number"
                      min="0"
                      placeholder="Enter new stock quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={localMultipleToRestock[product._id]['stock']} 
                      onChange={(e) => {
                        setLocalMultipleToRestock(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            stock: e.target.value
                          }
                        }));
                      }}
                    />
                  </div>)
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateMultipleStock(localMultipleToRestock)}
                disabled={modalLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {modalLoading ? "Updating..." : "Update Stock"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Restock Product</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center text-gray-600">
              No Product Selected
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Restock Product</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.hasVariants ? (
                <div>
                  {product.variants.map((variant) => {
                    return <div key={variant._id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">Variant: {variant.colorName}</p>
                        </div>
                      </div>
                      {variant.moreDetails.map((details) => {
                        return (<div key={details._id} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                          <p className="text-sm text-gray-600 mb-3">Current stock: {details.stock}</p>
                          <input 
                            type="number"
                            min="0"
                            placeholder="Enter new stock quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={stateVariableForDataForSingleProductWithVariants[variant._id]?.[details._id]?.[details.size._id] || ""}
                            onChange={(e) => {
                              setStateVariableForDataForSingleProductWithVariants(prevState => ({
                                ...prevState,
                                [variant._id]: {
                                  ...prevState[variant._id],
                                  [details._id]: {
                                    ...(prevState[variant._id]?.[details._id] || {}),
                                    [details.size._id]: e.target.value
                                  }
                                }
                              }));
                            }}
                          />
                        </div>)
                      })}
                    </div>
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">Current Stock: {product.stock}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Stock Quantity
                    </label>
                    <input
                      value={stockTextfield}
                      onChange={(e) => setStockTextfield(e.target.value)}
                      type="number"
                      min="0"
                      placeholder="Enter new stock quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStock}
              disabled={modalLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {modalLoading ? "Updating..." : "Update Stock"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Revised Rate Modal component
  const RevisedRateModal = ({ product={}, onClose, selectedProducts=[], multipleForRevisedRateInitial={} }) => {
    const [revisedRateTextfield, setRevisedRateTextfield] = useState("");
    const [discountStartDate, setDiscountStartDate] = useState(null);
    const [discountEndDate, setDiscountEndDate] = useState(null);
    const [comeBackToOriginalPrice, setComeBackToOriginalPrice] = useState(null);
    const [singleProductDiscountBulkPricing, setSingleProductDiscountBulkPricing] = useState([]);
    const [stateVariableToReviseRateForSingleProductWithVariants, setStateVariableToReviseRateForSingleProductWithVariants] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Functions for managing discount bulk pricing
    const addDiscountBulkPricingSection = (setLocal, productId, variantId = null, detailsId = null) => {
      setLocal(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          ...(variantId && detailsId ? {
            [variantId]: {
              ...prev[productId][variantId],
              [detailsId]: {
                ...prev[productId][variantId][detailsId],
                discountBulkPricing: [
                  ...(prev[productId][variantId][detailsId].discountBulkPricing || []),
                  { wholesalePrice: '', quantity: '' }
                ]
              }
            }
          } : {
            discountBulkPricing: [
              ...(prev[productId].discountBulkPricing || []),
              { wholesalePrice: '', quantity: '' }
            ]
          })
        }
      }));
    };

    const removeDiscountBulkPricingSection = (setLocal, productId, index, variantId = null, detailsId = null) => {
      setLocal(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          ...(variantId && detailsId ? {
            [variantId]: {
              ...prev[productId][variantId],
              [detailsId]: {
                ...prev[productId][variantId][detailsId],
                discountBulkPricing: prev[productId][variantId][detailsId].discountBulkPricing.filter((_, i) => i !== index)
              }
            }
          } : {
            discountBulkPricing: prev[productId].discountBulkPricing.filter((_, i) => i !== index)
          })
        }
      }));
    };

    const updateDiscountBulkPricing = (setLocal, productId, index, field, value, variantId = null, detailsId = null) => {
      setLocal(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          ...(variantId && detailsId ? {
            [variantId]: {
              ...prev[productId][variantId],
              [detailsId]: {
                ...prev[productId][variantId][detailsId],
                discountBulkPricing: prev[productId][variantId][detailsId].discountBulkPricing.map((item, i) => 
                  i === index ? { ...item, [field]: value } : item
                )
              }
            }
          } : {
            discountBulkPricing: prev[productId].discountBulkPricing.map((item, i) => 
              i === index ? { ...item, [field]: value } : item
            )
          })
        }
      }));
    };

    const getDiscountBulkPricingCount = (local, productId, variantId = null, detailsId = null) => {
      if (variantId && detailsId) {
        return local[productId]?.[variantId]?.[detailsId]?.discountBulkPricing?.length || 0;
      } else {
        return local[productId]?.discountBulkPricing?.length || 0;
      }
    };

    // Function that will update revised rate for single product
    const handleUpdateRevisedRate = async () => {
      setModalLoading(true);
      try {
        let dataToSend = {}
        if(product.hasVariants) {
          dataToSend = {
            productId: product._id,
            productData: stateVariableToReviseRateForSingleProductWithVariants
          }
        } else {
        dataToSend = {
          productId: product._id,
          updatedPrice: parseInt(revisedRateTextfield),
          discountStartDate,
          discountEndDate,
          discountPrice: parseInt(revisedRateTextfield),
          comeBackToOriginalPrice,
          discountBulkPricing: singleProductDiscountBulkPricing,
          productData: {}
        };
      }
        const res = await axios.post(
          'http://localhost:3000/api/product/revised-rate',
          dataToSend,
          { withCredentials: true }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success(`Rate revised successfully for ${product.name}`);
          setRevisedRateTextfield("");
          onClose();
        } else {
          toast.error("Failed to revise rate!");
        }
      } catch (error) {
        toast.error("Error revising rate: " + error.message);
      } finally {
        setModalLoading(false);
      }
    };

    // Function for updating multiple revised rates
    const handleUpdateMultipleStock = async (localMultipleForRevisedRate) => {
      setModalLoading(true);
      try{
        const res = await axios.post('http://localhost:3000/api/product/mass-revised-rate', localMultipleForRevisedRate, {
          withCredentials: true,
        });
        if(res.status === 200) {
          toast.success("Multiple product rates revised successfully!");
          onClose();
        } else {
          toast.error("Failed to revise rates!");
        }
      } catch(err) {
        toast.error("Error revising rates!");
        console.error(err);
      } finally {
        setModalLoading(false);
      }
    };

    if (selectedProducts.length > 0) {
      const [localMultipleForRevisedRate, setLocalMultipleForRevisedRate] = useState(multipleForRevisedRateInitial);
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Revised Rate - Multiple Products</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {Object.values(selectedProducts).map(product => {
                  return product.hasVariants ? 
                  (<div className="border border-gray-200 rounded-lg p-4" key={product._id}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Has Variants</p>
                      </div>
                    </div>
                    {product.variants.map(variant => {
                      return (<div key={variant._id} className="ml-4 space-y-4">
                        <h4 className="font-medium text-gray-800">Variant: {variant.colorName}</h4>
                        {variant.moreDetails.map(details => {
                          return (
                            <div key={details._id} className="bg-gray-50 p-4 rounded-lg space-y-3">
                              <p className="text-sm text-gray-600">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                              <p className="text-sm text-gray-600">Current price: {details.price}</p>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Discounted Price</label>
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter discounted price"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.[details.size._id] || ''} 
                                  onChange={(e) => {
                                    setLocalMultipleForRevisedRate(prev => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        [variant._id]: {
                                          ...prev[product._id][variant._id],
                                          [details._id]: {
                                            ...prev[product._id][variant._id][details._id],
                                            [details.size._id]: e.target.value,
                                            "discountPrice": e.target.value
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                  <input 
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["discountStartDate"] || ""}
                                    onChange={(e) => {
                                      setLocalMultipleForRevisedRate(prev => ({
                                        ...prev,
                                        [product._id]: {
                                          ...prev[product._id],
                                          [variant._id]: {
                                            ...prev[product._id][variant._id],
                                            [details._id]: {
                                              ...prev[product._id][variant._id][details._id],
                                              "discountStartDate": e.target.value
                                            }
                                          }
                                        }
                                      }));
                                    }}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                  <input 
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["discountEndDate"] || ""}
                                    onChange={(e) => {
                                      setLocalMultipleForRevisedRate(prev => ({
                                        ...prev,
                                        [product._id]: {
                                          ...prev[product._id],
                                          [variant._id]: {
                                            ...prev[product._id][variant._id],
                                            [details._id]: {
                                              ...prev[product._id][variant._id][details._id],
                                              "discountEndDate": e.target.value
                                            }
                                          }
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Return to Original Price?</label>
                                <select 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["comeBackToOriginalPrice"] || ""}
                                  onChange={(e) => {
                                    setLocalMultipleForRevisedRate(prev => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        [variant._id]: {
                                          ...prev[product._id][variant._id],
                                          [details._id]: {
                                            ...prev[product._id][variant._id][details._id],
                                            "comeBackToOriginalPrice": e.target.value
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                >
                                  <option value="">Select option</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>

                              <div className="bg-white p-3 rounded border">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-xs font-medium text-gray-700">
                                    Bulk Pricing ({getDiscountBulkPricingCount(localMultipleForRevisedRate, product._id, variant._id, details._id)} tiers)
                                  </h5>
                                  <button 
                                    onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, variant._id, details._id)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                  >
                                    Add Tier
                                  </button>
                                </div>
                                
                                {(localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.discountBulkPricing || []).map((pricing, index) => (
                                  <div key={index} className="flex gap-2 mb-2 p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <input 
                                        type="number"
                                        placeholder="Wholesale Price"
                                        className="w-full p-1 border rounded text-xs"
                                        value={pricing.wholesalePrice}
                                        onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'wholesalePrice', e.target.value, variant._id, details._id)}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <input 
                                        type="number"
                                        placeholder="Quantity"
                                        className="w-full p-1 border rounded text-xs"
                                        value={pricing.quantity}
                                        onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'quantity', e.target.value, variant._id, details._id)}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => removeDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, index, variant._id, details._id)}
                                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>)
                    })}
                  </div>) : 
                  (<div className="border border-gray-200 rounded-lg p-4" key={product._id}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Current Price: ${product.price}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price</label>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter discounted price"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={localMultipleForRevisedRate[product._id]?.['price'] || ''} 
                          onChange={(e) => {
                            setLocalMultipleForRevisedRate(prev => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                price: e.target.value,
                                discountPrice: e.target.value
                              }
                            }));
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input 
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={localMultipleForRevisedRate[product._id]?.["discountStartDate"] || ""}
                            onChange={(e) => {
                              setLocalMultipleForRevisedRate(prev => ({
                                ...prev,
                                [product._id]: {
                                  ...prev[product._id],
                                  "discountStartDate": e.target.value
                                }
                              }));
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input 
                            type="datetime-local"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={localMultipleForRevisedRate[product._id]?.["discountEndDate"] || ""}
                            onChange={(e) => {
                              setLocalMultipleForRevisedRate(prev => ({
                                ...prev,
                                [product._id]: {
                                  ...prev[product._id],
                                  "discountEndDate": e.target.value
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return to Original Price?</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={localMultipleForRevisedRate[product._id]?.["comeBackToOriginalPrice"] || ""}
                          onChange={(e) => {
                            setLocalMultipleForRevisedRate(prev => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                "comeBackToOriginalPrice": e.target.value
                              }
                            }));
                          }}
                        >
                          <option value="">Select option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm text-gray-700">
                            Bulk Pricing ({getDiscountBulkPricingCount(localMultipleForRevisedRate, product._id)} tiers)
                          </h4>
                          <button 
                            onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            Add Tier
                          </button>
                        </div>
                        
                        {(localMultipleForRevisedRate[product._id]?.discountBulkPricing || []).map((pricing, index) => (
                          <div key={index} className="flex gap-2 mb-2 p-2 bg-white rounded border">
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Wholesale Price</label>
                              <input 
                                type="number"
                                placeholder="e.g., 150"
                                className="w-full p-1 border rounded"
                                value={pricing.wholesalePrice}
                                onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'wholesalePrice', e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Quantity</label>
                              <input 
                                type="number"
                                placeholder="e.g., 10"
                                className="w-full p-1 border rounded"
                                value={pricing.quantity}
                                onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'quantity', e.target.value)}
                              />
                            </div>
                            <button 
                              onClick={() => removeDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, index)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs self-end hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>)
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateMultipleStock(localMultipleForRevisedRate)}
                disabled={modalLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {modalLoading ? "Updating..." : "Update Rates"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Revised Rate</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center text-gray-600">
              No Product Selected
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Revised Rate</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.hasVariants ? (
                <div>
                  {product.variants.map((variant) => {
                    return <div key={variant._id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">Variant: {variant.colorName}</p>
                        </div>
                      </div>
                      {variant.moreDetails.map((details) => {
                        return (<div key={details._id} className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <p className="text-sm text-gray-600">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                          <p className="text-sm text-gray-600">Current price: ${details.price}</p>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price</label>
                            <input 
                              name="discountPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter discounted price"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountPrice'] || ""} 
                              onChange={(e) => {
                                setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                  ...prev,
                                  [variant._id]: {
                                    ...prev[variant._id],
                                    [details._id]: {
                                      ...(prev[variant._id]?.[details._id] || {}),
                                      [e.target.name]: e.target.value
                                    }
                                  }
                                }))
                              }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                              <input 
                                type="datetime-local" 
                                name="discountStartDate"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountStartDate'] || ""} 
                                onChange={(e) => {
                                  setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                    ...prev,
                                    [variant._id]: {
                                      ...prev[variant._id],
                                      [details._id]: {
                                        ...(prev[variant._id]?.[details._id] || {}),
                                        [e.target.name]: e.target.value
                                      }
                                    }
                                  }))
                                }}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                              <input 
                                type="datetime-local" 
                                name="discountEndDate"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountEndDate'] || ""} 
                                onChange={(e) => {
                                  setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                    ...prev,
                                    [variant._id]: {
                                      ...prev[variant._id],
                                      [details._id]: {
                                        ...(prev[variant._id]?.[details._id] || {}),
                                        [e.target.name]: e.target.value
                                      }
                                    }
                                  }))
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Return to Original Price?</label>
                            <select 
                              name="comeBackToOriginalPrice"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['comeBackToOriginalPrice'] || ""} 
                              onChange={(e) => {
                                setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                  ...prev,
                                  [variant._id]: {
                                    ...prev[variant._id],
                                    [details._id]: {
                                      ...(prev[variant._id]?.[details._id] || {}),
                                      [e.target.name]: e.target.value
                                    }
                                  }
                                }))
                              }}
                            >
                              <option value="">Select option</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-sm">Bulk Pricing Tiers</h4>
                              <button onClick={() => {
                                setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                                  const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                                  
                                  return {
                                    ...prev,
                                    [variant._id]: {
                                      ...prev[variant._id],
                                      [details._id]: {
                                        ...(prev[variant._id]?.[details._id] || {}),
                                        bulkPricing: [
                                          ...currentBulkPricing,
                                          {
                                            id: Date.now() + Math.random(),
                                            wholesalePrice: "", 
                                            quantity: ""
                                          }
                                        ]
                                      }
                                    }
                                  };
                                });
                              }} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                                Add Tier
                              </button>
                            </div>
                            
                            {(() => {
                              const currentBulkPricing = stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.bulkPricing || [];
                              
                              return currentBulkPricing.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">No pricing tiers added</p>
                              ) : (
                                currentBulkPricing.map((tier, index) => {
                                  return (
                                    <div key={tier.id} className="flex gap-2 mb-2 p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-600">Wholesale Price</label>
                                        <input 
                                          type="number"
                                          placeholder="Price"
                                          className="w-full p-1 border rounded text-sm"
                                          value={tier.wholesalePrice} 
                                          onChange={(e) => {
                                            setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                                              const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                                              
                                              return {
                                                ...prev,
                                                [variant._id]: {
                                                  ...prev[variant._id],
                                                  [details._id]: {
                                                    ...(prev[variant._id]?.[details._id] || {}),
                                                    bulkPricing: currentBulkPricing.map(t => 
                                                      t.id === tier.id ? { ...t, wholesalePrice: e.target.value } : t
                                                    )
                                                  }
                                                }
                                              };
                                            });
                                          }} 
                                        />
                                      </div>

                                      <div className="flex-1">
                                        <label className="text-xs text-gray-600">Quantity</label>
                                        <input 
                                          type="number"
                                          placeholder="Qty"
                                          className="w-full p-1 border rounded text-sm"
                                          value={tier.quantity} 
                                          onChange={(e) => {
                                            setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                                              const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                                              
                                              return {
                                                ...prev,
                                                [variant._id]: {
                                                  ...prev[variant._id],
                                                  [details._id]: {
                                                    ...(prev[variant._id]?.[details._id] || {}),
                                                    bulkPricing: currentBulkPricing.map(t => 
                                                      t.id === tier.id ? { ...t, quantity: e.target.value } : t
                                                    )
                                                  }
                                                }
                                              };
                                            });
                                          }} 
                                        />
                                      </div>

                                      <button onClick={() => {
                                        setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                                          const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                                          
                                          return {
                                            ...prev,
                                            [variant._id]: {
                                              ...prev[variant._id],
                                              [details._id]: {
                                                ...(prev[variant._id]?.[details._id] || {}),
                                                bulkPricing: currentBulkPricing.filter(t => t.id !== tier.id)
                                              }
                                            }
                                          };
                                        });
                                      }} className="px-2 py-1 bg-red-500 text-white rounded text-xs self-end hover:bg-red-600 transition-colors">
                                        ×
                                      </button>
                                    </div>
                                  );
                                })
                              );
                            })()}
                          </div>
                        </div>)
                      })}
                    </div>
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">Current Price: ${product.price}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter discounted price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={revisedRateTextfield} 
                      onChange={(e) => setRevisedRateTextfield(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input 
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={discountStartDate || ""}
                        onChange={(e) => setDiscountStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input 
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={discountEndDate || ""}
                        onChange={(e) => setDiscountEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return to Original Price?</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={comeBackToOriginalPrice || ""}
                      onChange={(e) => setComeBackToOriginalPrice(e.target.value)}
                    >
                      <option value="">Select option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-sm">Bulk Pricing Tiers</h4>
                      <button onClick={() => {
                        setSingleProductDiscountBulkPricing(prev => [
                          ...prev,
                          {id: Date.now(), wholesalePrice: "", quantity: ""}
                        ]);
                      }} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                        Add Tier
                      </button>
                    </div>

                    {singleProductDiscountBulkPricing.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No pricing tiers added</p>
                    ) : (
                      singleProductDiscountBulkPricing.map((tier, index) => {
                        return (
                          <div key={tier.id} className="flex gap-2 mb-2 p-2 bg-white rounded border">
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Wholesale Price</label>
                              <input 
                                type="number"
                                placeholder="Price"
                                className="w-full p-1 border rounded"
                                value={tier.wholesalePrice} 
                                onChange={(e) => {
                                  setSingleProductDiscountBulkPricing(prev => 
                                    prev.map(t => 
                                      t.id === tier.id ? {...t, wholesalePrice: e.target.value} : t
                                    )
                                  )
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Quantity</label>
                              <input 
                                type="number"
                                placeholder="Qty"
                                className="w-full p-1 border rounded"
                                value={tier.quantity} 
                                onChange={(e) => {
                                  setSingleProductDiscountBulkPricing(prev => 
                                    prev.map(t => 
                                      t.id === tier.id ? {...t, quantity: e.target.value} : t
                                    )
                                  )
                                }}
                              />
                            </div>
                            <button onClick={() => {
                              setSingleProductDiscountBulkPricing(prev => 
                                prev.filter(t => t.id !== tier.id)
                              )
                            }} className="px-2 py-1 bg-red-500 text-white rounded text-xs self-end hover:bg-red-600 transition-colors">
                              ×
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRevisedRate}
              disabled={modalLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {modalLoading ? "Updating..." : "Revise Rate"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {isLoading && <LoadingOverlay />}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">Product Management</h1>
            <p className="text-blue-100 text-lg">Manage your product inventory and pricing with ease</p>
          </div>
        </div>

        {/* Professional Table Component */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Products Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Products
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                    <select 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="custom">Custom Date</option>
                      <option value="range">Date Range</option>
                    </select>
                  </div>

                  {dateFilter === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                      <input 
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {dateFilter === 'range' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) => setCustomDateRange(prev => ({...prev, start: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) => setCustomDateRange(prev => ({...prev, end: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort by Price</label>
                    <select 
                      value={priceSort}
                      onChange={(e) => setPriceSort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Sort</option>
                      <option value="low-high">Low to High</option>
                      <option value="high-low">High to Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort by Stock</label>
                    <select 
                      value={stockSort}
                      onChange={(e) => setStockSort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Sort</option>
                      <option value="low-high">Low to High</option>
                      <option value="high-low">High to Low</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">{selectedProducts.length} products selected</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowRevisedRateModal(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                    >
                      Add Revised Rate
                    </button>
                    <button
                      onClick={() => setShowRestockModal(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                    >
                      Restock
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors">
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedProducts.length === filteredData.length && filteredData.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr No.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color Variants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size Variants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  {selectedProducts.length === 0 && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedProducts.some(p => p._id === product._id)}
                        onChange={() => toggleCheckbox(product)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {product.hasVariants ? (
                        <button 
                          onClick={() => openViewStockModal(product)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Stock
                        </button>
                      ) : (
                        <span className="font-medium">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {product.hasVariants ? product.variants.length : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {getNumberOfSizeVariants(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {product.hasVariants ? (
                        <button 
                          onClick={() => openViewPriceModal(product)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Price
                        </button>
                      ) : (
                        <span className="font-medium">${product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    {selectedProducts.length === 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRevisedRateProduct(product);
                              setShowRevisedRateModal(true);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Revise Rate"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRestockProduct(product);
                              setShowRestockModal(true);
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                            title="Restock"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">entries per page</span>
              </div>

              {/* Pagination */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 7) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 4) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + index;
                    } else {
                      pageNumber = currentPage - 3 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRestockModal && (selectedProducts.length > 0 ? 
        <RestockModal selectedProducts={selectedProducts} multipleToRestockInitial={multipleProductsToRestock} onClose={() => setShowRestockModal(false)} /> : 
        <RestockModal product={restockProduct} onClose={() => setShowRestockModal(false)} />
      )}
      
      {showRevisedRateModal && (selectedProducts.length > 0 ? 
        <RevisedRateModal selectedProducts={selectedProducts} multipleForRevisedRateInitial={multipleProductsForRevisedRate} onClose={() => setShowRevisedRateModal(false)} /> : 
        <RevisedRateModal product={RevisedRateProduct} onClose={() => setShowRevisedRateModal(false)} />
      )}

      {/* View Stock Modal */}
      {showViewStockModal && (
        <ViewStockModal 
          product={selectedProductForView} 
          onClose={() => {
            setShowViewStockModal(false);
            setSelectedProductForView(null);
          }} 
        />
      )}

      {/* View Price Modal */}
      {showViewPriceModal && (
        <ViewPriceModal 
          product={selectedProductForView} 
          onClose={() => {
            setShowViewPriceModal(false);
            setSelectedProductForView(null);
          }} 
        />
      )}
    </div>
  );
}