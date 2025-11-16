import React, { useState, useEffect } from 'react';
import { X, Ruler, Edit } from 'lucide-react';

const DimensionInputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product,
  pricingType,
  initialQuantity = 1,
  editMode = null // { isEditing: true, cartKey: '...', existingDimensions: {...} }
}) => {
  const [dimensions, setDimensions] = useState({
    length: '',
    breadth: '',
    height: ''
  });
  const [quantity, setQuantity] = useState(initialQuantity);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [error, setError] = useState('');

  // Get base dimension and check if height is required
  const baseDimension = product?.dimensions?.[0] || null;
  const hasHeight = baseDimension?.height !== null && baseDimension?.height !== undefined;
  const unit = baseDimension?.unit || 'cm';

  // Prefill dimensions if in edit mode
  useEffect(() => {
    if (isOpen) {
      if (editMode?.isEditing && editMode?.existingDimensions) {
        const existing = editMode.existingDimensions;
        setDimensions({
          length: existing.length?.toString() || '',
          breadth: existing.breadth?.toString() || '',
          height: existing.height?.toString() || ''
        });
        setQuantity(initialQuantity);
      } else {
        setDimensions({ length: '', breadth: '', height: '' });
        setQuantity(initialQuantity);
      }
      setCalculatedPrice(0);
      setError('');
    }
  }, [isOpen, editMode, initialQuantity]);

  useEffect(() => {
    if (dimensions.length && dimensions.breadth) {
      if (hasHeight && !dimensions.height) {
        setCalculatedPrice(0);
        return;
      }
      calculatePrice();
    }
  }, [dimensions, baseDimension]);

  const calculatePrice = () => {
    if (!baseDimension) return;

    const length = parseFloat(dimensions.length) || 0;
    const breadth = parseFloat(dimensions.breadth) || 0;
    const height = hasHeight ? (parseFloat(dimensions.height) || 0) : 1;

    if (length <= 0 || breadth <= 0 || (hasHeight && height <= 0)) {
      setCalculatedPrice(0);
      return;
    }

    const userCubicMeasure = length * breadth * height;
    const baseUnitPrice = baseDimension.price;
    const finalPrice = baseUnitPrice * userCubicMeasure;
    
    setCalculatedPrice(finalPrice);
  };

  const handleInputChange = (field, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDimensions(prev => ({ ...prev, [field]: value }));
      setError('');
    }
  };

  const handleQuantityChange = (value) => {
  if (value === '') {
    setQuantity('');
    setError('');
  } else if (/^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      setQuantity(num);
      setError('');
    }
  }
};

  const handleConfirm = () => {
    const length = parseFloat(dimensions.length);
    const breadth = parseFloat(dimensions.breadth);
    const height = hasHeight ? parseFloat(dimensions.height) : null;
    const qty = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

    // Validation
    if (!length || length <= 0) {
      setError('Please enter a valid length');
      return;
    }
    if (!breadth || breadth <= 0) {
      setError('Please enter a valid breadth');
      return;
    }
    if (hasHeight && (!height || height <= 0)) {
      setError('Please enter a valid height');
      return;
    }
    if (!qty || qty < 1) {
      setError('Please enter a valid quantity (minimum 1)');
      return;
    }
    if (calculatedPrice <= 0) {
      setError('Invalid dimensions');
      return;
    }

    const dimensionData = {
      productId: product._id,
      length,
      breadth,
      height,
      unit,
      calculatedPrice,
      quantity: qty
    };
    
    console.log('🎯 Modal sending dimension data:', dimensionData);

    onConfirm(dimensionData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {editMode?.isEditing ? (
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editMode?.isEditing ? 'Edit Dimensions' : 'Enter Dimensions'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Base Price Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Base Price: </span>
              ₹{baseDimension?.price} per {hasHeight ? 'cubic' : 'square'} {unit}
            </p>
          </div>

          {/* Length Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Length ({unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={dimensions.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              placeholder="Enter length"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Breadth Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Breadth ({unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={dimensions.breadth}
              onChange={(e) => handleInputChange('breadth', e.target.value)}
              placeholder="Enter breadth"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Height Input - Conditional */}
          {hasHeight && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height ({unit}) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={dimensions.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                placeholder="Enter height"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={(e) => {
                if (e.target.value === '' || e.target.value === '0') {
                  setQuantity(1);
                }
              }}
              placeholder="Enter quantity"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Calculated Price */}
          {calculatedPrice > 0 && quantity > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                Unit Price:
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ₹{calculatedPrice.toFixed(2)}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 mt-2 mb-1">
                Total for {quantity} {quantity === 1 ? 'piece' : 'pieces'}:
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{(calculatedPrice * quantity).toFixed(2)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                {dimensions.length} × {dimensions.breadth}
                {hasHeight && ` × ${dimensions.height}`} {unit} = {' '}
                {hasHeight 
                  ? (parseFloat(dimensions.length) * parseFloat(dimensions.breadth) * parseFloat(dimensions.height)).toFixed(2)
                  : (parseFloat(dimensions.length) * parseFloat(dimensions.breadth)).toFixed(2)
                } {hasHeight ? 'cubic' : 'square'} {unit}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={calculatedPrice <= 0 || !quantity || quantity < 1}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editMode?.isEditing ? 'Update' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DimensionInputModal;