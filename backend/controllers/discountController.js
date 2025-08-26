const mongoose = require('mongoose');
const Discount = require('../models/Discount');
const { findCategoryById, findSubCategoryById } = require('./categoryController');

// Add new discount
const addDiscount = async (req, res) => {
    console.log('Request body:', req.body); // Debug incoming request
    try {
        const {
            startDate,
            endDate,
            discountPercentage,
            applicableToAll,
            selectedMainCategory,
            selectedSubCategory
        } = req.body;

        // Validate ObjectIds
        const isValidObjectId = mongoose.Types.ObjectId.isValid;
        if (!applicableToAll) {
            if (!selectedMainCategory || !isValidObjectId(selectedMainCategory)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or missing main category ID'
                });
            }
            if (selectedSubCategory && !isValidObjectId(selectedSubCategory)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sub category ID'
                });
            }
        }

        if (!endDate) {
            return res.status(400).json({
                success: false,
                message: 'End date is required'
            });
        }

        if (!discountPercentage || discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({
                success: false,
                message: 'Discount percentage must be between 0 and 100'
            });
        }

        const startDateTime = startDate ? new Date(startDate) : new Date();
        const endDateTime = new Date(endDate);

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        if (startDateTime >= endDateTime) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        if (startDate) {
            const now = new Date();
            if (startDateTime < now) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be in the past'
                });
            }
        }

        if (!applicableToAll) {
            const mainCategory = await findCategoryById(selectedMainCategory);
            console.log('Main category:', mainCategory); // Debug
            if (!mainCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected main category does not exist'
                });
            }

            if (selectedSubCategory) {
                const subCategory = await findSubCategoryById(selectedSubCategory);
                console.log('Sub category:', subCategory); // Debug
                if (!subCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected sub category does not exist'
                    });
                }

                const isValidSubCategory = await validateSubCategoryHierarchy(selectedMainCategory, selectedSubCategory);
                console.log('Is valid subcategory:', isValidSubCategory); // Debug
                if (!isValidSubCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected sub category is not a valid child of the main category'
                    });
                }
            }
        }

        console.log('Checking overlapping discounts for:', {
            startDateTime,
            endDateTime,
            categoryId: applicableToAll ? null : (selectedSubCategory || selectedMainCategory)
        }); // Debug
        const overlappingDiscount = await Discount.findOverlappingDiscounts(
            startDateTime,
            endDateTime,
            applicableToAll ? null : (selectedSubCategory || selectedMainCategory)
        );

        if (overlappingDiscount.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A discount already exists for this category/period combination',
                overlappingDiscount: overlappingDiscount[0]
            });
        }

        const discountData = {
            endDate: endDateTime,
            discountPercentage: parseFloat(discountPercentage),
            applicableToAll: applicableToAll || false,
            isActive: true
        };

        if (startDate) {
            discountData.startDate = startDateTime;
        }

        if (!applicableToAll) {
            discountData.selectedMainCategory = selectedMainCategory;
            discountData.selectedSubCategory = selectedSubCategory || null;
        }

        const newDiscount = new Discount(discountData);
        const savedDiscount = await newDiscount.save();

        await savedDiscount.populate([
            { path: 'selectedMainCategory', select: 'categoryName' },
            { path: 'selectedSubCategory', select: 'categoryName' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Discount created successfully',
            data: savedDiscount
        });
    } catch (error) {
        console.error('Error in addDiscount:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating discount',
            error: error.message
        });
    }
};

// Helper function to validate sub category hierarchy
const validateSubCategoryHierarchy = async (mainCategoryId, subCategoryId) => {
    try {
        const subCategory = await findSubCategoryById(subCategoryId);
        console.log('Subcategory in hierarchy check:', subCategory); // Debug
        if (!subCategory) return false;

        let currentCategory = subCategory;

        while (currentCategory.parent_category_id) {
            if (currentCategory.parent_category_id.toString() === mainCategoryId.toString()) {
                return true;
            }
            currentCategory = await findCategoryById(currentCategory.parent_category_id);
            console.log('Parent category in hierarchy:', currentCategory); // Debug
            if (!currentCategory) break;
        }

        return false;
    } catch (error) {
        console.error('Error validating sub category hierarchy:', error);
        return false;
    }
};

// Helper function to check overlapping discounts (kept for backward compatibility)
const checkOverlappingDiscounts = async (startDate, endDate, applicableToAll, categoryId) => {
    try {
        const results = await Discount.findOverlappingDiscounts(
            startDate,
            endDate,
            applicableToAll ? null : categoryId
        );
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error checking overlapping discounts:', error);
        return null;
    }
};

// Get all discounts
const getDiscounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;

        const query = {};
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const discounts = await Discount.find(query)
            .populate('selectedMainCategory', 'categoryName')
            .populate('selectedSubCategory', 'categoryName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Discount.countDocuments(query);

        res.status(200).json({
            success: true,
            data: discounts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error in getDiscounts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching discounts',
            error: error.message
        });
    }
};

// Get discount by ID
const getDiscountById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID'
            });
        }

        const discount = await Discount.findById(id)
            .populate('selectedMainCategory', 'categoryName')
            .populate('selectedSubCategory', 'categoryName');

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found'
            });
        }

        res.status(200).json({
            success: true,
            data: discount
        });
    } catch (error) {
        console.error('Error in getDiscountById:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching discount',
            error: error.message
        });
    }
};

// Update discount
const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID'
            });
        }

        delete updateData.createdAt;
        delete updateData.updatedAt;

        const updatedDiscount = await Discount.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate([
            { path: 'selectedMainCategory', select: 'categoryName' },
            { path: 'selectedSubCategory', select: 'categoryName' }
        ]);

        if (!updatedDiscount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Discount updated successfully',
            data: updatedDiscount
        });
    } catch (error) {
        console.error('Error in updateDiscount:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating discount',
            error: error.message
        });
    }
};

// Delete discount (soft delete)
const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID'
            });
        }

        const deletedDiscount = await Discount.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true }
        );

        if (!deletedDiscount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Discount deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteDiscount:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting discount',
            error: error.message
        });
    }
};

module.exports = {
    addDiscount,
    getDiscounts,
    getDiscountById,
    updateDiscount,
    deleteDiscount
};