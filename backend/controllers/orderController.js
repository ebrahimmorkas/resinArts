const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const FreeCash = require('../models/FreeCash');

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
                message: "Cart is empty",
            });
        }

        // Use req.user.id from auth middleware instead of body
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
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
            end_date: { $gte: new Date() },
        });

        for (const cartData of cartItems) {
            try {
                const product = await Product.findById(cartData.productId);
                if (!product) {
                    errors.push(`Product not found for id ${cartData.productId}`);
                    continue;
                }

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

                if (cartData.variantId) {
                    const variant = product.variants.find((v) => v._id.toString() === cartData.variantId);
                    if (!variant) {
                        errors.push(`Variant ${cartData.variantName || 'Unknown'} not found for product ${cartData.productName}`);
                        continue;
                    }

                    if (!cartData.sizeId) {
                        errors.push(`Size is required for variant ${cartData.variantName} of product ${cartData.productName}`);
                        continue;
                    }

                    let sizeFound = false;
                    for (const variantItem of product.variants) {
                        if (variantItem._id.toString() === cartData.variantId) {
                            for (const detail of variantItem.moreDetails) {
                                if (
                                    detail._id.toString() === cartData.detailsId &&
                                    detail.size._id.toString() === cartData.sizeId
                                ) {
                                    sizeFound = true;
                                    break;
                                }
                            }
                            break;
                        }
                    }

                    if (!sizeFound) {
                        errors.push(`Size ${cartData.sizeString || 'Unknown'} not found in variant ${cartData.variantName} for product ${cartData.productName}`);
                        continue;
                    }

                    ordersToAdd.push({
                        image_url: cartData.imageUrl,
                        product_id: cartData.productId,
                        product_name: cartData.productName,
                        variant_id: cartData.variantId,
                        variant_name: cartData.variantName,
                        size_id: cartData.sizeId,
                        size: cartData.sizeString,
                        quantity: cartData.quantity,
                        price: cartData.price,
                        total: cartData.price * cartData.quantity,
                        cash_applied: cashApplied,
                    });
                } else {
                    ordersToAdd.push({
                        image_url: cartData.imageUrl,
                        product_id: cartData.productId,
                        product_name: cartData.productName,
                        quantity: cartData.quantity,
                        price: cartData.price,
                        total: cartData.price * cartData.quantity,
                        cash_applied: cashApplied,
                    });
                }
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
            };

            if (totalFreeCashApplied > 0 && freeCashId) {
                orderData.cash_applied = { amount: totalFreeCashApplied, freeCashId };
                await FreeCash.findByIdAndUpdate(freeCashId, { is_cash_used: true, cash_used_date: new Date() });
                try {
                    await sendEmail(
                        user.email,
                        "Free Cash Applied",
                        `Your free cash of $${totalFreeCashApplied} has been applied to your order. Note: Free cash is single-use and any remaining amount is not credited back.`
                    );
                } catch (emailError) {
                    console.error("Error sending free cash email:", emailError);
                }
            }

            const newOrder = new Order(orderData);
            await newOrder.save();

            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
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
                message: "No valid items to order. All items have errors.",
                errors: errors,
            });
        }
    } catch (error) {
        console.error('Order placement error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while placing order",
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
        const order = await Order.findById(orderId);
        if (order) {
            if (parseInt(shippingPriceValue) > 0) {
                try {
                    const totalPrice = order.price + parseInt(shippingPriceValue);
                    const updatedOrder = await Order.findByIdAndUpdate(
                        orderId,
                        {
                            shipping_price: shippingPriceValue,
                            total_price: totalPrice,
                            status: "Accepted",
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );
                    try {
                        await sendEmail(email, "Accepted", `Your order has been accepted for id ${orderId}`);
                    } catch (error) {
                        console.log("Error in sending email");
                    } finally {
                        return res.status(200).json({ message: "Shipping price updated" });
                    }
                } catch (error) {
                    return res.status(400).json({ message: "Problem while updating the order" });
                }
            } else {
                return res.status(400).json({ message: "Input is not proper" });
            }
        } else {
            return res.status(400).json({ message: "Product not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: `Internal server error ${error}` });
    }
}

// Function to handle status
const handleStatusChange = async (req, res) => {
    try {
        const { status, orderId } = req.body;
        const statuses = ["Accepted", "Rejected", "In-Progress", "Dispatched", "Completed", "Pending", "Confirm"];

        if (statuses.includes(status)) {
            const order = await findOrder(orderId);
            const user = await findUser(order.user_id);
            if (order) {
                if (user) {
                    let paymentStatus = "Payment Pending";
                    if (status === "Confirm") {
                        paymentStatus = "Paid";
                    }
                    const updatedOrder = await Order.findByIdAndUpdate(
                        orderId,
                        {
                            status: status,
                            payment_status: paymentStatus
                        },
                        {
                            new: true,
                            runValidators: true
                        }
                    );

                    try {
                        switch (status) {
                            case "Rejected":
                                sendEmail(user.email, status, `Unfortunately, Your order with ${orderId} has been rejected`);
                                break;
                            case "Confirm":
                                sendEmail(user.email, status, `We have successfully received your payment for order ${orderId}. Your order will be delivered soon`);
                                break;
                            case "Dispatched":
                                sendEmail(user.email, status, `Your order ${orderId} has been successfully dispatched`);
                                break;
                        }
                    } catch (error) {
                        console.log("Error in sending email");
                    } finally {
                        return res.status(200).json({ message: "Rejected successfully" });
                    }
                } else {
                    return res.status(400).json({ message: "User not found" });
                }
            } else {
                return res.status(400).json({ message: "Order not found" });
            }
        } else {
            return res.status(400).json({ message: "Invalid status" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

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
        now > new Date(freeCash.end_date)
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