const FreeCash = require('../models/FreeCash');
const { findUserById } = require('./userController');
const { findCategoryById, findSubCategoryById } = require('./categoryController');
const sendEmail = require('../utils/sendEmail');

const addFreeCash = async (req, res) => {
    try {
        const { cashForm, userID } = req.body;
        console.log('Received cashForm:', cashForm); // Debug log

        if (!userID) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await findUserById(userID);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Coerce and validate inputs
        const amount = parseFloat(cashForm.amount);
        const validAbove = parseFloat(cashForm.validAbove) || 0;
        const isAllProducts = cashForm.validForAllProducts === true || cashForm.validForAllProducts === 'true';

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }
        if (validAbove < 0 || isNaN(validAbove)) {
            return res.status(400).json({ message: "Valid above amount must be non-negative" });
        }

        // Require main category if not all products
        if (!isAllProducts && (!cashForm.selectedMainCategory || cashForm.selectedMainCategory.trim() === '')) {
            return res.status(400).json({ message: "Main category required when not valid for all products" });
        }

        // Handle endDate
        let endDate = null;
        if (cashForm.endDate && cashForm.endDate.trim() !== '') {
            const parsedDate = new Date(cashForm.endDate.trim());
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: "Invalid end date: Use YYYY-MM-DD format" });
            }
            endDate = parsedDate;
        }

        // Handle categories
        let categoryId = null;
        let mainCategory = null;
        if (cashForm.selectedMainCategory && cashForm.selectedMainCategory.trim() !== '') {
            mainCategory = await findCategoryById(cashForm.selectedMainCategory.trim());
            if (!mainCategory) {
                return res.status(400).json({ message: "Main category not found" });
            }
            categoryId = mainCategory._id;
        }

        let subCategoryId = null;
        let subCategory = null;
        if (cashForm.selectedSubCategory && cashForm.selectedSubCategory.trim() !== '') {
            subCategory = await findSubCategoryById(cashForm.selectedSubCategory.trim());
            if (!subCategory) {
                return res.status(400).json({ message: "Sub category not found" });
            }
            subCategoryId = subCategory._id;
        }

        // Save document
        const newFreeCash = new FreeCash({
            user_id: user._id,
            start_date: new Date(),
            end_date: endDate,
            amount: amount,
            valid_above_amount: validAbove,
            category: categoryId,
            sub_category: subCategoryId,
            is_cash_applied_on__all_products: isAllProducts,
            is_cash_used: false,
            is_cash_expired: false,
        });

        await newFreeCash.save();

        // Send email based on conditions
        if (isAllProducts) {
            if (endDate) {
                await sendEmail(
                    user.email,
                    `Hurray! Free Cash ${amount}`,
                    `Congrats, You have been provided the ${amount} free cash on all products valid above on order of ₹ ${validAbove} valid till ${endDate.toISOString().split('T')[0]}`,
                );
            } else {
                await sendEmail(
                    user.email,
                    `Hurray! Free Cash ${amount}`,
                    `Congrats, You have been provided the ${amount} free cash on all products valid above on order of ₹ ${validAbove}`,
                );
            }
        } else {
            const mainCategoryName = mainCategory ? mainCategory.categoryName : 'Unknown';
            const subCategoryName = subCategory ? subCategory.categoryName : 'None';
            if (endDate) {
                await sendEmail(
                    user.email,
                    `Hurray! Free Cash ${amount}`,
                    `Congrats, You have been provided the ${amount} free cash on main category: ${mainCategoryName}${subCategory ? ` and Sub category: ${subCategoryName}` : ''} valid above on order of ₹ ${validAbove} valid till ${endDate.toISOString().split('T')[0]}`,
                );
            } else {
                await sendEmail(
                    user.email,
                    `Hurray! Free Cash ${amount}`,
                    `Congrats, You have been provided the ${amount} free cash on main category: ${mainCategoryName}${subCategory ? ` and Sub category: ${subCategoryName}` : ''} valid above on order of ₹ ${validAbove}`,
                );
            }
        }

        return res.status(200).json({
            message: `Free cash generated successfully for ${user.first_name} ${user.last_name}`,
            freeCashId: newFreeCash._id,
        });
    } catch (error) {
        console.error("Add Free Cash Error:", error); // Detailed backend log
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            const errorMessage = Object.values(error.errors || {})[0]?.message || error.message;
            return res.status(400).json({ message: `Free cash generation failed: ${errorMessage}` });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

// checkFreeCashEligibility unchanged
const checkFreeCashEligibility = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        const freeCash = await FreeCash.findOne({
            user_id: userId,
            is_cash_used: false,
            is_cash_expired: false,
            start_date: { $lte: now },
            $or: [
                { end_date: { $gte: now } },
                { end_date: null },
            ],
        });

        if (!freeCash) {
            return res.status(200).json({ freeCash: null, message: "No valid free cash available" });
        }

        return res.status(200).json({ freeCash, message: "Free cash found" });
    } catch (error) {
        console.error("Error checking free cash eligibility:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addFreeCash, checkFreeCashEligibility };