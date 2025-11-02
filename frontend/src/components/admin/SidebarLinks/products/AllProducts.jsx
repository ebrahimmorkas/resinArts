import React, { useContext, useState, useEffect, useMemo } from "react";
import { Edit2, Trash2, X, AlertTriangle, Calendar, Clock, DollarSign, Check, Package, Search, Filter, Download, Eye, ChevronLeft, ChevronRight, Power, PowerOff, Loader2, Copy } from "lucide-react";
import { ProductContext } from '../../../../../Context/ProductContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { duplicateProducts } from "../../../../../utils/api";
import { fetchCategories } from "../../../../../utils/api";

export default function AdminProductsPage() {
  const { products, loading, error, setProducts, fetchProducts } = useContext(ProductContext);

  // State variables
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [restockProduct, setRestockProduct] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [multipleProductsToRestock, setMultipleProductsToRestock] = useState({});
  const [showRevisedRateModal, setShowRevisedRateModal] = useState(false);
  const [multipleProductsForRevisedRate, setMultipleProductsForRevisedRate] = useState({});
  const [revisedRateProduct, setRevisedRateProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [priceSort, setPriceSort] = useState('');
  const [stockSort, setStockSort] = useState('');
  const [showViewStockModal, setShowViewStockModal] = useState(false);
  const [showViewPriceModal, setShowViewPriceModal] = useState(false);
  const [selectedProductForView, setSelectedProductForView] = useState(null);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  // const [showEditModal, setShowEditModal] = useState(false);
  // const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState({ type: 'general', message: '' });
  const [showStatusModal, setShowStatusModal] = useState(false);
const [statusModalData, setStatusModalData] = useState({ productId: null, isActive: false, productName: '' });
const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
const [bulkStatusAction, setBulkStatusAction] = useState(null);
const [showViewVariantsModal, setShowViewVariantsModal] = useState(false);
const [allCategoriesTree, setAllCategoriesTree] = useState([]);
const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
const [categoryFilterPath, setCategoryFilterPath] = useState("");
const [showExportModal, setShowExportModal] = useState(false);
const [exportingImages, setExportingImages] = useState(false);
  const navigate = useNavigate();
  

  // Effects
  useEffect(() => {
    const newMultipleProductsToRestock = {};
    selectedProducts.forEach(product => {
      newMultipleProductsToRestock[product._id] = {};
      if (product.hasVariants) {
        product.variants.forEach(variant => {
          newMultipleProductsToRestock[product._id][variant._id] = {};
          variant.moreDetails.forEach(details => {
            newMultipleProductsToRestock[product._id][variant._id][details._id] = {};
            newMultipleProductsToRestock[product._id][variant._id][details._id][details.size._id] = "";
          });
        });
      } else {
        newMultipleProductsToRestock[product._id]['stock'] = "";
      }
    });
    setMultipleProductsToRestock(newMultipleProductsToRestock);

    const newMultipleProductsForRevisedRate = {};
    selectedProducts.forEach(product => {
      newMultipleProductsForRevisedRate[product._id] = {};
      if (product.hasVariants) {
        product.variants.forEach(variant => {
          newMultipleProductsForRevisedRate[product._id][variant._id] = {};
          variant.moreDetails.forEach(details => {
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id] = {};
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id][details.size._id] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountStartDate"] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountEndDate"] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountPrice"] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["comeBackToOriginalPrice"] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountBulkPricing"] = [];
          });
        });
      } else {
        newMultipleProductsForRevisedRate[product._id]['price'] = "";
        newMultipleProductsForRevisedRate[product._id]["discountStartDate"] = "";
        newMultipleProductsForRevisedRate[product._id]["discountEndDate"] = "";
        newMultipleProductsForRevisedRate[product._id]["discountPrice"] = "";
        newMultipleProductsForRevisedRate[product._id]["comeBackToOriginalPrice"] = "";
        newMultipleProductsForRevisedRate[product._id]["discountBulkPricing"] = [];
      }
    });
    setMultipleProductsForRevisedRate(newMultipleProductsForRevisedRate);
  }, [selectedProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Fetch all products when admin panel mounts
useEffect(() => {
  const fetchAllAdminProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/product/all?all=true', { 
        withCredentials: true 
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Failed to fetch admin products:", error);
    }
  };
  
  fetchAllAdminProducts();
}, []); // Empty dependency array - run only once on mount

  // Fetch categories on component mount
useEffect(() => {
  const getCategories = async () => {
    try {
      const categories = await fetchCategories();
      setAllCategoriesTree(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories");
    }
  };
  getCategories();
}, []);

// Update category path based on selections
useEffect(() => {
  if (selectedCategoryIds.length === 0) {
    setCategoryFilterPath("");
    return;
  }
  
  const buildPath = (categoryId, tree) => {
    for (const cat of tree) {
      if (cat._id === categoryId) {
        return cat.categoryName;
      }
      if (cat.subcategories && cat.subcategories.length > 0) {
        const subPath = buildPath(categoryId, cat.subcategories);
        if (subPath) {
          return `${cat.categoryName} > ${subPath}`;
        }
      }
    }
    return null;
  };
  
  const lastSelectedId = selectedCategoryIds[selectedCategoryIds.length - 1];
  const path = buildPath(lastSelectedId, allCategoriesTree);
  setCategoryFilterPath(path || "");
}, [selectedCategoryIds, allCategoriesTree]);

// Helper function to find category in tree
const findCategoryInTree = (categoryId, categories) => {
  for (const cat of categories) {
    if (cat._id === categoryId) {
      return cat;
    }
    if (cat.subcategories && cat.subcategories.length > 0) {
      const found = findCategoryInTree(categoryId, cat.subcategories);
      if (found) return found;
    }
  }
  return null;
};

// Handle category selection
const handleCategorySelect = (level, categoryId) => {
  if (!categoryId) {
    // If clearing, remove this level and all subsequent levels
    setSelectedCategoryIds(selectedCategoryIds.slice(0, level));
  } else {
    // Update selection at this level
    const newSelectedIds = [...selectedCategoryIds.slice(0, level), categoryId];
    setSelectedCategoryIds(newSelectedIds);
  }
};

// Handle category path click to navigate back
const handleCategoryPathClick = (index) => {
  setSelectedCategoryIds(selectedCategoryIds.slice(0, index + 1));
};

// Clear all category filters
const clearCategoryFilter = () => {
  setSelectedCategoryIds([]);
  setCategoryFilterPath("");
};

  // Helper functions
  const openViewVariantsModal = (product) => {
  setSelectedProductForView(product);
  setShowViewVariantsModal(true);
};

  const doesProductExist = (product) => {
    return products.some((prod) => prod._id === product._id);
  };

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

  const getNumberOfSizeVariants = (product) => {
    const sizeLength = product.variants.map((variant) => variant.moreDetails.length);
    return sizeLength.reduce((sum, current) => sum + current, 0);
  };

  const toggleCheckbox = (product) => {
    setSelectedProducts((prev) =>
      prev.some((prod) => prod._id === product._id)
        ? prev.filter((prod) => prod._id !== product._id)
        : [...prev, product]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredData.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredData);
    }
  };  

  // Handle single product status toggle
const handleToggleStatus = (productId, newStatus) => {
  const product = products.find(p => p._id === productId);
  setStatusModalData({
    productId,
    isActive: newStatus,
    productName: product?.name || 'Unknown Product'
  });
  setShowStatusModal(true);
};

// Confirm single status change
const confirmStatusChange = async () => {
  setIsLoading(true);
  try {
    const res = await axios.post(
      'http://localhost:3000/api/product/toggle-status',
      {
        productId: statusModalData.productId,
        isActive: statusModalData.isActive
      },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === statusModalData.productId
            ? { ...p, isActive: statusModalData.isActive }
            : p
        )
      );
    }
  } catch (error) {
    console.error('Error toggling product status:', error);
    const errorMsg = error.response?.data?.message || 'Failed to update product status';
    toast.error(errorMsg);
  } finally {
    setIsLoading(false);
    setShowStatusModal(false);
  }
};

// Handle bulk status toggle
const handleBulkStatusToggle = (activate) => {
  if (selectedProducts.length === 0) {
    toast.warning('Please select products first');
    return;
  }
  setBulkStatusAction(activate);
  setShowBulkStatusModal(true);
};

// Confirm bulk status change
const confirmBulkStatusChange = async () => {
  setIsLoading(true);
  try {
    const productIds = selectedProducts.map(p => p._id);
    const res = await axios.post(
      'http://localhost:3000/api/product/bulk-toggle-status',
      {
        productIds,
        isActive: bulkStatusAction
      },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          productIds.includes(p._id) ? { ...p, isActive: bulkStatusAction } : p
        )
      );
      setSelectedProducts([]);
    }
  } catch (error) {
    console.error('Error bulk toggling status:', error);
    toast.error(error.response?.data?.message || 'Failed to update products');
  } finally {
    setIsLoading(false);
    setShowBulkStatusModal(false);
  }
};

  const exportToExcel = () => {
  setShowExportModal(true);
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openViewStockModal = (product) => {
    setSelectedProductForView(product);
    setShowViewStockModal(true);
  };

  const openViewPriceModal = (product) => {
    setSelectedProductForView(product);
    setShowViewPriceModal(true);
  };

  const openViewDetailsModal = (product) => {
    setSelectedProductForView(product);
    setShowViewDetailsModal(true);
  };

  const openEditModal = (product) => {
  navigate(`/admin/panel/products/edit/${product._id}`);
};

  const openDeleteModal = (product) => {
    setSelectedProductForDelete(product);
    setShowDeleteModal(true);
  };

const handleDelete = async () => {
  if (!selectedProductForDelete) return;
  setIsLoading(true);
  try {
    const res = await axios.delete(`http://localhost:3000/api/product/delete-product/${selectedProductForDelete._id}`, {
      withCredentials: true
    });
    if (res.status === 200) {
      toast.success('Product deleted successfully!');
      setSelectedProducts(prev => prev.filter(p => p._id !== selectedProductForDelete._id));
      setProducts(prevProducts => prevProducts.filter(p => p._id !== selectedProductForDelete._id));
    }
  } catch (error) {
    console.error("Delete error:", error);
    const errorMessage = error.response?.data?.message || 'Failed to delete product!';
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
    setShowDeleteModal(false);
    setSelectedProductForDelete(null);
  }
};

const handleDeleteSelected = async () => {
  if (selectedProducts.length === 0) return;
  setIsLoading(true);
  try {
    const deletePromises = selectedProducts.map(product => 
      axios.delete(`http://localhost:3000/api/product/delete-product/${product._id}`, {
        withCredentials: true
      })
    );
    await Promise.all(deletePromises);
    toast.success(`${selectedProducts.length} products deleted successfully!`);
    setProducts(prevProducts => prevProducts.filter(p => !selectedProducts.some(sp => sp._id === p._id)));
    setSelectedProducts([]);
  } catch (error) {
    console.error("Delete selected error:", error);
    const errorMessage = error.response?.data?.message || 'Failed to delete selected products!';
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
    setShowDeleteModal(false);
    setSelectedProductForDelete(null);
  }
};

// Function that will duplicate products
const handleDuplicateProduct = async (product) => {
  setIsLoading(true);
  try {
    const res = await duplicateProducts([product._id]);
    if (res.products && res.products.length > 0) {
      toast.success(`Product duplicated successfully as "${res.products[0].name}"!`);
      setProducts(prevProducts => [...prevProducts, ...res.products]);
    }
  } catch (error) {
    console.error("Duplicate error:", error);
    toast.error(`Failed to duplicate product: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

const handleDuplicateSelected = async () => {
  if (selectedProducts.length === 0) return;
  setIsLoading(true);
  try {
    const productIds = selectedProducts.map(p => p._id);
    const res = await duplicateProducts(productIds);
    toast.success(`${res.products.length} products duplicated successfully!`);
    setProducts(prevProducts => [...prevProducts, ...res.products]);
    setSelectedProducts([]);
  } catch (error) {
    console.error("Duplicate selected error:", error);
    toast.error(`Failed to duplicate products: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

  // Filtered data
  const filteredData = useMemo(() => {
    let filtered = products.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

     if (selectedCategoryIds.length > 0) {
    const lastSelectedId = selectedCategoryIds[selectedCategoryIds.length - 1];
    filtered = filtered.filter(item => {
      // Check if product's subCategory matches the selected category or any of its descendants
      if (item.subCategory === lastSelectedId) {
        return true;
      }
      // Check if the product's category path includes the selected category
      if (item.categoryPath && categoryFilterPath) {
        return item.categoryPath.includes(categoryFilterPath);
      }
      return false;
    });
  }

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
    } else if (stockSort === 'out-of-stock') {
      filtered = filtered.filter(item => {
        if (!item.hasVariants) {
          return item.stock === 0;
        } else {
          return item.variants.every(variant =>
            variant.moreDetails.every(detail => (detail.stock || 0) === 0)
          );
        }
      });
    }

    return filtered;
  }, [products, searchTerm, selectedCategoryIds, categoryFilterPath, dateFilter, customDate, customDateRange, priceSort, stockSort]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Inner Components

  // Coponent that will be shown when clicked on 'view variants' button specialy design for acivating and deactivating the variants of the products
const ViewVariantsModal = ({ product, onClose }) => {
  const [toggleLoading, setToggleLoading] = useState({});

  const handleToggleVariantStatus = async (variantId, currentStatus) => {
  setToggleLoading({ [`variant-${variantId}`]: true });
  try {
    const res = await axios.post(
      'http://localhost:3000/api/product/toggle-variant-size-status',
      {
        productId: product._id,
        variantId: variantId,
        isActive: !currentStatus,
      },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === product._id
            ? {
                ...p,
                variants: p.variants.map(v =>
                  v._id === variantId ? { ...v, isActive: !currentStatus } : v
                )
              }
            : p
        )
      );
    }
  } catch (error) {
    console.error('Error toggling variant:', error);
    const errorMsg = error.response?.data?.message || 'Failed to toggle variant status';
    toast.error(errorMsg);
  } finally {
    setToggleLoading({ [`variant-${variantId}`]: false });
  }
};

  const handleToggleSizeStatus = async (variantId, sizeId, currentStatus, variantIsActive) => {
    if (!variantIsActive && !currentStatus) {
      toast.error('Cannot activate size because the variant is deactivated');
      return;
    }

    setToggleLoading({ [`size-${variantId}-${sizeId}`]: true });
    try {
      const res = await axios.post(
        'http://localhost:3000/api/product/toggle-variant-size-status',
        {
          productId: product._id,
          variantId: variantId,
          sizeId: sizeId,
          isActive: !currentStatus,
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
        window.location.reload(); // Consider replacing with context update
      }
    } catch (error) {
      console.error('Error toggling size:', error);
      const errorMsg = error.response?.data?.message || 'Failed to toggle size status';
      toast.error(errorMsg);
    } finally {
      setToggleLoading({ [`size-${variantId}-${sizeId}`]: false });
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Variants - {product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {product.hasVariants && product.variants?.length > 0 ? (
              product.variants.map(variant => {
                const variantId = typeof variant._id === 'object' ? variant._id.$oid : variant._id;
                const isVariantActive = variant.isActive !== false;

                return (
                  <div key={variantId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={variant.variantImage || getImageUrl(product)}
                        alt={variant.colorName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{variant.colorName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Variant</p>
                      </div>
                      <button
                        onClick={() => handleToggleVariantStatus(variantId, isVariantActive)}
                        disabled={toggleLoading[`variant-${variantId}`]}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isVariantActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:text-white'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:text-white'
                        } disabled:opacity-50`}
                      >
                        {toggleLoading[`variant-${variantId}`] ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : isVariantActive ? (
                          <>
                            <Power className="w-3 h-3 mr-1 dark:text-white"/>
                            Active
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3 h-3 mr-1 dark:text-white" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>
                    <div className="ml-20 space-y-2">
                      {variant.moreDetails && variant.moreDetails.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-400">Sizes</h4>
                          <div className="mt-2 space-y-2">
                            {variant.moreDetails.map(details => {
                              const sizeId = typeof details._id === 'object' ? details._id.$oid : details._id;
                              const isSizeActive = isVariantActive && details.isActive !== false;

                              return (
                                <div
                                  key={sizeId}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-white">
                                      {details.size?.length}" × {details.size?.breadth}" × {details.size?.height}"
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-white">
                                      Stock: {details.stock || 0}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleToggleSizeStatus(variantId, sizeId, isSizeActive, isVariantActive)
                                    }
                                    disabled={toggleLoading[`size-${variantId}-${sizeId}`]}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                      isSizeActive
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:text-white'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200 dark:text-white'
                                    } disabled:opacity-50`}
                                  >
                                    {toggleLoading[`size-${variantId}-${sizeId}`] ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin dark:text-white" />
                                    ) : isSizeActive ? (
                                      <>
                                        <Power className="w-3 h-3 mr-1 dark:text-white" />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <PowerOff className="w-3 h-3 mr-1 dark:text-white" />
                                        Inactive
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No sizes available for this variant.</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">No variants available for this product.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModal = () => {
  if (!showExportModal) return null;

  const handleExportWithoutImages = async () => {
    setShowExportModal(false);
    await generateExcel(false);
  };

  const handleExportWithImages = async () => {
    setShowExportModal(false);
    setExportingImages(true);
    try {
      await generateExcelAndZip();
    } finally {
      setExportingImages(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Products</h3>
            </div>
            <button 
              onClick={() => setShowExportModal(false)} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Would you like to download product images along with the Excel file?
          </p>
          
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-white mb-1">With Images (ZIP)</h4>
              <p className="text-xs text-blue-700 dark:text-gray-400">
                Downloads Excel + all product images organized in folders
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Excel Only</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Downloads only the Excel file with image links
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleExportWithoutImages}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Excel Only
            </button>
            <button 
              onClick={handleExportWithImages}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-black dark:text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Download with Images (ZIP)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const generateExcel = async (includeImageLinks = true) => {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  // Define columns
  const columns = [
    { header: 'Sr No', key: 'srNo', width: 8 },
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Variant/Color', key: 'variant', width: 20 },
    { header: 'Size (L×B×H)', key: 'size', width: 15 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Created Date', key: 'createdDate', width: 15 }
  ];

  if (includeImageLinks) {
    columns.push({ header: 'Main Image', key: 'mainImage', width: 60 });
    columns.push({ header: 'Additional Images', key: 'additionalImages', width: 80 });
  }

  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 11 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

  let srNo = 1;

  products.forEach((product) => {
    if (product.hasVariants) {
      // Product with variants - one row per variant-size combination
      product.variants.forEach((variant) => {
        variant.moreDetails.forEach((detail) => {
          const row = {
            srNo: srNo++,
            productName: product.name,
            category: product.categoryPath || product.category,
            variant: variant.colorName,
            size: `${detail.size.length}×${detail.size.breadth}×${detail.size.height} ${detail.size.unit}`,
            stock: detail.stock || 0,
            price: detail.discountPrice || detail.price,
            createdDate: new Date(product.createdAt).toLocaleDateString()
          };

          const rowIndex = worksheet.addRow(row).number;

          if (includeImageLinks) {
            // Main Image (Variant Image)
            if (variant.variantImage) {
              worksheet.getCell(rowIndex, 9).value = {
                text: 'View Image',
                hyperlink: variant.variantImage
              };
              worksheet.getCell(rowIndex, 9).font = { color: { argb: 'FF0000FF' }, underline: true };
            }

            // Additional Images for this size
            if (detail.additionalImages && detail.additionalImages.length > 0) {
              const imageLinks = detail.additionalImages.map((img, idx) => 
                `Image ${idx + 1}: ${img}`
              ).join('\n');
              worksheet.getCell(rowIndex, 10).value = imageLinks;
              worksheet.getCell(rowIndex, 10).alignment = { wrapText: true, vertical: 'top' };
            }
          }
        });
      });
    } else {
      // Product without variants - main product row
      const row = {
        srNo: srNo++,
        productName: product.name,
        category: product.categoryPath || product.category,
        variant: 'N/A',
        size: 'N/A',
        stock: product.stock,
        price: product.discountPrice || product.price,
        createdDate: new Date(product.createdAt).toLocaleDateString()
      };

      const rowIndex = worksheet.addRow(row).number;

      if (includeImageLinks) {
        // Main Image
        if (product.image) {
          worksheet.getCell(rowIndex, 9).value = {
            text: 'View Image',
            hyperlink: product.image
          };
          worksheet.getCell(rowIndex, 9).font = { color: { argb: 'FF0000FF' }, underline: true };
        }

        // Additional Images
        if (product.additionalImages && product.additionalImages.length > 0) {
          const imageLinks = product.additionalImages.map((img, idx) => 
            `Image ${idx + 1}: ${img}`
          ).join('\n');
          worksheet.getCell(rowIndex, 10).value = imageLinks;
          worksheet.getCell(rowIndex, 10).alignment = { wrapText: true, vertical: 'top' };
        }
      }

      // Additional rows for additional images if product has no variants
      if (includeImageLinks && product.additionalImages && product.additionalImages.length > 0) {
        product.additionalImages.forEach((imgUrl, idx) => {
          const additionalRow = {
            srNo: '',
            productName: `${product.name} - Additional Image ${idx + 1}`,
            category: product.categoryPath || product.category,
            variant: 'N/A',
            size: 'N/A',
            stock: '',
            price: '',
            createdDate: ''
          };

          const additionalRowIndex = worksheet.addRow(additionalRow).number;
          worksheet.getCell(additionalRowIndex, 9).value = {
            text: 'View Image',
            hyperlink: imgUrl
          };
          worksheet.getCell(additionalRowIndex, 9).font = { color: { argb: 'FF0000FF' }, underline: true };
        });
      }
    }
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  if (!includeImageLinks) {
    // Save Excel only
    const FileSaver = await import('file-saver');
    FileSaver.saveAs(blob, 'products_export.xlsx');
    toast.success('Excel file downloaded successfully!');
  }
  
  return blob;
};

const generateExcelAndZip = async () => {
  try {
    const JSZip = (await import('jszip')).default;
    const FileSaver = await import('file-saver');
    const zip = new JSZip();

    // Add Excel file
    const excelBlob = await generateExcel(true);
    zip.file('products_export.xlsx', excelBlob);

    // Create images folder
    const imagesFolder = zip.folder('images');

    // Helper function to sanitize filenames
    const sanitizeFilename = (name) => {
      return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    };

    // Helper function to fetch image as blob
    const fetchImageBlob = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        return await response.blob();
      } catch (error) {
        console.error(`Error fetching image ${url}:`, error);
        return null;
      }
    };

    // Helper function to get file extension from URL
    const getExtension = (url) => {
      const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
      return match ? match[1] : 'jpg';
    };

    // Process all products
    for (const product of products) {
      const productName = sanitizeFilename(product.name);

      if (product.hasVariants) {
        // Create product folder
        const productFolder = imagesFolder.folder(productName);

        for (const variant of product.variants) {
          const variantName = sanitizeFilename(variant.colorName);
          const variantFolder = productFolder.folder(variantName);

          // Add variant main image
          if (variant.variantImage) {
            const blob = await fetchImageBlob(variant.variantImage);
            if (blob) {
              const ext = getExtension(variant.variantImage);
              variantFolder.file(`variant_main.${ext}`, blob);
            }
          }

          // Add size-specific images
          for (let sizeIdx = 0; sizeIdx < variant.moreDetails.length; sizeIdx++) {
            const detail = variant.moreDetails[sizeIdx];
            const sizeStr = `${detail.size.length}x${detail.size.breadth}x${detail.size.height}`;
            const sizeName = sanitizeFilename(sizeStr);

            if (detail.additionalImages && detail.additionalImages.length > 0) {
              const sizeFolder = variantFolder.folder(`size_${sizeName}`);
              
              for (let imgIdx = 0; imgIdx < detail.additionalImages.length; imgIdx++) {
                const imgUrl = detail.additionalImages[imgIdx];
                const blob = await fetchImageBlob(imgUrl);
                if (blob) {
                  const ext = getExtension(imgUrl);
                  sizeFolder.file(`image_${imgIdx + 1}.${ext}`, blob);
                }
              }
            }
          }
        }
      } else {
        // Product without variants
        const productFolder = imagesFolder.folder(productName);

        // Add main image
        if (product.image) {
          const blob = await fetchImageBlob(product.image);
          if (blob) {
            const ext = getExtension(product.image);
            productFolder.file(`main.${ext}`, blob);
          }
        }

        // Add additional images
        if (product.additionalImages && product.additionalImages.length > 0) {
          for (let idx = 0; idx < product.additionalImages.length; idx++) {
            const imgUrl = product.additionalImages[idx];
            const blob = await fetchImageBlob(imgUrl);
            if (blob) {
              const ext = getExtension(imgUrl);
              productFolder.file(`additional_${idx + 1}.${ext}`, blob);
            }
          }
        }
      }
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    FileSaver.saveAs(zipBlob, 'products_export_with_images.zip');
    toast.success('ZIP file with images downloaded successfully!');
  } catch (error) {
    console.error('Error generating ZIP:', error);
    toast.error('Failed to generate ZIP file with images');
  }
};
  
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Processing...</p>
      </div>
    </div>
  );

  const ErrorModal = () => {
    if (!showErrorModal) return null;

    const errorTypes = {
      general: {
        title: 'Something went wrong',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        primaryButton: { text: 'Try Again', color: 'bg-red-600 hover:bg-red-700' },
        secondaryButton: { text: 'Cancel', color: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800' }
      },
      network: {
        title: 'Network Connection Error',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        primaryButton: { text: 'Retry Connection', color: 'bg-orange-600 hover:bg-orange-700' },
        secondaryButton: { text: 'Cancel', color: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800' }
      }
    };

    const currentError = errorTypes[errorDetails.type] || errorTypes.general;
    const IconComponent = currentError.icon;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-10 h-10 ${currentError.iconBg} rounded-full flex items-center justify-center mr-3`}>
                    <IconComponent className={`w-6 h-6 ${currentError.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentError.title}</h3>
                </div>
                <button onClick={() => setShowErrorModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{errorDetails.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button onClick={() => setShowErrorModal(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                  {currentError.secondaryButton.text}
                </button>
                <button onClick={() => setShowErrorModal(false)} className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 rounded-md transition-colors ${currentError.primaryButton.color}`}>
                  {currentError.primaryButton.text}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

const DeleteConfirmationModal = () => {
  if (!showDeleteModal) return null;

  const isMultipleDelete = selectedProducts.length > 0;
  const productToDelete = isMultipleDelete ? null : selectedProductForDelete;
  
  if (!isMultipleDelete && !productToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-lg relative z-10">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isMultipleDelete ? 'Delete Selected Products' : 'Delete Product'}
              </h3>
            </div>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isMultipleDelete ? (
                <>Are you sure you want to delete <span className="font-semibold">{selectedProducts.length} selected products</span>?</>
              ) : (
                <>Are you sure you want to delete "<span className="font-semibold">{productToDelete.name}</span>"?</>
              )}
              {" "}This action cannot be undone and will permanently remove the product(s) from your inventory.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <strong>Warning:</strong> This will also remove all associated data including variants, pricing, and stock information.
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProductForDelete(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:text-white"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={isMultipleDelete ? handleDeleteSelected : handleDelete}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : `Delete ${isMultipleDelete ? 'Selected' : 'Product'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  const ViewDetailsModal = ({ product, onClose }) => {
    if (!product) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Product Details - {product.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Product Name</label>
                    <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{product.categoryPath || product.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(product.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Has Variants</label>
                    <p className="mt-1 text-sm text-gray-900">{product.hasVariants ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Main Product Image */}
              {product.image && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Product Image</h3>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full max-w-md h-64 object-cover rounded-lg shadow-md mx-auto"
                  />
                </div>
              )}

              {/* Product Details/Specifications */}
              {product.productDetails && product.productDetails.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.productDetails.map((detail, index) => (
                      <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                        <label className="text-sm font-medium text-gray-700">{detail.key}</label>
                        <p className="mt-1 text-sm text-gray-900">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-Variant Product Info */}
              {!product.hasVariants && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium">Price</p>
                      <p className="text-2xl font-bold text-blue-900">₹{product.price}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600 font-medium">Stock</p>
                      <p className="text-2xl font-bold text-green-900">{product.stock}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-600 font-medium">Bulk Pricing Tiers</p>
                      <p className="text-2xl font-bold text-purple-900">{product.bulkPricing?.length || 0}</p>
                    </div>
                  </div>

                  {/* Bulk Pricing */}
                  {product.bulkPricing && product.bulkPricing.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Pricing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.bulkPricing.map((bulk, index) => (
                          <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {bulk.quantity}+</p>
                            <p className="text-lg font-semibold text-green-600">₹{bulk.wholesalePrice}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Images for Non-Variant Products */}
                  {product.additionalImages && product.additionalImages.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {product.additionalImages.map((image, index) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`Additional ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Variants Information */}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Product Variants ({product.variants.length})</h3>
                  {product.variants.map((variant, variantIndex) => (
                    <div key={variant._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {variant.variantImage && (
                          <img 
                            src={variant.variantImage} 
                            alt={variant.colorName} 
                            className="w-20 h-20 rounded-lg object-cover border"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {variant.colorName}
                            {variant.isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Default
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Price: {variant.isPriceSame === 'yes' ? 'Same for all sizes' : 'Varies by size'}</span>
                            <span>Stock: {variant.isStockSame === 'yes' ? 'Same for all sizes' : 'Varies by size'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Variant Optional Details */}
                      {variant.optionalDetails && variant.optionalDetails.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h5 className="font-medium -800 dark:text-gray-100 mb-2">Variant Specifications</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {variant.optionalDetails.map((detail, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium text-gray-700">{detail.key}:</span>
                                <span className="text-gray-600 dark:text-gray-400 ml-1">{detail.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Price and Stock (if same for all sizes) */}
                      {(variant.isPriceSame === 'yes' || variant.moreDetails?.length === 1) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-blue-600 font-medium">Common Price</p>
                            <p className="text-lg font-bold text-blue-900">₹{variant.commonPrice}</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-green-600 font-medium">Common Stock</p>
                            <p className="text-lg font-bold text-green-900">{variant.commonStock}</p>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                            <p className="text-xs text-purple-600 font-medium">Bulk Pricing</p>
                            <p className="text-lg font-bold text-purple-900">{variant.commonBulkPricingCombinations?.length || 0}</p>
                          </div>
                        </div>
                      )}

                      {/* Size Configurations */}
                      {variant.moreDetails && variant.moreDetails.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="font-medium -800 dark:text-gray-100">Size Configurations ({variant.moreDetails.length})</h5>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {variant.moreDetails.map((detail, detailIndex) => (
                              <div key={detail._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium -800 dark:text-gray-100">
                                      Size: {detail.size?.length}" × {detail.size?.breadth}" × {detail.size?.height}"
                                    </p>
                                    <p className="text-sm text-gray-500">Weight: {detail.size?.weight}kg</p>
                                  </div>
                                  <div className="text-right">
                                    {variant.isPriceSame === 'no' && variant.moreDetails.length > 1 && (
                                      <p className="text-lg font-bold text-blue-600">₹{detail.price}</p>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Stock: {detail.stock || 0}</p>
                                  </div>
                                </div>

                                {/* Size-specific Optional Details */}
                                {detail.optionalDetails && detail.optionalDetails.length > 0 && (
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Size Details</p>
                                    <div className="space-y-1">
                                      {detail.optionalDetails.map((od, idx) => (
                                        <div key={idx} className="text-xs">
                                          <span className="font-medium text-gray-600 dark:text-gray-400">{od.key}:</span>
                                          <span className="text-gray-500 ml-1">{od.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Size-specific Bulk Pricing */}
                                {variant.isPriceSame === 'no' && detail.bulkPricingCombinations && detail.bulkPricingCombinations.length > 0 && (
                                  <div className="bg-purple-50 rounded p-3">
                                    <p className="text-xs font-medium text-purple-700 mb-2">Bulk Pricing</p>
                                    <div className="space-y-1">
                                      {detail.bulkPricingCombinations.map((bulk, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-purple-600">{bulk.quantity}+ items:</span>
                                          <span className="font-medium text-purple-800">₹{bulk.wholesalePrice}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Additional Images for this size */}
                                {detail.additionalImages && detail.additionalImages.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 mb-2">Size Images</p>
                                    <div className="flex gap-2 overflow-x-auto">
                                      {detail.additionalImages.map((image, imgIndex) => (
                                        <img 
                                          key={imgIndex}
                                          src={image} 
                                          alt={`Size ${detailIndex + 1} Image ${imgIndex + 1}`} 
                                          className="w-16 h-16 object-cover rounded border flex-shrink-0"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Bulk Pricing Combinations */}
                      {(variant.isPriceSame === 'yes' || variant.moreDetails?.length === 1) && variant.commonBulkPricingCombinations && variant.commonBulkPricingCombinations.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h5 className="font-medium text-purple-800 mb-3">Common Bulk Pricing</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {variant.commonBulkPricingCombinations.map((bulk, index) => (
                              <div key={index} className="bg-white dark:bg-gray-900 p-3 rounded border">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {bulk.quantity}+</p>
                                <p className="text-lg font-semibold text-purple-600">₹{bulk.wholesalePrice}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // const EditModal = ({ product, onClose }) => {
  //   if (!product) return null;

  //   return (
  //     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  //       <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
  //         <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
  //           <h2 className="text-xl font-semibold text-gray-900">Edit Product - {product.name}</h2>
  //           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
  //             <X className="w-5 h-5" />
  //           </button>
  //         </div>
  //         <div className="p-6 overflow-y-auto flex-1">
  //           <div className="text-center py-8">
  //             <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  //             <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Product Form</h3>
  //             <p className="text-gray-600 dark:text-gray-400">
  //               The edit functionality will be implemented with the same form structure as AddProduct.jsx
  //               with all current values pre-filled for editing.
  //             </p>
  //             <div className="mt-6 space-y-2 text-sm text-gray-500">
  //               <p>• Product Name: {product.name}</p>
  //               <p>• Category: {product.categoryPath || product.category}</p>
  //               <p>• Has Variants: {product.hasVariants ? 'Yes' : 'No'}</p>
  //               <p>• Created: {formatDate(product.createdAt)}</p>
  //             </div>
  //           </div>
  //         </div>
  //         <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
  //           <button
  //             onClick={onClose}
  //             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-gray-800 transition-colors"
  //           >
  //             Cancel
  //           </button>
  //           <button
  //             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
  //             onClick={() => {
  //               toast.info('Edit functionality will be implemented with full form');
  //               onClose();
  //             }}
  //           >
  //             Save Changes
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const ViewStockModal = ({ product, onClose }) => {
  const [toggleLoading, setToggleLoading] = useState({});

  const handleToggleVariantStatus = async (variantId, currentStatus) => {
    setToggleLoading({ [`variant-${variantId}`]: true });
    try {
      const res = await axios.post(
        'http://localhost:3000/api/product/toggle-variant-size-status',
        {
          productId: product._id,
          variantId: variantId,
          isActive: !currentStatus
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling variant:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle variant');
    } finally {
      setToggleLoading({ [`variant-${variantId}`]: false });
    }
  };

  const handleToggleSizeStatus = async (variantId, sizeId, currentStatus) => {
    setToggleLoading({ [`size-${sizeId}`]: true });
    try {
      const res = await axios.post(
        'http://localhost:3000/api/product/toggle-variant-size-status',
        {
          productId: product._id,
          variantId: variantId,
          sizeId: sizeId,
          isActive: !currentStatus
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling size:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle size');
    } finally {
      setToggleLoading({ [`size-${sizeId}`]: false });
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Stock Details - {product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {product.variants.map(variant => {
              const variantId = typeof variant._id === 'object' ? variant._id.$oid : variant._id;
              const isVariantActive = variant.isActive !== false;
              
              return (
                <div key={variantId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <img 
                      src={variant.variantImage || getImageUrl(product)} 
                      alt={variant.colorName} 
                      className="w-16 h-16 rounded-lg object-cover" 
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{variant.colorName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Variant</p>
                    </div>
                    <button
                      onClick={() => handleToggleVariantStatus(variantId, isVariantActive)}
                      disabled={toggleLoading[`variant-${variantId}`]}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isVariantActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:text-white' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200 dark:text-white'
                      } disabled:opacity-50`}
                    >
                      {toggleLoading[`variant-${variantId}`] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin dark:text-white" />
                      ) : isVariantActive ? (
                        <Power className="w-3 h-3 mr-1 dark:text-white" />
                      ) : (
                        <PowerOff className="w-3 h-3 mr-1 dark:text-white" />
                      )}
                      {isVariantActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 dark:text-white">
                    {variant.moreDetails.map(details => {
                      const detailsId = typeof details._id === 'object' ? details._id.$oid : details._id;
                      const isSizeActive = details.isActive !== false;
                      
                      return (
                        <div key={detailsId} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 dark:text-white">
                                Size: {details.size.length}" × {details.size.breadth}" × {details.size.height}"
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-lg font-bold text-blue-600">{details.stock || 0}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">in stock</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              (details.stock || 0) > 10 
                                ? 'bg-green-100 text-green-800' 
                                : (details.stock || 0) > 0 
                                  ? 'bg-yellow-100 text-yellow-800 dark:text-white' 
                                  : 'bg-red-100 text-red-800 dark:text-white'
                            }`}>
                              {(details.stock || 0) > 10 ? 'In Stock' : (details.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}
                            </div>
                            <button
                              onClick={() => handleToggleSizeStatus(variantId, detailsId, isSizeActive)}
                              disabled={toggleLoading[`size-${detailsId}`]}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSizeActive 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              } disabled:opacity-50`}
                            >
                              {toggleLoading[`size-${detailsId}`] ? (
                                <Loader2 className="w-3 h-3 animate-spin dark:text-white" />
                              ) : isSizeActive ? (
                                <Power className="w-3 h-3 dark:text-white" />
                              ) : (
                                <PowerOff className="w-3 h-3 dark:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

  const ViewPriceModal = ({ product, onClose }) => {
  const [toggleLoading, setToggleLoading] = useState({});

  const handleToggleVariantStatus = async (variantId, currentStatus) => {
    setToggleLoading({ [`variant-${variantId}`]: true });
    try {
      const res = await axios.post(
        'http://localhost:3000/api/product/toggle-variant-size-status',
        {
          productId: product._id,
          variantId: variantId,
          isActive: !currentStatus
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling variant:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle variant');
    } finally {
      setToggleLoading({ [`variant-${variantId}`]: false });
    }
  };

  const handleToggleSizeStatus = async (variantId, sizeId, currentStatus) => {
    setToggleLoading({ [`size-${sizeId}`]: true });
    try {
      const res = await axios.post(
        'http://localhost:3000/api/product/toggle-variant-size-status',
        {
          productId: product._id,
          variantId: variantId,
          sizeId: sizeId,
          isActive: !currentStatus
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling size:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle size');
    } finally {
      setToggleLoading({ [`size-${sizeId}`]: false });
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Price Details - {product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="space-y-6 dark:text-white">
            {product.variants.map(variant => {
              const variantId = typeof variant._id === 'object' ? variant._id.$oid : variant._id;
              const isVariantActive = variant.isActive !== false;
              
              return (
                <div key={variantId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <img 
                      src={variant.variantImage || getImageUrl(product)} 
                      alt={variant.colorName} 
                      className="w-16 h-16 rounded-lg object-cover" 
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{variant.colorName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Variant</p>
                    </div>
                    <button
                      onClick={() => handleToggleVariantStatus(variantId, isVariantActive)}
                      disabled={toggleLoading[`variant-${variantId}`]}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isVariantActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:text-white' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200 dark:text-white'
                      } disabled:opacity-50`}
                    >
                      {toggleLoading[`variant-${variantId}`] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : isVariantActive ? (
                        <Power className="w-3 h-3 mr-1 dark:text-white" />
                      ) : (
                        <PowerOff className="w-3 h-3 mr-1 dark:text-white" />
                      )}
                      {isVariantActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {variant.moreDetails.map(details => {
                      const detailsId = typeof details._id === 'object' ? details._id.$oid : details._id;
                      const isSizeActive = details.isActive !== false;
                      
                      return (
                        <div key={detailsId} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">
                              Size: {details.size.length}" × {details.size.breadth}" × {details.size.height}"
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gary-400">Base Price:</span>
                              <span className="text-base md:text-lg font-bold text-green-600 dark:text-white">₹{details.price}</span>
                            </div>
                            
                            {details.discountPrice && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">Discount Price:</span>
                                <span className="text-base md:text-lg font-bold text-red-600 dark:text-white">₹{details.discountPrice}</span>
                              </div>
                            )}
                            
                            {details.bulkPricing && details.bulkPricing.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-medium text-gray-700 mb-2 dark:text-gray-400">Bulk Pricing:</p>
                                <div className="space-y-1">
                                  {details.bulkPricing.map((bulk, index) => (
                                    <div key={index} className="flex justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400 dark:text-white">{bulk.quantity}+ items:</span>
                                      <span className="font-medium text-blue-600 dark:text-white">₹{bulk.wholesalePrice}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleToggleSizeStatus(variantId, detailsId, isSizeActive)}
                                disabled={toggleLoading[`size-${detailsId}`]}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                  isSizeActive 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                } disabled:opacity-50`}
                              >
                                {toggleLoading[`size-${detailsId}`] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isSizeActive ? (
                                  <Power className="w-3 h-3 dark:text-white" />
                                ) : (
                                  <PowerOff className="w-3 h-3 dark:text-white" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

  const RestockModal = ({ product = {}, onClose, selectedProducts = [], multipleToRestockInitial = {} }) => {
    const [stockTextfield, setStockTextfield] = useState("");
    const [stateVariableForDataForSingleProductWithVariants, setStateVariableForDataForSingleProductWithVariants] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    const handleUpdateStock = async () => {
  setModalLoading(true);
  try {
    let dataToSend = {};
    if (product.hasVariants) {
      dataToSend = {
        productId: product._id,
        updatedStock: "",
        productData: stateVariableForDataForSingleProductWithVariants
      };
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
      if (product.hasVariants) {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p._id === product._id
              ? {
                  ...p,
                  variants: p.variants.map(v => ({
                    ...v,
                    moreDetails: v.moreDetails.map(d =>
                      stateVariableForDataForSingleProductWithVariants[v._id]?.[d._id]?.[d.size._id]
                        ? { ...d, stock: parseInt(stateVariableForDataForSingleProductWithVariants[v._id][d._id][d.size._id]) }
                        : d
                    )
                  }))
                }
              : p
          )
        );
      } else {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p._id === product._id ? { ...p, stock: parseInt(stockTextfield) } : p
          )
        );
      }
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

    const handleUpdateMultipleStock = async (localMultipleToRestock) => {
      setModalLoading(true);
      try {
        const res = await axios.post('http://localhost:3000/api/product/mass-restock', localMultipleToRestock, {
          withCredentials: true,
        });
        if (res.status === 200) {
          toast.success("Multiple products restocked successfully!");
          onClose();
        } else {
          toast.error("Failed to update stock!");
        }
      } catch (err) {
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
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Restock Multiple Products</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {selectedProducts.map(product => (
                  product.hasVariants ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" key={product._id}>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Has Variants</p>
                        </div>
                      </div>
                      {product.variants.map(variant => (
                        <div key={variant._id} className="ml-4 space-y-3">
                          <h4 className="font-medium -800 dark:text-gray-100">Variant: {variant.colorName}</h4>
                          {variant.moreDetails.map(details => (
                            <div key={details._id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current stock: {details.stock}</p>
                              <input 
                                type="number"
                                min="0"
                                placeholder="Enter new stock quantity"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={localMultipleToRestock[product._id]?.[variant._id]?.[details._id]?.[details.size._id] || ""}
                                onChange={(e) => setLocalMultipleToRestock(prev => ({
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
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" key={product._id}>
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
                        value={localMultipleToRestock[product._id]?.stock || ""}
                        onChange={(e) => setLocalMultipleToRestock(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            stock: e.target.value
                          }
                        }))}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-gray-800 transition-colors" disabled={modalLoading}>
                Cancel
              </button>
              <button onClick={() => handleUpdateMultipleStock(localMultipleToRestock)} disabled={modalLoading} className="px-4 py-2 bg-blue-600 text-green-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                {modalLoading ? "Updating..." : "Update Stock"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!product) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Restock Product</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.hasVariants ? (
                product.variants.map((variant) => (
                  <div key={variant._id} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Variant: {variant.colorName}</p>
                      </div>
                    </div>
                    {variant.moreDetails.map((details) => (
                      <div key={details._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 dark:text-gray-400">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 dark:text-white">Current stock: {details.stock}</p>
                        <input 
                          type="number"
                          min="0"
                          placeholder="Enter new stock quantity"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={stateVariableForDataForSingleProductWithVariants[variant._id]?.[details._id]?.[details.size._id] || ""}
                          onChange={(e) => setStateVariableForDataForSingleProductWithVariants(prev => ({
                            ...prev,
                            [variant._id]: {
                              ...prev[variant._id],
                              [details._id]: {
                                ...prev[variant._id]?.[details._id],
                                [details.size._id]: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Stock: {product.stock}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Update Stock Quantity</label>
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
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 transition-colors" disabled={modalLoading}>
              Cancel
            </button>
            <button onClick={handleUpdateStock} disabled={modalLoading} className="px-4 py-2 bg-blue-600 text-green-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
              {modalLoading ? "Updating..." : "Update Stock"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RevisedRateModal = ({ product = {}, onClose, selectedProducts = [], multipleForRevisedRateInitial = {} }) => {
    const [revisedRateTextfield, setRevisedRateTextfield] = useState("");
    const [discountStartDate, setDiscountStartDate] = useState("");
    const [discountEndDate, setDiscountEndDate] = useState("");
    const [comeBackToOriginalPrice, setComeBackToOriginalPrice] = useState("");
    const [singleProductDiscountBulkPricing, setSingleProductDiscountBulkPricing] = useState([]);
    const [stateVariableToReviseRateForSingleProductWithVariants, setStateVariableToReviseRateForSingleProductWithVariants] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

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

    const handleUpdateRevisedRate = async () => {
      setModalLoading(true);
      try {
        let dataToSend = {};
        if (product.hasVariants) {
          dataToSend = {
            productId: product._id,
            productData: stateVariableToReviseRateForSingleProductWithVariants
          };
        } else {
          dataToSend = {
            productId: product._id,
            updatedPrice: parseFloat(revisedRateTextfield),
            discountStartDate,
            discountEndDate,
            discountPrice: parseFloat(revisedRateTextfield),
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

    const handleUpdateMultipleRevisedRate = async (localMultipleForRevisedRate) => {
      setModalLoading(true);
      try {
        const res = await axios.post('http://localhost:3000/api/product/mass-revised-rate', localMultipleForRevisedRate, {
          withCredentials: true,
        });
        if (res.status === 200) {
          toast.success("Multiple product rates revised successfully!");
          onClose();
        } else {
          toast.error("Failed to revise rates!");
        }
      } catch (err) {
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
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revised Rate - Multiple Products</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {selectedProducts.map(product => (
                  product.hasVariants ? (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" key={product._id}>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Has Variants</p>
                        </div>
                      </div>
                      {product.variants.map(variant => (
                        <div key={variant._id} className="ml-4 space-y-4">
                          <h4 className="font-medium -800 dark:text-gray-100">Variant: {variant.colorName}</h4>
                          {variant.moreDetails.map(details => (
                            <div key={details._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                              <p className="text-sm text-gray-600 dark:text-white">Current price: {details.price}</p>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-400">Discounted Price</label>
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter discounted price"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.[details.size._id] || ''}
                                  onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          [details.size._id]: e.target.value,
                                          discountPrice: e.target.value
                                        }
                                      }
                                    }
                                  }))}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-400">Start Date</label>
                                  <input 
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.discountStartDate || ''}
                                    onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        [variant._id]: {
                                          ...prev[product._id][variant._id],
                                          [details._id]: {
                                            ...prev[product._id][variant._id][details._id],
                                            discountStartDate: e.target.value
                                          }
                                        }
                                      }
                                    }))}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-400">End Date</label>
                                  <input 
                                    type="datetime-local"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.discountEndDate || ''}
                                    onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                      ...prev,
                                      [product._id]: {
                                        ...prev[product._id],
                                        [variant._id]: {
                                          ...prev[product._id][variant._id],
                                          [details._id]: {
                                            ...prev[product._id][variant._id][details._id],
                                            discountEndDate: e.target.value
                                          }
                                        }
                                      }
                                    }))}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-400">Return to Original Price?</label>
                                <select 
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                                  value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.comeBackToOriginalPrice || ''}
                                  onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          comeBackToOriginalPrice: e.target.value
                                        }
                                      }
                                    }
                                  }))}
                                >
                                  <option value="">Select option</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </div>

                              <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-xs font-medium text-gray-700">Bulk Pricing</h5>
                                  <button 
                                    onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, variant._id, details._id)}
                                    className="px-2 py-1 bg-blue-500 text-black rounded text-xs hover:bg-blue-600 transition-colors dark:text-gray-400"
                                  >
                                    Add Tier
                                  </button>
                                </div>
                                {(localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.discountBulkPricing || []).map((pricing, index) => (
                                  <div key={index} className="flex gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
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
                                      className="px-2 py-1 bg-red-500 text-black rounded text-xs hover:bg-red-600 transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" key={product._id}>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Current Price: ${product.price}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Discounted Price</label>
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter discounted price"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={localMultipleForRevisedRate[product._id]?.price || ''}
                            onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                price: e.target.value,
                                discountPrice: e.target.value
                              }
                            }))}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Start Date</label>
                            <input 
                              type="datetime-local"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={localMultipleForRevisedRate[product._id]?.discountStartDate || ''}
                              onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                ...prev,
                                [product._id]: {
                                  ...prev[product._id],
                                  discountStartDate: e.target.value
                                }
                              }))}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">End Date</label>
                            <input 
                              type="datetime-local"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={localMultipleForRevisedRate[product._id]?.discountEndDate || ''}
                              onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                                ...prev,
                                [product._id]: {
                                  ...prev[product._id],
                                  discountEndDate: e.target.value
                                }
                              }))}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Return to Original Price?</label>
                          <select 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={localMultipleForRevisedRate[product._id]?.comeBackToOriginalPrice || ''}
                            onChange={(e) => setLocalMultipleForRevisedRate(prev => ({
                              ...prev,
                              [product._id]: {
                                ...prev[product._id],
                                comeBackToOriginalPrice: e.target.value
                              }
                            }))}
                          >
                            <option value="">Select option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm text-gray-700">Bulk Pricing</h4>
                            <button 
                              onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id)}
                              className="px-3 py-1 bg-blue-500 text-black rounded text-sm hover:bg-blue-600 transition-colors dark:text-gray-400"
                            >
                              Add Tier
                            </button>
                          </div>
                          
                          {(localMultipleForRevisedRate[product._id]?.discountBulkPricing || []).map((pricing, index) => (
                            <div key={index} className="flex gap-2 mb-2 p-2 bg-white dark:bg-gray-900 rounded border">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Wholesale Price</label>
                                <input 
                                  type="number"
                                  placeholder="e.g., 150"
                                  className="w-full p-1 border rounded"
                                  value={pricing.wholesalePrice}
                                  onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'wholesalePrice', e.target.value)}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Quantity</label>
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
                                className="px-2 py-1 bg-red-500 text-red-600 rounded text-xs self-end hover:bg-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:text-white dark:bg-gray-800 transition-colors" disabled={modalLoading}>
                Cancel
              </button>
              <button onClick={() => handleUpdateMultipleRevisedRate(localMultipleForRevisedRate)} disabled={modalLoading} className="px-4 py-2 bg-green-600 text-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
                {modalLoading ? "Updating..." : "Update Rates"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!product) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revised Rate</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {product.hasVariants ? (
                product.variants.map((variant) => (
                  <div key={variant._id} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Variant: {variant.colorName}</p>
                      </div>
                    </div>
                    {variant.moreDetails.map((details) => (
                      <div key={details._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Size: {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                        <p className="text-sm text-gray-600 dark:text-white">Current price: ${details.price}</p>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Discounted Price</label>
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter discounted price"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={stateVariableToReviseRateForSingleProductWithVariants[variant._id]?.[details._id]?.discountPrice || ""}
                            onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                              ...prev,
                              [variant._id]: {
                                ...prev[variant._id],
                                [details._id]: {
                                  ...prev[variant._id]?.[details._id],
                                  discountPrice: e.target.value
                                }
                              }
                            }))}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Start Date</label>
                            <input 
                              type="datetime-local"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={stateVariableToReviseRateForSingleProductWithVariants[variant._id]?.[details._id]?.discountStartDate || ""}
                              onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                ...prev,
                                [variant._id]: {
                                  ...prev[variant._id],
                                  [details._id]: {
                                    ...prev[variant._id]?.[details._id],
                                    discountStartDate: e.target.value
                                  }
                                }
                              }))}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">End Date</label>
                            <input 
                              type="datetime-local"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={stateVariableToReviseRateForSingleProductWithVariants[variant._id]?.[details._id]?.discountEndDate || ""}
                              onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                ...prev,
                                [variant._id]: {
                                  ...prev[variant._id],
                                  [details._id]: {
                                    ...prev[variant._id]?.[details._id],
                                    discountEndDate: e.target.value
                                  }
                                }
                              }))}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Return to Original Price?</label>
                          <select 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={stateVariableToReviseRateForSingleProductWithVariants[variant._id]?.[details._id]?.comeBackToOriginalPrice || ""}
                            onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                              ...prev,
                              [variant._id]: {
                                ...prev[variant._id],
                                [details._id]: {
                                  ...prev[variant._id]?.[details._id],
                                  comeBackToOriginalPrice: e.target.value
                                }
                              }
                            }))}
                          >
                            <option value="">Select option</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-sm">Bulk Pricing Tiers</h4>
                            <button onClick={() => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                              ...prev,
                              [variant._id]: {
                                ...prev[variant._id],
                                [details._id]: {
                                  ...prev[variant._id]?.[details._id],
                                  discountBulkPricing: [
                                    ...(prev[variant._id]?.[details._id]?.discountBulkPricing || []),
                                    { wholesalePrice: "", quantity: "" }
                                  ]
                                }
                              }
                            }))} className="px-3 py-1 bg-blue-500 text-black rounded text-sm hover:bg-blue-600 transition-colors dark:text-gray-400">
                              Add Tier
                            </button>
                          </div>

                          { (stateVariableToReviseRateForSingleProductWithVariants[variant._id]?.[details._id]?.discountBulkPricing || []).map((tier, index) => (
                            <div key={index} className="flex gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Wholesale Price</label>
                                <input 
                                  type="number"
                                  placeholder="Price"
                                  className="w-full p-1 border rounded text-sm"
                                  value={tier.wholesalePrice}
                                  onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                    ...prev,
                                    [variant._id]: {
                                      ...prev[variant._id],
                                      [details._id]: {
                                        ...prev[variant._id]?.[details._id],
                                        discountBulkPricing: prev[variant._id][details._id].discountBulkPricing.map((t, i) => 
                                          i === index ? { ...t, wholesalePrice: e.target.value } : t
                                        )
                                      }
                                    }
                                  }))}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400">Quantity</label>
                                <input 
                                  type="number"
                                  placeholder="Qty"
                                  className="w-full p-1 border rounded text-sm"
                                  value={tier.quantity}
                                  onChange={(e) => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                    ...prev,
                                    [variant._id]: {
                                      ...prev[variant._id],
                                      [details._id]: {
                                        ...prev[variant._id]?.[details._id],
                                        discountBulkPricing: prev[variant._id][details._id].discountBulkPricing.map((t, i) => 
                                          i === index ? { ...t, quantity: e.target.value } : t
                                        )
                                      }
                                    }
                                  }))}
                                />
                              </div>
                              <button onClick={() => setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
                                ...prev,
                                [variant._id]: {
                                  ...prev[variant._id],
                                  [details._id]: {
                                    ...prev[variant._id]?.[details._id],
                                    discountBulkPricing: prev[variant._id][details._id].discountBulkPricing.filter((_, i) => i !== index)
                                  }
                                }
                              }))} className="px-2 py-1 bg-red-500 text-black rounded text-xs self-end hover:bg-red-600 transition-colors">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(product)} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Price: ${product.price}</p>
                    </div>
                  </div>
                  
                  <div> 
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Discounted Price</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Start Date</label>
                      <input 
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={discountStartDate}
                        onChange={(e) => setDiscountStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">End Date</label>
                      <input 
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={discountEndDate}
                        onChange={(e) => setDiscountEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Return to Original Price?</label>
                    <select 
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  value={comeBackToOriginalPrice}
  onChange={(e) => setComeBackToOriginalPrice(e.target.value)}
>
  <option value="">Select option</option>
  <option value="yes">Yes</option>
  <option value="no">No</option>
</select>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-sm">Bulk Pricing Tiers</h4>
                      <button onClick={() => setSingleProductDiscountBulkPricing(prev => [...prev, { wholesalePrice: "", quantity: "" }])} className="px-3 py-1 bg-blue-500 text-black rounded text-sm hover:bg-blue-600 transition-colors dark:text-gray-400">
                        Add Tier
                      </button>
                    </div>

                    {singleProductDiscountBulkPricing.map((tier, index) => (
                      <div key={index} className="flex gap-2 mb-2 p-2 bg-white dark:bg-gray-900 rounded border">
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 dark:text-gray-400">Wholesale Price</label>
                          <input 
                            type="number"
                            placeholder="Price"
                            className="w-full p-1 border rounded"
                            value={tier.wholesalePrice}
                            onChange={(e) => setSingleProductDiscountBulkPricing(prev => prev.map((t, i) => i === index ? { ...t, wholesalePrice: e.target.value } : t))}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600 dark:text-gray-400">Quantity</label>
                          <input 
                            type="number"
                            placeholder="Qty"
                            className="w-full p-1 border rounded"
                            value={tier.quantity}
                            onChange={(e) => setSingleProductDiscountBulkPricing(prev => prev.map((t, i) => i === index ? { ...t, quantity: e.target.value } : t))}
                          />
                        </div>
                        <button onClick={() => setSingleProductDiscountBulkPricing(prev => prev.filter((_, i) => i !== index))} className="px-2 py-1 bg-red-500 text-black rounded text-xs self-end hover:bg-red-600 transition-colors">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-gray-800 transition-colors" disabled={modalLoading}>
              Cancel
            </button>
            <button onClick={handleUpdateRevisedRate} disabled={modalLoading} className="px-4 py-2 bg-green-600 text-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
              {modalLoading ? "Updating..." : "Revise Rate"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center"><div className="text-lg text-gray-600 dark:text-gray-400">Loading products...</div></div>;
  
  if (error) return <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center"><div className="text-lg text-red-600">Error loading products</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6">
      {isLoading && <LoadingOverlay />}
      {exportingImages && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center max-w-sm">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Preparing your export...</p>
      <p className="text-sm text-gray-500 dark:text-gray-500">Downloading images and creating ZIP file</p>
    </div>
  </div>
)}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              <span className="block sm:inline">Product</span>
              <span className="block sm:inline sm:ml-2">Management</span>
            </h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Manage your product inventory and pricing with ease</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Products Management</h3>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
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
                <div className="flex items-center space-x-2">
                  <button onClick={() => setShowFilters(!showFilters)} className="dark:text-gray-400 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                  <button onClick={exportToExcel} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white dark:text-gray-400 dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <Download className="w-4 h-4 mr-2" />
                    Export Products
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
    {/* ADD THIS CATEGORY FILTER SECTION AT THE TOP */}
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-400">Category Filter</h4>
        {selectedCategoryIds.length > 0 && (
          <button
            onClick={clearCategoryFilter}
            className="text-xs text-red-600 hover:text-red-800 font-medium dark:text-white"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      {/* Category Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        {/* Main Category Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Main Category</label>
          <select
            value={selectedCategoryIds[0] || ""}
            onChange={(e) => handleCategorySelect(0, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {allCategoriesTree
              .filter(cat => !cat.parent_category_id && !cat.parentCategoryId)
              .map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.categoryName}
                </option>
              ))}
          </select>
        </div>

        {/* Sub Category Dropdown - Only show if main category is selected and has subcategories */}
        {selectedCategoryIds.length > 0 && (() => {
          const lastSelectedId = selectedCategoryIds[selectedCategoryIds.length - 1];
          const lastCategory = findCategoryInTree(lastSelectedId, allCategoriesTree);
          const hasSubcategories = lastCategory?.subcategories && lastCategory.subcategories.length > 0;
          
          if (hasSubcategories) {
            return (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-400">Sub Category</label>
                <select
                  value={selectedCategoryIds[selectedCategoryIds.length] || ""}
                  onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 appearance-none cursor-pointer"
                >
                  <option value="">Select sub category</option>
                  {lastCategory.subcategories.map(subCat => (
                    <option key={subCat._id} value={subCat._id}>
                      {subCat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Category Path Display */}
      {categoryFilterPath && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-2">Selected Category Path:</p>
          <div className="flex flex-wrap items-center gap-2">
            {categoryFilterPath.split(' > ').map((catName, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => handleCategoryPathClick(index)}
                  className="text-sm text-blue-800 hover:text-blue-900 hover:underline font-medium"
                >
                  {catName}
                </button>
                {index < categoryFilterPath.split(' > ').length - 1 && (
                  <span className="mx-2 text-blue-400">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Date Filter</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-300 dark:text-white dark:bg-gray-900">
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
                      <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  )}

                  {dateFilter === 'range' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Start Date</label>
                        <input type="date" value={customDateRange.start} onChange={(e) => setCustomDateRange(prev => ({...prev, start: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">End Date</label>
                        <input type="date" value={customDateRange.end} onChange={(e) => setCustomDateRange(prev => ({...prev, end: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Sort by Price</label>
                    <select value={priceSort} onChange={(e) => setPriceSort(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-300 dark:text-white dark:bg-gray-900">
                      <option value="">No Sort</option>
                      <option value="low-high">Low to High</option>
                      <option value="high-low">High to Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-400">Sort by Stock</label>
                    <select value={stockSort} onChange={(e) => setStockSort(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-300 dark:text-white dark:bg-gray-900">
                      <option value="">No Sort</option>
                      <option value="low-high">Low to High</option>
                      <option value="high-low">High to Low</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">{selectedProducts.length} products selected</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setShowRevisedRateModal(true)} className="bg-green-500 hover:bg-green-600 text-green-500 px-3 py-1 rounded-md text-sm font-medium transition-colors">
                      Add Revised Rate
                    </button>
                    <button onClick={() => setShowRestockModal(true)} className="bg-blue-500 hover:bg-green-600 text-green-500 px-3 py-1 rounded-md text-sm font-medium transition-colors">
                      Restock
                    </button>
                    <button 
          onClick={handleDuplicateSelected} 
          className="bg-indigo-500 hover:bg-indigo-600 text-blue-600 px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center"
        >
          <Copy className="w-4 h-4 mr-1" />
          Duplicate Selected
        </button>
                    <button 
          onClick={() => {
            const productIds = selectedProducts.map(p => p._id).join(',');
            navigate(`/admin/panel/products/bulk-edit/${productIds}`);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-blue-500 px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          <Edit2 className="w-4 h-4 inline mr-1" />
          Bulk Edit
        </button>
        <button 
          onClick={() => handleBulkStatusToggle(true)}
          className="bg-green-500 hover:bg-green-600 text-green-600 px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center"
        >
          <Power className="w-4 h-4 mr-1" />
          Activate Selected
        </button>
        <button 
          onClick={() => handleBulkStatusToggle(false)}
          className="bg-orange-500 hover:bg-orange-600 text-red-600 px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center dark:text-white"
        >
          <PowerOff className="w-4 h-4 mr-1" />
          Deactivate Selected
        </button>
                    <button 
  onClick={() => setShowDeleteModal(true)} 
  className="bg-red-500 hover:bg-red-600 text-red-600 px-3 py-1 rounded-md text-sm font-medium transition-colors dark:text-white"
>
  Delete Selected
</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
  <tr>
    <th scope="col" className="px-6 py-3">
      <input
        type="checkbox"
        checked={selectedProducts.length === filteredData.length && filteredData.length > 0}
        onChange={toggleSelectAll}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
    </th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color Variants</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size Variants</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
  </tr>
</thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
  {currentData.map((product, index) => (
    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedProducts.some((p) => p._id === product._id)}
          onChange={() => toggleCheckbox(product)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-400">{product.name}</div>
        <div className="text-sm text-gray-500 dark:text-blue-500">{product._id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{product.categoryPath || product.category}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {product.hasVariants ? (
          <button
            onClick={() => openViewStockModal(product)}
            className="text-blue-600 hover:text-blue-800 dark:text-white"
          >
            View Stock
          </button>
        ) : (
          <span className={product.stock > 0 ? 'text-green-600 dark:text-white' : 'text-red-600 dark:text-white'}>
            {product.stock}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
        {product.hasVariants ? product.variants.length : 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">
        {getNumberOfSizeVariants(product)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {product.hasVariants ? (
          <button
            onClick={() => openViewPriceModal(product)}
            className="text-blue-600 hover:text-blue-800 dark:text-white"
          >
            View Price
          </button>
        ) : (
          <span className="text-green-600 dark:text-white">₹{product.price}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {product.hasVariants ? (
          <button
            onClick={() => openViewVariantsModal(product)}
            className="text-blue-600 hover:text-blue-800"
          >
            View Variants
          </button>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{formatDate(product.createdAt)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => handleToggleStatus(product._id, !product.isActive)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
            product.isActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:text-white'
              : 'bg-red-100 text-red-800 hover:bg-red-200 dark:text-white'
          }`}
        >
          {product.isActive ? (
            <>
              <Power className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <PowerOff className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => openViewDetailsModal(product)}
          className="text-blue-600 hover:text-blue-800" title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button onClick={() => { setRevisedRateProduct(product); setShowRevisedRateModal(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Revise Rate">
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setRestockProduct(product); setShowRestockModal(true); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Restock">
                            <Package className="w-4 h-4" />
                          </button>
        <button
          onClick={() => openEditModal(product)}
          className="text-blue-600 hover:text-blue-800" title="Edit Product"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDuplicateProduct(product)}
          className="text-blue-600 hover:text-blue-800" title="Duplicate Product"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => openDeleteModal(product)}
          className="text-red-600 hover:text-red-800 dark:text-white" title="Delete Product"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 bg-gray-400">Show</span>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-300 dark:text-white dark:bg-gray-900">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700 dark:bg-gray-400">entries per page</span>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
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
                      <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === pageNumber ? 'bg-blue-600 text-blue-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-800'}`}>
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRestockModal && (
        <RestockModal 
          product={selectedProducts.length > 0 ? null : restockProduct} 
          selectedProducts={selectedProducts.length > 0 ? selectedProducts : []} 
          multipleToRestockInitial={multipleProductsToRestock} 
          onClose={() => setShowRestockModal(false)} 
        />
      )}
      {showRevisedRateModal && (
        <RevisedRateModal 
          product={selectedProducts.length > 0 ? null : revisedRateProduct} 
          selectedProducts={selectedProducts.length > 0 ? selectedProducts : []} 
          multipleForRevisedRateInitial={multipleProductsForRevisedRate} 
          onClose={() => setShowRevisedRateModal(false)} 
        />
      )}
      {showViewStockModal && <ViewStockModal product={selectedProductForView} onClose={() => setShowViewStockModal(false)} />}
      {showViewPriceModal && <ViewPriceModal product={selectedProductForView} onClose={() => setShowViewPriceModal(false)} />}
      {showViewDetailsModal && <ViewDetailsModal product={selectedProductForView} onClose={() => setShowViewDetailsModal(false)} />}
      {/* {showEditModal && <EditModal product={selectedProductForEdit} onClose={() => setShowEditModal(false)} />} */}
      <DeleteConfirmationModal />
      <ErrorModal />
      {/* Status Confirmation Modal */}
{showStatusModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900">
          {statusModalData.isActive ? 'Activate Product' : 'Deactivate Product'}
        </h3>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to {statusModalData.isActive ? 'activate' : 'deactivate'}{' '}
          <span className="font-semibold text-gray-900">"{statusModalData.productName}"</span>?
        </p>
        {!statusModalData.isActive && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              This product will not be visible to customers.
            </p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button
          onClick={() => setShowStatusModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:text-white"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={confirmStatusChange}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-gren-600 transition-colors ${
            statusModalData.isActive 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-orange-600 hover:bg-orange-700'
          } disabled:opacity-50`}
        >
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
)}

{/* Bulk Status Confirmation Modal */}
{showBulkStatusModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-2xl">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900">
          {bulkStatusAction ? 'Activate' : 'Deactivate'} Multiple Products
        </h3>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to {bulkStatusAction ? 'activate' : 'deactivate'}{' '}
          <span className="font-semibold text-gray-900">{selectedProducts.length} selected products</span>?
        </p>
        {bulkStatusAction && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Only products with active categories will be activated.
            </p>
          </div>
        )}
        {!bulkStatusAction && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              These products will not be visible to customers.
            </p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button
          onClick={() => setShowBulkStatusModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:text-white"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={confirmBulkStatusChange}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-green-600 transition-colors ${
            bulkStatusAction 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-orange-600 hover:bg-orange-700'
          } disabled:opacity-50`}
        >
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal that shows variants */}
{showViewVariantsModal && (
  <ViewVariantsModal
    product={selectedProductForView}
    onClose={() => setShowViewVariantsModal(false)}
  />
)}
<ExportModal />
    </div>
  );
}