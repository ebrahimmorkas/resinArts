const cron = require('node-cron');
const Order = require('../models/Order');
const CompanySettings = require('../models/CompanySettings');
const sendEmail = require('../utils/sendEmail');

let currentCronJob = null;

// Calculate the cutoff date based on settings
const calculateCutoffDate = (unit, value) => {
    const now = new Date();
    
    switch(unit) {
        case 'minutes':
            return new Date(now.getTime() - value * 60 * 1000);
        case 'hours':
            return new Date(now.getTime() - value * 60 * 60 * 1000);
        case 'days':
            return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        case 'weeks':
            return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        case 'months':
            const monthsAgo = new Date(now);
            monthsAgo.setMonth(monthsAgo.getMonth() - value);
            return monthsAgo;
        case 'years':
            const yearsAgo = new Date(now);
            yearsAgo.setFullYear(yearsAgo.getFullYear() - value);
            return yearsAgo;
        default:
            return now;
    }
};

// Get cron schedule based on settings
const getCronSchedule = (unit, value) => {
    switch(unit) {
        case 'minutes':
            // Run every X minutes
            return `*/${value} * * * *`;
        case 'hours':
            // Run every X hours
            return `0 */${value} * * *`;
        case 'days':
            // Run once daily at midnight
            return '0 0 * * *';
        case 'weeks':
            // Run once weekly on Sunday at midnight
            return '0 0 * * 0';
        case 'months':
            // Run once monthly on 1st at midnight
            return '0 0 1 * *';
        case 'years':
            // Run once yearly on Jan 1st at midnight
            return '0 0 1 1 *';
        default:
            // Default: run daily at midnight
            return '0 0 * * *';
    }
};

// Format order details for email
const formatOrderDetails = (orders) => {
    return orders.map((order, index) => {
        const products = order.orderedProducts.map(p => 
            `    - ${p.product_name}${p.variant_name ? ` (${p.variant_name})` : ''}${p.size ? ` - Size: ${p.size}` : ''} x ${p.quantity} = ₹${p.total}`
        ).join('\n');
        
        return `
${index + 1}. Order ID: ${order._id}
   Customer: ${order.user_name}
   Email: ${order.email}
   Phone: ${order.phone_number}
   Status: ${order.status}
   Payment Status: ${order.payment_status}
   Order Date: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
   Last Updated: ${new Date(order.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
   Products:
${products}
   Subtotal: ₹${order.price}
   Shipping: ₹${order.shipping_price}
   Total: ₹${order.total_price}
   ${order.cash_applied ? `Cash Applied: ₹${order.cash_applied.amount}` : ''}
`;
    }).join('\n' + '='.repeat(80) + '\n');
};

// Check and delete orders based on settings
const checkAndDeleteOrders = async () => {
    try {
        console.log('Starting automatic order deletion check...');
        
        // Get company settings
        const settings = await CompanySettings.findOne();
        
        if (!settings || !settings.autoDeleteOrders || !settings.autoDeleteOrders.enabled) {
            console.log('Automatic order deletion is disabled');
            return;
        }
        
        const { deleteStatus, deleteAfterUnit, deleteAfterValue } = settings.autoDeleteOrders;
        
        // Calculate cutoff date
        const cutoffDate = calculateCutoffDate(deleteAfterUnit, deleteAfterValue);
        const now = new Date();
        
        console.log(`Checking for ${deleteStatus} orders older than ${deleteAfterValue} ${deleteAfterUnit}`);
        console.log(`Cutoff date: ${cutoffDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        
        // Find orders to delete
        const ordersToDelete = await Order.find({
            status: deleteStatus,
            updatedAt: { $lte: cutoffDate }
        });
        
        if (ordersToDelete.length === 0) {
            console.log('No orders found for deletion');
            return;
        }
        
        console.log(`Found ${ordersToDelete.length} orders to delete`);
        
        // Delete orders
        const deleteResult = await Order.deleteMany({
            status: deleteStatus,
            updatedAt: { $lte: cutoffDate }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} orders`);
        
        // Send email notification to admin
        if (settings.adminEmail) {
            const emailSubject = `Automatic Order Deletion Report - ${ordersToDelete.length} Orders Deleted`;
            
            const emailBody = `
Automatic Order Deletion Report
${'='.repeat(80)}

Deletion Summary:
- Total Orders Deleted: ${ordersToDelete.length}
- Status: ${deleteStatus}
- Duration: ${deleteAfterValue} ${deleteAfterUnit}
- Start Date: ${cutoffDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- End Date: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

${'='.repeat(80)}

Deleted Orders Details:
${'='.repeat(80)}
${formatOrderDetails(ordersToDelete)}

${'='.repeat(80)}

This is an automated email notification from your e-commerce system.
Orders with status "${deleteStatus}" that were last updated before ${cutoffDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} have been permanently deleted from the database.

Note: This action cannot be undone. Please ensure you have proper backups if needed.
`;
            
            try {
                await sendEmail(settings.adminEmail, emailSubject, emailBody);
                console.log(`Deletion notification email sent to ${settings.adminEmail}`);
            } catch (emailError) {
                console.error('Error sending deletion notification email:', emailError);
            }
        }
        
        console.log('Automatic order deletion check completed');
    } catch (error) {
        console.error('Error in checkAndDeleteOrders:', error);
    }
};

// Start or restart cron job based on current settings
const startOrderDeletionCron = async () => {
    try {
        // Stop existing cron job if running
        if (currentCronJob) {
            currentCronJob.stop();
            currentCronJob = null;
            console.log('Stopped existing order deletion cron job');
        }
        
        // Get company settings
        const settings = await CompanySettings.findOne();
        
        if (!settings || !settings.autoDeleteOrders || !settings.autoDeleteOrders.enabled) {
            console.log('Order deletion cron job not started - feature is disabled');
            return;
        }
        
        const { deleteAfterUnit, deleteAfterValue } = settings.autoDeleteOrders;
        
        // Get appropriate cron schedule
        const cronSchedule = getCronSchedule(deleteAfterUnit, deleteAfterValue);
        
        console.log(`Starting order deletion cron job with schedule: ${cronSchedule}`);
        console.log(`Will check for orders every ${deleteAfterValue} ${deleteAfterUnit}`);
        
        // Start new cron job
        currentCronJob = cron.schedule(cronSchedule, () => {
            console.log('Running scheduled order deletion check...');
            checkAndDeleteOrders();
        });
        
        console.log('Order deletion cron job started successfully');
    } catch (error) {
        console.error('Error starting order deletion cron job:', error);
    }
};

// Stop cron job
const stopOrderDeletionCron = () => {
    if (currentCronJob) {
        currentCronJob.stop();
        currentCronJob = null;
        console.log('Order deletion cron job stopped');
    }
};

// Restart cron job (call this when settings are updated)
const restartOrderDeletionCron = async () => {
    console.log('Restarting order deletion cron job with new settings...');
    await startOrderDeletionCron();
};

module.exports = { 
    startOrderDeletionCron, 
    stopOrderDeletionCron,
    restartOrderDeletionCron,
    checkAndDeleteOrders 
};