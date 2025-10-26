import React, { useState, useEffect, useContext, useMemo } from 'react';
import { X, Search, Package, ChevronRight, AlertCircle, Plus, Check, Filter } from 'lucide-react';
import { ProductContext } from '../../../../../Context/ProductContext';
import axios from 'axios';

// Helper to flatten categories
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
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Helper to calculate effective price
const calculateEffectivePrice = (product, variant = null, sizeDetail = null) => {
  const now = new Date();
  let basePrice = 0;
  let discountPrice = null;
  let discountStartDate, discountEndDate;

  if (sizeDetail) {
    basePrice = sizeDetail.price;
    discountStartDate = sizeDetail.discountStartDate;
    discountEndDate = sizeDetail.discountEndDate;
    discountPrice = sizeDetail.discountPrice;
  } else if (variant && variant.commonPrice !== undefined) {
    basePrice = variant.commonPrice;
    discountStartDate = variant.discountStartDate;
    discountEndDate = variant.discountEndDate;
    discountPrice = variant.discountCommonPrice;
  } else {
    basePrice = product.price;
    discountStartDate = product.discountStartDate;
    discountEndDate = product.discountEndDate;
    discountPrice = product.discountPrice;
  }

  const isDiscountActive = discountStartDate && discountEndDate
    ? now >= new Date(discountStartDate) && now <= new Date(discountEndDate)
    : false;

  return {
    originalPrice: basePrice,
    currentPrice: isDiscountActive && discountPrice ? discountPrice : basePrice,
    isDiscounted: isDiscountActive && discountPrice
  };
};

// Product Card Component
const ProductCard = ({ product, isSelected, onSelect, alreadyInOrder, isExpanded, onToggleExpand }) => {
  const { originalPrice, currentPrice, isDiscounted } = calculateEffectivePrice(product);
  const mainImage = product.image || (product.variants?.[0]?.variantImage) || '/placeholder.svg';

  return (
    <div className={`border-2 rounded-xl p-4 transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    } ${alreadyInOrder ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(product)}
            disabled={alreadyInOrder}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Product Image */}
        <div className="flex-shrink-0">
          <div 
            className="relative cursor-pointer group"
            onClick={onToggleExpand}
          >
            <img
  src={mainImage}
  alt={product.name}
  className={`object-cover rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${
    isExpanded ? 'w-32 h-32' : 'w-16 h-16'
  }`}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder.svg';
  }}
/>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
              <span className="text-xs text-white opacity-0 group-hover:opacity-100">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {product.name}
          </h3>
          
          {alreadyInOrder && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full mb-2">
              Already in Order
            </span>
          )}

          <div className="flex items-center gap-2 mb-2">
            {isDiscounted ? (
              <>
                <span className="text-sm line-through text-gray-400">
                  ₹{originalPrice}
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{currentPrice}
                </span>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  Discount Active
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{currentPrice}
              </span>
            )}
          </div>

          {!product.hasVariants && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stock: {product.stock}
            </p>
          )}

          {product.hasVariants && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {product.variants?.length || 0} variants available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Variant Selection Modal
const VariantSelectionModal = ({ product, onClose, onConfirm, alreadyAddedVariants }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [availableVariants, setAvailableVariants] = useState([]);

  useEffect(() => {
    // Filter out already added variants
    const filtered = product.variants?.filter(v => {
      const variantKey = `${product._id}_${v._id}`;
      return !alreadyAddedVariants.some(added => 
        added.product_id === product._id && added.variant_id === v._id?.toString()
      );
    }) || [];
    setAvailableVariants(filtered);
  }, [product, alreadyAddedVariants]);

  const handleConfirm = () => {
    if (selectedVariant && selectedSize) {
      const sizeDetail = selectedVariant.moreDetails.find(md => md._id === selectedSize);
      const { originalPrice, currentPrice, isDiscounted } = calculateEffectivePrice(product, selectedVariant, sizeDetail);
      
      onConfirm({
        product,
        variant: selectedVariant,
        sizeDetail,
        price: currentPrice
      });
    }
  };

  const getAvailableSizes = (variant) => {
    if (!variant) return [];
    return variant.moreDetails?.filter(md => {
      const sizeKey = `${product._id}_${variant._id}_${md._id}`;
      return !alreadyAddedVariants.some(added => 
        added.product_id === product._id && 
        added.variant_id === variant._id?.toString() && 
        added.size_id === md._id?.toString()
      );
    }) || [];
  };

  const selectedVariantObj = availableVariants.find(v => v._id === selectedVariant);
  const availableSizes = selectedVariantObj ? getAvailableSizes(selectedVariantObj) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Select Variant & Size for {product.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {availableVariants.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                All variants of this product are already in the order
              </p>
            </div>
          ) : (
            <>
              {/* Variant Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select Variant (Color)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableVariants.map((variant) => {
                    const { originalPrice, currentPrice, isDiscounted } = calculateEffectivePrice(product, variant);
                    return (
                      <button
                        key={variant._id}
                        onClick={() => {
                          setSelectedVariant(variant._id);
                          setSelectedSize(null); // Reset size when variant changes
                        }}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedVariant === variant._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {variant.variantImage && (
                          <img
                            src={variant.variantImage}
                            alt={variant.colorName}
                            className="w-full h-20 object-cover rounded-md mb-2"
                          />
                        )}
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {variant.colorName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {isDiscounted ? (
                            <>
                              <span className="line-through">₹{originalPrice}</span>{' '}
                              <span className="text-green-600 dark:text-green-400 font-semibold">₹{currentPrice}</span>
                            </>
                          ) : (
                            `₹${currentPrice}`
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              {selectedVariant && availableSizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Select Size
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSizes.map((sizeDetail) => {
                      const { originalPrice, currentPrice, isDiscounted } = calculateEffectivePrice(product, selectedVariantObj, sizeDetail);
                      const sizeString = `${sizeDetail.size.length} × ${sizeDetail.size.breadth} × ${sizeDetail.size.height} ${sizeDetail.size.unit}`;
                      
                      return (
                        <button
                          key={sizeDetail._id}
                          onClick={() => setSelectedSize(sizeDetail._id)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            selectedSize === sizeDetail._id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {sizeString}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Stock: {sizeDetail.stock}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {isDiscounted ? (
                              <>
                                <span className="line-through">₹{originalPrice}</span>{' '}
                                <span className="text-green-600 dark:text-green-400 font-semibold">₹{currentPrice}</span>
                              </>
                            ) : (
                              `₹${currentPrice}`
                            )}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedVariant && availableSizes.length === 0 && (
                <div className="text-center py-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    All sizes of this variant are already in the order
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {availableVariants.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedVariant || !selectedSize}
                className="dark:text-gray-400 flex-1 px-4 py-2 bg-blue-600 text-green-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Quantity Input Modal
const QuantityInputModal = ({ selectedProducts, onClose, onConfirm }) => {
  const [quantities, setQuantities] = useState({});
  const [commonQuantity, setCommonQuantity] = useState('');
  const [useCommon, setUseCommon] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initial = {};
    selectedProducts.forEach(item => {
      initial[item.uniqueKey] = '';
    });
    setQuantities(initial);
  }, [selectedProducts]);

  const handleIndividualQuantityChange = (uniqueKey, value) => {
    setQuantities(prev => ({ ...prev, [uniqueKey]: value }));
  };

  const handleCommonQuantityChange = (value) => {
    setCommonQuantity(value);
  };

const validateAndConfirm = () => {
  const newErrors = {};
  const finalQuantities = {};

  selectedProducts.forEach(item => {
    // Priority: individual quantity if filled, otherwise common quantity
    const individualQty = quantities[item.uniqueKey];
    const qty = individualQty && individualQty.trim() !== '' 
      ? parseInt(individualQty) 
      : parseInt(commonQuantity);
    
    if (!qty || qty <= 0) {
      newErrors[item.uniqueKey] = 'Please enter quantity in either common or individual field';
      return;
    }

    // Check stock
    if (item.product.hasVariants) {
      if (qty > item.sizeDetail.stock) {
        newErrors[item.uniqueKey] = `Insufficient stock. Available: ${item.sizeDetail.stock}`;
        return;
      }
    } else {
      if (qty > item.product.stock) {
        newErrors[item.uniqueKey] = `Insufficient stock. Available: ${item.product.stock}`;
        return;
      }
    }

    finalQuantities[item.uniqueKey] = qty;
  });

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  onConfirm(finalQuantities);
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Enter Quantities
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Common Quantity */}
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
  <div className="flex items-start gap-2">
    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-blue-800 dark:text-blue-200">
      Enter common quantity to apply to all products, or enter individual quantities. Individual quantities take priority over common quantity.
    </p>
  </div>
</div>

          {/* Individual Quantities */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Individual Quantities
            </h4>
            <div className="space-y-3">
              {selectedProducts.map((item) => (
                <div key={item.uniqueKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={item.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {item.product.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Variant: {item.variant.colorName}
                        </p>
                      )}
                      {item.sizeDetail && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Size: {item.sizeString}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Available Stock: {item.product.hasVariants ? item.sizeDetail.stock : item.product.stock}
                      </p>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={quantities[item.uniqueKey]}
                    onChange={(e) => handleIndividualQuantityChange(item.uniqueKey, e.target.value)}
                    min="1"
                    max={item.product.hasVariants ? item.sizeDetail.stock : item.product.stock}
                    disabled={false}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 ${
                      errors[item.uniqueKey] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter quantity"
                  />
                  {errors[item.uniqueKey] && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {errors[item.uniqueKey]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {useCommon 
                  ? 'Using common quantity for all products. Enter individual quantities to override.'
                  : 'Using individual quantities. Clear them to use common quantity.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndConfirm}
              className="flex-1 px-4 py-2 bg-blue-600 text-green-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
function AddProductToOrderModal({ onClose, onAddProducts, existingProducts }) {
  const { products, loading } = useContext(ProductContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [expandedImages, setExpandedImages] = useState({});
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [currentVariantProduct, setCurrentVariantProduct] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [productsForQuantity, setProductsForQuantity] = useState([]);
  
  // Category state
  const [allCategoriesTree, setAllCategoriesTree] = useState([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categoryPath, setCategoryPath] = useState('');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://api.simplyrks.cloud/api/category/all', { withCredentials: true });
        setAllCategoriesTree(response.data);
        setAllCategoriesFlat(flattenCategories(response.data));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Update category path
  useEffect(() => {
    const pathNames = selectedCategoryIds
      .map((id) => allCategoriesFlat.find((cat) => cat._id === id)?.categoryName)
      .filter(Boolean);
    setCategoryPath(pathNames.join(' > '));
  }, [selectedCategoryIds, allCategoriesFlat]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.isActive);

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

   // Apply category filter
if (selectedCategoryIds.length > 0) {
  const lastSelectedId = selectedCategoryIds[selectedCategoryIds.length - 1];
  filtered = filtered.filter(p => {
    // Check both mainCategory and subCategory
    const mainCatMatch = p.mainCategory && (
      p.mainCategory === lastSelectedId || 
      p.mainCategory._id === lastSelectedId ||
      (typeof p.mainCategory === 'object' && p.mainCategory._id === lastSelectedId)
    );
    
    const subCatMatch = p.subCategory && (
      p.subCategory === lastSelectedId || 
      p.subCategory._id === lastSelectedId ||
      (typeof p.subCategory === 'object' && p.subCategory._id === lastSelectedId)
    );
    
    return mainCatMatch || subCatMatch;
  });
}

    return filtered;
  }, [products, searchTerm, selectedCategoryIds]);

  // Check if product/variant already in order
  const isProductInOrder = (product) => {
    if (!product.hasVariants) {
      return existingProducts.some(ep => ep.product_id === product._id);
    }
    return false; // For products with variants, check at variant level
  };

  const handleProductSelect = (product) => {
    if (product.hasVariants) {
      setCurrentVariantProduct(product);
      setShowVariantModal(true);
    } else {
      // Toggle selection for products without variants
      setSelectedProducts(prev => {
        const exists = prev.find(p => p.uniqueKey === product._id);
        if (exists) {
          return prev.filter(p => p.uniqueKey !== product._id);
        } else {
          const { currentPrice } = calculateEffectivePrice(product);
          return [...prev, {
            uniqueKey: product._id,
            product,
            variant: null,
            sizeDetail: null,
            imageUrl: product.image,
            price: currentPrice,
            sizeString: null
          }];
        }
      });
    }
  };

  const handleVariantConfirm = ({ product, variant, sizeDetail, price }) => {
    const uniqueKey = `${product._id}_${variant._id}_${sizeDetail._id}`;
    const sizeString = `${sizeDetail.size.length} × ${sizeDetail.size.breadth} × ${sizeDetail.size.height} ${sizeDetail.size.unit}`;
    
    setSelectedProducts(prev => [...prev, {
      uniqueKey,
      product,
      variant,
      sizeDetail,
      imageUrl: variant.variantImage || product.image,
      price,
      sizeString
    }]);
    
    setShowVariantModal(false);
    setCurrentVariantProduct(null);
  };

  const handleAddQuantity = () => {
    setProductsForQuantity(selectedProducts);
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = (quantities) => {
    const productsToAdd = selectedProducts.map(item => {
      const qty = quantities[item.uniqueKey];
      return {
        image_url: item.imageUrl,
        product_id: item.product._id,
        product_name: item.product.name,
        variant_id: item.variant?._id || null,
        variant_name: item.variant?.colorName || null,
        size_id: item.sizeDetail?._id || null,
        size: item.sizeString,
        quantity: qty,
        price: item.price,
        total: item.price * qty,
        cash_applied: 0
      };
    });

    onAddProducts(productsToAdd);
    onClose();
  };

  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean);
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level);
    }
    setSelectedCategoryIds(newSelectedCategoryIds);
  };

  const renderCategoryDropdowns = () => {
    const dropdowns = [];
    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id);
    
    dropdowns.push(
      <select
      key="category-dropdown-0"
        value={selectedCategoryIds[0] || ""}
        onChange={(e) => handleCategorySelect(0, e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">All Categories</option>
        {mainCategoryOptions.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.categoryName}
          </option>
        ))}
      </select>
    );

    const lastSelectedCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1];
    const lastSelectedCategoryInTree = findCategoryInTree(lastSelectedCategoryId, allCategoriesTree);
    const subCategoryOptions = lastSelectedCategoryInTree ? lastSelectedCategoryInTree.subcategories || [] : [];

    if (selectedCategoryIds.length > 0 && subCategoryOptions.length > 0) {
      dropdowns.push(
        <select
          key="category-dropdown-sub"
          value={selectedCategoryIds[selectedCategoryIds.length] || ""}
          onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Select sub category</option>
          {subCategoryOptions.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      );
    }

    return dropdowns;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryIds([]);
    setCategoryPath('');
  };

  const isSelected = (product) => {
    if (product.hasVariants) {
      return selectedProducts.some(sp => sp.product._id === product._id);
    }
    return selectedProducts.some(sp => sp.uniqueKey === product._id);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Add Products to Order</h2>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {renderCategoryDropdowns()}
                {(searchTerm || selectedCategoryIds.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Category Path */}
              {categoryPath && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Category Path:</span>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                    {categoryPath.split(' > ').map((cat, idx, arr) => (
                      <React.Fragment key={idx}>
                        <button
                          onClick={() => {
                            const newIds = selectedCategoryIds.slice(0, idx + 1);
                            setSelectedCategoryIds(newIds);
                          }}
                          className="hover:underline"
                        >
                          {cat}
                        </button>
                        {idx < arr.length - 1 && <ChevronRight className="h-4 w-4" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchTerm || selectedCategoryIds.length > 0
                    ? 'No products found matching your criteria'
                    : 'No products available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isSelected={isSelected(product)}
                    onSelect={handleProductSelect}
                    alreadyInOrder={isProductInOrder(product)}
                    isExpanded={expandedImages[product._id]}
                    onToggleExpand={() => setExpandedImages(prev => ({
                      ...prev,
                      [product._id]: !prev[product._id]
                    }))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProducts.length > 0 ? (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {selectedProducts.length} product(s) selected
                  </span>
                ) : (
                  <span>Select products to add to order</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuantity}
                  disabled={selectedProducts.length === 0}
                  className="px-6 py-2 dark:text-gray-400 bg-blue-600 text-blue-900 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Quantity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && currentVariantProduct && (
        <VariantSelectionModal
          product={currentVariantProduct}
          onClose={() => {
            setShowVariantModal(false);
            setCurrentVariantProduct(null);
          }}
          onConfirm={handleVariantConfirm}
          alreadyAddedVariants={[...existingProducts, ...selectedProducts]}
        />
      )}

      {/* Quantity Input Modal */}
      {showQuantityModal && (
        <QuantityInputModal
          selectedProducts={productsForQuantity}
          onClose={() => setShowQuantityModal(false)}
          onConfirm={handleQuantityConfirm}
        />
      )}
    </>
  );
}

export default AddProductToOrderModal;