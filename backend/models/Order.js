const mongoose = require('mongoose');

const orderedProductSchema = new mongoose.Schema({
    image_url: {
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
    },
    variant_name: {
        type: String,
        required: false,
    },
    size_id: {
        type: mongoose.Types.ObjectId,
    },
    size: {
        type: String,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    cash_applied: {
        type: Number,
        required: false,
        default: 0,
    },
}, { _id: false });

const orderSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
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
    orderedProducts: [orderedProductSchema],
    status: {
        type: String,
        enum: ["Accepted", "Rejected", "In-Progress", "Dispatched", "Completed", "Pending", "Confirm"],
        required: true,
        default: "Pending",
    },
    cash_applied: {
        type: {
            amount: { type: Number, required: true },
            freeCashId: { type: mongoose.Types.ObjectId, required: true },
        },
        required: false,
    },
    price: {
        type: Number,
        required: true,
    },
    shipping_price: {
        type: Number,
        default: 0,
    },
    total_price: {
        type: String,
        required: false,
        default: "Pending",
    },
    payment_status: {
        type: String,
        required: true,
        enum: ['Paid', 'Payment Pending'],
        default: "Payment Pending",
    },
});

module.exports = mongoose.model('Order', orderSchema);