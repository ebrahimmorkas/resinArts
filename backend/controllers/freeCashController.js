const FreeCash = require('../models/FreeCash');
const { findUserById } = require('./userController');
const { findCategoryById } = require('./categoryController');

const addFreeCash = async (req, res) => {
  try {
    const { cashForm, userID } = req.body;
    console.log('Received cashForm:', cashForm);

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

    let rootCategoryId = null;
    if (!isAllProducts) {
      const mainCatId = cashForm.selectedMainCategory.trim();
      const subCatId = cashForm.selectedSubCategory ? cashForm.selectedSubCategory.trim() : null;

      if (subCatId) {
        // Validate sub exists and belongs to main
        const subCategory = await findCategoryById(subCatId);
        if (!subCategory || subCategory.parent_category_id.toString() !== mainCatId) {
          return res.status(400).json({ message: "Invalid sub category" });
        }
        rootCategoryId = subCategory._id; // Deepest: sub + descendants
      } else if (mainCatId) {
        const mainCategory = await findCategoryById(mainCatId);
        if (!mainCategory) {
          return res.status(400).json({ message: "Main category not found" });
        }
        rootCategoryId = mainCategory._id; // Main + all descendants
      }
    }

    const newFreeCash = new FreeCash({
      user_id: user._id,
      start_date: new Date(),
      end_date: endDate,
      amount: amount,
      valid_above_amount: validAbove,
      category: rootCategoryId,
      sub_category: null, // Not needed
      is_cash_applied_on__all_products: isAllProducts,
      is_cash_used: false,
      is_cash_expired: false,
    });

    await newFreeCash.save();

    return res.status(200).json({
      message: `Free cash generated successfully for ${user.first_name} ${user.last_name}`,
      freeCashId: newFreeCash._id,
    });
  } catch (error) {
    console.error("Add Free Cash Error:", error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      const errorMessage = Object.values(error.errors || {})[0]?.message || error.message;
      return res.status(400).json({ message: `Free cash generation failed: ${errorMessage}` });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkFreeCashEligibility = async (req, res) => {
  try {
    const { userID } = req.body;
    const user = await findUserById(userID);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const currentDate = new Date();
    const freeCashRecords = await FreeCash.find({
      user_id: user._id,
      is_cash_used: false,
      $or: [
        { end_date: { $gte: currentDate } },
        { end_date: null },
      ],
    });

    const eligibleFreeCash = freeCashRecords.map(record => ({
      freeCashId: record._id,
      amount: record.amount,
      validAboveAmount: record.valid_above_amount,
      category: record.category,
      isCashAppliedOnAllProducts: record.is_cash_applied_on__all_products,
      endDate: record.end_date ? format(record.end_date, 'yyyy-MM-dd') : null,
    }));

    return res.status(200).json({
      message: "Free cash fetched successfully",
      freeCash: eligibleFreeCash,
    });
  } catch (error) {
    console.error("Check Free Cash Eligibility Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addFreeCash, checkFreeCashEligibility };