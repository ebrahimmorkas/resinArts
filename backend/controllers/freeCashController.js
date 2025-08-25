const FreeCash = require('../models/FreeCash');
const {findUserById} = require('./userController');
const {findCategoryById, findSubCategoryById} = require('./categoryController');

const addFreeCash = async (req, res) => {
    try {
        const {cashForm, userID} = req.body;

        if(!userID) {
            return res.status(400).json({message: "Invalid user ID"});
        }

        const user  = await findUserById(userID);
        if(!user) {
            return res.status(400).json({message: "User not found"})
        }

        if(cashForm. selectedMainCategory == "" && cashForm.validForAllProducts == false) {
            return res.satus(400).json({message: "Invalid main category ID"});
        }

        const mainCategory = await findCategoryById(cashForm.selectedMainCategory);
        if(!mainCategory) {
            return res.status(400).json({message: "Main category not found"});
        }

        if(cashForm.selectedSubCategory == "") {
            return res.status(400).json({message: "Invalid sub category ID"});
        }

        const subCategory = await findSubCategoryById(cashForm.selectedSubCategory);
        if(!subCategory) {
            return res.status(400).json({message: "Sub category not found"});
        }

       if (
  !cashForm.amount || isNaN(Number(cashForm.amount)) || Number(cashForm.amount) <= 0 ||
  !cashForm.validAbove || isNaN(Number(cashForm.validAbove)) || Number(cashForm.validAbove) <= 0
) {
  return res.status(400).json({ message: "Please fill all the fields properly" });
}

        // verything all right proceed adding
        try {
            const newFreeCash = new FreeCash({user_id: user._id, end_date: new Date(cashForm.endDate), amount: cashForm.amount, valid_above_amount: cashForm.validAbove, category: cashForm.selectedMainCategory, sub_category: cashForm.selectedSubCategory, is_cash_applied_on__all_products: cashForm.validForAllProducts});
            await newFreeCash.save();

            return res.status(200).json({message: `Free cash generated successfully for ${user.first_name} ${user.last_name}`})
        } catch(error) {
            return res.status(400).json({message: "Problem while generating free cash"});
        }
    } catch(error) {
        return res.status(500).json({meessage: "Internal server error"});
    }
}

module.exports = {addFreeCash};