import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { CategoryContext } from '../../../../../Context/CategoryContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Percent, Tag, CheckCircle, X, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

function Discount() {
    const { categories, loadingCategories, categoriesErrors } = useContext(CategoryContext);

    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [categoryBreadcrumbs, setCategoryBreadcrumbs] = useState([]);
    const [noCategories, setNoCategories] = useState(true);
    const [showSubCategories, setShowSubCategories] = useState(false);
    const [applicableToAll, setApplicableToAll] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        discountPercentage: '',
        applicableToAll: false,
        selectedMainCategory: '',
        selectedSubCategory: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const setMainCategoriesDropDown = () => {
            if (categories.length === 0) {
                setNoCategories(true);
                return;
            }
            setNoCategories(false);
            const main_categories = categories.filter(mainCategory => mainCategory.parent_category_id === null && mainCategory.isActive);
            setMainCategories(main_categories);
        };
        console.log('Categories from context:', categories);
        setMainCategoriesDropDown();
    }, [categories]);

    const getCategoryById = (categoryId) => {
        return categories.find(category => category._id === categoryId);
    };

    const getSubCategories = (parentId) => {
    return categories.filter(category => category.parent_category_id === parentId && category.isActive);
};

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }
        
        if (!formData.discountPercentage) {
            newErrors.discountPercentage = 'Discount percentage is required';
        } else if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
            newErrors.discountPercentage = 'Discount must be between 1 and 100';
        }
        
        if (!formData.applicableToAll && !formData.selectedMainCategory) {
            newErrors.category = "Please select a category or choose 'Applicable to all products'";
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.dateRange = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleMainCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedMainCategory(categoryId);
        setSelectedSubCategory('');

        setFormData(prev => ({
            ...prev,
            selectedMainCategory: categoryId,
            selectedSubCategory: ''
        }));

        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }

        if (!categoryId) {
            setSubCategories([]);
            setShowSubCategories(false);
            setCategoryBreadcrumbs([]);
            return;
        }

        const selectedCategory = getCategoryById(categoryId);
        if (!selectedCategory) return;

        setCategoryBreadcrumbs([{
            id: categoryId,
            name: selectedCategory.categoryName,
            level: 0
        }]);

        const sub_categories = getSubCategories(categoryId);

        if (sub_categories.length === 0) {
            setShowSubCategories(false);
            setSubCategories([]);
        } else {
            setShowSubCategories(true);
            setSubCategories(sub_categories);
        }
    };

    const handleSubCategoriesChange = (e) => {
        const subCategoryId = e.target.value;
        setSelectedSubCategory(subCategoryId);

        setFormData(prev => ({
            ...prev,
            selectedSubCategory: subCategoryId
        }));

        if (!subCategoryId) {
            const mainCatSubCategories = getSubCategories(selectedMainCategory);
            setSubCategories(mainCatSubCategories);

            const mainCategory = getCategoryById(selectedMainCategory);
            setCategoryBreadcrumbs([{
                id: selectedMainCategory,
                name: mainCategory.categoryName,
                level: 0
            }]);
            return;
        }

        const selectedSubCategory = getCategoryById(subCategoryId);
        if (!selectedSubCategory) return;

        const currentBreadcrumbs = [...categoryBreadcrumbs];
        const newLevel = currentBreadcrumbs.length;
        const filteredBreadcrumbs = currentBreadcrumbs.slice(0, newLevel);

        filteredBreadcrumbs.push({
            id: subCategoryId,
            name: selectedSubCategory.categoryName,
            level: newLevel
        });

        setCategoryBreadcrumbs(filteredBreadcrumbs);

        const further_sub_categories = getSubCategories(subCategoryId);

        if (further_sub_categories.length === 0) {
            setShowSubCategories(false);
        } else {
            setSubCategories(further_sub_categories);
            setSelectedSubCategory('');
            setFormData(prev => ({
                ...prev,
                selectedSubCategory: ''
            }));
        }
    };

    const handleBreadcrumbClick = (clickedCategory, clickedLevel) => {
        if (clickedLevel === 0) {
            const mainCatSubCategories = getSubCategories(clickedCategory.id);
            setSubCategories(mainCatSubCategories);
            setSelectedSubCategory('');
            setCategoryBreadcrumbs([clickedCategory]);
            setFormData(prev => ({
                ...prev,
                selectedSubCategory: ''
            }));
        } else {
            const clickedSubCategories = getSubCategories(clickedCategory.id);
            setSubCategories(clickedSubCategories);
            setSelectedSubCategory('');
            setCategoryBreadcrumbs(categoryBreadcrumbs.slice(0, clickedLevel + 1));
            setFormData(prev => ({
                ...prev,
                selectedSubCategory: ''
            }));
        }
    };

    const handleApplicableToAllChange = (e) => {
        const isChecked = e.target.checked;
        setApplicableToAll(isChecked);
        setFormData(prev => ({
            ...prev,
            applicableToAll: isChecked
        }));

        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }

        if (isChecked) {
            setSelectedMainCategory('');
            setSelectedSubCategory('');
            setSubCategories([]);
            setShowSubCategories(false);
            setCategoryBreadcrumbs([]);
            setFormData(prev => ({
                ...prev,
                selectedMainCategory: '',
                selectedSubCategory: ''
            }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear specific errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (name === 'startDate' || name === 'endDate') {
            if (errors.dateRange) {
                setErrors(prev => ({ ...prev, dateRange: '' }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setShowConfirmModal(true);
        }
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        setShowConfirmModal(false);

        console.log('Form data before submission:', formData);

        try {
            const res = await axios.post('https://api.mouldmarket.in/api/discount/add', formData, { withCredentials: true });
            if (res.status !== 201) {
                const errorMsg = `Failed to create discount: Invalid response status (${res.status})`;
                setErrorMessage(errorMsg);
                setShowErrorModal(true);
                toast.error(errorMsg, {
                    position: "top-right",
                    autoClose: 5000,
                });
                return;
            }
            console.log('Discount created successfully:', res.data);
            toast.success('🎉 Discount created successfully!', {
                position: "top-right",
                autoClose: 3000,
            });
            
            // Reset form
            setFormData({
                startDate: '',
                endDate: '',
                discountPercentage: '',
                applicableToAll: false,
                selectedMainCategory: '',
                selectedSubCategory: ''
            });
            setApplicableToAll(false);
            setSelectedMainCategory('');
            setSelectedSubCategory('');
            setSubCategories([]);
            setShowSubCategories(false);
            setCategoryBreadcrumbs([]);
            setErrors({});
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            console.error('Error creating discount:', error.response?.data || error);
            setErrorMessage(errorMessage);
            setShowErrorModal(true);
            toast.error(`❌ Failed to create discount: ${errorMessage}`, {
                position: "top-right",
                autoClose: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (categoriesErrors) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="flex items-center space-x-3 text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                        <span className="text-lg font-medium">Error loading categories</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">There was a problem fetching categories. Please try again later.</p>
                </div>
            </div>
        );
    }

    if (loadingCategories) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-4 text-center">Loading categories...</p>
                </div>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Please add some categories before creating discounts.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Create New Discount</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Set up promotional discounts for your products</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Date Range Section */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center dark:text-white">
                                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                                        Date Range
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                                                Start Date (Optional)
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                                                End Date *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                                required
                                            />
                                            {errors.endDate && (
                                                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {errors.dateRange && (
                                        <p className="mt-2 text-sm text-red-600">{errors.dateRange}</p>
                                    )}
                                </div>

                                {/* Discount Section */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center dark:text-white">
                                        <Percent className="w-5 h-5 mr-2 text-green-600" />
                                        Discount Details
                                    </h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                                            Discount Percentage *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="discountPercentage"
                                                value={formData.discountPercentage}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="100"
                                                placeholder="Enter discount percentage"
                                                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                    errors.discountPercentage ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                                <span className="text-gray-500 font-medium dark:text-gray-400">%</span>
                                            </div>
                                        </div>
                                        {errors.discountPercentage && (
                                            <p className="mt-1 text-sm text-red-600">{errors.discountPercentage}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter a value between 1 and 100</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Category Selection */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center dark:text-white">
                                        <Tag className="w-5 h-5 mr-2 text-purple-600" />
                                        Category Selection
                                    </h3>

                                    {/* Apply to All Toggle */}
                                    <div className="mb-6">
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={applicableToAll}
                                                    onChange={handleApplicableToAllChange}
                                                    className="sr-only"
                                                />
                                                <div className={`block bg-gray-300 w-14 h-8 rounded-full transition-colors ${
                                                    applicableToAll ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}></div>
                                                <div className={`absolute left-1 top-1 bg-white dark:bg-gray-900 w-6 h-6 rounded-full transition-transform ${
                                                    applicableToAll ? 'transform translate-x-6' : ''
                                                }`}></div>
                                            </div>
                                            <div className="ml-3">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-400">Apply to All Products</span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Discount will apply to all products in your store</p>
                                            </div>
                                        </label>
                                    </div>

                                    {!applicableToAll && (
                                        <div className="space-y-4">
                                            {/* Breadcrumbs */}
                                            {categoryBreadcrumbs.length > 0 && (
                                                <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-100">
                                                    <div className="text-sm font-medium text-gray-700 mb-2 dark:text-white">Selected Category Path:</div>
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {categoryBreadcrumbs.map((category, index) => (
                                                            <span key={category.id} className="flex items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleBreadcrumbClick(category, index)}
                                                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                                                                >
                                                                    {category.name}
                                                                </button>
                                                                {index < categoryBreadcrumbs.length - 1 && (
                                                                    <span className="mx-2 text-gray-400">→</span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Main Category Select */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                                                    Main Category *
                                                </label>
                                                <select
  value={selectedMainCategory}
  onChange={handleMainCategoryChange}
  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 ${
    errors.category ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/50' : 'border-gray-300 dark:border-gray-600'
  }`}
>
  <option value="">Select a main category</option>
  {mainCategories.map(mainCategory => (
    <option value={mainCategory._id} key={mainCategory._id}>
      {mainCategory.categoryName}
    </option>
  ))}
</select>
                                            </div>

                                            {/* Sub Category Select */}
                                            {showSubCategories && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">
                                                        Sub Category
                                                    </label>
                                                    <select
  value={selectedSubCategory}
  onChange={handleSubCategoriesChange}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
>
  <option value="">Select a sub category</option>
  {subCategories.map(sub_category => (
    <option value={sub_category._id} key={sub_category._id}>
      {sub_category.categoryName}
    </option>
  ))}
</select>
                                                </div>
                                            )}

                                            {errors.category && (
                                                <p className="text-sm text-red-600">{errors.category}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Summary Card */}
                                <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                                    <h4 className="text-lg font-semibold text-blue-900 mb-3">Discount Summary</h4>
                                        <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Scope:</span>
                                            <span className="font-medium text-blue-900">
                                                {applicableToAll ? 'All Products' : 'Specific Category'}
                                            </span>
                                        </div>
                                        {!applicableToAll && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-700">Main Category:</span>
                                                    <span className="font-medium text-blue-900">
                                                        {selectedMainCategory 
                                                            ? getCategoryById(selectedMainCategory)?.categoryName || 'Selected'
                                                            : 'None'
                                                        }
                                                    </span>
                                                </div>
                                                {selectedSubCategory && (
                                                    <div className="flex justify-between">
                                                        <span className="text-blue-700">Sub Category:</span>
                                                        <span className="font-medium text-blue-900">
                                                            {getCategoryById(selectedSubCategory)?.categoryName || 'Selected'}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Discount:</span>
                                            <span className="font-medium text-blue-900 dark:text-gray-400">
                                                {formData.discountPercentage ? `${formData.discountPercentage}%` : 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 flex justify-center">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating Discount...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Create Discount
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Discount</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we process your request...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Something went wrong
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                An unexpected error occurred while creating your discount. Please review the details below and try again.
                            </p>

                            {/* Error Details */}
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
                                        <div className="text-sm text-red-700 bg-red-100 p-3 rounded border font-mono">
                                            {errorMessage}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        // Optionally trigger retry logic here
                                    }}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Discount Creation</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to create this discount? This action will make the discount active according to your specified date range.
                            </p>
                            
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmSubmit}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Discount;