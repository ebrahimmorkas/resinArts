const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const placeOrder = async (req, res) => {
    try {
        const cartItems = Object.values(req.body);
        
        // Validate input
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // ✅ Get user ONCE - all items belong to same user
        const userId = cartItems[0]?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "No user ID provided"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const errors = [];
        const ordersToAdd = [];

        // ✅ Process each cart item (no redundant user checks)
        for (const cartData of cartItems) {
            try {
                const product = await Product.findById(cartData.productId);
                if (!product) {
                    errors.push(`Product not found for id ${cartData.productId}`);
                    continue; // ✅ Skip invalid item, process others
                }

                if (cartData.variantId) {
                    // Product with variants - MUST have size and details
                    const variant = product.variants.find(v => v._id.toString() === cartData.variantId);
                    if (!variant) {
                        errors.push(`Variant ${cartData.variantName || 'Unknown'} not found for product ${cartData.productName}`);
                        continue;
                    }

                    // Validate size exists (mandatory for variants)
                    if (!cartData.sizeId) {
                        errors.push(`Size is required for variant ${cartData.variantName} of product ${cartData.productName}`);
                        continue;
                    }

                    let sizeFound = false;
                    for (const variantItem of product.variants) {
                        if (variantItem._id.toString() === cartData.variantId) {
                            for (const detail of variantItem.moreDetails) {
                                if (detail._id.toString() === cartData.detailsId && 
                                    detail.size._id.toString() === cartData.sizeId) {
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

                    // Add order with variant and size (both mandatory)
                    ordersToAdd.push({
                        image_url: cartData.imageUrl,
                        product_id: cartData.productId,
                        product_name: cartData.productName,
                        variant_id: cartData.variantId,
                        variant_name: cartData.variantName,
                        size_id: cartData.sizeId,
                        size: cartData.sizeString,
                        quantity: cartData.quantity,
                        original_price: cartData.price * cartData.quantity,
                    });
                } else {
                    // Product without variants (no variants = no sizes = no details)
                    ordersToAdd.push({
                        image_url: cartData.imageUrl,
                        product_id: cartData.productId,
                        product_name: cartData.productName,
                        quantity: cartData.quantity,
                        original_price: cartData.price * cartData.quantity,
                    });
                }

            } catch (itemError) {
                console.error('Error processing cart item:', itemError);
                errors.push(`Error processing product ${cartData.productId}: ${itemError.message}`);
                continue; // ✅ Continue processing other items
            }
        }

        // ✅ Create order if we have valid items
        if (ordersToAdd.length > 0) {
            const totalPrice = ordersToAdd.reduce((sum, item) => sum + item.original_price, 0);

            const newOrder = new Order({
                user_id: req.user.id, // From auth middleware
                user_name: `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim(),
                email: user.email,
                phone_number: user.phone_number,
                whatsapp_number: user.whatsapp_number,
                orderedProducts: ordersToAdd,
                price: totalPrice,
            });

            await newOrder.save();

            // ✅ Success response (even if some items had errors)
            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order: {
                    id: newOrder._id,
                    totalPrice: totalPrice,
                    itemCount: ordersToAdd.length,
                    validItems: ordersToAdd.length,
                    totalItems: cartItems.length
                },
                warnings: errors.length > 0 ? {
                    message: `${errors.length} items could not be processed`,
                    details: errors
                } : undefined
            });
        } else {
            // ✅ No valid items to order
            return res.status(400).json({
                success: false,
                message: "No valid items to order. All items have errors.",
                errors: errors
            });
        }

    } catch (error) {
        console.error('Order placement error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while placing order",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    placeOrder,
};