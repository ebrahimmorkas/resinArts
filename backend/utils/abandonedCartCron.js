// resinArts/backend/utils/abandonedCartCron.js
const cron = require('node-cron');
const Cart = require('../models/Cart');
const User = require('../models/User');
const AbandonedCart = require('../models/AbandonedCart');

// Backup sync function - runs hourly to catch any missed updates
const syncAbandonedCarts = async () => {
    try {
        console.log('Running abandoned cart backup sync...');
        
        // Find all users who have cart items
        const cartItems = await Cart.find({});
        
        // Group by user
        const userCarts = {};
        cartItems.forEach(item => {
            const userId = item.user_id.toString();
            if (!userCarts[userId]) {
                userCarts[userId] = [];
            }
            userCarts[userId].push(item);
        });

        // Sync each user's cart
        for (const [userId, items] of Object.entries(userCarts)) {
            const user = await User.findById(userId);
            if (!user) continue;

            const userName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();
            const cartItemsData = items.map(item => ({
                image_url: item.image_url,
                product_id: item.product_id,
                variant_id: item.variant_id,
                details_id: item.details_id,
                size_id: item.size_id,
                product_name: item.product_name,
                variant_name: item.variant_name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                cash_applied: item.cash_applied,
                discounted_price: item.discounted_price,
            }));

            await AbandonedCart.findOneAndUpdate(
                { user_id: userId },
                {
                    user_name: userName,
                    email: user.email,
                    phone_number: user.phone_number,
                    whatsapp_number: user.whatsapp_number,
                    cart_items: cartItemsData,
                    last_updated: new Date(),
                },
                { upsert: true, new: true }
            );
        }

        // Clean up abandoned carts for users with no cart items
        const userIdsWithCarts = Object.keys(userCarts);
        await AbandonedCart.deleteMany({
            user_id: { $nin: userIdsWithCarts.map(id => require('mongoose').Types.ObjectId(id)) }
        });

        console.log('Abandoned cart backup sync completed');
    } catch (error) {
        console.error('Error in syncAbandonedCarts:', error);
    }
};

// Start cron job - runs every hour as backup
const startAbandonedCartCron = () => {
    // Run every hour: 0 * * * *
    cron.schedule('0 * * * *', () => {
        console.log('Starting backup abandoned cart sync...');
        syncAbandonedCarts();
    });

    console.log('Abandoned cart backup sync cron started - running every hour');
};

module.exports = { startAbandonedCartCron, syncAbandonedCarts };