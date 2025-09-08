const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        image_url: {
            type: String,
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        variant_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            default: null,
        },
        details_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            default: null,
        },
        size_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            default: null,
        },
        product_name: {
            type: String,
            required: true,
        },
        variant_name: {
            type: String,
            required: false,
            default: null,
        },
        size: {
            type: String,
            required: false,
            default: null,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 1,
        },
        cash_applied: {
            type: Number,
            required: false,
            default: 0,
        },
        discounted_price: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Cart", cartSchema);