import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    subCategory: ''
  });

  const [details, setDetails] = useState([
    { name: '', value: '' },
    { name: '', value: '' },
    { name: '', value: '' }
  ]);

  const [colorVariants, setColorVariants] = useState([
    {
      color: '',
      image: null,
      price: '',
      isDefault: false,
      optionalDetails: []
    }
  ]);

  const [sizeVariants, setSizeVariants] = useState([
    { size: '', price: '', optionalDetails: [] },
    { size: '', price: '', optionalDetails: [] },
    { size: '', price: '', optionalDetails: [] },
    { size: '', price: '', optionalDetails: [] }
  ]);

  const [pricingSections, setPricingSections] = useState([
    { color: '', size: '', price: '' },
    { color: '', size: '', price: '' },
    { color: '', size: '', price: '' },
    { color: '', size: '', price: '' }
  ]);

  // Dummy category data
  const categories = [
    { id: '1', name: 'Clothing' },
    { id: '2', name: 'Electronics' },
    { id: '3', name: 'Home & Garden' }
  ];

  const subCategories = {
    '1': ['T-Shirts', 'Jeans', 'Jackets'],
    '2': ['Phones', 'Laptops', 'Accessories'],
    '3': ['Furniture', 'Decor', 'Appliances']
  };

  // Pricing validation logic
  const isBasePriceFilled = !!formData.price;
  const isAnyColorPriceFilled = colorVariants.some(variant => variant.price);
  const isAnySizePriceFilled = sizeVariants.some(variant => variant.price);
  const isPricingSectionEnabled = !isBasePriceFilled && !isAnyColorPriceFilled && !isAnySizePriceFilled;

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    setColorVariants(updatedVariants);
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
        optionalDetails: []
      }
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
    setSizeVariants(updatedVariants);
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
      { size: '', price: '', optionalDetails: [] }
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
    setPricingSections(updatedPricing);
  };

  const addPricingSection = () => {
    setPricingSections([...pricingSections, { color: '', size: '', price: '' }]);
  };

  const removePricingSection = (index) => {
    if (pricingSections.length > 1) {
      setPricingSections(pricingSections.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    console.log('Form Data:', formData);
    console.log('Details:', details);
    console.log('Color Variants:', colorVariants);
    console.log('Size Variants:', sizeVariants);
    console.log('Pricing Sections:', pricingSections);
    // Handle form submission here
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-b from-gray-50 to-white shadow-xl rounded-2xl">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Add New Product</h1>
        <p className="text-gray-500 text-lg">Complete the form below to add a new product to your inventory</p>
      </div>

      <div className="space-y-10">
        {/* Basic Product Info */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                disabled={isAnyColorPriceFilled || isAnySizePriceFilled}
              />
            </div>
          </div>
        </div>

        {/* Category Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Category *
              </label>
              <select
                value={formData.subCategory}
                onChange={(e) => handleFormChange('subCategory', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                required
                disabled={!formData.category}
              >
                <option value="">Select sub-category</option>
                {formData.category && subCategories[formData.category]?.map((subCategory, index) => (
                  <option key={index} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Product Details</h2>
          
          <div className="space-y-4">
            {details.map((detail, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={detail.name}
                    onChange={(e) => handleDetailChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Detail name (e.g., Material)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={detail.value}
                    onChange={(e) => handleDetailChange(index, 'value', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Detail value (e.g., Cotton)"
                  />
                </div>
                {details.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDetail(index)}
                    className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
            className="mt-4 flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
          >
            <Plus size={16} />
            Add more details
          </button>
        </div>

        {/* Color Variants Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Color Variants</h2>
          
          <div className="space-y-6">
            {colorVariants.map((variant, variantIndex) => (
              <div key={variantIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Color Variant {variantIndex + 1}
                  </h3>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'color', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Red, Blue, #FF5733"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleImageUpload(variantIndex, e)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      accept="image/*"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (for all sizes)
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleColorVariantChange(variantIndex, 'price', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
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
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Set as default variant</span>
                  </label>
                </div>

                {variant.optionalDetails.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Details for this Variant</h4>
                    <div className="space-y-2">
                      {variant.optionalDetails.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) => handleColorOptionalDetailChange(variantIndex, detailIndex, 'name', e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Detail name"
                          />
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) => handleColorOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Detail value"
                          />
                          <button
                            type="button"
                            onClick={() => removeColorOptionalDetail(variantIndex, detailIndex)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                >
                  <Plus size={14} />
                  Add optional details for this variant
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addColorVariant}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200 font-medium"
          >
            <Plus size={16} />
            Add Color Variant
          </button>
        </div>

        {/* Size Variants Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Size Variants</h2>
          
          <div className="space-y-6">
            {sizeVariants.map((variant, variantIndex) => (
              <div key={variantIndex} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Size Variant {variantIndex + 1}
                  </h3>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size *
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => handleSizeVariantChange(variantIndex, 'size', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., S, M, L, XL"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleSizeVariantChange(variantIndex, 'price', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={isBasePriceFilled || isAnyColorPriceFilled}
                    />
                  </div>
                </div>

                {variant.optionalDetails.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Details for this Variant</h4>
                    <div className="space-y-2">
                      {variant.optionalDetails.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) => handleSizeOptionalDetailChange(variantIndex, detailIndex, 'name', e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Detail name"
                          />
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) => handleSizeOptionalDetailChange(variantIndex, detailIndex, 'value', e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Detail value"
                          />
                          <button
                            type="button"
                            onClick={() => removeSizeOptionalDetail(variantIndex, detailIndex)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
                  className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                >
                  <Plus size={14} />
                  Add optional details for this variant
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addSizeVariant}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200 font-medium"
          >
            <Plus size={16} />
            Add Size Variant
          </button>
        </div>

        {/* Pricing Section */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pricing Combinations</h2>
          
          <div className="space-y-6">
            {pricingSections.map((section, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Pricing Combination {index + 1}
                  </h3>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={section.color}
                      onChange={(e) => handlePricingSectionChange(index, 'color', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      disabled={!isPricingSectionEnabled}
                    >
                      <option value="">Select color</option>
                      {colorVariants.map((variant, i) => (
                        <option key={i} value={variant.color}>
                          {variant.color || `Color ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={section.size}
                      onChange={(e) => handlePricingSectionChange(index, 'size', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      disabled={!isPricingSectionEnabled}
                    >
                      <option value="">Select size</option>
                      {sizeVariants.map((variant, i) => (
                        <option key={i} value={variant.size}>
                          {variant.size || `Size ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      value={section.price}
                      onChange={(e) => handlePricingSectionChange(index, 'price', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={!isPricingSectionEnabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addPricingSection}
            className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-lg transition-colors duration-200 font-medium ${
              isPricingSectionEnabled
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus size={16} />
            Add More Pricing Section
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;