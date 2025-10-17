import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, RefreshCw, Package, CheckCircle, Search, Tag, Layers, ChevronRight, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchCategories } from '../../../../../utils/api';

// Helper to flatten category tree
const flattenCategories = (categories, parentPath = "", parentId = null) => {
  let flatList = [];
  categories.forEach((cat) => {
    const currentPath = parentPath ? `${parentPath} > ${cat.categoryName}` : cat.categoryName;
    flatList.push({ ...cat, path: currentPath, parentId: parentId });
    if (cat.subcategories && cat.subcategories.length > 0) {
      flatList = flatList.concat(flattenCategories(cat.subcategories, currentPath, cat._id));
    }
  });
  return flatList;
};

// Helper to find category in tree
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

const OverrideProductsModal = ({ isOpen, onClose, products, onOverride, isProcessing }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategoriesTree, setAllCategoriesTree] = useState([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categoryPath, setCategoryPath] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    if (isOpen) {
      const getCategories = async () => {
        try {
          const categories = await fetchCategories();
          setAllCategoriesTree(categories);
          setAllCategoriesFlat(flattenCategories(categories));
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      getCategories();
    }
  }, [isOpen]);

  // Update category path based on selections
  useEffect(() => {
    const pathNames = selectedCategoryIds
      .map((id) => allCategoriesFlat.find((cat) => cat._id === id)?.categoryName)
      .filter(Boolean);
    setCategoryPath(pathNames.join(' > '));
  }, [selectedCategoryIds, allCategoriesFlat]);

  if (!isOpen) return null;

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    let matchesCategory = true;
    if (selectedCategoryIds.length > 0) {
      const selectedPath = categoryPath.toLowerCase();
      const productPath = (product.categoryPath || '').toLowerCase();
      matchesCategory = productPath.startsWith(selectedPath);
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleCheckboxChange = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.productId));
    }
  };

  const handleOverride = () => {
    onOverride(selectedProducts);
  };

  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean);
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level);
    }
    setSelectedCategoryIds(newSelectedCategoryIds);
  };

  const handleCategoryPathClick = (index) => {
    const newSelectedCategoryIds = selectedCategoryIds.slice(0, index + 1);
    setSelectedCategoryIds(newSelectedCategoryIds);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryIds([]);
    setCategoryPath('');
  };

  const hasActiveFilters = searchQuery || selectedCategoryIds.length > 0;

  const renderCategoryDropdowns = () => {
    const dropdowns = [];

    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id);
    dropdowns.push(
      <div key="category-dropdown-0" className="space-y-2">
        <label htmlFor="category-level-0" className="block text-sm font-semibold text-gray-700 dark:text-gray-400">
          <Tag className="inline w-4 h-4 mr-2" />
          Main Category
        </label>
        <select
          id="category-level-0"
          value={selectedCategoryIds[0] || ''}
          onChange={(e) => handleCategorySelect(0, e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
        >
          <option value="">All Categories</option>
          {mainCategoryOptions.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>
    );

    const lastSelectedCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1];
    const lastSelectedCategoryInTree = findCategoryInTree(lastSelectedCategoryId, allCategoriesTree);
    const subCategoryOptions = lastSelectedCategoryInTree ? lastSelectedCategoryInTree.subcategories || [] : [];

    if (selectedCategoryIds.length > 0 && subCategoryOptions.length > 0) {
      dropdowns.push(
        <div key="category-dropdown-sub" className="space-y-2">
          <label htmlFor="category-level-sub" className="block text-sm font-semibold text-gray-700 dark:text-gray-400">
            <Layers className="inline w-4 h-4 mr-2" />
            Sub Category
          </label>
          <select
            id="category-level-sub"
            value={selectedCategoryIds[selectedCategoryIds.length] || ''}
            onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
          >
            <option value="">Select sub category</option>
            {subCategoryOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{dropdowns}</div>;
  };

  const renderCategoryPath = () => {
    if (!categoryPath) return null;

    const pathParts = categoryPath.split(' > ');
    return (
      <div className="flex items-center flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <span className="text-sm font-medium text-blue-900 dark:text-blue-400">Category:</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <button
              onClick={() => handleCategoryPathClick(index)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              {part}
            </button>
            {index < pathParts.length - 1 && (
              <ChevronRight className="w-4 h-4 text-blue-400" />
            )}
          </React.Fragment>
        ))}
        <button
          onClick={() => {
            setSelectedCategoryIds([]);
            setCategoryPath('');
          }}
          className="ml-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
        >
          Clear
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Products Already Exists
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select products to override with new data
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Section - Fixed */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="p-6">
            {/* Filter Buttons - Always Visible */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-white"
                >
                  <Filter className="w-5 h-5" />
                  <span>{isFilterOpen ? 'Close Filters' : 'Open Filters'}</span>
                  {hasActiveFilters && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  )}
                  {isFilterOpen ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </button>

                {!isFilterOpen && hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-white"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Filter Results Summary */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> of{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{products.length}</span> products
                </span>
              </div>
            </div>

            {/* Collapsible Filter Content */}
            {isFilterOpen && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                {/* Category Filters */}
                {renderCategoryDropdowns()}

                {/* Category Path */}
                {renderCategoryPath()}
              </div>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  disabled={isProcessing || filteredProducts.length === 0}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                Select All ({filteredProducts.length} products)
              </span>
            </label>
          </div>

          {/* Product List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || selectedCategoryIds.length > 0
                  ? 'Try adjusting your filters'
                  : 'No products to display'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.productId}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedProducts.includes(product.productId)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.productId)}
                      onChange={() => handleCheckboxChange(product.productId)}
                      disabled={isProcessing}
                      className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    />
                  </div>

                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {product.categoryPath || 'No category'}
                    </p>
                    {product.hasVariants && (
                      <span className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 rounded-full">
                        {product.variantsCount} variant{product.variantsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4">
                  <RefreshCw className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Overriding Products...
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we update the products
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedProducts.length}
              </span> of {filteredProducts.length} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={selectedProducts.length === 0 || isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Override Selected</span>
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

export default OverrideProductsModal;