import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { 
  Search, Edit2, Trash2, ChevronLeft, ChevronRight, Eye, Filter, Download, X, AlertTriangle, Loader2, FolderTree, Plus, Calendar, Hash, Save, Image as ImageIcon, Upload, Power, PowerOff, AlertCircle
} from 'lucide-react';
import { CategoryContext } from '../../../../../Context/CategoryContext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';

const AllCategories = () => {
  const { categories, loadingCategories, setCategories } = useContext(CategoryContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });
  const [hierarchyModal, setHierarchyModal] = useState({ isOpen: false, category: null });
  const [editModal, setEditModal] = useState({ isOpen: false, category: null });
  const [filterModal, setFilterModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [loadingStates, setLoadingStates] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadCategoryId, setUploadCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState({ 
    hasChanges: false, 
    categoryId: null, 
    value: '', 
    hasImageChanges: false 
  });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    pendingCategoryId: null, 
    pendingValue: '', 
    isClosing: false,
    isImageChange: false 
  });
  const [imageModal, setImageModal] = useState({ isOpen: false, url: '' });
  const [shouldClickFileInput, setShouldClickFileInput] = useState(false);
  const fileInputRef = useRef(null);
  const [filters, setFilters] = useState({
    singleDate: '',
    startDate: '',
    endDate: '',
    noSubcategories: false,
    subcategoryCount: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    singleDate: '',
    startDate: '',
    endDate: '',
    noSubcategories: false,
    subcategoryCount: ''
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
const [statusModalData, setStatusModalData] = useState({ 
  categoryId: null, 
  isActive: false, 
  categoryName: '',
  hasChildren: false 
});
const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
const [reactivateData, setReactivateData] = useState({ categoryId: null, categoryName: '' });
const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
const [bulkStatusAction, setBulkStatusAction] = useState(null);

  const parentCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_category_id);
  }, [categories]);

  const getSubcategoryCount = (parentId) => {
    return categories.filter(cat => 
      cat.parent_category_id && 
      (typeof cat.parent_category_id === 'object' 
        ? cat.parent_category_id.$oid === parentId 
        : cat.parent_category_id === parentId)
    ).length;
  };

  const buildHierarchy = (parentId) => {
    const children = categories.filter(cat => {
      if (!cat.parent_category_id) return false;
      const parentIdValue = typeof cat.parent_category_id === 'object' 
        ? cat.parent_category_id.$oid 
        : cat.parent_category_id;
      return parentIdValue === parentId;
    });

    return children.map(child => {
      const childId = typeof child._id === 'object' ? child._id.$oid : child._id;
      return {
        ...child,
        children: buildHierarchy(childId)
      };
    });
  };

  const refreshEditModal = () => {
    if (editModal.isOpen && editModal.category) {
      const updatedMainCategory = categories.find(cat => {
        const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
        const editCatId = typeof editModal.category._id === 'object' ? editModal.category._id.$oid : editModal.category._id;
        return catId === editCatId;
      });
      
      if (updatedMainCategory) {
        const categoryId = typeof updatedMainCategory._id === 'object' ? updatedMainCategory._id.$oid : updatedMainCategory._id;
        const hierarchy = buildHierarchy(categoryId);
        setEditModal({ isOpen: true, category: { ...updatedMainCategory, children: hierarchy } });
      }
    }
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setFilterModal(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const emptyFilters = {
      singleDate: '',
      startDate: '',
      endDate: '',
      noSubcategories: false,
      subcategoryCount: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterModal(false);
  };

  const filteredData = useMemo(() => {
    let result = parentCategories.filter(item =>
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (appliedFilters.singleDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.createdAt.$date || item.createdAt).toISOString().split('T')[0];
        return itemDate === appliedFilters.singleDate;
      });
    }

    if (appliedFilters.startDate && appliedFilters.endDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.createdAt.$date || item.createdAt);
        const start = new Date(appliedFilters.startDate);
        const end = new Date(appliedFilters.endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      });
    }

    if (appliedFilters.noSubcategories) {
      result = result.filter(item => {
        const categoryId = typeof item._id === 'object' ? item._id.$oid : item._id;
        return getSubcategoryCount(categoryId) === 0;
      });
    }

    if (appliedFilters.subcategoryCount !== '') {
      const count = parseInt(appliedFilters.subcategoryCount);
      if (!isNaN(count)) {
        result = result.filter(item => {
          const categoryId = typeof item._id === 'object' ? item._id.$oid : item._id;
          return getSubcategoryCount(categoryId) === count;
        });
      }
    }

    return result;
  }, [parentCategories, searchTerm, appliedFilters, categories]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  React.useEffect(() => {
    refreshEditModal();
  }, [categories]);

  useEffect(() => {
    if (showImageUpload && shouldClickFileInput && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      setShouldClickFileInput(false);
    }
  }, [showImageUpload, shouldClickFileInput]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentData.map(item => typeof item._id === 'object' ? item._id.$oid : item._id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleDeleteClick = (category) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    setDeleteModal({
      isOpen: true,
      categoryId: categoryId,
      categoryName: category.categoryName,
      hasChildren: getSubcategoryCount(categoryId) > 0
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.isBulk) {
      setIsDeleting(true);
      try {
        const deletePromises = deleteModal.categoryId.map(id =>
          axios.delete(`http://localhost:3000/api/category/delete-category/${id}`, { withCredentials: true })
        );
        await Promise.all(deletePromises);

        const getAllChildIds = (parentId) => {
          const children = categories.filter(cat => {
            const parentIdValue = cat.parent_category_id 
              ? (typeof cat.parent_category_id === 'object' ? cat.parent_category_id.$oid : cat.parent_category_id)
              : null;
            return parentIdValue === parentId;
          });
          
          let allIds = children.map(child => typeof child._id === 'object' ? child._id.$oid : child._id);
          children.forEach(child => {
            const childId = typeof child._id === 'object' ? child._id.$oid : child._id;
            allIds = allIds.concat(getAllChildIds(childId));
          });
          return allIds;
        };

        let allDeletedIds = [...deleteModal.categoryId];
        deleteModal.categoryId.forEach(id => {
          allDeletedIds = allDeletedIds.concat(getAllChildIds(id));
        });

        setCategories(prev => prev.filter(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          return !allDeletedIds.includes(catId);
        }));

        toast.success(`${deleteModal.categoryId.length} categories deleted successfully!`);
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
        setSelectedRows([]);
      } catch (error) {
        console.error('Error deleting categories:', error);
        toast.error(error.response?.data?.message || 'Failed to delete categories');
      } finally {
        setIsDeleting(false);
      }
    } else {
      setIsDeleting(true);
      try {
        await axios.delete(
          `http://localhost:3000/api/category/delete-category/${deleteModal.categoryId}`,
          { withCredentials: true }
        );
        
        const getAllChildIds = (parentId) => {
          const children = categories.filter(cat => {
            const parentIdValue = cat.parent_category_id 
              ? (typeof cat.parent_category_id === 'object' ? cat.parent_category_id.$oid : cat.parent_category_id)
              : null;
            return parentIdValue === parentId;
          });
          
          let allIds = children.map(child => typeof child._id === 'object' ? child._id.$oid : child._id);
          children.forEach(child => {
            const childId = typeof child._id === 'object' ? child._id.$oid : child._id;
            allIds = allIds.concat(getAllChildIds(childId));
          });
          return allIds;
        };

        const deletedIds = [deleteModal.categoryId, ...getAllChildIds(deleteModal.categoryId)];
        
        setCategories(prev => prev.filter(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          return !deletedIds.includes(catId);
        }));
        
        toast.success('Category deleted successfully!');
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
        setSelectedRows([]);
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error(error.response?.data?.message || 'Failed to delete category');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    
    const selectedCategories = categories.filter(cat => {
      const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
      return selectedRows.includes(catId);
    });
    
    const hasChildren = selectedCategories.some(cat => {
      const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
      return getSubcategoryCount(catId) > 0;
    });

    setDeleteModal({
      isOpen: true,
      categoryId: selectedRows,
      categoryName: `${selectedRows.length} categories`,
      hasChildren: hasChildren,
      isBulk: true
    });
  };

  const handleViewHierarchy = (category) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    const hierarchy = buildHierarchy(categoryId);
    setHierarchyModal({
      isOpen: true,
      category: { ...category, children: hierarchy }
    });
  };

  const handleEditHierarchy = (category) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    const hierarchy = buildHierarchy(categoryId);
    setEditModal({
      isOpen: true,
      category: { ...category, children: hierarchy }
    });
    setEditingCategoryId(null);
    setAddingSubcategoryTo(null);
    setImagePreview(null);
    setSelectedImage(null);
    setShowImageUpload(false);
    setUploadCategoryId(null);
    setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
  };

  const handleEditClick = (categoryId, currentName) => {
    if (unsavedChanges.hasChanges || unsavedChanges.hasImageChanges) {
      setConfirmModal({
        isOpen: true,
        pendingCategoryId: categoryId,
        pendingValue: currentName,
        isImageChange: false
      });
    } else {
      setEditingCategoryId(categoryId);
      setEditingValue(currentName);
      setUnsavedChanges({ hasChanges: false, categoryId, value: currentName, hasImageChanges: false });
      setAddingSubcategoryTo(null);
    }
  };

  const handleEditingChange = (e) => {
    setEditingValue(e.target.value);
    setUnsavedChanges(prev => ({ ...prev, hasChanges: e.target.value !== prev.value }));
  };

  const handleSaveUnsavedChanges = async () => {
    if (unsavedChanges.hasChanges) {
      setLoadingStates(prev => ({ ...prev, [unsavedChanges.categoryId]: true }));
      try {
        await axios.put(
          `http://localhost:3000/api/category/update-category/${unsavedChanges.categoryId}`,
          { categoryName: editingValue },
          { withCredentials: true }
        );

        setCategories(prev => prev.map(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          if (catId === unsavedChanges.categoryId) {
            return { ...cat, categoryName: editingValue };
          }
          return cat;
        }));

        toast.success('Category updated successfully!');
        setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
        if (confirmModal.pendingCategoryId) {
          setEditingCategoryId(confirmModal.pendingCategoryId);
          setEditingValue(confirmModal.pendingValue);
          setUnsavedChanges({ hasChanges: false, categoryId: confirmModal.pendingCategoryId, value: confirmModal.pendingValue, hasImageChanges: false });
        }
        setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
      } catch (error) {
        console.error('Error updating category:', error);
        toast.error(error.response?.data?.message || 'Failed to update category');
      } finally {
        setLoadingStates(prev => ({ ...prev, [unsavedChanges.categoryId]: false }));
      }
    } else if (unsavedChanges.hasImageChanges) {
      setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: true }));
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);

        const response = await axios.put(
          `http://localhost:3000/api/category/update-category-image/${uploadCategoryId}`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        setCategories(prev => prev.map(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          if (catId === uploadCategoryId) {
            return { ...cat, image: response.data.imageUrl };
          }
          return cat;
        }));

        toast.success('Image updated successfully!');
        setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
        setShowImageUpload(false);
        setImagePreview(null);
        setSelectedImage(null);
        if (confirmModal.pendingCategoryId) {
          setUploadCategoryId(confirmModal.pendingCategoryId);
          setShowImageUpload(true);
          setShouldClickFileInput(true);
        }
        setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
      } catch (error) {
        console.error('Error updating image:', error);
        toast.error(error.response?.data?.message || 'Failed to update image');
      } finally {
        setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: false }));
      }
    }
  };

  const handleDiscardChanges = () => {
    if (unsavedChanges.hasChanges) {
      setEditingCategoryId(confirmModal.pendingCategoryId);
      setEditingValue(confirmModal.pendingValue);
      setUnsavedChanges({ hasChanges: false, categoryId: confirmModal.pendingCategoryId, value: confirmModal.pendingValue, hasImageChanges: false });
      setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
    } else if (unsavedChanges.hasImageChanges) {
      setShowImageUpload(false);
      setImagePreview(null);
      setSelectedImage(null);
      setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
      if (confirmModal.pendingCategoryId) {
        setUploadCategoryId(confirmModal.pendingCategoryId);
        setShowImageUpload(true);
        setShouldClickFileInput(true);
      }
      setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
    }
  };

  const handleSaveEdit = async (categoryId) => {
    if (!editingValue.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [categoryId]: true }));
    try {
      await axios.put(
        `http://localhost:3000/api/category/update-category/${categoryId}`,
        { categoryName: editingValue },
        { withCredentials: true }
      );

      setCategories(prev => prev.map(cat => {
        const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
        if (catId === categoryId) {
          return { ...cat, categoryName: editingValue };
        }
        return cat;
      }));

      toast.success('Category updated successfully!');
      setEditingCategoryId(null);
      setEditingValue('');
      setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoadingStates(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingValue('');
    setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
  };

  const handleAddSubcategory = (parentId) => {
    setAddingSubcategoryTo(parentId);
    setNewSubcategoryName('');
    setEditingCategoryId(null);
  };

  const handleSaveSubcategory = async (parentId) => {
    if (!newSubcategoryName.trim()) {
      toast.error('Subcategory name cannot be empty');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`add-${parentId}`]: true }));
    try {
      const response = await axios.post(
        `http://localhost:3000/api/category/add-subcategory`,
        { categoryName: newSubcategoryName, parent_category_id: parentId },
        { withCredentials: true }
      );

      setCategories(prev => [...prev, response.data.category]);
      toast.success('Subcategory added successfully!');
      setAddingSubcategoryTo(null);
      setNewSubcategoryName('');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast.error(error.response?.data?.message || 'Failed to add subcategory');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`add-${parentId}`]: false }));
    }
  };

  const handleCancelAddSubcategory = () => {
    setAddingSubcategoryTo(null);
    setNewSubcategoryName('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setUnsavedChanges(prev => ({ ...prev, hasImageChanges: true }));
      };
      reader.readAsDataURL(file);
    } else {
      setShowImageUpload(false);
      setImagePreview(null);
      setSelectedImage(null);
      setUnsavedChanges(prev => ({ ...prev, hasImageChanges: false }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: true }));

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await axios.put(
        `http://localhost:3000/api/category/update-category-image/${uploadCategoryId}`,
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setCategories(prev => prev.map(cat => {
        const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
        if (catId === uploadCategoryId) {
          return { ...cat, image: response.data.imageUrl };
        }
        return cat;
      }));

      toast.success('Image updated successfully!');
      setShowImageUpload(false);
      setImagePreview(null);
      setSelectedImage(null);
      setUploadCategoryId(null);
      setUnsavedChanges(prev => ({ ...prev, hasImageChanges: false }));
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error(error.response?.data?.message || 'Failed to update image');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: false }));
    }
  };

  const handleCancelImageUpload = () => {
    setShowImageUpload(false);
    setImagePreview(null);
    setSelectedImage(null);
    setUploadCategoryId(null);
    setUnsavedChanges(prev => ({ ...prev, hasImageChanges: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = async (categoryId) => {
    setLoadingStates(prev => ({ ...prev, [`remove-image-${categoryId}`]: true }));

    try {
      await axios.put(
        `http://localhost:3000/api/category/update-category-image/${categoryId}`,
        { removeImage: true },
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      setCategories(prev => prev.map(cat => {
        const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
        if (catId === categoryId) {
          return { ...cat, image: null };
        }
        return cat;
      }));

      toast.success('Image removed successfully!');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(error.response?.data?.message || 'Failed to remove image');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`remove-image-${categoryId}`]: false }));
    }
  };

  const handleChangeImage = (categoryId) => {
    if (unsavedChanges.hasChanges || unsavedChanges.hasImageChanges) {
      setConfirmModal({
        isOpen: true,
        pendingCategoryId: categoryId,
        pendingValue: '',
        isClosing: false,
        isImageChange: true
      });
    } else {
      setUploadCategoryId(categoryId);
      setShowImageUpload(true);
      setShouldClickFileInput(true);
      setImagePreview(null);
      setSelectedImage(null);
    }
  };

  const handleDeleteFromEditModal = (categoryId, categoryName) => {
    const hasChildren = categories.some(cat => {
      const parentIdValue = cat.parent_category_id 
        ? (typeof cat.parent_category_id === 'object' ? cat.parent_category_id.$oid : cat.parent_category_id)
        : null;
      return parentIdValue === categoryId;
    });

    setDeleteModal({
      isOpen: true,
      categoryId: categoryId,
      categoryName: categoryName,
      hasChildren: hasChildren
    });
  };

  const handleCloseEditModal = () => {
    if (unsavedChanges.hasChanges || unsavedChanges.hasImageChanges) {
      setConfirmModal({
        isOpen: true,
        pendingCategoryId: null,
        pendingValue: '',
        isClosing: true,
        isImageChange: false
      });
    } else {
      setEditModal({ isOpen: false, category: null });
      setEditingCategoryId(null);
      setAddingSubcategoryTo(null);
      setImagePreview(null);
      setSelectedImage(null);
      setShowImageUpload(false);
      setUploadCategoryId(null);
      setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
    }
  };

  const handleConfirmCloseModal = async () => {
    if (unsavedChanges.hasChanges) {
      setLoadingStates(prev => ({ ...prev, [unsavedChanges.categoryId]: true }));
      try {
        await axios.put(
          `http://localhost:3000/api/category/update-category/${unsavedChanges.categoryId}`,
          { categoryName: editingValue },
          { withCredentials: true }
        );

        setCategories(prev => prev.map(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          if (catId === unsavedChanges.categoryId) {
            return { ...cat, categoryName: editingValue };
          }
          return cat;
        }));

        toast.success('Category updated successfully!');
      } catch (error) {
        console.error('Error updating category:', error);
        toast.error(error.response?.data?.message || 'Failed to update category');
      } finally {
        setLoadingStates(prev => ({ ...prev, [unsavedChanges.categoryId]: false }));
      }
    } else if (unsavedChanges.hasImageChanges) {
      setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: true }));
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);

        const response = await axios.put(
          `http://localhost:3000/api/category/update-category-image/${uploadCategoryId}`,
          formData,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        setCategories(prev => prev.map(cat => {
          const catId = typeof cat._id === 'object' ? cat._id.$oid : cat._id;
          if (catId === uploadCategoryId) {
            return { ...cat, image: response.data.imageUrl };
          }
          return cat;
        }));

        toast.success('Image updated successfully!');
      } catch (error) {
        console.error('Error updating image:', error);
        toast.error(error.response?.data?.message || 'Failed to update image');
      } finally {
        setLoadingStates(prev => ({ ...prev, [`image-${uploadCategoryId}`]: false }));
      }
    }
    
    setEditModal({ isOpen: false, category: null });
    setEditingCategoryId(null);
    setAddingSubcategoryTo(null);
    setImagePreview(null);
    setSelectedImage(null);
    setShowImageUpload(false);
    setUploadCategoryId(null);
    setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
    setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
  };

  const handleDiscardCloseModal = () => {
    setEditModal({ isOpen: false, category: null });
    setEditingCategoryId(null);
    setAddingSubcategoryTo(null);
    setImagePreview(null);
    setSelectedImage(null);
    setShowImageUpload(false);
    setUploadCategoryId(null);
    setUnsavedChanges({ hasChanges: false, categoryId: null, value: '', hasImageChanges: false });
    setConfirmModal({ isOpen: false, pendingCategoryId: null, pendingValue: '', isClosing: false, isImageChange: false });
  };

  const handleExport = () => {
    function getHierarchyRows(cat, level = 0) {
      const indent = '  '.repeat(level);
      let rows = [[`${indent}${cat.categoryName}`, cat.image || '', new Date(cat.createdAt.$date || cat.createdAt).toLocaleDateString()]];
      if (cat.children) {
        cat.children.forEach(child => {
          rows = rows.concat(getHierarchyRows(child, level + 1));
        });
      }
      return rows;
    }

    let data = [['Name', 'Image URL', 'Created At']];
    parentCategories.forEach(parent => {
      const categoryId = typeof parent._id === 'object' ? parent._id.$oid : parent._id;
      const hierarchy = buildHierarchy(categoryId);
      data = data.concat(getHierarchyRows({ ...parent, children: hierarchy }));
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "categories.xlsx");
  };
// Handle single category status toggle
const handleToggleStatus = (categoryId, newStatus, categoryName) => {
  const category = categories.find(c => {
    const catId = typeof c._id === 'object' ? c._id.$oid : c._id;
    return catId === categoryId;
  });
  
  const hasChildren = getSubcategoryCount(categoryId) > 0;
  
  setStatusModalData({
    categoryId,
    isActive: newStatus,
    categoryName,
    hasChildren
  });
  setShowStatusModal(true);
};

// Confirm status change
const confirmStatusChange = async (reactivateProducts = false) => {
  setIsLoading(true);
  try {
    const res = await axios.post(
      'http://localhost:3000/api/category/toggle-status',
      {
        categoryId: statusModalData.categoryId,
        isActive: statusModalData.isActive,
        reactivateProducts
      },
      { withCredentials: true }
    );

    if (res.status === 200) {
      toast.success(res.data.message);
      
      // Update categories in context
      const updatedCategories = await axios.get(
        'http://localhost:3000/api/category/fetch-categories',
        { withCredentials: true }
      );
      setCategories(updatedCategories.data.categories);
      
      setShowStatusModal(false);
      setShowReactivateConfirm(false);
    }
  } catch (error) {
    console.error('Error toggling category status:', error);
    toast.error(error.response?.data?.message || 'Failed to update category status');
  } finally {
    setIsLoading(false);
  }
};

// Handle reactivation with product check
const handleReactivate = () => {
  setShowStatusModal(false);
  setReactivateData({
    categoryId: statusModalData.categoryId,
    categoryName: statusModalData.categoryName
  });
  setShowReactivateConfirm(true);
};

// Handle bulk status toggle
const handleBulkStatusToggle = (activate) => {
  if (selectedRows.length === 0) {
    toast.warning('Please select categories first');
    return;
  }
  setBulkStatusAction(activate);
  setShowBulkStatusModal(true);
};

// Confirm bulk status change
const confirmBulkStatusChange = async (reactivateProducts = false) => {
  setIsLoading(true);
  try {
    const res = await axios.post(
      'http://localhost:3000/api/category/bulk-toggle-status',
      {
        categoryIds: selectedRows,
        isActive: bulkStatusAction,
        reactivateProducts
      },
      { withCredentials: true }
    );

    if (res.status === 200) {
      toast.success(res.data.message);
      
      // Refresh categories
      const updatedCategories = await axios.get(
        'http://localhost:3000/api/category/fetch-categories',
        { withCredentials: true }
      );
      setCategories(updatedCategories.data.categories);
      
      setSelectedRows([]);
      setShowBulkStatusModal(false);
    }
  } catch (error) {
    console.error('Error bulk toggling status:', error);
    toast.error(error.response?.data?.message || 'Failed to update categories');
  } finally {
    setIsLoading(false);
  }
};
  const renderHierarchyTree = (category, level = 0, isEditMode = false, isLast = false, parentLines = []) => {
    const categoryId = typeof category._id === 'object' ? category._id.$oid : category._id;
    const hasChildren = category.children && category.children.length > 0;
    const isMainParent = level === 0;
    const isEditing = editingCategoryId === categoryId;
    const isAddingChild = addingSubcategoryTo === categoryId;
    const isUploading = showImageUpload && uploadCategoryId === categoryId;

    return (
      <div key={categoryId} className="mb-1">
        <div className="flex items-start">
          {level > 0 && (
            <div className="flex items-start pt-3" style={{ width: `${level * 32}px` }}>
              {parentLines.map((showLine, idx) => (
                <div key={idx} className="relative" style={{ width: '32px', height: '100%' }}>
                  {showLine && (
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
                  )}
                </div>
              ))}
              <div className="relative" style={{ width: '32px' }}>
                <div className="absolute left-4 top-0 w-px bg-gray-300" style={{ height: '24px' }}></div>
                <div className="absolute left-4 top-6 h-px bg-gray-300" style={{ width: '12px' }}></div>
                {!isLast && (
                  <div className="absolute left-4 bottom-0 w-px bg-gray-300" style={{ top: '24px' }}></div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex-1">
            <div 
              className={`flex items-center gap-3 p-3 rounded-lg border border-blue-200 hover:bg-gray-50 transition-colors ${isMainParent ? 'bg-blue-50' : ''} ${category.image && !isEditMode ? 'cursor-pointer' : ''}`}
              onClick={() => !isEditMode && category.image && setImageModal({ isOpen: true, url: category.image })}
            >
              {showImageUpload && imagePreview && isUploading ? (
                <img 
                  src={imagePreview} 
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-md border-2 border-blue-500"
                />
              ) : category.image ? (
                <img 
                  src={category.image} 
                  alt={category.categoryName}
                  className="w-12 h-12 object-cover rounded-md border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                  <FolderTree className="w-6 h-6 text-gray-400" />
                </div>
              )}

              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editingValue}
                    onChange={handleEditingChange}
                    className="flex-1 px-3 py-1.5 border border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(categoryId)}
                    disabled={loadingStates[categoryId]}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                    title="Save"
                  >
                    {loadingStates[categoryId] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <p className="flex-1 font-medium text-gray-900">{category.categoryName}</p>
              )}

              {isEditMode && !isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAddSubcategory(categoryId)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Add Subcategory"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(categoryId, category.categoryName)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFromEditModal(categoryId, category.categoryName)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isEditMode && !isEditing && (
              <div className="flex gap-2 mt-2 ml-0">
                <button
                  onClick={() => handleChangeImage(categoryId)}
                  className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200"
                >
                  {category.image ? 'Change Image' : 'Add Image'}
                </button>
                {category.image && (
                  <button
                    onClick={() => handleRemoveImage(categoryId)}
                    disabled={loadingStates[`remove-image-${categoryId}`]}
                    className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200 disabled:opacity-50"
                  >
                    {loadingStates[`remove-image-${categoryId}`] ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      'Remove Image'
                    )}
                  </button>
                )}
              </div>
            )}

            {isUploading && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                {imagePreview && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSaveImage}
                      disabled={loadingStates[`image-${uploadCategoryId}`]}
                      className="flex-1 px-4 py-2 bg-blue-600 text-green-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingStates[`image-${uploadCategoryId}`] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Image
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelImageUpload}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {isAddingChild && (
              <div className="mt-2 flex items-center gap-2" style={{ marginLeft: level > 0 ? `${(level + 1) * 24}px` : '24px' }}>
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Enter subcategory name"
                  className="flex-1 px-3 py-1.5 border border-blue-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveSubcategory(categoryId)}
                  disabled={loadingStates[`add-${categoryId}`]}
                  className="px-3 py-1.5 bg-blue-600 text-green-600 text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingStates[`add-${categoryId}`] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancelAddSubcategory}
                  className="px-3 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {hasChildren && (
              <div className="mt-2">
                {category.children.map((child, idx) => 
                  renderHierarchyTree(child, level + 1, isEditMode, idx === category.children.length - 1, [...parentLines, !isLast])
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Categories Management</h1>
            <p className="text-blue-100 text-sm">Manage and organize your product categories</p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md">
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <p className="text-sm text-gray-500">
                Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                />
              </div>
              
              {selectedRows.length > 0 ? (
                <div className="flex items-center space-x-2">
                    <button 
      onClick={() => handleBulkStatusToggle(true)}
      className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
    >
      <Power className="w-4 h-4 mr-2" />
      Activate ({selectedRows.length})
    </button>
    <button 
      onClick={() => handleBulkStatusToggle(false)}
      className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
    >
      <PowerOff className="w-4 h-4 mr-2" />
      Deactivate ({selectedRows.length})
    </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedRows.length})
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setFilterModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                  <button 
                    onClick={handleExport}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories to display</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first category</p>
            <button className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Add Category
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden border-t border-gray-200">
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '60px' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.length === currentData.length && currentData.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '80px' }}>
                        Sr No.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '100px' }}>
                        Image
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '180px' }}>
                        Name
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                        Sub Categories
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '140px' }}>
                        Created At
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
  Status
</th>
                      {selectedRows.length === 0 && (
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '220px' }}>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((item, index) => {
                      const categoryId = typeof item._id === 'object' ? item._id.$oid : item._id;
                      const subcategoryCount = getSubcategoryCount(categoryId);
                      const createdDate = new Date(item.createdAt.$date || item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <tr key={categoryId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '60px' }}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(categoryId)}
                              onChange={() => handleSelectRow(categoryId)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                            {startIndex + index + 1}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-center cursor-pointer" 
                            style={{ minWidth: '100px' }} 
                            onClick={() => item.image && setImageModal({ isOpen: true, url: item.image })}
                          >
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.categoryName}
                                className="w-12 h-12 object-cover rounded-md mx-auto border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-md mx-auto flex items-center justify-center">
                                <FolderTree className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium" style={{ minWidth: '180px' }}>
                            {item.categoryName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '140px' }}>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500" style={{ minWidth: '140px' }}>
                            {createdDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleToggleStatus(item._id, !item.isActive, item.categoryName);
    }}
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      item.isActive 
        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
        : 'bg-red-100 text-red-800 hover:bg-red-200'
    }`}
    title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
  >
    {item.isActive ? (
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
                          {selectedRows.length === 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '220px' }}>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleViewHierarchy(item)}
                                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                                  title="View Hierarchy"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Hierarchy
                                </button>
                                <button
                                  onClick={() => handleEditHierarchy(item)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-700">entries per page</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {totalPages > 0 && [...Array(Math.min(totalPages, 7))].map((_, index) => {
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
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Modal */}
      {filterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Filter Categories
                  </h3>
                </div>
                <button
                  onClick={() => setFilterModal(false)}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Specific Creation Date
                </label>
                <input
                  type="date"
                  value={filters.singleDate}
                  onChange={(e) => setFilters({...filters, singleDate: e.target.value, startDate: '', endDate: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value, singleDate: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value, singleDate: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.noSubcategories}
                    onChange={(e) => setFilters({...filters, noSubcategories: e.target.checked, subcategoryCount: ''})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Show only categories with no subcategories
                  </span>
                </label>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 mr-2" />
                  Number of Subcategories
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter number"
                  value={filters.subcategoryCount}
                  onChange={(e) => setFilters({...filters, subcategoryCount: e.target.value, noSubcategories: false})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Unsaved Changes
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You have unsaved changes. Do you want to save them before continuing?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={confirmModal.isClosing ? handleConfirmCloseModal : handleSaveUnsavedChanges}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-gren-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={confirmModal.isClosing ? handleDiscardCloseModal : handleDiscardChanges}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Category
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.categoryName}</span>?
                    </p>
                    {deleteModal.hasChildren && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 flex items-start">
                          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>This category has subcategories. Deleting it will also delete all nested subcategories.</span>
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-row-reverse gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hierarchy Modal (View Only) */}
      {hierarchyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                    <FolderTree className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Category Hierarchy
                    </h3>
                    <p className="text-sm text-gray-500">
                      {hierarchyModal.category?.categoryName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHierarchyModal({ isOpen: false, category: null })}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {hierarchyModal.category && (
                <div className="space-y-2">
                  {renderHierarchyTree(hierarchyModal.category, 0, false)}
                </div>
              )}
              
              {(!hierarchyModal.category?.children || hierarchyModal.category.children.length === 0) && (
                <div className="text-center py-8">
                  <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No subcategories found</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-row-reverse">
              <button
                type="button"
                onClick={() => setHierarchyModal({ isOpen: false, category: null })}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                    <Edit2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Category Hierarchy
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage categories and subcategories
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {editModal.category && renderHierarchyTree(editModal.category, 0, true)}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-row-reverse">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-[80vh]">
            <img 
              src={imageModal.url} 
              alt="Category Image" 
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
            <button 
              onClick={() => setImageModal({ isOpen: false, url: '' })} 
              className="absolute top-2 right-2 text-black bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      {/* Status Confirmation Modal */}
{showStatusModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {statusModalData.isActive ? 'Activate Category' : 'Deactivate Category'}
        </h3>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-600 mb-3">
          Are you sure you want to {statusModalData.isActive ? 'activate' : 'deactivate'}{' '}
          <span className="font-semibold text-gray-900">"{statusModalData.categoryName}"</span>?
        </p>
        
        {statusModalData.hasChildren && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>This will also {statusModalData.isActive ? 'activate' : 'deactivate'} all subcategories.</span>
            </p>
          </div>
        )}
        
        {!statusModalData.isActive && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              All products in this category will also be deactivated.
            </p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
        <button
          onClick={() => setShowStatusModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={() => statusModalData.isActive ? handleReactivate() : confirmStatusChange(false)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
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

{/* Reactivate Products Confirmation */}
{showReactivateConfirm && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Reactivate Products?
        </h3>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-600 mb-3">
          Do you want to reactivate all products that were deactivated when this category was deactivated?
        </p>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Only products with active main and sub categories will be reactivated.
          </p>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
        <button
          onClick={() => confirmStatusChange(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          No, Only Category
        </button>
        <button
          onClick={() => confirmStatusChange(true)}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Yes, Reactivate Products'}
        </button>
      </div>
    </div>
  </div>
)}

{/* Bulk Status Modal */}
{showBulkStatusModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {bulkStatusAction ? 'Activate' : 'Deactivate'} Multiple Categories
        </h3>
      </div>
      <div className="px-6 py-4">
        <p className="text-gray-600 mb-3">
          Are you sure you want to {bulkStatusAction ? 'activate' : 'deactivate'}{' '}
          <span className="font-semibold text-gray-900">{selectedRows.length} selected categories</span>?
        </p>
        {!bulkStatusAction && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              All products in these categories will also be deactivated.
            </p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
        <button
          onClick={() => setShowBulkStatusModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={() => confirmBulkStatusChange(bulkStatusAction)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
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
    </div>
  );
};

export default AllCategories;