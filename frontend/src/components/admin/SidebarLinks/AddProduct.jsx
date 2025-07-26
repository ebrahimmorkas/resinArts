import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import axios from 'axios';

const PriceRangeSection = React.memo(({
  ranges,
  onRangeChange,
  onAddRange,
  onRemoveRange,
  title,
  isRequired = false,
  disabled = false,
  isBasePrice = false,
  isSizeOrPricing = false
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
        <div key={range._id || `range-${index}`} className="bg-white p-3 rounded-md border border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Retail Price {index === 0 && isRequired ? '*' : ''}
              </label>
              <input
                type="number"
                value={range.retailPrice}
                onChange={(e) => onRangeChange(index, 'retailPrice', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required={index === 0}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Wholesale Price {index === 0 && isRequired ? '*' : ''}
              </label>
              <input
                type="number"
                value={range.wholesalePrice}
                onChange={(e) => onRangeChange(index, 'wholesalePrice', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required={index === 0 && isRequired}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Threshold Quantity {index === 0 && isRequired ? '*' : ''}
              </label>
              <input
                type="number"
                value={range.thresholdQuantity}
                onChange={(e) => onRangeChange(index, 'thresholdQuantity', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
                min="1"
                required={index === 0 && isRequired}
                disabled={disabled}
              />
              <p className="text-sm text-gray-500 mt-1">This number will be included</p>
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
  </div>
));

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    categoryPath: [],
  });

  const [errors, setErrors] = useState({});
  const [details, setDetails] = useState([
    { name: '', value: '' },
    { name: '', value: '' },
    { name: '', value: '' },
  ]);
  const [colorVariants, setColorVariants] = useState([
    {
      color: '',
      image: null,
      price: '',
      isDefault: true,
      optionalDetails: [],
    },
  ]);
  const [sizeVariants, setSizeVariants] = useState([
    {
      size: '',
      price: '',
      optionalDetails: [],
      priceRanges: [{ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }],
      isDefault: true,
      useDimensions: false,
      length: '',
      breadth: '',
      height: '',
      forAllColors: 'yes',
      availableColors: [],
    },
  ]);
  const [pricingSections, setPricingSections] = useState([
    { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [{ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }] },
  ]);
  const [basePriceRanges, setBasePriceRanges] = useState([
    { retailPrice: '', wholesalePrice: '', thresholdQuantity: '' },
  ]);
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching categories from /api/category/all...');
      const response = await axios.get('http://localhost:3000/api/category/all', { withCredentials: true });
      const categoriesData = response.data;
      console.log('Fetched categories:', JSON.stringify(categoriesData, null, 2));

      if (!Array.isArray(categoriesData)) {
        throw new Error('Invalid category data received');
      }

      setCategories(categoriesData);

      const mainCats = categoriesData.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id);
      setMainCategories(mainCats);
      console.log('Main categories set:', mainCats);

      let allCategories = [...categoriesData];
      categoriesData.forEach((cat) => {
        if (cat.subcategories && Array.isArray(cat.subcategories)) {
          allCategories = [...allCategories, ...cat.subcategories];
        }
      });
      setCategories(allCategories);
      console.log('All categories set:', allCategories);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      setFetchError('Failed to load categories. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleMainCategoryChange = useCallback((e) => {
    const selectedId = e.target.value;
    console.log('Main category selected:', selectedId);

    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        category: '',
        categoryPath: [],
      }));
      setSelectedPath([]);
      setSubCategoryOptions([]);
      setErrors((prev) => ({ ...prev, category: '' }));
      console.log('Cleared category selection');
      return;
    }

    const selectedCategory = categories.find((cat) => cat._id === selectedId);
    if (!selectedCategory) {
      console.error('Selected main category not found:', selectedId);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryPath: [selectedId],
    }));
    setSelectedPath([selectedCategory]);

    let subs = selectedCategory.subcategories || [];
    if (subs.length === 0) {
      subs = categories.filter((cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId);
    }
    setSubCategoryOptions(subs);
    console.log('Subcategory options set:', subs);
    setErrors((prev) => ({ ...prev, category: '' }));
  }, [categories]);

  const handleSubCategoryChange = useCallback((e) => {
    const selectedId = e.target.value;
    console.log('Subcategory selected:', selectedId);

    if (!selectedId) {
      const parentCategory = selectedPath[0];
      setFormData((prev) => ({
        ...prev,
        category: parentCategory._id,
        categoryPath: [parentCategory._id],
      }));
      setSelectedPath([parentCategory]);
      let subs = parentCategory.subcategories || [];
      if (subs.length === 0) {
        subs = categories.filter((cat) => cat.parentCategoryId === parentCategory._id || cat.parent_category_id === parentCategory._id);
      }
      setSubCategoryOptions(subs);
      console.log('Reset to main category subcategories:', subs);
      return;
    }

    let selectedCategory = subCategoryOptions.find((cat) => cat._id === selectedId);
    if (!selectedCategory) {
      selectedCategory = categories.find((cat) => cat._id === selectedId);
    }
    if (!selectedCategory) {
      console.error('Selected subcategory not found:', selectedId);
      return;
    }

    const newSelectedPath = [...selectedPath, selectedCategory];
    setFormData((prev) => ({
      ...prev,
      category: selectedId,
      categoryPath: newSelectedPath.map((cat) => cat._id),
    }));
    setSelectedPath(newSelectedPath);

    let subs = selectedCategory.subcategories || [];
    if (subs.length === 0) {
      subs = categories.filter((cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId);
    }
    setSubCategoryOptions(subs);
    console.log('New subcategory options:', subs);
  }, [categories, selectedPath, subCategoryOptions]);

  const handleBreadcrumbClick = useCallback((index) => {
    console.log('Breadcrumb clicked:', index);
    const newSelectedPath = selectedPath.slice(0, index + 1);
    setSelectedPath(newSelectedPath);
    const lastCategory = newSelectedPath[newSelectedPath.length - 1];
    let subs = lastCategory.subcategories || [];
    if (subs.length === 0) {
      subs = categories.filter((cat) => cat.parentCategoryId === lastCategory._id || cat.parent_category_id === lastCategory._id);
    }
    setSubCategoryOptions(subs);
    setFormData((prev) => ({
      ...prev,
      category: lastCategory._id,
      categoryPath: newSelectedPath.map((cat) => cat._id),
    }));
    console.log('Breadcrumb path updated:', newSelectedPath, 'Subcategories:', subs);
  }, [categories, selectedPath]);

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
        {index < selectedPath.length - 1 && <span className="mx-1">&gt;</span>}
      </span>
    ));
  };

  const renderCategoryDropdowns = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Main Category *</label>
          <select
            value={selectedPath[0]?._id || ''}
            onChange={handleMainCategoryChange}
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
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>
        {subCategoryOptions.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
            <select
              value={selectedPath[selectedPath.length - 1]?._id || ''}
              onChange={handleSubCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">Select Subcategory</option>
              {subCategoryOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const isBasePriceFilled = !!formData.price;

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBasePriceRangeChange = useCallback((index, field, value) => {
    setBasePriceRanges((prev) => {
      const updatedRanges = [...prev];
      updatedRanges[index][field] = value;
      return updatedRanges;
    });
  }, []);

  const addBasePriceRange = () => {
    setBasePriceRanges([...basePriceRanges, { retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }]);
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

  const handleColorVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex][field] = value;
    if (field === 'isDefault' && value) {
      updatedVariants.forEach((variant, index) => {
        variant.isDefault = index === variantIndex;
      });
    }
    if (field === 'price' && value === '0') {
      updatedVariants[variantIndex][field] = '';
    }
    setColorVariants(updatedVariants);
    setErrors((prev) => ({ ...prev, [`color_${variantIndex}`]: '' }));
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

  const handleSizeVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex][field] = value;
    if (field === 'isDefault' && value) {
      updatedVariants.forEach((variant, index) => {
        variant.isDefault = index === variantIndex;
      });
    }
    if (field === 'price' && value === '0') {
      updatedVariants[variantIndex][field] = '';
    }
    if (field === 'forAllColors' && value === 'yes') {
      updatedVariants[variantIndex].availableColors = [];
    }
    setSizeVariants(updatedVariants);
    setErrors((prev) => ({ ...prev, [`size_${variantIndex}`]: '' }));
  };

  const handleSizeAvailableColorsChange = (variantIndex, color) => {
    const updatedVariants = [...sizeVariants];
    const currentColors = updatedVariants[variantIndex].availableColors;
    if (currentColors.includes(color)) {
      updatedVariants[variantIndex].availableColors = currentColors.filter((c) => c !== color);
    } else {
      updatedVariants[variantIndex].availableColors = [...currentColors, color];
    }
    setSizeVariants(updatedVariants);
    setErrors((prev) => ({ ...prev, [`size_${variantIndex}`]: '' }));
  };

  const toggleDimensions = (variantIndex) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].useDimensions = !updatedVariants[variantIndex].useDimensions;
    if (!updatedVariants[variantIndex].useDimensions) {
      updatedVariants[variantIndex].length = '';
      updatedVariants[variantIndex].breadth = '';
      updatedVariants[variantIndex].height = '';
      updatedVariants[variantIndex].size = '';
    } else {
      updatedVariants[variantIndex].size = '';
    }
    setSizeVariants(updatedVariants);
  };

  const handleSizePriceRangeChange = useCallback((variantIndex, rangeIndex, field, value) => {
    setSizeVariants((prev) => {
      const updatedVariants = [...prev];
      updatedVariants[variantIndex].priceRanges[rangeIndex][field] = value;
      return updatedVariants;
    });
  }, []);

  const addSizePriceRange = (variantIndex) => {
    const updatedVariants = [...sizeVariants];
    updatedVariants[variantIndex].priceRanges.push({ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' });
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
      {
        size: '',
        price: '',
        optionalDetails: [],
        priceRanges: [{ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }],
        isDefault: false,
        useDimensions: false,
        length: '',
        breadth: '',
        height: '',
        forAllColors: 'yes',
        availableColors: [],
      },
    ]);
  };

  const removeSizeVariant = (index) => {
    if (sizeVariants.length > 1) {
      setSizeVariants(sizeVariants.filter((_, i) => i !== index));
    }
  };

  const handlePricingSectionChange = (index, field, value) => {
    const updatedPricing = [...pricingSections];
    updatedPricing[index][field] = value;
    if (field === 'price' && value === '0') {
      updatedPricing[index][field] = '';
    }
    setPricingSections(updatedPricing);
  };

  const handlePricingSectionPriceRangeChange = useCallback((sectionIndex, rangeIndex, field, value) => {
    setPricingSections((prev) => {
      const updatedPricing = [...prev];
      updatedPricing[sectionIndex].priceRanges[rangeIndex][field] = value;
      return updatedPricing;
    });
  }, []);

  const addPricingSectionPriceRange = (sectionIndex) => {
    const updatedPricing = [...pricingSections];
    updatedPricing[sectionIndex].priceRanges.push({ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' });
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
      { color: '', size: '', price: '', wholesalePrice: '', thresholdQuantity: '', priceRanges: [{ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }] },
    ]);
  };

  const removePricingSection = (index) => {
    if (pricingSections.length > 1) {
      setPricingSections(pricingSections.filter((_, i) => i !== index));
    }
  };

  const isVariantEmpty = (variant, type) => {
    if (type === 'color') {
      return (
        !variant.color &&
        !variant.image &&
        !variant.price &&
        !variant.isDefault &&
        variant.optionalDetails.every((detail) => !detail.name && !detail.value)
      );
    } else if (type === 'size') {
      return (
        !variant.size &&
        !variant.price &&
        !variant.isDefault &&
        !variant.length &&
        !variant.breadth &&
        !variant.height &&
        !variant.availableColors.length &&
        variant.optionalDetails.every((detail) => !detail.name && !detail.value) &&
        variant.priceRanges.every((range) => !range.retailPrice && !range.wholesalePrice && !range.thresholdQuantity)
      );
    } else if (type === 'pricingSection') {
      return (
        !variant.color &&
        !variant.size &&
        !variant.price &&
        !variant.wholesalePrice &&
        !variant.thresholdQuantity &&
        variant.priceRanges.every((range) => !range.retailPrice && !range.wholesalePrice && !range.thresholdQuantity)
      );
    } else if (type === 'basePriceRange') {
      return !variant.retailPrice && !variant.wholesalePrice && !variant.thresholdQuantity;
    } else if (type === 'detail') {
      return !variant.name && !variant.value;
    }
    return true;
  };

  const validateSizeVariants = () => {
    const useDimensions = sizeVariants.some((variant) => variant.useDimensions);
    const useDropdown = sizeVariants.some((variant) => !variant.useDimensions && variant.size);

    if (useDimensions && useDropdown) {
      return 'All size variants must use either the size dropdown or dimensions, not both.';
    }

    const errors = {};
    sizeVariants.forEach((variant, index) => {
      if (useDimensions) {
        if (!variant.length || !variant.breadth || !variant.height) {
          errors[`size_${index}`] = 'Length, Breadth, and Height are required for all size variants.';
        }
      } else if (!variant.size) {
        errors[`size_${index}`] = 'Size is required for all size variants.';
      }
      if (variant.forAllColors === 'no' && !variant.availableColors.length) {
        errors[`size_${index}`] = 'At least one color must be selected if not available for all colors.';
      }
    });

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleSubmit = async () => {
    setErrors({});

    const newErrors = {};
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price && !colorVariants.some((v) => v.price) && !sizeVariants.some((v) => v.price)) {
      newErrors.price = 'Base price or variant prices are required';
    }
    if (!colorVariants[0].color) newErrors.color_0 = 'At least one color variant is required';

    const sizeErrors = validateSizeVariants();
    if (sizeErrors) {
      if (typeof sizeErrors === 'string') {
        setErrors({ size: sizeErrors });
        setShowErrorModal(true);
        return;
      } else {
        Object.assign(newErrors, sizeErrors);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('categoryPath', JSON.stringify(formData.categoryPath));

      const filteredDetails = details.filter((detail) => !isVariantEmpty(detail, 'detail'));
      formDataToSend.append('details', JSON.stringify(filteredDetails));

      const filteredColorVariants = colorVariants.filter((variant) => !isVariantEmpty(variant, 'color'));
      filteredColorVariants.forEach((variant, index) => {
        if (variant.image) {
          formDataToSend.append('colorImages', variant.image);
        }
      });
      formDataToSend.append('colorVariants', JSON.stringify(filteredColorVariants.map(({ image, ...rest }) => rest)));

      const filteredSizeVariants = sizeVariants.filter((variant) => !isVariantEmpty(variant, 'size'));
      formDataToSend.append('sizeVariants', JSON.stringify(filteredSizeVariants));

      const filteredPricingSections = pricingSections.filter((section) => !isVariantEmpty(section, 'pricingSection'));
      formDataToSend.append('pricingSections', JSON.stringify(filteredPricingSections));

      const filteredBasePriceRanges = basePriceRanges.filter((range) => !isVariantEmpty(range, 'basePriceRange'));
      formDataToSend.append('basePriceRanges', JSON.stringify(filteredBasePriceRanges));

      await axios.post('http://localhost:3000/api/product/add', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setIsSubmitting(false);
      setShowSuccessModal(true);

      setFormData({ name: '', price: '', stock: '', category: '', categoryPath: [] });
      setDetails([{ name: '', value: '' }, { name: '', value: '' }, { name: '', value: '' }]);
      setColorVariants([{ color: '', image: null, price: '', isDefault: true, optionalDetails: [] }]);
      setSizeVariants([
        {
          size: '',
          price: '',
          optionalDetails: [],
          priceRanges: [{ retailPrice: '', wholesalePrice: '', thresholdQuantity: '' }],
          isDefault: true,
          useDimensions: false,
          length: '',
          breadth: '',
          height: '',
          forAllColors: 'yes',
          availableColors: [],
        },
      ]);
      setPricingSections([]);
      setBasePriceRanges([]);
      setSelectedPath([]);
      setSubCategoryOptions([]);
    } catch (error) {
      console.error('Error adding product:', error);
      setIsSubmitting(false);
      setShowErrorModal(true);
      setErrors((prev) => ({
        ...prev,
        server: error.response?.data?.error || 'Failed to add product. Please try again.',
      }));
    }
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-green-600 mb-4">Product Added Successfully!</h3>
        <p className="text-gray-600 mb-6">Your product has been added to the inventory.</p>
        <button
          onClick={() => setShowSuccessModal(false)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  const ErrorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Product Not Added</h3>
        <p className="text-gray-600 mb-6">Please check the errors below and try again.</p>
        <ul className="text-gray-600 mb-6">
          {Object.entries(errors).map(([key, value]) => (
            <li key={key} className="text-sm">{value}</li>
          ))}
        </ul>
        <button
          onClick={() => setShowErrorModal(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
      {fetchError && (
        <div className="text-center py-8">
          <p className="text-red-500">{fetchError}</p>
          <button
            onClick={fetchCategories}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !fetchError && (
        <div>
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-white text-lg">Adding your product...</p>
              </div>
            </div>
          )}
          {showSuccessModal && <SuccessModal />}
          {showErrorModal && <ErrorModal />}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Add New Product</h1>
            <p className="text-gray-500 text-base">Complete the form below to add a new product to your inventory</p>
          </div>

          <div className="space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter product name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value === '0' ? '' : e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleFormChange('stock', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="0"
                    min="0"
                    required
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                </div>
              </div>
              {formData.price && (
                <PriceRangeSection
                  ranges={basePriceRanges}
                  onRangeChange={handleBasePriceRangeChange}
                  onAddRange={addBasePriceRange}
                  onRemoveRange={removeBasePriceRange}
                  title="Price Ranges"
                  isRequired={true}
                  isBasePrice={true}
                />
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Category Selection</h2>
              {categories.length > 0 ? (
                <div className="space-y-4">
                  {renderCategoryDropdowns()}
                  {selectedPath.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Product Details</h2>
              <div className="space-y-4">
                {details.map((detail, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={detail.name}
                        onChange={(e) => handleDetailChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="Detail name (e.g., Material)"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={detail.value}
                        onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="e.g., Cotton"
                      />
                    </div>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetail(index)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMoreDetails}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Plus size={16} />
                Add more details
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
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
                        {errors.color_0 && <p className="text-red-500 text-xs mt-1">{errors.color_0}</p>}
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
                      {!isBasePriceFilled && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleColorVariantChange(variantIndex, 'price', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleColorVariantChange(variantIndex, 'isDefault', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={detail.value}
                                onChange={(e) => handleColorOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => removeColorOptionalDetail(variantIndex, detailIndex)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
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
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
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
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                Add Color Variant
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Size Variants</h2>
              {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
              <div className="space-y-6">
                {sizeVariants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">Size Variant {variantIndex + 1}</h3>
                      {sizeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSizeVariant(variantIndex)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                        {!variant.useDimensions ? (
                          <div>
                            <select
                              value={variant.size}
                              onChange={(e) => handleSizeVariantChange(variantIndex, 'size', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              required
                            >
                              <option value="">Select Size</option>
                              {sizeOptions.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => toggleDimensions(variantIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Enter dimensions
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={variant.length}
                                onChange={(e) => handleSizeVariantChange(variantIndex, 'length', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Length"
                                min="0"
                                step="0.01"
                              />
                              <input
                                type="number"
                                value={variant.breadth}
                                onChange={(e) => handleSizeVariantChange(variantIndex, 'breadth', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Breadth"
                                min="0"
                                step="0.01"
                              />
                              <input
                                type="number"
                                value={variant.height}
                                onChange={(e) => handleSizeVariantChange(variantIndex, 'height', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Height"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDimensions(variantIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Use size dropdown
                            </button>
                          </div>
                        )}
                        {errors[`size_${variantIndex}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`size_${variantIndex}`]}</p>
                        )}
                      </div>
                      {!isBasePriceFilled && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleSizeVariantChange(variantIndex, 'price', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">For All Colors?</label>
                      <select
                        value={variant.forAllColors}
                        onChange={(e) => handleSizeVariantChange(variantIndex, 'forAllColors', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {variant.forAllColors === 'no' && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Colors *</label>
                        <div className="relative">
                          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white space-y-2">
                            {colorVariants.map((colorVariant, index) => (
                              <div key={index} className="flex items-center">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.availableColors.includes(colorVariant.color)}
                                    onChange={() => handleSizeAvailableColorsChange(variantIndex, colorVariant.color)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    disabled={!colorVariant.color}
                                  />
                                  <span>{colorVariant.color || `Color ${index + 1}`}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleSizeVariantChange(variantIndex, 'isDefault', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">Set as default variant</span>
                      </label>
                    </div>
                    {!isBasePriceFilled && variant.price && (
                      <PriceRangeSection
                        ranges={variant.priceRanges}
                        onRangeChange={(rangeIndex, field, value) =>
                          handleSizePriceRangeChange(variantIndex, rangeIndex, field, value)
                        }
                        onAddRange={() => addSizePriceRange(variantIndex)}
                        onRemoveRange={(rangeIndex) => removeSizePriceRange(variantIndex, rangeIndex)}
                        title={`Price Range for ${variant.size || 'Size ' + (variantIndex + 1)}`}
                        isRequired={true}
                        isSizeOrPricing={true}
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
                                onChange={(e) => handleSizeOptionalDetailChange(variantIndex, detailIndex, 'name', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={detail.value}
                                onChange={(e) => handleSizeOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => removeSizeOptionalDetail(variantIndex, detailIndex)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
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
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <Plus size={16} />
                      Add optional details
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSizeVariant}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                Add Size Variant
              </button>
            </div>

            {isBasePriceFilled && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
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
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                          <select
                            value={section.color}
                            onChange={(e) => handlePricingSectionChange(index, 'color', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          >
                            <option value="">Select Size</option>
                            {sizeVariants.map((variant, i) => (
                              <option key={i} value={variant.size || `${variant.length}x${variant.breadth}x${variant.height}`}>
                                {variant.size || `${variant.length}x${variant.breadth}x${variant.height}` || 'Size ' + (i + 1)}
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Wholesale Price</label>
                          <input
                            type="number"
                            value={section.wholesalePrice || ''}
                            onChange={(e) => handlePricingSectionChange(index, 'wholesalePrice', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Threshold Quantity</label>
                          <input
                            type="number"
                            value={section.thresholdQuantity || ''}
                            onChange={(e) => handlePricingSectionChange(index, 'thresholdQuantity', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="10"
                            min="1"
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
                          isRequired={true}
                          isSizeOrPricing={true}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPricingSection}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus size={16} />
                  Add Pricing Combination
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 px-6 text-white rounded-lg transition-colors duration-200 ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Adding Product...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;