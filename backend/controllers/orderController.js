const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Function to check whether the order exists or not
const findOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if(order) {
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
    if(user) {
        return user;
    } else {
        return null;
    }
}

const findProduct = async (productId) => {
    const product = await Product.findById(productId);
    if(product) {
        return product;
    } else {
        return null;
    }
}

// Function to add the order
const placeOrder = async (req, res) => {
    try {
        const cartItems = Object.values(req.body);
        console.log(cartItems);
        
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
                        price: cartData.price,
                        total: cartData.price * cartData.quantity,
                    });
                } else {
                    // Product without variants (no variants = no sizes = no details)
                    ordersToAdd.push({
                        image_url: cartData.imageUrl,
                        product_id: cartData.productId,
                        product_name: cartData.productName,
                        quantity: cartData.quantity,
                        price: cartData.price,
                        total: cartData.price * cartData.quantity,
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
            const totalPrice = ordersToAdd.reduce((sum, item) => sum + item.total, 0);

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

// Function to fetch all the orders
const fetchOrders = async (req, res) => {
    console.log("Request received for fetching orders");
    try {
        const orders = await Order.find();
        if(orders) {
            // console.log(orders);
            return res.status(200).json({message: "Success", orders});
        } else {
            return res.status(400).json({message: "No orders found"});
        }
    } catch(error) {
        return res.status(500).json({message: "Internal server error"});
    }
};

// Function where admin will update the shiping price
const shippingPriceUpdate = async (req, res) => {
    // console.log(req.body);
    try {
        const {shippingPriceValue, orderId, email} = req.body;
        const order = await Order.findById(orderId);
        if(order) {
            // Order with this ID is present
            console.log(order)
            // Checking the input
            if(parseInt(shippingPriceValue) > 0) {
                // Input is proper

                // Updating the order
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
                    // console.log(email)
                    try {
                        await sendEmail(email, "Accepted", `Your order has been accepted for id ${orderId}`)
                    } catch(error) {
                        console.log("Error in sending email");
                    } finally {
                        return res.status(200).json({message: "Shipping price updated"});
                    }
                } catch(error) {
                    // Prolem while updating the order
                    return res.status(400).json({message: "Problem while updating the order"});
                }
            } else {
                // Input is not proper
                return res.status(400).json({message: "Input is not proper"})
            }
        } else {
            // Order with this id is not present
            return res.status(400).json({message: "Product not found"})
        }
    } catch(error) {
        return res.status(500).json({message: `Internal server error ${error}`});
    }
}

// Function to handle status
const handleStatusChange = async (req, res) => {
    // console.log(req.body);
    try {
    const {status, orderId} = req.body;

    // Checking whether the order exists or not
    const order = await findOrder(orderId);
    // checking whether user exists or not
    const user = await findUser(order.user_id)
    if(order) {
        // Order is present

        // Checking whether user exists or not
        if(user) {
            console.log("Updting")
            // Start the updating process
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                {
                    status: status,
                    total_price: status
                },
                {
                    new: true,
                    runValidators: true
                }
            )

            // Sending the email
            try {
                console.log("try email")
                sendEmail(user.email, status, `Unfortunately, Your order with ${orderId} has been rejected`);
            } catch (error) {
                console.log("catch email")
                console.log("Error in sending email");
            } finally {
                console.log("Finally email")
                return res.status(200).json({message: "Rejected successfully"});
            }
        } else {
            // User does not exist
            return res.status(400).json({message: "User not found"})
        }
    } else {
        // Order is not present
        return res.status(400).json({message: "Order not found"})        
    }
} catch(error) {
    return res.status(500).json({message: "Internal server error"});
}
}

// Function to edit the order that is quantity and price
const editOrder = async (req, res) => {
    // console.log(req.body);
    try {
        const {products} = req.body;
        const {orderId} = req.params;
        const order = await findOrder(orderId);
        const user = await findUser(order.user_id);
        if(order) {
            console.log(products[0]);
            if(user) {
                const prices = [];
                for (const prod of products) {
                    const product = await findProduct(prod.product_id);
                    if(!product) {
                        return res.status(400).json({message: "Product not found"})
                    } else {
                        prices.push(prod.total);
                    }
                }
                const price = prices.reduce((accumulator, current) => accumulator + current, 0);
                const totalPrice = price + order.shipping_price;
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
            } else {
                return res.status(400).json({message: "User not found"});
            }
        } else {
            return res.status(400).json({message: "Order not found"});
        }
    } catch (error) {
        return res.status(500).json({message: "Internal server error"});
    }
}

module.exports = {
    placeOrder,
    fetchOrders,
    shippingPriceUpdate,
    handleStatusChange,
    editOrder,
};