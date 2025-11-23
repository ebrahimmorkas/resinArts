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
const { checkAndDeleteOrders } = require('../utils/orderDeletionCron');

const calculateShippingPrice = async (user, itemsTotal, companySettings) => {
  try {
    // Check if free shipping is enabled and threshold is met
    if (companySettings.shippingPriceSettings.freeShipping && 
        itemsTotal >= companySettings.shippingPriceSettings.freeShippingAboveAmount) {
      return { shippingPrice: 0, isPending: false, needsManualEntry: false };
    }

    // Check if same for all products (common shipping price) - this should be checked BEFORE isManual
    if (companySettings.shippingPriceSettings.sameForAll && companySettings.shippingPriceSettings.commonShippingPrice !== undefined) {
      return { 
        shippingPrice: companySettings.shippingPriceSettings.commonShippingPrice, 
        isPending: false,
        needsManualEntry: false
      };
    }

    // Check if manual pricing is enabled
    if (companySettings.shippingPriceSettings.isManual) {
      // When isManual is true and sameForAll is false, require manual entry
      return { shippingPrice: null, isPending: true, needsManualEntry: true };
    }

    // Location-based shipping (when isManual: false and sameForAll: false)
    const shippingType = companySettings.shippingPriceSettings.shippingType;
    let userLocation = null;

    if (shippingType === 'state') {
      userLocation = user.state;
    } else if (shippingType === 'city') {
      userLocation = user.city;
    } else if (shippingType === 'zipcode') {
      userLocation = user.zip_code;
    }

    // Validate user location is not empty
    if (!userLocation || userLocation.trim() === '') {
      return { shippingPrice: null, isPending: true, needsManualEntry: true };
    }

    // Find matching shipping price in the list
    const shippingEntry = companySettings.shippingPriceSettings.shippingPrices.find(
      entry => entry.location.toLowerCase().trim() === userLocation.toLowerCase().trim()
    );

    if (shippingEntry) {
      return { shippingPrice: shippingEntry.price, isPending: false, needsManualEntry: false };
    } else {
      // Location not found in list - require manual entry
      return { shippingPrice: null, isPending: true, needsManualEntry: true };
    }
  } catch (error) {
    console.error('Error calculating shipping price:', error);
    return { shippingPrice: null, isPending: true, needsManualEntry: true };
  }
};

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
    const { cartItems, deliveryAddress } = req.body;
const cartItemsArray = Object.values(cartItems);
if (!cartItemsArray || cartItemsArray.length === 0) {
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

    for (const cartData of cartItemsArray) {
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

// Check if product has custom dimensions (dimension-based pricing)
if (cartData.customDimensions && cartData.customDimensions.calculatedPrice) {
  basePrice = parseFloat(cartData.customDimensions.calculatedPrice) || 0;
  console.log('💰 Dimension product basePrice:', basePrice);
} else if (sizeDetail) {
  basePrice = parseFloat(isDiscountActive && sizeDetail.discountPrice ? sizeDetail.discountPrice : sizeDetail.price) || 0;
} else if (variant && variant.commonPrice !== undefined) {
  basePrice = parseFloat(isDiscountActive && variant.discountCommonPrice ? variant.discountCommonPrice : variant.commonPrice) || 0;
} else {
  basePrice = parseFloat(isDiscountActive && product.discountPrice ? product.discountPrice : product.price) || 0;
}

console.log('📊 Final basePrice:', basePrice, 'for product:', cartData.productName);

        let bulkPricing = [];

// Check if product has custom dimensions - use product-level bulk pricing
if (cartData.customDimensions) {
  bulkPricing = product.bulkPricing || [];
  console.log('💰 Dimension product bulkPricing:', bulkPricing);
} else if (sizeDetail) {
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
        console.log('💵 effectiveUnitPrice:', effectiveUnitPrice, 'quantity:', cartData.quantity);
        const subtotal = effectiveUnitPrice * cartData.quantity;
        console.log('💵 subtotal:', subtotal);
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
          customDimensions: cartData.customDimensions || null,
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

      // Calculate shipping price
      const companySettings = await CompanySettings.getSingleton();
      const { shippingPrice, isPending } = await calculateShippingPrice(user, finalPrice, companySettings);

       const orderData = {
        user_id: req.user.id,
        user_name: `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim(),
        email: user.email,
        phone_number: user.phone_number,
        whatsapp_number: user.whatsapp_number,
  address_id: deliveryAddress?.address_id || null,
  delivery_address: {
    name: deliveryAddress?.name || 'Home',
    state: deliveryAddress?.state || user.state,
    city: deliveryAddress?.city || user.city,
    pincode: deliveryAddress?.pincode || user.zip_code,
    full_address: deliveryAddress?.full_address || user.address,
  },
  orderedProducts: ordersToAdd,
        price: finalPrice,
        shipping_price: shippingPrice || 0,
        total_price: isPending ? "Pending" : (finalPrice + (shippingPrice || 0)),
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
        time: new Date(),
        unread: true,
        type: 'order',
      });
      await notification.save();

      // Emit notification event for Navbar.jsx
      const io = req.app.get('io');
      console.log('Emitting newOrderNotification event for order:', newOrder._id);
      io.to('admin_room').emit('newOrderNotification', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        time: notification.time.toISOString(),
        unread: notification.unread,
        orderId: notification.orderId,
        type: notification.type,
      });

      // Emit order event for Orders.jsx
      console.log('Emitting newOrder event for order:', newOrder._id);
      io.to('admin_room').emit('newOrder', {
        _id: newOrder._id,
        user_id: newOrder.user_id,
        user_name: newOrder.user_name,
        email: newOrder.email,
        phone_number: newOrder.phone_number,
        whatsapp_number: newOrder.whatsapp_number,
        orderedProducts: newOrder.orderedProducts,
        status: newOrder.status,
        price: newOrder.price,
        shipping_price: newOrder.shipping_price,
        total_price: newOrder.total_price,
        payment_status: newOrder.payment_status,
        cash_applied: newOrder.cash_applied,
        createdAt: newOrder.createdAt.toISOString(),
        updatedAt: newOrder.updatedAt.toISOString(),
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
              if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
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

DELIVERY ADDRESS (${orderData.delivery_address.name}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderData.delivery_address.full_address}
${orderData.delivery_address.city}, ${orderData.delivery_address.state} - ${orderData.delivery_address.pincode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${orderDetailsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹${totalPrice.toFixed(2)}
${totalFreeCashApplied > 0 ? `Free Cash Applied: -₹${totalFreeCashApplied.toFixed(2)}` : ''}
Shipping: ${newOrder.shipping_price === 0 && newOrder.total_price !== "Pending" ? 'Free' : `₹${newOrder.shipping_price.toFixed(2)}`}

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
          totalItems: cartItemsArray.length,
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
    const { shippingPriceValue, orderId, email, isEdit = false } = req.body;
    console.log('Received shippingPriceUpdate request:', { shippingPriceValue, orderId, email, isEdit });

    // Validate inputs
    if (!orderId || shippingPriceValue === undefined || isNaN(shippingPriceValue) || parseFloat(shippingPriceValue) < 0) {
      console.error('Validation failed:', { shippingPriceValue, orderId, email });
      return res.status(400).json({ message: 'Order ID and valid shipping price (>= 0) are required' });
    }

    // Validate email is provided
    if (!email || email.trim() === '') {
      console.error('Validation failed: Email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found for ID:', orderId);
      return res.status(400).json({ message: 'Order not found' });
    }

    // Validate email matches order email for security
    if (order.email !== email.trim()) {
      console.error('Email mismatch for order:', { orderId, providedEmail: email, orderEmail: order.email });
      return res.status(403).json({ message: 'Unauthorized: Email does not match order' });
    }

    // For editing, ensure order status is Accepted
    if (isEdit && order.status !== 'Accepted') {
      console.error('Cannot edit shipping price for non-Accepted order:', { orderId, currentStatus: order.status });
      return res.status(400).json({ message: 'Shipping price can only be edited for Accepted orders' });
    }

    // Check stock for each ordered product (only for new acceptance, not for editing)
    if (!isEdit) {
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
    }

    // Prepare update data
    const updateData = {
      shipping_price: parseFloat(shippingPriceValue),
      total_price: parseFloat(order.price) + parseFloat(shippingPriceValue),
      updatedAt: new Date()
    };

    // Only set status to Accepted when not editing
    if (!isEdit) {
      updateData.status = 'Accepted';
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedOrder) {
      console.error('Failed to update order:', orderId);
      return res.status(400).json({ message: 'Problem while updating the order' });
    }

    console.log('Order updated:', { 
      id: updatedOrder._id, 
      shipping_price: updatedOrder.shipping_price, 
      total_price: updatedOrder.total_price, 
      status: updatedOrder.status,
      isEdit 
    });

    // Emit Socket.IO event
const io = req.app.get('io');
if (io) {
  console.log('Emitting orderUpdated event for order:', updatedOrder._id);
  io.to('admin_room').emit('orderUpdated', {
    _id: updatedOrder._id,
    orderedProducts: updatedOrder.orderedProducts,
    price: updatedOrder.price,
    shipping_price: updatedOrder.shipping_price,
    total_price: updatedOrder.total_price,
    status: updatedOrder.status,
  });
} else {
      console.error('Socket.IO not initialized');
    }

    // Send email notification (your existing email logic remains unchanged)
    try {
      const companySettings = await CompanySettings.findOne();
      
      let emailSubject, emailText;
      
      if (isEdit) {
        // Shipping price update email
        emailSubject = `New total price is ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}, Shipping Cost Updated - Order #${orderId}`;
        emailText = `Dear ${order.user_name},

We have updated the shipping cost for your order #${orderId}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHIPPING COST UPDATE NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Previous Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
Updated Shipping Cost: ₹${parseFloat(updatedOrder.shipping_price || 0).toFixed(2)}
New Total Amount: ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}
Order Status: ${updatedOrder.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASON FOR UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This adjustment has been made to reflect the accurate shipping charges based on:
• Updated shipping rates
• Location-specific pricing
• Package dimensions/weight
• Service provider changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPDATED ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Previous Shipping: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Total: ₹${parseFloat(parseFloat(order.price || 0) + parseFloat(order.shipping_price || 0)).toFixed(2)}

New Shipping: ₹${parseFloat(updatedOrder.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW TOTAL: ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${parseFloat(updatedOrder.shipping_price || 0) > parseFloat(order.shipping_price || 0) ? 
  `• Additional payment of ₹${parseFloat(updatedOrder.shipping_price - order.shipping_price).toFixed(2)} is required
• Please contact us to complete the additional payment` : 
  `• No additional payment required
• Your existing payment covers the updated total`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${parseFloat(updatedOrder.shipping_price || 0) > parseFloat(order.shipping_price || 0) ? 
  `1️⃣ Contact us via WhatsApp or phone to complete additional payment
2️⃣ Share payment proof for verification
3️⃣ Once verified, your order processing continues` : 
  `1️⃣ Your order continues processing with updated pricing
2️⃣ No action required from your side
3️⃣ You will receive dispatch confirmation soon`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We apologize for any inconvenience this may cause and appreciate your understanding. Our team is committed to providing accurate pricing and excellent service.

If you have any questions about this update, please don't hesitate to contact us.

Thank you for your continued trust in ${companySettings?.companyName || 'Mould Market'}!
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;
      } else {
        // Order acceptance email - Payment required (your existing email template)
        const orderDetailsText = order.orderedProducts
          .map((item, index) => {
            let itemDetails = `${index + 1}. ${item.product_name}`;
            if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
            if (item.size) itemDetails += ` - Size: ${item.size}`;
            if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
            itemDetails += `\n   Quantity: ${item.quantity}`;
            itemDetails += `\n   Unit Price: ₹${parseFloat(item.price || 0).toFixed(2)}`;
            itemDetails += `\n   Item Total: ₹${parseFloat(item.total || 0).toFixed(2)}`;
            if (parseFloat(item.cash_applied || 0) > 0) itemDetails += `\n   Free Cash Applied: ₹${parseFloat(item.cash_applied || 0).toFixed(2)}`;
            return itemDetails;
          })
          .join('\n\n');

        emailSubject = `Payment Required - Order #${orderId} Accepted`;
        emailText = `Dear ${order.user_name},

Thank you for your order with ${companySettings?.companyName || 'Mould Market'}!

We are pleased to confirm that your order #${orderId} has been **ACCEPTED** by our team and is ready for processing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: PAYMENT REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To confirm your order and proceed with processing, please complete the payment of the total amount:

TOTAL AMOUNT DUE: ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Order Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Status: ACCEPTED (Payment Pending)

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.user_name}
Email: ${order.email}
Phone: ${order.phone_number}
WhatsApp: ${order.whatsapp_number}

ORDER ITEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(updatedOrder.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please contact us via WhatsApp or phone to receive payment details and complete your order confirmation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US FOR PAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}, ${companySettings?.adminState || ''} - ${companySettings?.adminPincode || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Complete payment using the contact details above
2️⃣ Share your payment proof via WhatsApp or email
3️⃣ Once payment is verified, your order will be CONFIRMED
4️⃣ You will receive a dispatch confirmation when your order ships
5️⃣ Track your order status in your account dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We strive to process your order quickly once payment is received. Your satisfaction is our priority!

Thank you for choosing ${companySettings?.companyName || 'Mould Market'}!
The Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;
      }

      await sendEmail(email, emailSubject, emailText);
      console.log(`${isEdit ? 'Shipping price update' : 'Order acceptance'} email sent to:`, email);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      message: isEdit ? 'Shipping price updated successfully' : 'Order accepted and shipping price added successfully',
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

    // Update order with status, payment_status, and updatedAt (if status is Confirm, Dispatched, or Completed)
    const updateFields = {
      status: status,
      payment_status: paymentStatus,
    };
    if (["Confirm", "Dispatched", "Completed"].includes(status)) {
      updateFields.updatedAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    // Send email notification for status changes
    try {
      // Prepare order details text for email
      const orderDetailsText = order.orderedProducts
        .map((item, index) => {
          let itemDetails = `${index + 1}. ${item.product_name}`;
          if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
          if (item.size) itemDetails += ` - Size: ${item.size}`;
           if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
          itemDetails += `\n   Quantity: ${item.quantity}`;
          itemDetails += `\n   Unit Price: ₹${parseFloat(item.price || 0).toFixed(2)}`;
          itemDetails += `\n   Item Total: ₹${parseFloat(item.total || 0).toFixed(2)}`;
          if (parseFloat(item.cash_applied || 0) > 0) itemDetails += `\n   Free Cash Applied: ₹${parseFloat(item.cash_applied || 0).toFixed(2)}`;
          return itemDetails;
        })
        .join('\n\n');

      let emailSubject, emailText;

      switch (status) {
        case "Rejected":
          emailSubject = `Order #${orderId} - Status Updated to Rejected`;
          emailText = `Dear ${order.user_name || user.name},

We regret to inform you that your order #${orderId} has been **REJECTED**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER REJECTION NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Current Status: REJECTED

We sincerely apologize for this inconvenience. After careful review, we were unable to process your order due to one or more of the following reasons:
• Unavailability of requested items
• Payment processing issues
• Address verification concerns
• Inventory constraints
• Technical or system limitations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.user_name || user.name}
Email: ${order.email || user.email}
Phone: ${order.phone_number || user.phone_number}
WhatsApp: ${order.whatsapp_number || ''}

ORDER ITEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₹${parseFloat(order.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Your order has been cancelled and no charges have been applied
2️⃣ You can place a new order at any time
3️⃣ Consider checking product availability before placing future orders
4️⃣ Contact us if you need clarification about this rejection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}, ${companySettings?.adminState || ''} - ${companySettings?.adminPincode || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We apologize for any inconvenience this may have caused. Our team is committed to providing you with the best possible shopping experience. We value your business and hope to serve you better in the future.

If you have any questions regarding this rejection or would like to discuss alternative options, please don't hesitate to contact us.

Thank you for your understanding,
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;
          break;

        case "Confirm":
          emailSubject = `Order #${orderId} - Confirmed & Payment Received`;
          emailText = `Dear ${order.user_name || user.name},

Excellent news! Your order #${orderId} has been **CONFIRMED** and payment has been successfully received.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Confirmation Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Current Status: CONFIRMED

Thank you for completing your payment! Your order is now being processed by our team and will be prepared for dispatch soon.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.user_name || user.name}
Email: ${order.email || user.email}
Phone: ${order.phone_number || user.phone_number}
WhatsApp: ${order.whatsapp_number || ''}

DELIVERY ADDRESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${order.address || 'Address details will be confirmed soon'}

ORDER ITEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₹${parseFloat(order.total_price || 0).toFixed(2)}
Payment Status: PAID ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROCESSING TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Order Confirmation: ✅ Completed
• Processing: ⏳ In Progress (1-2 business days)
• Quality Check: ⏳ Pending
• Dispatch: ⏳ Pending
• Delivery: ⏳ Pending (3-7 business days after dispatch)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT HAPPENS NEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Your order is being processed by our warehouse team
2️⃣ Each item undergoes quality verification
3️⃣ You will receive a dispatch confirmation with tracking details
4️⃣ Track your order status in your account dashboard
5️⃣ Estimated delivery within 3-7 business days after dispatch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}, ${companySettings?.adminState || ''} - ${companySettings?.adminPincode || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for choosing ${companySettings?.companyName || 'Mould Market'}! We are committed to delivering your order with care and efficiency. Our team works diligently to ensure your satisfaction.

You can track your order progress in real-time through your account dashboard or by contacting our support team.

Best regards,
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;
          break;

        case "Dispatched":
          emailSubject = `Order #${orderId} - Dispatched & On Its Way!`;
          emailText = `Dear ${order.user_name || user.name},

Great news! Your order #${orderId} has been **DISPATCHED** and is on its way to you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DISPATCH NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Dispatch Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Current Status: DISPATCHED

Your package has left our warehouse and is now with our trusted shipping partner for delivery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.user_name || user.name}
Email: ${order.email || user.email}
Phone: ${order.phone_number || user.phone_number}
WhatsApp: ${order.whatsapp_number || ''}

DELIVERY ADDRESS (${order.delivery_address?.name || 'N/A'}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${order.delivery_address?.full_address || 'Address not available'}
${order.delivery_address?.city || ''}, ${order.delivery_address?.state || ''} - ${order.delivery_address?.pincode || ''}

ORDER ITEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₹${parseFloat(order.total_price || 0).toFixed(2)}
Payment Status: PAID ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Expected Delivery: 3-7 business days from dispatch
• Shipping Partner: ${companySettings?.shippingPartner || 'Our trusted courier service'}
• Tracking: Available soon via your account dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRACKING YOUR ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Check your account dashboard for real-time tracking updates
2️⃣ You will receive tracking number via WhatsApp/SMS
3️⃣ Track your shipment directly with our shipping partner
4️⃣ Contact us if you don't receive tracking details within 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO EXPECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Delivery attempts will be made during business hours
• If you're unavailable, the courier will attempt delivery on the next working day
• You may need to present valid ID for high-value orders
• Inspect your package upon delivery and report any issues immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}, ${companySettings?.adminState || ''} - ${companySettings?.adminPincode || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your patience! We're excited for you to receive your order. Our team has carefully packed and shipped your items with care. If you have any questions about your delivery or need assistance with tracking, please don't hesitate to contact us.

Happy Shopping!
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;
          break;
      }

      // Send the email if subject and text are defined
      if (emailSubject && emailText) {
        await sendEmail(user.email, emailSubject, emailText);
        console.log(`Status update email sent to: ${user.email} for status: ${status}`);
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

// Helper function to calculate price based on quantity and bulk pricing
const calculatePriceWithBulkDiscount = (quantity, basePrice, bulkPricingArray) => {
    if (!bulkPricingArray || bulkPricingArray.length === 0) {
        // No bulk pricing, return base price * quantity
        return basePrice * quantity;
    }

    // Sort bulk pricing by quantity in descending order to find the best applicable tier
    const sortedBulkPricing = [...bulkPricingArray].sort((a, b) => b.quantity - a.quantity);
    
    // Find the applicable bulk pricing tier
    const applicableTier = sortedBulkPricing.find(tier => quantity >= tier.quantity);
    
    if (applicableTier) {
        // Apply bulk price
        return applicableTier.wholesalePrice * quantity;
    } else {
        // Quantity doesn't meet any bulk pricing threshold, use base price
        return basePrice * quantity;
    }
};

// Function to reject order when all products have zero quantity
const rejectZeroQuantityOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    
    const user = await findUser(order.user_id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    
    // Update order status to Rejected
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Rejected',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
// Emit Socket.IO event
const io = req.app.get('io');
if (io) {
  console.log('Emitting orderUpdated event for order:', updatedOrder._id);
  io.to('admin_room').emit('orderUpdated', {
    _id: updatedOrder._id,
    orderedProducts: updatedOrder.orderedProducts,
    price: updatedOrder.price,
    shipping_price: updatedOrder.shipping_price,
    total_price: updatedOrder.total_price,
    status: updatedOrder.status,
  });
}
    
    // Send rejection email
    try {
      const companySettings = await CompanySettings.getSingleton();
      
      const emailSubject = `Order #${orderId} - Rejected`;
      const emailText = `Dear ${user.name || user.email},

We regret to inform you that your order #${orderId} has been **REJECTED** due to unavailability of the requested items.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER REJECTION NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Rejection Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Current Status: REJECTED

After careful review, we were unable to fulfill your order due to stock unavailability. We sincerely apologize for this inconvenience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Your order has been cancelled and no charges have been applied
2️⃣ You can place a new order at any time
3️⃣ Check product availability before placing future orders
4️⃣ Contact us if you need clarification about this rejection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}

We apologize for any inconvenience and look forward to serving you in the future.

Best regards,
The Customer Service Team

---
${companySettings?.companyName || 'Mould Market'}`;
      
      await sendEmail(email, emailSubject, emailText);
      console.log("Rejection email sent successfully");
    } catch (error) {
      console.log("Error sending rejection email:", error);
    }
    
    return res.status(200).json({ message: "Order rejected successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error rejecting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Function to confirm order update after confirmation modal
const confirmOrderUpdate = async (req, res) => {
  try {
    const { orderId, products, confirmedShippingPrice, email, currentStatus } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    
    const user = await findUser(order.user_id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    
    // Recalculate prices with bulk pricing
    const prices = [];
    for (const prod of products) {
      const product = await findProduct(prod.product_id);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }
      
      let itemTotal = 0;
      let basePrice = 0;
      let bulkPricing = [];
      
      if (product.hasVariants && prod.variant_id && prod.size_id) {
        const variant = product.variants.find(v => v._id.toString() === prod.variant_id.toString());
        if (!variant) {
          return res.status(400).json({ message: `Variant not found for product: ${product.name}` });
        }
        
        const sizeDetail = variant.moreDetails.find(md => md._id.toString() === prod.size_id.toString());
        if (!sizeDetail) {
          return res.status(400).json({ message: `Size not found for variant: ${variant.colorName}` });
        }
        
        basePrice = sizeDetail.price;
        bulkPricing = sizeDetail.bulkPricingCombinations || [];
      } else if (!product.hasVariants) {
        basePrice = product.price;
        bulkPricing = product.bulkPricing || [];
      } else {
        return res.status(400).json({ message: `Invalid product configuration for: ${product.name}` });
      }
      
      itemTotal = calculatePriceWithBulkDiscount(prod.quantity, basePrice, bulkPricing);
      prod.total = itemTotal;
      prod.price = basePrice;
      prices.push(itemTotal);
    }
    
    const newPrice = prices.reduce((acc, curr) => acc + curr, 0);
    const newShippingPrice = confirmedShippingPrice;
    const newTotalPrice = newPrice + newShippingPrice;
    
    const oldPrice = order.price;
    const oldShippingPrice = order.shipping_price;
    const oldTotalPrice = order.total_price === 'Pending' ? 0 : parseFloat(order.total_price);
    
    // Determine if status should change to Accepted
    const updateData = {
      orderedProducts: products,
      price: newPrice,
      shipping_price: newShippingPrice,
      total_price: newTotalPrice,
      updatedAt: new Date()
    };
    
    // Change status to Accepted if currently Pending
    if (currentStatus === 'Pending') {
      updateData.status = 'Accepted';
    }
    
    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Emit Socket.IO event
const io = req.app.get('io');
if (io) {
  io.to('admin_room').emit('orderUpdated', {
    _id: updatedOrder._id,
    orderedProducts: updatedOrder.orderedProducts,
    price: updatedOrder.price,
    shipping_price: updatedOrder.shipping_price,
    total_price: updatedOrder.total_price,
    status: updatedOrder.status,
  });
}
    
    // Send email
    try {
      const companySettings = await CompanySettings.getSingleton();
      const orderDetailsText = products
        .map((item, index) => {
          let itemDetails = `${index + 1}. ${item.product_name}`;
          if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
          if (item.size) itemDetails += ` - Size: ${item.size}`;
          if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
          itemDetails += `\n   Quantity: ${item.quantity}`;
          itemDetails += `\n   Unit Price: ₹${parseFloat(item.price || 0).toFixed(2)}`;
          itemDetails += `\n   Item Total: ₹${parseFloat(item.total || 0).toFixed(2)}`;
          return itemDetails;
        })
        .join('\n\n');
      
      const priceDifference = newTotalPrice - oldTotalPrice;
      const isConfirmedOrder = updatedOrder.status === 'Confirm';
      
      let paymentImpactText = '';
      
      if (isConfirmedOrder) {
        // Order is already confirmed (paid)
        if (priceDifference > 0) {
          // Additional payment required
          paymentImpactText = `• Additional payment of ₹${parseFloat(priceDifference).toFixed(2)} is required
- Please contact us to complete the additional payment`;
        } else if (priceDifference < 0) {
          // Refund will be processed
          paymentImpactText = `• Refund of ₹${parseFloat(Math.abs(priceDifference)).toFixed(2)} will be processed within 5-7 business days
- Refund will be credited to your original payment method`;
        } else {
          paymentImpactText = `• No additional payment or refund required
- Your existing payment covers the updated total`;
        }
      } else {
        // Order is in Accepted/Pending status
        paymentImpactText = `• Total payment of ₹${parseFloat(newTotalPrice).toFixed(2)} is required
- Please contact us to complete the payment`;
      }
      
      const emailSubject = `Order #${order._id} Updated - ${companySettings?.companyName || 'Mould Market'}`;
      const emailText = `Dear ${user.name || user.email},

Your order #${order._id} has been successfully updated by our team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER UPDATE NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order._id}
Update Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Status: ${updatedOrder.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPDATED ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDER ITEMS:
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Subtotal: ₹${parseFloat(oldPrice || 0).toFixed(2)}
Updated Subtotal: ₹${parseFloat(updatedOrder.price || 0).toFixed(2)}

Previous Shipping Cost: ₹${parseFloat(oldShippingPrice || 0).toFixed(2)}
Updated Shipping Cost: ${updatedOrder.shipping_price === 0 ? 'Free' : `₹${parseFloat(updatedOrder.shipping_price || 0).toFixed(2)}`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Total Amount: ₹${parseFloat(oldTotalPrice || 0).toFixed(2)}
New Total Amount: ₹${parseFloat(updatedOrder.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASON FOR UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The order was updated to reflect changes in:
- Product quantities
- Item selection
- Pricing adjustments
${newShippingPrice !== oldShippingPrice ? '• Shipping price recalculation' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${paymentImpactText}

${newShippingPrice === 0 && oldShippingPrice > 0 ? `
🎉 GOOD NEWS: Your order now qualifies for FREE SHIPPING!
Your order total has reached the free shipping threshold.` : ''}

${newShippingPrice > 0 && oldShippingPrice === 0 ? `
⚠️ SHIPPING CHARGES APPLIED
Due to the updated order value, standard shipping charges now apply.` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  isConfirmedOrder && priceDifference > 0
    ? `1️⃣ Contact us via WhatsApp or phone to complete additional payment
2️⃣ Share payment proof for verification
3️⃣ Once verified, your order processing continues`
    : isConfirmedOrder && priceDifference < 0
    ? `1️⃣ Refund will be processed automatically within 5-7 business days
2️⃣ Your order continues processing with updated details
3️⃣ You will receive further updates on your order status`
    : `1️⃣ Your order continues processing with updated details
2️⃣ ${isConfirmedOrder ? 'No action required from your side' : 'Complete payment to proceed with the order'}
3️⃣ You will receive further updates on your order status`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We apologize for any inconvenience and are committed to ensuring your satisfaction. Please reach out with any questions.
Thank you for your continued trust in ${companySettings?.companyName || 'Mould Market'}!
Best regards,
The Customer Service Team

${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}
${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}`;
  await sendEmail(email, emailSubject, emailText);
  console.log("Order update email sent successfully");
} catch (error) {
  console.log("Error sending email:", error);
}

return res.status(200).json({ 
  message: "Order updated successfully",
  order: updatedOrder
});
} catch (error) {
console.error("Error confirming order update:", error);
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
                    }
                    
                    let itemTotal = 0;
                    let basePrice = 0;
                    let bulkPricing = [];
                    
                    // Check if product has variants
                    if (product.hasVariants && prod.variant_id && prod.size_id) {
                        // Product with variants - find the specific variant and size
                        const variant = product.variants.find(v => v._id.toString() === prod.variant_id.toString());
                        
                        if (!variant) {
                            return res.status(400).json({ message: `Variant not found for product: ${product.name}` });
                        }
                        
                        const sizeDetail = variant.moreDetails.find(md => md._id.toString() === prod.size_id.toString());
                        
                        if (!sizeDetail) {
                            return res.status(400).json({ message: `Size not found for variant: ${variant.colorName}` });
                        }
                        
                        basePrice = sizeDetail.price;
                        bulkPricing = sizeDetail.bulkPricingCombinations || [];
                        
                    } else if (!product.hasVariants) {
                        // Product without variants
                        basePrice = product.price;
                        bulkPricing = product.bulkPricing || [];
                        
                    } else {
                        return res.status(400).json({ message: `Invalid product configuration for: ${product.name}` });
                    }
                    
                    // Calculate the item total with bulk pricing logic
                    itemTotal = calculatePriceWithBulkDiscount(prod.quantity, basePrice, bulkPricing);
                    
                    // Update the product's total in the array (for database storage)
                    prod.total = itemTotal;
                    prod.price = basePrice; // Store the base unit price
                    
                    prices.push(itemTotal);
                }
                
                const newPrice = prices.reduce((accumulator, current) => accumulator + current, 0);
                const oldPrice = order.price;
                const oldShippingPrice = order.shipping_price;
                const oldTotalPrice = order.total_price;
                
                // Get company settings for shipping calculation
                const companySettings = await CompanySettings.getSingleton();
                const { shippingPrice, isPending, needsManualEntry } = await calculateShippingPrice(user, newPrice, companySettings);
                
                let newShippingPrice = oldShippingPrice;
                let newTotalPrice = oldTotalPrice;
                
                // Check if shipping needs recalculation
                if (isPending || needsManualEntry) {
                    // Manual entry required - show confirmation modal with pending shipping
                    return res.status(200).json({
                        message: "Order update requires confirmation",
                        requiresConfirmation: true,
                        newPrice: newPrice,
                        newShippingPrice: "Pending",
                        newTotalPrice: "Pending",
                        order: {
                            _id: order._id,
                            price: newPrice,
                            shipping_price: "Pending",
                            total_price: "Pending"
                        }
                    });
                } else {
                    // Shipping price can be calculated automatically
                    newShippingPrice = shippingPrice;
                    newTotalPrice = newPrice + newShippingPrice;
                    
                    // Always show confirmation modal for edits
                    return res.status(200).json({
                        message: "Order update requires confirmation",
                        requiresConfirmation: true,
                        newPrice: newPrice,
                        newShippingPrice: newShippingPrice,
                        newTotalPrice: newTotalPrice,
                        order: {
                            _id: order._id,
                            price: newPrice,
                            shipping_price: newShippingPrice,
                            total_price: newTotalPrice
                        }
                    });
                }
            } else {
                return res.status(400).json({ message: "User not found" });
            }
        } else {
            return res.status(400).json({ message: "Order not found" });
        }
    } catch (error) {
        console.error("Error in editOrder:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

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

const sendAcceptEmailWhenShippingPriceAddedAutomatically = async (req, res) => {
  try {
    console.log("Request received for sending acceptance email");
    const { email, orderId } = req.body;

    if (!email || !orderId) {
      console.error('Validation failed: Email and orderId are required');
      return res.status(400).json({ message: 'Email and orderId are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Accepted') {
      console.error('Order not in Accepted status:', { orderId, status: order.status });
      return res.status(400).json({ message: 'Order must be in Accepted status to send acceptance email' });
    }

    // if (!order.shipping_price || order.shipping_price === 0) {
    //   console.error('Shipping price not set for order:', orderId);
    //   return res.status(400).json({ message: 'Shipping price must be set to send acceptance email' });
    // }

    if (order.shipping_price == null && order.total_price === "Pending") {
  console.error('Shipping price not set for order:', orderId);
  return res.status(400).json({ message: 'Shipping price must be set to send acceptance email' });
}

    const companySettings = await CompanySettings.findOne();
    if (!companySettings) {
      console.error('Company settings not found');
      return res.status(500).json({ message: 'Company settings not found' });
    }

    // Generate order items text
    const orderDetailsText = order.orderedProducts
      .map((item, index) => {
        let itemDetails = `${index + 1}. ${item.product_name}`;
        if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
        if (item.size) itemDetails += ` - Size: ${item.size}`;
         if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
        itemDetails += `\n   Quantity: ${item.quantity}`;
        itemDetails += `\n   Unit Price: ₹${parseFloat(item.price || 0).toFixed(2)}`;
        itemDetails += `\n   Item Total: ₹${parseFloat(item.total || 0).toFixed(2)}`;
        if (parseFloat(item.cash_applied || 0) > 0) itemDetails += `\n   Free Cash Applied: ₹${parseFloat(item.cash_applied || 0).toFixed(2)}`;
        return itemDetails;
      })
      .join('\n\n');

    // Email template
    const emailSubject = `Payment Required - Order #${orderId} Accepted`;
    const emailText = `Dear ${order.user_name},

Thank you for your order with ${companySettings?.companyName || 'Mould Market'}!

We are pleased to confirm that your order #${orderId} has been **ACCEPTED** by our team and is ready for processing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: PAYMENT REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To confirm your order and proceed with processing, please complete the payment of the total amount:

TOTAL AMOUNT DUE: ₹${parseFloat(order.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Status: ACCEPTED (Payment Pending)

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${order.user_name}
Email: ${order.email}
Phone: ${order.phone_number}
WhatsApp: ${order.whatsapp_number}

ORDER ITEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetailsText}

PRICING SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₹${parseFloat(order.total_price || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please contact us via WhatsApp or phone to receive payment details and complete your order confirmation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US FOR PAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}
📱 WhatsApp: ${companySettings?.adminWhatsappNumber || 'Contact us'}
📍 Address: ${companySettings?.adminAddress || ''}, ${companySettings?.adminCity || ''}, ${companySettings?.adminState || ''} - ${companySettings?.adminPincode || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Complete payment using the contact details above
2️⃣ Share your payment proof via WhatsApp or email
3️⃣ Once payment is verified, your order will be CONFIRMED
4️⃣ You will receive a dispatch confirmation when your order ships
5️⃣ Track your order status in your account dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUR COMMITMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We strive to process your order quickly once payment is received. Your satisfaction is our priority!

Thank you for choosing ${companySettings?.companyName || 'Mould Market'}!
The Team

---
${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminPhoneNumber || ''} | ${companySettings?.adminWhatsappNumber || ''}
${companySettings?.adminEmail || ''}`;

    await sendEmail(email, emailSubject, emailText);
    console.log('Acceptance email sent successfully to:', email);

    return res.status(200).json({
      message: 'Acceptance email sent successfully',
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error sending acceptance email:', error.message, error.stack);
    return res.status(500).json({
      message: 'Failed to send acceptance email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Bulk actions controller functions:
// Bulk Accept Orders
const bulkAccept = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    const companySettings = await CompanySettings.getSingleton();
    
    const results = {
      accepted: [],
      insufficientStock: [],
      invalidStatus: [],
      shippingPending: []
    };

    for (const order of orders) {
      // Only accept Pending orders
      if (order.status !== 'Pending') {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only accept Pending orders'
        });
        continue;
      }

      // Check stock for all products
      let hasInsufficientStock = false;
      for (const item of order.orderedProducts) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          hasInsufficientStock = true;
          break;
        }

        if (!item.variant_id) {
          if (product.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        } else {
          const variant = product.variants.id(item.variant_id);
          if (!variant) {
            hasInsufficientStock = true;
            break;
          }
          const sizeDetail = variant.moreDetails.id(item.size_id);
          if (!sizeDetail || sizeDetail.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        }
      }

      if (hasInsufficientStock) {
        results.insufficientStock.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8),
          userName: order.user_name
        });
        continue;
      }

      // Calculate shipping price
      const user = await User.findById(order.user_id);
      const { shippingPrice, isPending } = await calculateShippingPrice(user, order.price, companySettings);

      if (isPending) {
        results.shippingPending.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8),
          userName: order.user_name,
          email: order.email
        });
        continue;
      }

      // Update order
      order.status = 'Accepted';
      order.shipping_price = shippingPrice || 0;
      order.total_price = order.price + (shippingPrice || 0);
      order.updatedAt = new Date();
      await order.save();

      results.accepted.push({
        orderId: order._id,
        orderNumber: order._id.toString().substring(0, 8)
      });

      // Send email
      try {
        const orderDetailsText = order.orderedProducts
          .map((item, index) => {
            let itemDetails = `${index + 1}. ${item.product_name}`;
            if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
            if (item.size) itemDetails += ` - Size: ${item.size}`;
             if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
            itemDetails += `\n   Quantity: ${item.quantity}`;
            itemDetails += `\n   Unit Price: ₹${parseFloat(item.price || 0).toFixed(2)}`;
            itemDetails += `\n   Item Total: ₹${parseFloat(item.total || 0).toFixed(2)}`;
            return itemDetails;
          })
          .join('\n\n');

        const emailSubject = `Payment Required - Order #${order._id} Accepted`;
        const emailText = `Dear ${order.user_name},

Thank you for your order with ${companySettings?.companyName || 'Mould Market'}!

We are pleased to confirm that your order #${order._id} has been **ACCEPTED** by our team and is ready for processing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: PAYMENT REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To confirm your order and proceed with processing, please complete the payment of the total amount:

TOTAL AMOUNT DUE: ₹${parseFloat(order.total_price || 0).toFixed(2)}

ORDER DETAILS:
${orderDetailsText}

PRICING SUMMARY:
Subtotal: ₹${parseFloat(order.price || 0).toFixed(2)}
Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
TOTAL AMOUNT: ₹${parseFloat(order.total_price || 0).toFixed(2)}

Please contact us to complete the payment.

${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminEmail || ''}
${companySettings?.adminPhoneNumber || ''}`;

        await sendEmail(order.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending acceptance email:', emailError);
      }
    }

    // Emit Socket.IO events for accepted orders
    const io = req.app.get('io');
    if (io && results.accepted.length > 0) {
      for (const accepted of results.accepted) {
        const updatedOrder = await Order.findById(accepted.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.accepted.length} order(s) accepted successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk accept error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Reject Orders
const bulkReject = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    const companySettings = await CompanySettings.getSingleton();
    
    const results = {
      rejected: [],
      insufficientStock: [],
      sufficientStock: [],
      invalidStatus: []
    };

    for (const order of orders) {
      // Can reject Pending, Accepted, or Confirm orders
      if (!['Pending', 'Accepted', 'Confirm'].includes(order.status)) {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only reject Pending, Accepted, or Confirm orders'
        });
        continue;
      }

      // For Confirm status, directly add to rejected (already paid, no stock check needed)
      if (order.status === 'Confirm') {
        order.status = 'Rejected';
        order.updatedAt = new Date();
        await order.save();

        results.rejected.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8)
        });

        // Send rejection email
        try {
          await sendRejectionEmail(order, companySettings);
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
        }
        continue;
      }

      // For Pending and Accepted, check stock
      let hasInsufficientStock = false;
      for (const item of order.orderedProducts) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          hasInsufficientStock = true;
          break;
        }

        if (!item.variant_id) {
          if (product.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        } else {
          const variant = product.variants.id(item.variant_id);
          if (!variant) {
            hasInsufficientStock = true;
            break;
          }
          const sizeDetail = variant.moreDetails.id(item.size_id);
          if (!sizeDetail || sizeDetail.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        }
      }

      if (hasInsufficientStock) {
        // Auto-reject orders with insufficient stock
        order.status = 'Rejected';
        order.updatedAt = new Date();
        await order.save();

        results.insufficientStock.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8),
          userName: order.user_name
        });

        try {
          await sendRejectionEmail(order, companySettings);
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
        }
      } else {
        // Orders with sufficient stock - user needs to confirm
        results.sufficientStock.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8),
          userName: order.user_name,
          email: order.email,
          status: order.status
        });
      }
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && (results.rejected.length > 0 || results.insufficientStock.length > 0)) {
      const allRejected = [...results.rejected, ...results.insufficientStock];
      for (const rejected of allRejected) {
        const updatedOrder = await Order.findById(rejected.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.rejected.length + results.insufficientStock.length} order(s) rejected`,
      results
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function for rejection email
const sendRejectionEmail = async (order, companySettings) => {
  const emailSubject = `Order #${order._id} - Status Updated to Rejected`;
  const emailText = `Dear ${order.user_name},

We regret to inform you that your order #${order._id} has been **REJECTED**.

We sincerely apologize for this inconvenience. Your order could not be processed due to inventory constraints or other limitations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT US
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${companySettings?.companyName || 'Mould Market'}
📧 Email: ${companySettings?.adminEmail || 'support@company.com'}
📞 Phone: ${companySettings?.adminPhoneNumber || 'Contact us'}

Thank you for your understanding.
The Customer Service Team`;

  await sendEmail(order.email, emailSubject, emailText);
};

// Bulk Confirm Orders
const bulkConfirm = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    const companySettings = await CompanySettings.getSingleton();
    const lowStockThreshold = companySettings.lowStockAlertThreshold || 10;
    
    const results = {
      confirmed: [],
      insufficientStock: [],
      invalidStatus: []
    };

    for (const order of orders) {
      if (order.status !== 'Accepted') {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only confirm Accepted orders'
        });
        continue;
      }

      // Check and deduct stock
      let hasInsufficientStock = false;
      for (const item of order.orderedProducts) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          hasInsufficientStock = true;
          break;
        }

        if (!item.variant_id) {
          if (product.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        } else {
          const variant = product.variants.id(item.variant_id);
          if (!variant) {
            hasInsufficientStock = true;
            break;
          }
          const sizeDetail = variant.moreDetails.id(item.size_id);
          if (!sizeDetail || sizeDetail.stock < item.quantity) {
            hasInsufficientStock = true;
            break;
          }
        }
      }

      if (hasInsufficientStock) {
        results.insufficientStock.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8),
          userName: order.user_name
        });
        continue;
      }

      // Deduct stock and create notifications
      for (const item of order.orderedProducts) {
        const product = await Product.findById(item.product_id);
        const itemKey = getItemKey(item.product_id, item.variant_id, item.size_id);
        let stockLevel = 0;
        let itemName = product.name;

        if (!item.variant_id) {
          product.stock -= item.quantity;
          stockLevel = product.stock;
        } else {
          const variant = product.variants.id(item.variant_id);
          const sizeDetail = variant.moreDetails.id(item.size_id);
          sizeDetail.stock -= item.quantity;
          stockLevel = sizeDetail.stock;
          itemName += item.variant_name ? ` (${item.variant_name}` : '';
          itemName += item.size ? `, Size ${item.size})` : ')';
        }

        await product.save();

        // Check for low stock/out of stock notifications
        const notified = notifiedItems.get(itemKey) || { lowStockNotified: false, outOfStockNotified: false };

        if (stockLevel === 0 && !notified.outOfStockNotified) {
          const notification = new Notification({
            title: 'Out of Stock Alert',
            message: `Out of Stock Alert: ${itemName} is out of stock (Product ID: ${item.product_id})`,
            recipient: 'admin',
            productId: item.product_id,
            type: 'outOfStock',
          });
          await notification.save();

          const io = req.app.get('io');
          io.to('admin_room').emit('newOrderNotification', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            unread: notification.unread,
            productId: notification.productId,
            type: notification.type,
          });

          if (companySettings.receiveOutOfStockEmail && companySettings.adminEmail) {
            try {
              await sendEmail(
                companySettings.adminEmail,
                `Out of Stock Alert: ${itemName}`,
                `The following item is out of stock:\n\n${itemName}\nProduct ID: ${item.product_id}\n\nPlease restock the item.\n\n--\n${companySettings.companyName || 'Mould Market'}`
              );
            } catch (emailError) {
              console.error('Error sending out of stock email:', emailError);
            }
          }

          notifiedItems.set(itemKey, { ...notified, outOfStockNotified: true });
        } else if (stockLevel > 0 && stockLevel < lowStockThreshold && !notified.lowStockNotified) {
          const notification = new Notification({
            title: 'Low Stock Alert',
            message: `Low Stock Alert: ${itemName} has ${stockLevel} units remaining (Product ID: ${item.product_id})`,
            recipient: 'admin',
            productId: item.product_id,
            type: 'lowStock',
          });
          await notification.save();

          const io = req.app.get('io');
          io.to('admin_room').emit('newOrderNotification', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            time: notification.time,
            unread: notification.unread,
            productId: notification.productId,
            type: notification.type,
          });

          if (companySettings.receiveLowStockEmail && companySettings.adminEmail) {
            try {
              await sendEmail(
                companySettings.adminEmail,
                `Low Stock Alert: ${itemName}`,
                `The following item is low on stock:\n\n${itemName}\nRemaining Stock: ${stockLevel} units\nProduct ID: ${item.product_id}\n\nPlease consider restocking.\n\n--\n${companySettings.companyName || 'Mould Market'}`
              );
            } catch (emailError) {
              console.error('Error sending low stock email:', emailError);
            }
          }

          notifiedItems.set(itemKey, { ...notified, lowStockNotified: true });
        } else if (stockLevel >= lowStockThreshold) {
          notifiedItems.set(itemKey, { lowStockNotified: false, outOfStockNotified: false });
        }
      }

      // Update order status
      order.status = 'Confirm';
      order.payment_status = 'Paid';
      order.updatedAt = new Date();
      await order.save();

      results.confirmed.push({
        orderId: order._id,
        orderNumber: order._id.toString().substring(0, 8)
      });

      // Send email
      try {
        const orderDetailsText = order.orderedProducts
          .map((item, index) => {
            let itemDetails = `${index + 1}. ${item.product_name}`;
            if (item.variant_name) itemDetails += ` - ${item.variant_name}`;
            if (item.size) itemDetails += ` - Size: ${item.size}`;
             if (item.customDimensions) {
      itemDetails += `\n   📐 Custom Dimensions: ${item.customDimensions.length} × ${item.customDimensions.breadth}`;
      if (item.customDimensions.height) itemDetails += ` × ${item.customDimensions.height}`;
      itemDetails += ` ${item.customDimensions.unit}`;
      if (item.customDimensions.calculatedPrice) {
        itemDetails += `\n   💰 Calculated Price: ₹${item.customDimensions.calculatedPrice.toFixed(2)}`;
      }
    }
            itemDetails += `\n   Quantity: ${item.quantity}`;
            return itemDetails;
          })
          .join('\n\n');

        const emailSubject = `Order #${order._id} - Confirmed & Payment Received`;
        const emailText = `Dear ${order.user_name},

Excellent news! Your order #${order._id} has been **CONFIRMED** and payment has been successfully received.

ORDER ITEMS:
${orderDetailsText}

Your order is now being processed and will be dispatched soon.

${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminEmail || ''}`;

        await sendEmail(order.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && results.confirmed.length > 0) {
      for (const confirmed of results.confirmed) {
        const updatedOrder = await Order.findById(confirmed.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.confirmed.length} order(s) confirmed successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk confirm error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Dispatch Orders
const bulkDispatch = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    const companySettings = await CompanySettings.getSingleton();
    
    const results = {
      dispatched: [],
      invalidStatus: []
    };

    for (const order of orders) {
      if (order.status !== 'Confirm') {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only dispatch Confirm orders'
        });
        continue;
      }

      order.status = 'Dispatched';
      order.updatedAt = new Date();
      await order.save();

      results.dispatched.push({
        orderId: order._id,
        orderNumber: order._id.toString().substring(0, 8)
      });

      // Send email
      try {
        const emailSubject = `Order #${order._id} - Dispatched & On Its Way!`;
        const emailText = `Dear ${order.user_name},

Great news! Your order #${order._id} has been **DISPATCHED** and is on its way to you.

Expected Delivery: 3-7 business days from dispatch

${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminEmail || ''}`;

        await sendEmail(order.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending dispatch email:', emailError);
      }
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && results.dispatched.length > 0) {
      for (const dispatched of results.dispatched) {
        const updatedOrder = await Order.findById(dispatched.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.dispatched.length} order(s) dispatched successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk dispatch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Complete Orders
const bulkComplete = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    
    const results = {
      completed: [],
      invalidStatus: []
    };

    for (const order of orders) {
      if (order.status !== 'Dispatched') {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only complete Dispatched orders'
        });
        continue;
      }

      order.status = 'Completed';
      order.updatedAt = new Date();
      await order.save();

      results.completed.push({
        orderId: order._id,
        orderNumber: order._id.toString().substring(0, 8)
      });
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && results.completed.length > 0) {
      for (const completed of results.completed) {
        const updatedOrder = await Order.findById(completed.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.completed.length} order(s) completed successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk complete error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Delete Orders
const bulkDelete = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    
    const results = {
      deleted: [],
      failed: []
    };

    for (const order of orders) {
      try {
        await Order.findByIdAndDelete(order._id);
        results.deleted.push({
          orderId: order._id,
          orderNumber: order._id.toString().substring(0, 8)
        });
      } catch (error) {
        results.failed.push({
          orderId: order._id,
          reason: error.message
        });
      }
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && results.deleted.length > 0) {
      for (const deleted of results.deleted) {
        io.to('admin_room').emit('orderDeleted', { orderId: deleted.orderId });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.deleted.length} order(s) deleted successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Update Shipping Price
const bulkUpdateShippingPrice = async (req, res) => {
  try {
    const { orderIds, shippingPrice } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }

    if (shippingPrice === undefined || isNaN(shippingPrice) || parseFloat(shippingPrice) < 0) {
      return res.status(400).json({ message: 'Valid shipping price (>= 0) is required' });
    }

    const orders = await Order.find({ _id: { $in: orderIds } });
    
    const results = {
      updated: [],
      invalidStatus: []
    };

    for (const order of orders) {
      // Can update shipping for Accepted, Confirm, or Rejected orders with existing shipping price
      const canUpdate = 
        order.status === 'Accepted' || 
        order.status === 'Confirm' ||
        (order.status === 'Rejected' && order.shipping_price > 0);

      if (!canUpdate) {
        results.invalidStatus.push({
          orderId: order._id,
          currentStatus: order.status,
          reason: 'Can only update shipping for Accepted, Confirm, or Rejected (with existing shipping) orders'
        });
        continue;
      }

      const oldShippingPrice = order.shipping_price;
      order.shipping_price = parseFloat(shippingPrice);
      order.total_price = order.price + parseFloat(shippingPrice);
      order.updatedAt = new Date();
      await order.save();

      results.updated.push({
        orderId: order._id,
        orderNumber: order._id.toString().substring(0, 8),
        oldShippingPrice,
        newShippingPrice: order.shipping_price
      });

      // Send email
      try {
        const companySettings = await CompanySettings.getSingleton();
        const emailSubject = `Shipping Cost Updated - Order #${order._id}`;
        const emailText = `Dear ${order.user_name},

The shipping cost for your order #${order._id} has been updated.

Previous Shipping Cost: ₹${parseFloat(oldShippingPrice || 0).toFixed(2)}
Updated Shipping Cost: ₹${parseFloat(order.shipping_price || 0).toFixed(2)}
New Total Amount: ₹${parseFloat(order.total_price || 0).toFixed(2)}

${companySettings?.companyName || 'Mould Market'}
${companySettings?.adminEmail || ''}`;

        await sendEmail(order.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending shipping update email:', emailError);
      }
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io && results.updated.length > 0) {
      for (const updated of results.updated) {
        const updatedOrder = await Order.findById(updated.orderId);
        io.to('admin_room').emit('shippingPriceUpdated', {
          _id: updatedOrder._id,
          shipping_price: updatedOrder.shipping_price,
          total_price: updatedOrder.total_price,
          status: updatedOrder.status,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.updated.length} order(s) shipping price updated successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk update shipping price error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Manual trigger for automatic order deletion
const automaticDelete = async (req, res) => {
    try {
        // Get order IDs before deletion for socket emission
        const CompanySettings = require('../models/CompanySettings');
        const settings = await CompanySettings.findOne();
        
        if (!settings || !settings.autoDeleteOrders || !settings.autoDeleteOrders.enabled) {
            return res.status(400).json({
                success: false,
                message: 'Automatic order deletion is not enabled'
            });
        }
        
        const { deleteStatus, deleteAfterUnit, deleteAfterValue } = settings.autoDeleteOrders;
        
        // Calculate cutoff date (copy from cron job)
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
        
        const cutoffDate = calculateCutoffDate(deleteAfterUnit, deleteAfterValue);
        
        // Get orders to delete
        const Order = require('../models/Order');
        const ordersToDelete = await Order.find({
            status: deleteStatus,
            updatedAt: { $lte: cutoffDate }
        });
        
        if (ordersToDelete.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No orders found for deletion'
            });
        }
        
        const deletedOrderIds = ordersToDelete.map(order => order._id.toString());
        
        // Trigger the cron function
        await checkAndDeleteOrders();
        
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to('admin_room').emit('ordersDeleted', { 
                orderIds: deletedOrderIds,
                count: ordersToDelete.length 
            });
        }
        
        res.status(200).json({
            success: true,
            message: `${ordersToDelete.length} order(s) deleted successfully. Check admin email for details.`,
            deletedCount: ordersToDelete.length
        });
    } catch (error) {
        console.error('Error in manual order deletion trigger:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger automatic order deletion',
            error: error.message
        });
    }
};

// Delete Single Order
const deleteSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.findByIdAndDelete(orderId);

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('orderDeleted', { orderId });
    }

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      orderId
    });
  } catch (error) {
    console.error('Delete single order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
    placeOrder,
    fetchOrders,
    shippingPriceUpdate,
    handleStatusChange,
    editOrder,
    isFreeCashEligible,
    sendAcceptEmailWhenShippingPriceAddedAutomatically,
    rejectZeroQuantityOrder,
    confirmOrderUpdate,
    deleteSingleOrder,
    // Bulk actions
    bulkAccept,
    bulkReject,
    bulkConfirm,
    bulkDispatch,
    bulkComplete,
    bulkDelete,
    bulkUpdateShippingPrice,
    // Cron job
    automaticDelete
};