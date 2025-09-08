const mongoose = require('mongoose');

const freeCashSchema = mongoose.Schema({
    user_id: {
        required: true,
        type: mongoose.Types.ObjectId,
    },
    start_date: {
        required: false,
        type: Date,
        default: Date.now, // Fixed: removed () from Date.now
    },
    end_date: {
        required: false,
        type: Date,
        default: null,
    },
    amount: {
        required: true,
        type: Number,
    },
    valid_above_amount: {
        required: false, // Fixed: typo from "requried"
        type: Number,
        default: 0,
    },
    category: {
        required: false,
        type: mongoose.Types.ObjectId,
        default: null,
    },
    sub_category: {
        required: false,
        type: mongoose.Types.ObjectId,
        default: null
    },
    is_cash_applied_on__all_products: {
        required: false,
        type: Boolean,
        default: false
    },
    is_cash_used: {
        required: false,
        type: Boolean,
        default: false
    },
    cash_used_date: {
        required: false,
        type: Date,
        default: null,
    },
    is_cash_expired: {
        required: false,
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model('FreeCash', freeCashSchema);