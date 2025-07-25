import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import axios from 'axios';

const AddProduct = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    categoryPath: [],
  });

  // Details state
  const [details, setDetails] = useState([
    { name: '', value: '' },
    { name: '', value: '' },
    { name: '', value: '' },
  ]);

  // Color variants state
  const [colorVariants, setColorVariants] = useState([
    {
      color: '',
      image: null,
      price: '',
      isDefault: false,
      optionalDetails: [],
      priceRanges: [{ minQuantity: 1, maxQuantity: '', unitPrice: '' }],
    },
  ]);

  // Size variants state
  const [sizeVariants, setSizeVariants] = useState([
    { size: '', price: '', optionalDetails: [], priceRanges: [] },
    { size: '', price: '', optionalDetails: [], priceRanges: [] },
    { size: '', price: '', optionalDetails: [], priceRanges: [] },
    { size: '', price: '', optionalDetails: [], priceRanges: [] },
  ]);

  // Pricing sections state
  const [pricingSections, setPricingSections] = useState([
    { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [] },
    { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [] },
    { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [] },
    { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [] },
  ]);

  // Base price ranges state
  const [basePriceRanges, setBasePriceRanges] = useState([
    { minQuantity: 1, maxQuantity: '', unitPrice: '' },
  ]);

  // Category-related states
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/category/all');
      const categoriesData = response.data;
      console.log('Fetched categories:', categoriesData);
      setCategories(categoriesData);
      setMainCategories(categoriesData.filter((cat) => !cat.parent_category_id));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  // Handle main category selection
  const handleMainCategorySelect = (e) => {
    const selectedId = e.target.value;
    console.log('Main category selected:', selectedId);

    if (!selectedId) {
      setSelectedPath([]);
      setSubCategoryOptions([]);
      setFormData((prev) => ({
        ...prev,
        category: '',
        categoryPath: [],
      }));
      return;
    }

    const selectedCategory = categories.find((cat) => cat._id === selectedId);
    if (!selectedCategory) return;

    setSelectedPath([selectedCategory]);
    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryPath: [selectedId],
    }));
    setSubCategoryOptions(selectedCategory.subcategories || []);
    console.log('Subcategory options set to:', selectedCategory.subcategories || []);
  };

  // Handle subcategory selection
  const handleSubCategorySelect = (e) => {
    const selectedId = e.target.value;
    console.log('Subcategory selected:', selectedId);

    if (!selectedId) {
      const mainCategory = selectedPath[0];
      setSelectedPath([mainCategory]);
      setSubCategoryOptions(mainCategory.subcategories || []);
      setFormData((prev) => ({
        ...prev,
        category: mainCategory._id,
        categoryPath: [mainCategory._id],
      }));
      console.log('Reset to main category subcategories:', mainCategory.subcategories || []);
      return;
    }

    let selectedCategory = subCategoryOptions.find((cat) => cat._id === selectedId);
    if (!selectedCategory) {
      selectedCategory = categories.find((cat) => cat._id === selectedId);
    }
    if (!selectedCategory) {
      console.error('Selected category not found:', selectedId);
      return;
    }

    const newSelectedPath = [...selectedPath];
    newSelectedPath.push(selectedCategory);
    setSelectedPath(newSelectedPath);
    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryPath: newSelectedPath.map((cat) => cat._id),
    }));
    setSubCategoryOptions(selectedCategory.subcategories || []);
    console.log('New subcategory options:', selectedCategory.subcategories || []);
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (index) => {
    console.log('Breadcrumb clicked:', index);
    const newSelectedPath = selectedPath.slice(0, index + 1);
    setSelectedPath(newSelectedPath);
    const lastCategory = newSelectedPath[newSelectedPath.length - 1];
    setSubCategoryOptions(lastCategory.subcategories || []);
    setFormData((prev) => ({
      ...prev,
      category: lastCategory._id,
      categoryPath: newSelectedPath.map((cat) => cat._id),
    }));
    console.log('Breadcrumb path updated:', newSelectedPath);
  };

  // Render breadcrumb
  const getCategoryBreadCrumb = () => {
    return selectedPath.map((cat, index) => (
      <span key={cat._id}>
        <button
          type="button"
          onClick={() => handleBreadcrumbClick(index)}
          className="text-blue-600 hover:underline"
        >
          {cat.categoryName}
        </button>
        {index < selectedPath.length - 1 && ' > '}
      </span>
    ));
  };

  // Render category dropdowns
  const renderCategoryDropdowns = () => {
    const mainCategoryId = selectedPath[0] ? selectedPath[0]._id : '';
    const subCategoryId = selectedPath.length > 1 ? selectedPath[selectedPath.length - 1]._id : '';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Main Category *</label>
          <select
            value={mainCategoryId}
            onChange={handleMainCategorySelect}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            required
          >
            <option value="">Select Main Category</option>
            {mainCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
          <select
            value={subCategoryId}
            onChange={handleSubCategorySelect}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              !mainCategoryId ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={!mainCategoryId}
          >
            <option value="">Select Subcategory</option>
            {subCategoryOptions.map((category) => (
              <option key={category._id} value={category._id}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // Pricing validation
  const isBasePriceFilled = !!formData.price;
  const isAnyColorPriceFilled = colorVariants.some((variant) => variant.price);
  const isAnySizePriceFilled = sizeVariants.some((variant) => variant.price);
  const isPricingSectionEnabled = !isBasePriceFilled && !isAnyColorPriceFilled && !isAnySizePriceFilled;

  // Form handlers
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBasePriceRangeChange = (index, field, value) => {
    const updatedRanges = [...basePriceRanges];
    updatedRanges[index][field] = value;
    setBasePriceRanges(updatedRanges);
  };

  const addBasePriceRange = () => {
    setBasePriceRanges([...basePriceRanges, { minQuantity: '', maxQuantity: '', unitPrice: '' }]);
  };

  const removeBasePriceRange = (index) => {
    if (basePriceRanges.length > 1) {
      setBasePriceRanges(basePriceRanges.filter((_, i) => i !== index));
    }
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...details];
    updatedDetails[index][field] = value;
    setDetails(updatedDetails);
  };

  const addMoreDetails = () => {
    setDetails([...details, { name: '', value: '' }]);
  };

  const removeDetail = (index) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  // Color variant handlers
  const handleColorVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex][field] = value;
    if (field === 'isDefault' && value) {
      updatedVariants.forEach((variant, index) => {
        variant.isDefault = index === variantIndex;
      });
    }
    setColorVariants(updatedVariants);
  };

  const handleColorPriceRangeChange = (variantIndex, rangeIndex, field, value) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].priceRanges[rangeIndex][field] = value;
    setColorVariants(updatedVariants);
  };

  const addColorPriceRange = (variantIndex) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].priceRanges.push({ minQuantity: '', maxQuantity: '', unitPrice: '' });
    setColorVariants(updatedVariants);
  };

  const removeColorPriceRange = (variantIndex, rangeIndex) => {
    const updatedVariants = [...colorVariants];
    if (updatedVariants[variantIndex].priceRanges.length > 1) {
      updatedVariants[variantIndex].priceRanges = updatedVariants[variantIndex].priceRanges.filter((_, i) => i !== rangeIndex);
      setColorVariants(updatedVariants);
    }
  };

  const handleColorOptionalDetailChange = (variantIndex, detailIndex, field, value) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].optionalDetails[detailIndex][field] = value;
    setColorVariants(updatedVariants);
  };

  const addColorOptionalDetail = (variantIndex) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].optionalDetails.push({ name: '', value: '' });
    setColorVariants(updatedVariants);
  };

  const removeColorOptionalDetail = (variantIndex, detailIndex) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].optionalDetails = updatedVariants[variantIndex].optionalDetails.filter((_, i) => i !== detailIndex);
    setColorVariants(updatedVariants);
  };

  const addColorVariant = () => {
    setColorVariants([
      ...colorVariants,
      {
        color: '',
        image: null,
        price: '',
        isDefault: false,
        optionalDetails: [],
        priceRanges: [],
      },
    ]);
  };

  const removeColorVariant = (index) => {
    if (colorVariants.length > 1) {
      setColorVariants(colorVariants.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (variantIndex, event) => {
    const file = event.target.files[0];
    if (file) {
      const updatedVariants = [...colorVariants];
      updatedVariants[variantIndex].image = file;
      setColorVariants(updatedVariants);
    }
  };

  // Size variant handlers
  const handleSizeVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex][field] = value;
    setSizeVariants(updatedVariants);
  };

  const handleSizePriceRangeChange = (variantIndex, rangeIndex, field, value) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].priceRanges[rangeIndex][field] = value;
    setSizeVariants(updatedVariants);
  };

  const addSizePriceRange = (variantIndex) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].priceRanges.push({ minQuantity: '', maxQuantity: '', unitPrice: '' });
    setSizeVariants(updatedVariants);
  };

  const removeSizePriceRange = (variantIndex, rangeIndex) => {
    const updatedVariants = [...sizeVariants];
    if (updatedVariants[variantIndex].priceRanges.length > 1) {
      updatedVariants[variantIndex].priceRanges = updatedVariants[variantIndex].priceRanges.filter((_, i) => i !== rangeIndex);
      setSizeVariants(updatedVariants);
    }
  };

  const handleSizeOptionalDetailChange = (variantIndex, detailIndex, field, value) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].optionalDetails[detailIndex][field] = value;
    setSizeVariants(updatedVariants);
  };

  const addSizeOptionalDetail = (variantIndex) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].optionalDetails.push({ name: '', value: '' });
    setSizeVariants(updatedVariants);
  };

  const removeSizeOptionalDetail = (variantIndex, detailIndex) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].optionalDetails = updatedVariants[variantIndex].optionalDetails.filter((_, i) => i !== detailIndex);
    setSizeVariants(updatedVariants);
  };

  const addSizeVariant = () => {
    setSizeVariants([
      ...sizeVariants,
      { size: '', price: '', optionalDetails: [], priceRanges: [] },
    ]);
  };

  const removeSizeVariant = (index) => {
    if (sizeVariants.length > 1) {
      setSizeVariants(sizeVariants.filter((_, i) => i !== index));
    }
  };

  // Pricing section handlers
  const handlePricingSectionChange = (index, field, value) => {
    const updatedPricing = [...pricingSections];
    updatedPricing[index][field] = value;
    setPricingSections(updatedPricing);
  };

  const handlePricingSectionPriceRangeChange = (sectionIndex, rangeIndex, field, value) => {
    const updatedPricing = [...pricingSections];
    updatedPricing[sectionIndex].priceRanges[rangeIndex][field] = value;
    setPricingSections(updatedPricing);
  };

  const addPricingSectionPriceRange = (sectionIndex) => {
    const updatedPricing = [...pricingSections];
    updatedPricing[sectionIndex].priceRanges.push({ minQuantity: '', maxQuantity: '', unitPrice: '' });
    setPricingSections(updatedPricing);
  };

  const removePricingSectionPriceRange = (sectionIndex, rangeIndex) => {
    const updatedPricing = [...pricingSections];
    if (updatedPricing[sectionIndex].priceRanges.length > 1) {
      updatedPricing[sectionIndex].priceRanges = updatedPricing[sectionIndex].priceRanges.filter((_, i) => i !== rangeIndex);
      setPricingSections(updatedPricing);
    }
  };

  const addPricingSection = () => {
    setPricingSections([
      ...pricingSections,
      { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [] },
    ]);
  };

  const removePricingSection = (index) => {
    if (pricingSections.length > 1) {
      setPricingSections(pricingSections.filter((_, i) => i !== index));
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    try {
      const productData = {
        ...formData,
        details,
        colorVariants,
        sizeVariants,
        pricingSections,
        basePriceRanges,
      };
      console.log('Product Data:', productData);
      const response = await axios.post('http://localhost:3000/api/product/add', productData);
      console.log('Product added successfully:', response.data);
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    }
  };

  // Price range component
  const PriceRangeSection = ({
    ranges,
    onRangeChange,
    onAddRange,
    onRemoveRange,
    title,
    isRequired = false,
    disabled = false,
  }) => (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-blue-800">
          {title} {isRequired && <span className="text-red-500">*</span>}
        </h4>
        <button
          type="button"
          onClick={onAddRange}
          disabled={disabled}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
            disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus size={12} />
          Add Range
        </button>
      </div>
      <div className="space-y-3">
        {ranges.map((range, index) => (
          <div key={index} className="bg-white p-3 rounded-md border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Min Qty {index === 0 && isRequired ? '*' : ''}
                </label>
                <input
                  type="number"
                  value={range.minQuantity}
                  onChange={(e) => onRangeChange(index, 'minQuantity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="1"
                  required={index === 0 && isRequired}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Qty</label>
                <input
                  type="number"
                  value={range.maxQuantity}
                  onChange={(e) => onRangeChange(index, 'maxQuantity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="∞"
                  min={range.minQuantity || 1}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unit Price {index === 0 && isRequired ? '*' : ''}
                </label>
                <input
                  type="number"
                  value={range.unitPrice}
                  onChange={(e) => onRangeChange(index, 'unitPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required={index === 0 && isRequired}
                  disabled={disabled}
                />
              </div>
              <div className="flex justify-end">
                {ranges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRange(index)}
                    disabled={disabled}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      disabled ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!disabled && (
        <p className="text-xs text-blue-600 mt-2">
          💡 Set different prices for different quantity ranges (e.g., 1-10 pieces: ₹10/piece, 11-50 pieces: ₹8/piece)
        </p>
      )}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-white shadow-xl rounded-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-white shadow-xl rounded-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Add New Product</h1>
        <p className="text-gray-500 text-base">Complete the form below to add a new product to your inventory</p>
      </div>

      <div className="space-y-10">
        {/* Basic Product Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Base Price *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                disabled={isAnyColorPriceFilled || isAnySizePriceFilled}
              />
            </div>
          </div>
          {formData.price && (
            <PriceRangeSection
              ranges={basePriceRanges}
              onRangeChange={handleBasePriceRangeChange}
              onAddRange={addBasePriceRange}
              onRemoveRange={removeBasePriceRange}
              title="Bulk Pricing Tiers"
              isRequired={true}
            />
          )}
        </div>

        {/* Category Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Category Selection</h2>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {renderCategoryDropdowns()}
              {selectedPath.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Selected Category Path:</p>
                  <p className="text-blue-600 font-semibold text-lg">{getCategoryBreadCrumb()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No categories available. Please add categories first.</p>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Product Details</h2>
          <div className="space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={detail.name}
                    onChange={(e) => handleDetailChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Detail name (e.g., Material)"
                  />
                </div>
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={detail.value}
                    onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Detail value (e.g., Cotton)"
                  />
                </div>
                {details.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDetail(index)}
                    className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMoreDetails}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm"
          >
            <Plus size={16} />
            Add more details
          </button>
        </div>

        {/* Color Variants */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Color Variants</h2>
          <div className="space-y-6">
            {colorVariants.map((variant, variantIndex) => (
              <div key={variantIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">Color Variant {variantIndex + 1}</h3>
                  {colorVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColorVariant(variantIndex)}
                      className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color *</label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'color', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., Red, Blue, #FF5733"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(variantIndex, e)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      accept="image/*"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (for all sizes)</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={isBasePriceFilled || isAnySizePriceFilled}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={variant.isDefault}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'isDefault', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-semibold text-gray-700">Set as default variant</span>
                  </label>
                </div>
                {variant.optionalDetails.length > 0 && (
                  <div className="mb-4 mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Optional Details</h4>
                    <div className="space-y-2">
                      {variant.optionalDetails.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex flex-col sm:flex-row gap-2 items-start">
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) => handleColorOptionalDetailChange(variantIndex, detailIndex, 'name', e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="Detail name"
                          />
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) => handleColorOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="Detail value"
                          />
                          <button
                            type="button"
                            onClick={() => removeColorOptionalDetail(variantIndex, detailIndex)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => addColorOptionalDetail(variantIndex)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Plus size={14} />
                  Add optional details
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addColorVariant}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 text-sm"
          >
            <Plus size={16} />
            Add Color Variant
          </button>
        </div>

        {/* Size Variants */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Size Variants</h2>
          <div className="space-y-6">
            {sizeVariants.map((variant, variantIndex) => (
              <div key={variantIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">Size Variant {variantIndex + 1}</h3>
                  {sizeVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSizeVariant(variantIndex)}
                      className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => handleSizeVariantChange(variantIndex, 'size', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., S, M, L, XL"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleSizeVariantChange(variantIndex, 'price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={isBasePriceFilled || isAnyColorPriceFilled}
                    />
                  </div>
                </div>
                {variant.price && (
                  <PriceRangeSection
                    ranges={variant.priceRanges}
                    onRangeChange={(rangeIndex, field, value) =>
                      handleSizePriceRangeChange(variantIndex, rangeIndex, field, value)
                    }
                    onAddRange={() => addSizePriceRange(variantIndex)}
                    onRemoveRange={(rangeIndex) => removeSizePriceRange(variantIndex, rangeIndex)}
                    title={`Price Range for ${variant.size || 'Size ' + (variantIndex + 1)}`}
                    isRequired
                  />
                )}
                {variant.optionalDetails.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Optional Details</h4>
                    <div className="space-y-2">
                      {variant.optionalDetails.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex flex-col sm:flex-row gap-2 items-start">
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) =>
                              handleSizeOptionalDetailChange(variantIndex, detailIndex, 'name', e.target.value)
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) =>
                              handleSizeOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="Value"
                          />
                          <button
                            type="button"
                            onClick={() => removeSizeOptionalDetail(variantIndex, detailIndex)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => addSizeOptionalDetail(variantIndex)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Plus size={14} />
                  Add optional details
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSizeVariant}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 text-sm"
          >
            <Plus size={16} />
            Add Size Variant
          </button>
        </div>

        {/* Pricing Combinations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pricing Combinations</h2>
          <div className="space-y-6">
            {pricingSections.map((section, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">Pricing Combination {index + 1}</h3>
                  {pricingSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePricingSection(index)}
                      className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <select
                      value={section.color}
                      onChange={(e) => handlePricingSectionChange(index, 'color', e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      disabled={!isPricingSectionEnabled}
                    >
                      <option value="">Select Color</option>
                      {colorVariants.map((variant, i) => (
                        <option key={i} value={variant.color}>
                          {variant.color || 'Color ' + (i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                    <select
                      value={section.size}
                      onChange={(e) => handlePricingSectionChange(index, 'size', e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      disabled={!isPricingSectionEnabled}
                    >
                      <option value="">Select Size</option>
                      {sizeVariants.map((variant, i) => (
                        <option key={i} value={variant.size}>
                          {variant.size || 'Size ' + (i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Retail Price</label>
                    <input
                      type="number"
                      value={section.price}
                      onChange={(e) => handlePricingSectionChange(index, 'price', e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={!isPricingSectionEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Wholesale Price</label>
                    <input
                      type="number"
                      value={section.wholesalePrice || ''}
                      onChange={(e) => handlePricingSectionChange(index, 'wholesalePrice', e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={!isPricingSectionEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Threshold Quantity</label>
                    <input
                      type="number"
                      value={section.thresholdQuantity || ''}
                      onChange={(e) => handlePricingSectionChange(index, 'thresholdQuantity', e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="10"
                      min="1"
                      disabled={!isPricingSectionEnabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">This number will be included</p>
                  </div>
                </div>
                {section.price && (
                  <PriceRangeSection
                    ranges={section.priceRanges}
                    onRangeChange={(rangeIndex, field, value) =>
                      handlePricingSectionPriceRangeChange(index, rangeIndex, field, value)
                    }
                    onAddRange={() => addPricingSectionPriceRange(index)}
                    onRemoveRange={(rangeIndex) => removePricingSectionPriceRange(index, rangeIndex)}
                    title={`Price Range for Combination ${index + 1}`}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPricingSection}
            className={`mt-6 flex items-center gap-2 px-6 py-3 text-sm rounded-lg transition-colors duration-200 ${
              isPricingSectionEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isPricingSectionEnabled}
          >
            <Plus size={16} />
            Add Pricing Combination
          </button>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2 border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors duration-200 text-sm"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;