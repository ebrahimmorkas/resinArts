import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { CategoryContext } from '../../../../../Context/CategoryContext';
import axios from 'axios';

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

    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        discountPercentage: '',
        applicableToAll: false,
        selectedMainCategory: '',
        selectedSubCategory: ''
    });

    useEffect(() => {
        const setMainCategoriesDropDown = () => {
            if (categories.length === 0) {
                setNoCategories(true);
                return;
            }
            setNoCategories(false);
            const main_categories = categories.filter(mainCategory => mainCategory.parent_category_id === null);
            setMainCategories(main_categories);
        };
        console.log('Categories from context:', categories); // Debug categories
        setMainCategoriesDropDown();
    }, [categories]);

    const getCategoryById = (categoryId) => {
        return categories.find(category => category._id === categoryId);
    };

    const getSubCategories = (parentId) => {
        return categories.filter(category => category.parent_category_id === parentId);
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
            setShowSubCategories(true);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.endDate) {
            alert('Please select end date');
            return;
        }
        if (!formData.discountPercentage) {
            alert('Please enter discount percentage');
            return;
        }
        if (!formData.applicableToAll && !formData.selectedMainCategory) {
            alert("Please select a main category or choose 'Applicable to all products'");
            return;
        }

        console.log('Form data before submission:', formData); // Debug form data

        try {
            const res = await axios.post('https://resinarts.onrender.com/api/discount/add', formData, { withCredentials: true });
            if (res.status !== 201) {
                alert(`Failed to create discount: Invalid response status (${res.status})`);
                return;
            }
            console.log('Discount created successfully:', res.data);
            alert('Discount created successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            console.error('Error creating discount:', error.response?.data || error);
            alert(`Failed to create discount: ${errorMessage}`);
        }
    };

    if (categoriesErrors) return <div>Problem in fetching categories</div>;
    if (loadingCategories) return <div>Loading categories</div>;
    if (categories.length === 0) return <div>No categories added</div>;

    return (
        <div>
            <h2>Create Discount</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Start Date:</label><br />
                    <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>End Date:</label><br />
                    <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Discount Percentage (Don't include %):</label><br />
                    <input
                        type="number"
                        name="discountPercentage"
                        value={formData.discountPercentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        required
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={applicableToAll}
                            onChange={handleApplicableToAllChange}
                        />
                        {' '}Applicable to all products
                    </label>
                </div>

                {!applicableToAll && (
                    <div>
                        {categoryBreadcrumbs.length > 0 && (
                            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <strong>Category Path: </strong>
                                {categoryBreadcrumbs.map((category, index) => (
                                    <span key={category.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleBreadcrumbClick(category, index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#007bff',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                padding: '0',
                                                margin: '0'
                                            }}
                                        >
                                            {category.name}
                                        </button>
                                        {index < categoryBreadcrumbs.length - 1 && ' > '}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <label>Select main category:</label><br />
                            <select
                                value={selectedMainCategory}
                                onChange={handleMainCategoryChange}
                                style={{ minWidth: '200px', padding: '5px' }}
                            >
                                <option value="" disabled>Select</option>
                                {mainCategories.map(mainCategory => (
                                    <option value={mainCategory._id} key={mainCategory._id}>
                                        {mainCategory.categoryName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {showSubCategories && (
                            <div style={{ marginBottom: '15px' }}>
                                <label>Select sub category:</label><br />
                                <select
                                    value={selectedSubCategory}
                                    onChange={handleSubCategoriesChange}
                                    style={{ minWidth: '200px', padding: '5px' }}
                                >
                                    <option value="" disabled>Select</option>
                                    {subCategories.map(sub_category => (
                                        <option value={sub_category._id} key={sub_category._id}>
                                            {sub_category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '20px' }}>
                    <button
                        type="submit"
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Create Discount
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4>Debug Info:</h4>
                <p><strong>Applicable to All:</strong> {applicableToAll ? 'Yes' : 'No'}</p>
                <p><strong>Main Category:</strong> {selectedMainCategory || 'None'}</p>
                <p><strong>Sub Category:</strong> {selectedSubCategory || 'None'}</p>
                <p><strong>Final Category ID:</strong> {formData.selectedSubCategory || formData.selectedMainCategory || 'None'}</p>
            </div>
        </div>
    );
}

export default Discount;