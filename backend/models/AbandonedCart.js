// resinArts/backend/models/AbandonedCart.js
const mongoose = require('mongoose');

const abandonedCartSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // Ensures one document per user
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
            required: false,
        },
        whatsapp_number: {
            type: String,
            required: false,
        },
        cart_items: [
            {
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
        ],
        last_updated: {
            type: Date,
            default: Date.now,
        },
        reminder_sent: {
            type: Boolean,
            default: false,
        },
        reminder_sent_date: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
abandonedCartSchema.index({ user_id: 1 });
abandonedCartSchema.index({ last_updated: 1 });

module.exports = mongoose.model('AbandonedCart', abandonedCartSchema);