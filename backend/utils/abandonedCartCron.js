const cron = require('node-cron');
const Cart = require('../models/Cart');
const User = require('../models/User');
const AbandonedCart = require('../models/AbandonedCart');
const Notification = require('../models/Notification');

// Check for abandoned carts that need notifications (15+ minutes old)
const checkAbandonedCartNotifications = async (io) => {
    try {
        console.log('Checking for abandoned cart notifications...');
        
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        // Find abandoned carts that are 15+ minutes old
        const abandonedCarts = await AbandonedCart.find({
            createdAt: { $lte: fifteenMinutesAgo }
        });

        for (const cart of abandonedCarts) {
            // Check if notification already exists for this cart
            const existingNotification = await Notification.findOne({
                abandonedCartId: cart._id,
                type: 'abandonedCart'
            });

            if (!existingNotification) {
                // Create new notification
                const notification = new Notification({
                    title: 'Abandoned Cart Alert',
                    message: `${cart.user_name} has ${cart.cart_items.length} item(s) in their abandoned cart`,
                    time: new Date(),
                    unread: true,
                    recipient: 'admin',
                    type: 'abandonedCart',
                    abandonedCartId: cart._id,
                    userId: cart.user_id,
                    itemCount: cart.cart_items.length,
                    customerName: cart.user_name,
                    whatsappNumber: cart.whatsapp_number,
                    cartItems: cart.cart_items,
                });

                await notification.save();

                // Emit socket event to admin
                if (io) {
                    io.to('admin_room').emit('abandonedCartNotification', {
                        id: notification._id,
                        title: notification.title,
                        message: notification.message,
                        time: notification.time,
                        unread: notification.unread,
                        type: 'abandonedCart',
                        abandonedCartId: cart._id,
                        userId: cart.user_id,
                        itemCount: cart.cart_items.length,
                        customerName: cart.user_name,
                        whatsappNumber: cart.whatsapp_number,
                        cartItems: cart.cart_items,
                    });
                }

                console.log(`Notification created for abandoned cart: ${cart._id}`);
            } else {
                // Update existing notification if cart items changed
                if (existingNotification.itemCount !== cart.cart_items.length) {
                    existingNotification.itemCount = cart.cart_items.length;
                    existingNotification.message = `${cart.user_name} has ${cart.cart_items.length} item(s) in their abandoned cart`;
                    existingNotification.time = new Date();
                    existingNotification.unread = true;
                    existingNotification.cartItems = cart.cart_items;
                    await existingNotification.save();

                    // Emit updated notification
                    if (io) {
                        io.to('admin_room').emit('abandonedCartNotification', {
                            id: existingNotification._id,
                            title: existingNotification.title,
                            message: existingNotification.message,
                            time: existingNotification.time,
                            unread: existingNotification.unread,
                            type: 'abandonedCart',
                            abandonedCartId: cart._id,
                            userId: cart.user_id,
                            itemCount: cart.cart_items.length,
                            customerName: cart.user_name,
                            whatsappNumber: cart.whatsapp_number,
                            cartItems: cart.cart_items,
                        });
                    }

                    console.log(`Notification updated for abandoned cart: ${cart._id}`);
                }
            }
        }

        console.log('Abandoned cart notification check completed');
    } catch (error) {
        console.error('Error in checkAbandonedCartNotifications:', error);
    }
};

// Backup sync function - runs hourly to catch any missed updates
const syncAbandonedCarts = async () => {
    try {
        console.log('Running abandoned cart backup sync...');
        
        const cartItems = await Cart.find({});
        
        const userCarts = {};
        cartItems.forEach(item => {
            const userId = item.user_id.toString();
            if (!userCarts[userId]) {
                userCarts[userId] = [];
            }
            userCarts[userId].push(item);
        });

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

        const userIdsWithCarts = Object.keys(userCarts);
        await AbandonedCart.deleteMany({
            user_id: { $nin: userIdsWithCarts.map(id => require('mongoose').Types.ObjectId(id)) }
        });

        console.log('Abandoned cart backup sync completed');
    } catch (error) {
        console.error('Error in syncAbandonedCarts:', error);
    }
};

// Start cron jobs
const startAbandonedCartCron = (io) => {
    // Check for notification-worthy carts every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        console.log('Starting abandoned cart notification check...');
        checkAbandonedCartNotifications(io);
    });

    // Backup sync every hour
    cron.schedule('0 * * * *', () => {
        console.log('Starting backup abandoned cart sync...');
        syncAbandonedCarts();
    });

    console.log('Abandoned cart cron jobs started');
    
    // Run notification check immediately on startup
    if (io) {
        checkAbandonedCartNotifications(io);
    }
};

module.exports = { startAbandonedCartCron, syncAbandonedCarts, checkAbandonedCartNotifications };