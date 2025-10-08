// resinArts/backend/utils/abandonedCartCron.js
const cron = require('node-cron');
const Cart = require('../models/Cart');
const User = require('../models/User');
const AbandonedCart = require('../models/AbandonedCart');

// Function to check and create/update abandoned carts
const checkAbandonedCarts = async () => {
    try {
        console.log('Running abandoned cart check...');
        
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find all carts that were updated more than 30 minutes ago
        const oldCartItems = await Cart.find({
            updatedAt: { $lte: thirtyMinutesAgo }
        });

        if (oldCartItems.length === 0) {
            console.log('No abandoned carts found');
            return;
        }

        // Group cart items by user_id
        const cartsByUser = {};
        oldCartItems.forEach(item => {
            const userId = item.user_id.toString();
            if (!cartsByUser[userId]) {
                cartsByUser[userId] = [];
            }
            cartsByUser[userId].push(item);
        });

        // Process each user's abandoned cart
        for (const [userId, cartItems] of Object.entries(cartsByUser)) {
            try {
                // Fetch user details
                const user = await User.findById(userId);
                if (!user) {
                    console.log(`User not found for ID: ${userId}`);
                    continue;
                }

                const userName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();

                // Prepare cart items data
                const cartItemsData = cartItems.map(item => ({
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

                // Check if abandoned cart already exists for this user
                const existingAbandonedCart = await AbandonedCart.findOne({ user_id: userId });

                if (existingAbandonedCart) {
                    // Update existing abandoned cart
                    existingAbandonedCart.cart_items = cartItemsData;
                    existingAbandonedCart.last_updated = new Date();
                    existingAbandonedCart.user_name = userName;
                    existingAbandonedCart.email = user.email;
                    existingAbandonedCart.phone_number = user.phone_number;
                    existingAbandonedCart.whatsapp_number = user.whatsapp_number;
                    await existingAbandonedCart.save();
                    console.log(`Updated abandoned cart for user: ${userName}`);
                } else {
                    // Create new abandoned cart
                    const newAbandonedCart = new AbandonedCart({
                        user_id: userId,
                        user_name: userName,
                        email: user.email,
                        phone_number: user.phone_number,
                        whatsapp_number: user.whatsapp_number,
                        cart_items: cartItemsData,
                        last_updated: new Date(),
                    });
                    await newAbandonedCart.save();
                    console.log(`Created abandoned cart for user: ${userName}`);
                }
            } catch (error) {
                console.error(`Error processing abandoned cart for user ${userId}:`, error);
            }
        }

        console.log('Abandoned cart check completed');
    } catch (error) {
        console.error('Error in checkAbandonedCarts:', error);
    }
};

// Schedule the cron job to run every 30 minutes
const startAbandonedCartCron = () => {
    // Run every 30 minutes: */30 * * * *
    cron.schedule('*/30 * * * *', () => {
        console.log('Starting scheduled abandoned cart check...');
        checkAbandonedCarts();
    });

    console.log('Abandoned cart cron job started - running every 30 minutes');
    
    // Optional: Run immediately on startup
    checkAbandonedCarts();
};

module.exports = { startAbandonedCartCron, checkAbandonedCarts };