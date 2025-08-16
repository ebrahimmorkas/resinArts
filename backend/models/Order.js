const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    image_url: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
    },
    whatsapp_number: {
        type: String,
        required: true,
    },
    product_id: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    product_name: {
        type: String,
        required: true,
    },
    variant_id: {
        type: mongoose.Types.ObjectId,
        required: false,
    },
    variant_name: {
        type: String,
        required: false,
        default: "",
    },
    size_id: {
        type: mongoose.Types.ObjectId,
        require: false,
    },
    size: {
        type: String,
        required: false,
        default: "",
    },
    quantity: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: false,
        default: null,
    },
    original_price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["Accepted", "Rejected", "In-Progress", "Dispatched", "Completed"],
        required: true,
        default: "Pending",
    },
    cash_applied: {
        type: String,
        // enum: ["yes", "no"],
        required: false,
    },
    total_price: {
        type: String,
        required: false,
        default: "Pending",
    },
});

module.exports = mongoose.model('Order', orderSchema);