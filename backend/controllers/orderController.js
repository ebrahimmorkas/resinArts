const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const CompanySettings = require('../models/CompanySettings');
const FreeCash = require('../models/FreeCash');
const Discount = require('../models/Discount');
const { removeAbandonedCartByUserId } = require('./abandonedCartController');
const Notification = require('../models/Notification');
const AbandonedCart = require('../models/AbandonedCart');

// In-memory cache to track notified low stock/out-of-stock items
const notifiedItems = new Map(); // Key: productId_variantId_sizeId, Value: { lowStockNotified, outOfStockNotified }

// Helper function to generate item key
const getItemKey = (productId, variantId, sizeId) => {
  return `${productId}_${variantId || ''}_${sizeId || ''}`;
};

// Function to check whether the order exists or not
const findOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (order) {
            return order;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
}

const findUser = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        return user;
    } else {
        return null;
    }
}

const findProduct = async (productId) => {
    const product = await Product.findById(productId);
    if (product) {
        return product;
    } else {
        return null;
    }
}

// Function to add the order
const placeOrder = async (req, res) => {
  try {
    const cartItems = Object.values(req.body);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const errors = [];
    const ordersToAdd = [];
    let totalFreeCashApplied = 0;
    let freeCashId = null;

    const freeCash = await FreeCash.findOne({
      user_id: userId,
      is_cash_used: false,
      is_cash_expired: false,
      start_date: { $lte: new Date() },
      $or: [{ end_date: { $gte: new Date() } }, { end_date: null }],
    });

    const now = new Date();
    const discountData = await Discount.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      isActive: true,
    });

    for (const cartData of cartItems) {
      try {
        const product = await Product.findById(cartData.productId);
        if (!product) {
          errors.push(`Product not found for id ${cartData.productId}`);
          continue;
        }

        let variant = null;
        let sizeDetail = null;
        if (cartData.variantId) {
          variant = product.variants.find((v) => v._id.toString() === cartData.variantId);
          if (!variant) {
            errors.push(`Variant not found for product ${cartData.productName}`);
            continue;
          }

          if (cartData.detailsId) {
            sizeDetail = variant.moreDetails.find((md) => md._id.toString() === cartData.detailsId);
            if (!sizeDetail) {
              errors.push(`Size detail not found for variant in product ${cartData.productName}`);
              continue;
            }
          }
        }

        let discountStartDate, discountEndDate;
        if (sizeDetail && sizeDetail.discountStartDate && sizeDetail.discountEndDate) {
          discountStartDate = sizeDetail.discountStartDate;
          discountEndDate = sizeDetail.discountEndDate;
        } else if (variant && variant.discountStartDate && variant.discountEndDate) {
          discountStartDate = variant.discountStartDate;
          discountEndDate = variant.discountEndDate;
        } else if (product.discountStartDate && product.discountEndDate) {
          discountStartDate = product.discountStartDate;
          discountEndDate = product.discountEndDate;
        }

        const isDiscountActive =
          discountStartDate && discountEndDate
            ? now >= new Date(discountStartDate) && now <= new Date(discountEndDate)
            : false;

        let basePrice = 0;
        if (sizeDetail) {
          basePrice = parseFloat(isDiscountActive && sizeDetail.discountPrice ? sizeDetail.discountPrice : sizeDetail.price) || 0;
        } else if (variant && variant.commonPrice !== undefined) {
          basePrice = parseFloat(isDiscountActive && variant.discountCommonPrice ? variant.discountCommonPrice : variant.commonPrice) || 0;
        } else {
          basePrice = parseFloat(isDiscountActive && product.discountPrice ? product.discountPrice : product.price) || 0;
        }

        let bulkPricing = [];
        if (sizeDetail) {
          if (isDiscountActive && sizeDetail.discountBulkPricing) {
            bulkPricing = sizeDetail.discountBulkPricing || [];
          } else if (sizeDetail.bulkPricingCombinations) {
            bulkPricing = sizeDetail.bulkPricingCombinations || [];
          }
        } else if (variant) {
          if (isDiscountActive && variant.discountBulkPricing) {
            bulkPricing = variant.discountBulkPricing || [];
          } else if (variant.bulkPricing) {
            bulkPricing = variant.bulkPricing || [];
          }
        } else {
          if (isDiscountActive && product.discountBulkPricing) {
            bulkPricing = product.discountBulkPricing || [];
          } else if (product.bulkPricing) {
            bulkPricing = product.bulkPricing || [];
          }
        }

        let globalDiscount = null;
        for (const discount of discountData) {
          if (
            discount.applicableToAll ||
            (discount.selectedMainCategory && product.categoryPath?.includes(discount.selectedMainCategory)) ||
            (discount.selectedSubCategory && product.categoryPath?.includes(discount.selectedSubCategory))
          ) {
            globalDiscount = discount;
            break;
          }
        }

        if (globalDiscount) {
          const discountFactor = 1 - globalDiscount.discountPercentage / 100;
          basePrice *= discountFactor;
          bulkPricing = bulkPricing.map((tier) => ({
            ...tier,
            wholesalePrice: tier.wholesalePrice * discountFactor,
          }));
        }

        let effectiveUnitPrice = basePrice;
        if (bulkPricing.length > 0) {
          for (let i = bulkPricing.length - 1; i >= 0; i--) {
            if (cartData.quantity >= bulkPricing[i].quantity) {
              effectiveUnitPrice = bulkPricing[i].wholesalePrice;
              break;
            }
          }
        }

        const subtotal = effectiveUnitPrice * cartData.quantity;

        let cashApplied = cartData.cash_applied || cartData.cashApplied || 0;
        if (freeCash && cashApplied > 0) {
          const isEligible = isFreeCashEligible(product, cartData, freeCash);
          if (!isEligible) {
            errors.push(`Free cash not eligible for product ${cartData.productName}`);
            cashApplied = 0;
          } else {
            totalFreeCashApplied += cashApplied;
            freeCashId = freeCash._id;
          }
        }

        const orderItem = {
          image_url: cartData.imageUrl,
          product_id: cartData.productId,
          product_name: cartData.productName,
          quantity: cartData.quantity,
          price: effectiveUnitPrice,
          total: subtotal,
          cash_applied: cashApplied,
        };

        if (cartData.variantId) {
          orderItem.variant_id = cartData.variantId;
          orderItem.variant_name = variant ? variant.colorName : cartData.variantName;
        }

        if (cartData.sizeId) {
          orderItem.size_id = cartData.sizeId;
          orderItem.size = sizeDetail
            ? `${sizeDetail.size.length} × ${sizeDetail.size.breadth} × ${sizeDetail.size.height} ${sizeDetail.size.unit || 'cm'}`
            : cartData.sizeString;
        }

        ordersToAdd.push(orderItem);
      } catch (itemError) {
        console.error('Error processing cart item:', itemError);
        errors.push(`Error processing product ${cartData.productId}: ${itemError.message}`);
        continue;
      }
    }

    if (ordersToAdd.length > 0) {
      const totalPrice = ordersToAdd.reduce((sum, item) => sum + item.total, 0);
      const finalPrice = Math.max(0, totalPrice - totalFreeCashApplied);

      const orderData = {
        user_id: req.user.id,
        user_name: `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim(),
        email: user.email,
        phone_number: user.phone_number,
        whatsapp_number: user.whatsapp_number,
        orderedProducts: ordersToAdd,
        price: finalPrice,
        total_price: finalPrice, // Ensure total_price is set
        shipping_price: 0, // Initialize shipping_price
        status: 'Pending',
        payment_status: 'Payment Pending',
        createdAt: new Date(),
      };

      if (totalFreeCashApplied > 0 && freeCashId) {
        orderData.cash_applied = { amount: totalFreeCashApplied, freeCashId };
        await FreeCash.findByIdAndUpdate(freeCashId, { is_cash_used: true, cash_used_date: new Date() });
        try {
          await sendEmail(
            user.email,
            'Free Cash Applied',
            `Your free cash of $${totalFreeCashApplied} has been applied to your order. Note: Free cash is single-use and any remaining amount is not credited back.`
          );
        } catch (emailError) {
          console.error('Error sending free cash email:', emailError);
        }
      }

      const newOrder = new Order(orderData);
      await newOrder.save();

      if (!newOrder._id) {
        throw new Error('Failed to create order with valid ID');
      }

      // Remove from abandoned cart
      try {
        await AbandonedCart.findOneAndDelete({ user_id: req.user.id });
        const io = req.app.get('io');
        if (io) {
          io.to('admin_room').emit('abandoned_cart_removed', { userId: req.user.id });
        }
      } catch (error) {
        console.error('Error removing abandoned cart:', error);
      }

      // Create and save notification
      const productList = ordersToAdd
        .map((item, index) => {
          let details = `${index + 1}. ${item.product_name} (Qty: ${item.quantity})`;
          if (item.variant_name) details += ` - ${item.variant_name}`;
          if (item.size) details += ` - Size: ${item.size}`;
          return details;
        })
        .join('\n');
      const notification = new Notification({
        title: 'New Order Received',
        message: `Order #${newOrder._id} placed by ${orderData.user_name}:\n${productList}`,
        orderId: newOrder._id,
        recipient: 'admin',
      });
      await notification.save();

      // Emit correct order data via Socket.IO
      const io = req.app.get('io');
      console.log('Emitting newOrder event for order:', newOrder._id);
      io.to('admin_room').emit('newOrder', {
        _id: newOrder._id,
        user_id: newOrder.user_id,
        user_name: newOrder.user_name,
        email: newOrder.email,
        phone_number: newOrder.phone_number,
        whatsapp_number: newOrder.whatsapp_number,
        orderedProducts: newOrder.orderedProducts,
        price: newOrder.price,
        total_price: newOrder.total_price,
        shipping_price: newOrder.shipping_price,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        createdAt: newOrder.createdAt,
      });

      // Send email notification to admin
      try {
        const companySettings = await CompanySettings.findOne();
        if (companySettings && companySettings.receiveOrderEmails && companySettings.adminEmail) {
          const orderDetailsText = ordersToAdd
            .map((item, index) => {
              let itemDetails = `${index + 1}. ${item.product_name}`;
              if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
              if (item.size) itemDetails += ` - Size: ${item.size}`;
              itemDetails += `\n   Quantity: ${item.quantity}`;
              itemDetails += `\n   Price: ₹${item.price.toFixed(2)}`;
              itemDetails += `\n   Total: ₹${item.total.toFixed(2)}`;
              if (item.cash_applied > 0) itemDetails += `\n   Free Cash Applied: ₹${item.cash_applied.toFixed(2)}`;
              return itemDetails;
            })
            .join('\n\n');

          const emailSubject = `New Order Placed - Order #${newOrder._id}`;
          const emailText = `
🎉 NEW ORDER RECEIVED!

Order ID: ${newOrder._id}
Order Date: ${new Date(newOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Order Status: ${newOrder.status}
Payment Status: ${newOrder.payment_status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${orderData.user_name}
Email: ${user.email}
Phone: ${user.phone_number}
WhatsApp: ${user.whatsapp_number}

Address: ${user.address || 'Not provided'}
City: ${user.city || 'Not provided'}
State: ${user.state || 'Not provided'}
Pincode: ${user.zip_code || 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${orderDetailsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹${totalPrice.toFixed(2)}
${totalFreeCashApplied > 0 ? `Free Cash Applied: -₹${totalFreeCashApplied.toFixed(2)}` : ''}
Shipping: ₹${newOrder.shipping_price.toFixed(2)}

TOTAL: ₹${finalPrice.toFixed(2)} + Shipping Price

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Items: ${ordersToAdd.length}

${companySettings.companyName ? `\n--\n${companySettings.companyName}` : ''}
This is an automated email notification.
          `.trim();

          await sendEmail(companySettings.adminEmail, emailSubject, emailText);
          console.log(`Order notification email sent to: ${companySettings.adminEmail}`);
        }
      } catch (emailError) {
        console.error('Error sending order notification email:', emailError);
      }

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        order: {
          id: newOrder._id,
          totalPrice: finalPrice,
          itemCount: ordersToAdd.length,
          validItems: ordersToAdd.length,
          totalItems: cartItems.length,
        },
        warnings: errors.length > 0 ? {
          message: `${errors.length} items could not be processed`,
          details: errors,
        } : undefined,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid items to order. All items have errors.',
        errors: errors,
      });
    }
  } catch (error) {
    console.error('Order placement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while placing order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Function to fetch all the orders
const fetchOrders = async (req, res) => {
    console.log("Request received for fetching orders");
    try {
        const orders = await Order.find();
        if (orders) {
            return res.status(200).json({ message: "Success", orders });
        } else {
            return res.status(400).json({ message: "No orders found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Function where admin will update the shipping price
const shippingPriceUpdate = async (req, res) => {
  try {
    const { shippingPriceValue, orderId, email } = req.body;
    console.log('Received shippingPriceUpdate request:', { shippingPriceValue, orderId, email });

    // Validate inputs
    if (!orderId || shippingPriceValue === undefined || isNaN(shippingPriceValue) || parseInt(shippingPriceValue) <= 0) {
      console.error('Validation failed:', { shippingPriceValue, orderId, email });
      return res.status(400).json({ message: 'Order ID and valid positive shipping price are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found for ID:', orderId);
      return res.status(400).json({ message: 'Order not found' });
    }

    // Check stock for each ordered product
    for (const item of order.orderedProducts) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        console.error('Product not found:', item.product_id);
        return res.status(404).json({ message: `Product not found for ID ${item.product_id}` });
      }

      if (!item.variant_id) {
        // Product without variants
        if (product.stock < item.quantity) {
          console.error('Insufficient stock for product:', { product_id: item.product_id, product_name: item.product_name, stock: product.stock, quantity: item.quantity });
          return res.status(400).json({ message: `Insufficient stock for product ${item.product_name}. Cannot accept order.` });
        }
      } else {
        // Product with variants
        const variant = product.variants.id(item.variant_id);
        if (!variant) {
          console.error('Variant not found:', { product_id: item.product_id, variant_id: item.variant_id });
          return res.status(404).json({ message: `Variant not found for product ${item.product_name}` });
        }

        const sizeDetail = variant.moreDetails.id(item.size_id);
        if (!sizeDetail) {
          console.error('Size detail not found:', { product_id: item.product_id, variant_id: item.variant_id, size_id: item.size_id });
          return res.status(404).json({ message: `Size detail not found for variant in product ${item.product_name}` });
        }

        if (sizeDetail.stock < item.quantity) {
          console.error('Insufficient stock for size:', { product_name: item.product_name, variant_name: item.variant_name, size: item.size, stock: sizeDetail.stock, quantity: item.quantity });
          return res.status(400).json({ message: `Insufficient stock for size ${item.size} in variant ${item.variant_name} of product ${item.product_name}. Cannot accept order.` });
        }
      }
    }

    // Update order
    const totalPrice = parseFloat(order.price) + parseFloat(shippingPriceValue);
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        shipping_price: parseFloat(shippingPriceValue),
        total_price: totalPrice,
        status: 'Accepted',
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      console.error('Failed to update order:', orderId);
      return res.status(400).json({ message: 'Problem while updating the order' });
    }

    console.log('Order updated:', { id: updatedOrder._id, shipping_price: updatedOrder.shipping_price, total_price: updatedOrder.total_price, status: updatedOrder.status });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting shippingPriceUpdated event for order:', updatedOrder._id);
      io.to('admin_room').emit('shippingPriceUpdated', {
        _id: updatedOrder._id,
        shipping_price: updatedOrder.shipping_price,
        total_price: updatedOrder.total_price,
        status: updatedOrder.status,
      });
    } else {
      console.error('Socket.IO not initialized');
    }

    // Send email notification
    try {
      const companySettings = await CompanySettings.findOne();
      await sendEmail(
        email,
        `Order #${orderId} Accepted`,
        `Dear ${order.user_name},\n\nYour order #${orderId} has been accepted.\nShipping Price: ₹${updatedOrder.shipping_price.toFixed(2)}\nTotal Price: ₹${updatedOrder.total_price.toFixed(2)}\n\nThank you for shopping with ${companySettings?.companyName || 'Mould Market'}!`
      );
      console.log('Shipping price update email sent to:', email);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
    }

    return res.status(200).json({
      message: 'Shipping price updated',
      order: {
        id: updatedOrder._id,
        shipping_price: updatedOrder.shipping_price,
        total_price: updatedOrder.total_price,
        status: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error('Shipping price update error:', error.message, error.stack);
    return res.status(500).json({
      message: `Failed to update shipping price: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Function to handle status
const handleStatusChange = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    const statuses = ["Accepted", "Rejected", "In-Progress", "Dispatched", "Completed", "Pending", "Confirm"];

    if (!statuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await findOrder(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    const user = await findUser(order.user_id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let paymentStatus = order.payment_status;
    const companySettings = await CompanySettings.getSingleton();
    const lowStockThreshold = companySettings.lowStockAlertThreshold || 10;

    if (status === "Confirm") {
      paymentStatus = "Paid";

      // Deduct stock and check for low stock/out of stock
      for (const item of order.orderedProducts) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          return res.status(404).json({ message: `Product not found for ID ${item.product_id}` });
        }

        const itemKey = getItemKey(item.product_id, item.variant_id, item.size_id);
        let stockLevel = 0;
        let itemName = product.name;

        if (!item.variant_id) {
          // Product without variants
          if (product.stock < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock for product ${item.product_name}` });
          }
          product.stock -= item.quantity;
          stockLevel = product.stock;
        } else {
          // Product with variants
          const variant = product.variants.id(item.variant_id);
          if (!variant) {
            return res.status(404).json({ message: `Variant not found for product ${item.product_name}` });
          }

          const sizeDetail = variant.moreDetails.id(item.size_id);
          if (!sizeDetail) {
            return res.status(404).json({ message: `Size detail not found for variant in product ${item.product_name}` });
          }

          if (sizeDetail.stock < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock for size ${item.size} in variant ${item.variant_name} of product ${item.product_name}` });
          }
          sizeDetail.stock -= item.quantity;
          stockLevel = sizeDetail.stock;
          itemName += item.variant_name ? ` (${item.variant_name}` : '';
          itemName += item.size ? `, Size ${item.size})` : ')';
        }

        // Save the updated product
        await product.save();

        // Check for low stock or out of stock
        const notified = notifiedItems.get(itemKey) || { lowStockNotified: false, outOfStockNotified: false };

        if (stockLevel === 0 && !notified.outOfStockNotified) {
          // Out of Stock Notification
          const notification = new Notification({
            title: 'Out of Stock Alert',
            message: `Out of Stock Alert: ${itemName} is out of stock (Product ID: ${item.product_id})`,
            recipient: 'admin',
            productId: item.product_id,
            type: 'outOfStock',
          });
          await notification.save();

          // Emit Socket.IO event
          const io = req.app.get('io');
          io.to('admin_room').emit('newOrder', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            unread: notification.unread,
            productId: notification.productId,
            type: notification.type,
          });

          // Send email if enabled
          if (companySettings.receiveOutOfStockEmail && companySettings.adminEmail) {
            try {
              await sendEmail(
                companySettings.adminEmail,
                `Out of Stock Alert: ${itemName}`,
                `The following item is out of stock:\n\n${itemName}\nProduct ID: ${item.product_id}\n\nPlease restock the item.\n\n--\n${companySettings.companyName || 'Mould Market'}`
              );
              console.log(`Out of stock email sent to: ${companySettings.adminEmail}`);
            } catch (emailError) {
              console.error('Error sending out of stock email:', emailError);
            }
          }

          // Update notified status
          notifiedItems.set(itemKey, { ...notified, outOfStockNotified: true });
        } else if (stockLevel > 0 && stockLevel < lowStockThreshold && !notified.lowStockNotified) {
          // Low Stock Notification
          const notification = new Notification({
            title: 'Low Stock Alert',
            message: `Low Stock Alert: ${itemName} has ${stockLevel} units remaining (Product ID: ${item.product_id})`,
            recipient: 'admin',
            productId: item.product_id,
            type: 'lowStock',
          });
          await notification.save();

          // Emit Socket.IO event
          const io = req.app.get('io');
          io.to('admin_room').emit('newOrder', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            unread: notification.unread,
            productId: notification.productId,
            type: notification.type,
          });

          // Send email if enabled
          if (companySettings.receiveLowStockEmail && companySettings.adminEmail) {
            try {
              await sendEmail(
                companySettings.adminEmail,
                `Low Stock Alert: ${itemName}`,
                `The following item is low on stock:\n\n${itemName}\nRemaining Stock: ${stockLevel} units\nProduct ID: ${item.product_id}\n\nPlease consider restocking.\n\n--\n${companySettings.companyName || 'Mould Market'}`
              );
              console.log(`Low stock email sent to: ${companySettings.adminEmail}`);
            } catch (emailError) {
              console.error('Error sending low stock email:', emailError);
            }
          }

          // Update notified status
          notifiedItems.set(itemKey, { ...notified, lowStockNotified: true });
        } else if (stockLevel >= lowStockThreshold) {
          // Reset low stock notification if stock is replenished above threshold
          notifiedItems.set(itemKey, { lowStockNotified: false, outOfStockNotified: false });
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: status,
        payment_status: paymentStatus,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    try {
      switch (status) {
        case "Rejected":
          await sendEmail(user.email, 'Order Rejected', `Unfortunately, your order with ID ${orderId} has been rejected`);
          break;
        case "Confirm":
          await sendEmail(user.email, 'Order Confirmed', `We have successfully received your payment for order ${orderId}. Your order will be delivered soon`);
          break;
        case "Dispatched":
          await sendEmail(user.email, 'Order Dispatched', `Your order ${orderId} has been successfully dispatched`);
          break;
      }
    } catch (error) {
      console.log("Error in sending email:", error);
    }

    return res.status(200).json({ message: `${status} updated successfully` });
  } catch (error) {
    console.error('Status change error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Function to edit the order that is quantity and price
const editOrder = async (req, res) => {
    try {
        const { products } = req.body;
        const { orderId } = req.params;
        const order = await findOrder(orderId);
        const user = await findUser(order.user_id);
        if (order) {
            if (user) {
                const prices = [];
                for (const prod of products) {
                    const product = await findProduct(prod.product_id);
                    if (!product) {
                        return res.status(400).json({ message: "Product not found" });
                    } else {
                        prices.push(prod.total);
                    }
                }
                const price = prices.reduce((accumulator, current) => accumulator + current, 0);
                const totalPrice = price + order.shipping_price;
                try {
                    const updatedProduct = await Order.findByIdAndUpdate(
                        order._id,
                        {
                            orderedProducts: products,
                            price: price,
                            total_price: totalPrice
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                    try {
                        sendEmail(user.email, `Updation of order ${order._id}`, `Your total price is ${updatedProduct.total_price}`);
                    } catch (error) {
                        console.log("Problem in sending email");
                    } finally {
                        return res.status(200).json({ message: "Product edited successfully" });
                    }
                } catch (error) {
                    return res.status(400).json({ message: `Problem while updating the order ${error}` });
                }
            } else {
                return res.status(400).json({ message: "User not found" });
            }
        } else {
            return res.status(400).json({ message: "Order not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

const isFreeCashEligible = (product, cartData, freeCash) => {
    if (!freeCash) return false;
    
    const now = new Date();
    if (
        freeCash.is_cash_used ||
        freeCash.is_cash_expired ||
        now < new Date(freeCash.start_date) ||
        (freeCash.end_date && now > new Date(freeCash.end_date))
    ) {
        return false;
    }

    const itemPrice = cartData.discountedPrice || cartData.price;
    const itemTotal = itemPrice * cartData.quantity;
    
    if (itemTotal < freeCash.valid_above_amount) {
        return false;
    }

    if (freeCash.is_cash_applied_on__all_products) {
        return true;
    }

    if (freeCash.category) {
        const isMainCategoryMatch = product.mainCategory && 
            (product.mainCategory.toString() === freeCash.category.toString() ||
             product.mainCategory._id?.toString() === freeCash.category.toString());
        
        if (!isMainCategoryMatch) {
            return false;
        }

        if (freeCash.sub_category) {
            const isSubCategoryMatch = product.subCategory &&
                (product.subCategory.toString() === freeCash.sub_category.toString() ||
                 product.subCategory._id?.toString() === freeCash.sub_category.toString());
            
            if (!isSubCategoryMatch) {
                return false;
            }
        }
    }

    return true;
};

module.exports = {
    placeOrder,
    fetchOrders,
    shippingPriceUpdate,
    handleStatusChange,
    editOrder,
    isFreeCashEligible,
};