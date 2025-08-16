const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const placeOrder = (req, res) => {
    // console.log(req.body);
    const errors = [];
    const ordersToAdd = [{}];
    Object.values(req.body).forEach(async cartData => {
        console.log(cartData);
        try {
            const user = await User.findById(cartData.userId)
            if(user) {
            const product = await Product.findById(cartData.productId);
                if(product) {
                    let isVariantFound = false;
                    
                    if(cartData.variantId) {
                        // Variant ID is present in cart
                    
                    product.variants.map(variant => {
                        if(variant._id.toString() === cartData.variantId) {
                            // Variant ID matched
                            isVariantFound = true;
                        }
                    })

                    // Checking whether variant was found or not
                    if(isVariantFound) {
                        // Variant found

                        if(cartData.sizeId) {

                        
                        let isSizeFound = false;
                        product.variants.map(variant => {
                            variant.moreDetails.map(details => {
                                if(details._id.toString() === cartData.detailsId) {
                                    // Now checking whether the size ID received is same as details ID from database
                                    if(details.size._id.toString() === cartData.sizeId) {
                                        isSizeFound = true
                                    }
                                }
                            })
                        })
                        // Checking whether size id found or not
                        if(isSizeFound) {
                            // Size id found proceed towards order adding
                            console.log("Adding order");
                            const order = {
                                user_id: req.user.id,
                                imageUrl: cartData.image_url,
                                user_name: user.first_name + " " + user.middle_name + " " + user.last_name,
                                email: user.email, 
                                phone_number: user.phone_number,
                                whatsapp_number: user.whatsapp_number,
                                product_id: cartData.productId,
                                product_name: cartData.productName,
                                variant_id: cartData.variantId,
                                variant_name: cartData.variantName,
                                size_id: cartData.sizeId,
                                size: cartData.size,
                                quantity: cartData.quantity,
                                original_price: cartData.price * cartData.quantity,
                            }
                            const p_id = cartData.productId;
                            ordersToAdd[0].p_id = order;
                            console.log(ordersToAdd);
                            console.log(p_id);
                        } else {
                            // Size does not found
                            errors.push(`Size ${cartData.sizeString} is not present in variant ${cartData.variantName} for product ${cartData.productName}`);
                            return;
                        }
                    } else {
                        // Size ID is not present in cart data
                    }
                } else {
                        // Variant does not found
                        errors.push(`Variant ID ${cartData.variantName} does not found for product ${cartData.productName}`);
                        return;
                    }
                } else {
                    // Variant ID not preset in cart products
                }
             }else {
                    errors.push(`Product not found for id ${cartData.productId}`);
                    return;
                }
        } else {
            errors.push(`User not found`)
        }
    } catch (error) {
        console.log(error)
    }
    })
}

module.exports = {
    placeOrder,
};