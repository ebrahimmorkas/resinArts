const FreeCash = require('../models/FreeCash');
const { findUserById } = require('./userController');
const { findCategoryById, findSubCategoryById } = require('./categoryController');

const addFreeCash = async (req, res) => {
    try {
        const { cashForm, userID } = req.body;

        if (!userID) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await findUserById(userID);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (cashForm.selectedMainCategory === "" && cashForm.validForAllProducts === false) {
            return res.status(400).json({ message: "Invalid main category ID" });
        }

        let mainCategory = null;
        if (cashForm.selectedMainCategory) {
            mainCategory = await findCategoryById(cashForm.selectedMainCategory);
            if (!mainCategory) {
                return res.status(400).json({ message: "Main category not found" });
            }
        }

        let subCategory = null;
        if (cashForm.selectedSubCategory) {
            subCategory = await findSubCategoryById(cashForm.selectedSubCategory);
            if (!subCategory) {
                return res.status(400).json({ message: "Sub category not found" });
            }
        }

        if (
            !cashForm.amount ||
            isNaN(Number(cashForm.amount)) ||
            Number(cashForm.amount) <= 0 ||
            !cashForm.validAbove ||
            isNaN(Number(cashForm.validAbove)) ||
            Number(cashForm.validAbove) < 0
        ) {
            return res.status(400).json({ message: "Please fill all the fields properly" });
        }

        try {
            const newFreeCash = new FreeCash({
                user_id: user._id,
                end_date: new Date(cashForm.endDate),
                amount: cashForm.amount,
                valid_above_amount: cashForm.validAbove,
                category: cashForm.selectedMainCategory || null,
                sub_category: cashForm.selectedSubCategory || null,
                is_cash_applied_on__all_products: cashForm.validForAllProducts,
            });
            await newFreeCash.save();

            return res.status(200).json({
                message: `Free cash generated successfully for ${user.first_name} ${user.last_name}`,
            });
        } catch (error) {
            return res.status(400).json({ message: "Problem while generating free cash" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const checkFreeCashEligibility = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        const freeCash = await FreeCash.findOne({
            user_id: userId,
            is_cash_used: false,
            is_cash_expired: false,
            start_date: { $lte: now },
            end_date: { $gte: now },
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