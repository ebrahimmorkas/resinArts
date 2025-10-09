// resinArts/backend/controllers/abandonedCartController.js
const AbandonedCart = require('../models/AbandonedCart');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const Cart = require('../models/Cart');

// Get all abandoned carts (Admin only)
const getAllAbandonedCarts = async (req, res) => {
    try {
        const abandonedCarts = await AbandonedCart.find()
            .sort({ last_updated: -1 });

        return res.status(200).json({
            success: true,
            abandonedCarts,
        });
    } catch (error) {
        console.error('Error fetching abandoned carts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching abandoned carts',
        });
    }
};

// Delete single abandoned cart
const deleteAbandonedCart = async (req, res) => {
    try {
        const { id } = req.params;
        const io = req.app.get('io');

        const deletedCart = await AbandonedCart.findByIdAndDelete(id);

        if (!deletedCart) {
            return res.status(404).json({
                success: false,
                message: 'Abandoned cart not found',
            });
        }

        // Delete user's cart items as well
        await Cart.deleteMany({ user_id: deletedCart.user_id });

        // Emit socket event
        if (io) {
            io.to('admin_room').emit('abandoned_cart_deleted', { cartId: id });
        }

        return res.status(200).json({
            success: true,
            message: 'Abandoned cart and user cart deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting abandoned cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting abandoned cart',
        });
    }
};

// Delete multiple abandoned carts
const deleteMultipleAbandonedCarts = async (req, res) => {
    try {
        const { ids } = req.body;
        const io = req.app.get('io');

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or empty IDs array',
            });
        }

        // Get all carts first to get user IDs
        const cartsToDelete = await AbandonedCart.find({ _id: { $in: ids } });
        const userIds = cartsToDelete.map(cart => cart.user_id);

        // Delete abandoned carts
        const result = await AbandonedCart.deleteMany({ _id: { $in: ids } });

        // Delete all cart items for these users
        await Cart.deleteMany({ user_id: { $in: userIds } });

        // Emit socket event
        if (io) {
            io.to('admin_room').emit('abandoned_carts_deleted', { cartIds: ids });
        }

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} abandoned cart(s) and user carts deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Error deleting multiple abandoned carts:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while deleting abandoned carts',
        });
    }
};

// Send reminder email to user
const sendReminderEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const abandonedCart = await AbandonedCart.findById(id);

        if (!abandonedCart) {
            return res.status(404).json({
                success: false,
                message: 'Abandoned cart not found',
            });
        }

        // Prepare cart items details for email
        const cartItemsText = abandonedCart.cart_items.map((item, index) => {
            let itemDetails = `${index + 1}. ${item.product_name}`;
            if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
            if (item.size) itemDetails += ` - Size: ${item.size}`;
            itemDetails += `\n   Quantity: ${item.quantity}`;
            itemDetails += `\n   Price: ₹${item.discounted_price.toFixed(2)}`;
            itemDetails += `\n   Subtotal: ₹${(item.discounted_price * item.quantity).toFixed(2)}`;
            return itemDetails;
        }).join('\n\n');

        const cartTotal = abandonedCart.cart_items.reduce(
            (total, item) => total + (item.discounted_price * item.quantity), 
            0
        );

        const emailSubject = "Don't forget your items! Complete your purchase";
        
        const emailText = `
Hi ${abandonedCart.user_name},

We noticed you left some items in your cart. Don't miss out on these great products!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CART ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${cartItemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CART TOTAL: ₹${cartTotal.toFixed(2)} + Shipping Price
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Complete your purchase now and get these items delivered to your doorstep!

Visit our website to complete your order: ${process.env.FRONTEND_URL || 'https://yourdomain.com'}

If you have any questions or need assistance, feel free to contact us.

Best regards,
Mould Market Team

--
This is an automated reminder email.
        `.trim();

        try {
            await sendEmail(abandonedCart.email, emailSubject, emailText);
            
            // Update reminder sent status
            await AbandonedCart.findByIdAndUpdate(id, {
                reminder_sent: true,
                reminder_sent_date: new Date(),
            });

            return res.status(200).json({
                success: true,
                message: 'Reminder email sent successfully',
            });
        } catch (emailError) {
            console.error('Email sending error details:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send reminder email',
                error: emailError.message,
            });
        }
    } catch (error) {
        console.error('Error in sendReminderEmail:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

const removeAbandonedCartByUserId = async (userId) => {
    try {
        await AbandonedCart.findOneAndDelete({ user_id: userId });
        console.log(`Abandoned cart removed for user: ${userId}`);
    } catch (error) {
        console.error('Error removing abandoned cart:', error);
    }
};

module.exports = {
    getAllAbandonedCarts,
    deleteAbandonedCart,
    deleteMultipleAbandonedCarts,
    sendReminderEmail,
    removeAbandonedCartByUserId
};