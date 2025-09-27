"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { FreeCashContext } from "./FreeCashContext";
import { ProductContext } from "./ProductContext";

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [applyFreeCash, setApplyFreeCash] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Get contexts
    const { freeCash, checkFreeCashEligibility } = useContext(FreeCashContext);
    const { products } = useContext(ProductContext);

    axios.defaults.withCredentials = true;

    // Initial cart fetch
    useEffect(() => {
        fetchCartFromBackend();
    }, []);

    // When free cash context loads, check for eligibility and refresh cart
    useEffect(() => {
        if (freeCash !== null && Object.keys(cartItems).length > 0) {
            // If free cash is available, enable the checkbox by default
            if (freeCash && !freeCash.is_cash_used && !freeCash.is_cash_expired) {
                setApplyFreeCash(false);
            } else {
                setApplyFreeCash(false);
            }
            updateAllCashApplied();
        }
    }, [freeCash]);

    // Recalculate cash applied when applyFreeCash checkbox changes
    useEffect(() => {
        if (Object.keys(cartItems).length > 0) {
            updateAllCashApplied();
        }
    }, [applyFreeCash]);

    const fetchCartFromBackend = async () => {
        try {
            setLoading(true);
            const response = await axios.get("https://api.simplyrks.cloud/api/cart", {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const cartData = response.data;
                const formattedCart = {};
                cartData.forEach((item) => {
                    const cartKey = `${item.product_id}-${item.variant_name || "default"}-${item.size || "default"}`;
                    formattedCart[cartKey] = {
                        productId: item.product_id,
                        variantName: item.variant_name || null,
                        sizeString: item.size || null,
                        quantity: item.quantity,
                        price: item.price,
                        discountedPrice: item.discounted_price,
                        imageUrl: item.image_url,
                        productName: item.product_name,
                        variantId: item.variant_id,
                        detailsId: item.details_id,
                        sizeId: item.size_id,
                        cashApplied: item.cash_applied || 0,
                        userId: item.user_id,
                    };
                });
                setCartItems(formattedCart);
                
                // After loading cart, check for free cash availability
                if (checkFreeCashEligibility) {
                    await checkFreeCashEligibility();
                }
            }
        } catch (err) {
            setError("Failed to load cart");
            console.error("Error fetching cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, colorName, sizeString, quantity, productData) => {
        try {
            setLoading(true);
            const cartKey = `${productId}-${colorName || "default"}-${sizeString || "default"}`;

            let cashApplied = 0;
            if (applyFreeCash && freeCash) {
                const product = products.find((p) => p._id === productId);
                if (product) {
                    const mockCartData = {
                        ...productData,
                        quantity: quantity,
                        discountedPrice: productData.discountedPrice || productData.price
                    };
                    
                    if (isFreeCashEligible(product, mockCartData, freeCash)) {
                        const itemTotal = mockCartData.discountedPrice * quantity;
                        cashApplied = Math.min(freeCash.amount, itemTotal);
                    }
                }
            }

            const cartItemData = {
                image_url: productData.imageUrl,
                product_id: productId,
                product_name: productData.productName,
                quantity: quantity,
                price: productData.price,
                cash_applied: cashApplied,
                discounted_price: productData.discountedPrice || productData.price,
            };

            if (productData.variantId && productData.variantId !== "") {
                cartItemData.variant_id = productData.variantId;
            }
            if (productData.detailsId && productData.detailsId !== "") {
                cartItemData.details_id = productData.detailsId;
            }
            if (productData.sizeId && productData.sizeId !== "") {
                cartItemData.size_id = productData.sizeId;
            }
            if (colorName && colorName !== "") {
                cartItemData.variant_name = colorName;
            }
            if (sizeString && sizeString !== "") {
                cartItemData.size = sizeString;
            }

            const response = await axios.post("https://api.simplyrks.cloud/api/cart", cartItemData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200 || response.status === 201) {
                setCartItems((prev) => ({
                    ...prev,
                    [cartKey]: {
                        productId,
                        variantName: colorName || null,
                        sizeString: sizeString || null,
                        quantity: (prev[cartKey]?.quantity || 0) + quantity,
                        price: productData.price,
                        discountedPrice: productData.discountedPrice || productData.price,
                        imageUrl: productData.imageUrl,
                        productName: productData.productName,
                        variantId: productData.variantId,
                        detailsId: productData.detailsId,
                        sizeId: productData.sizeId,
                        cashApplied,
                    },
                }));
            } else {
                throw new Error("Failed to add item to cart");
            }
        } catch (err) {
            setError("Failed to add item to cart");
            console.error("Error adding to cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (cartKey, change) => {
        try {
            const item = cartItems[cartKey];
            if (!item) return;

            const newQuantity = item.quantity + change;

            if (newQuantity <= 0) {
                await removeFromCart(cartKey);
                return;
            }

            let cashApplied = 0;
            if (applyFreeCash && freeCash) {
                const product = products.find((p) => p._id === item.productId);
                if (product) {
                    const mockCartData = {
                        ...item,
                        quantity: newQuantity,
                        discountedPrice: item.discountedPrice || item.price
                    };
                    
                    if (isFreeCashEligible(product, mockCartData, freeCash)) {
                        const itemTotal = mockCartData.discountedPrice * newQuantity;
                        cashApplied = Math.min(freeCash.amount, itemTotal);
                    }
                }
            }

            const response = await axios.put(
                "https://api.simplyrks.cloud/api/cart",
                {
                    product_id: item.productId,
                    variant_name: item.variantName,
                    size: item.sizeString,
                    quantity: newQuantity,
                    cash_applied: cashApplied,
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.status === 200) {
                setCartItems((prev) => ({
                    ...prev,
                    [cartKey]: {
                        ...prev[cartKey],
                        quantity: newQuantity,
                        cashApplied,
                    },
                }));
            }
        } catch (err) {
            setError("Failed to update quantity");
            console.error("Error updating quantity:", err);
        }
    };

    const removeFromCart = async (cartKey) => {
        try {
            const item = cartItems[cartKey];
            if (!item) return;

            const response = await axios.delete("https://api.simplyrks.cloud/api/cart", {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    product_id: item.productId,
                    variant_name: item.variantName,
                    size: item.sizeString,
                },
            });

            if (response.status === 200) {
                setCartItems((prev) => {
                    const newCart = { ...prev };
                    delete newCart[cartKey];
                    return newCart;
                });
            }
        } catch (err) {
            setError("Failed to remove item");
            console.error("Error removing from cart:", err);
        }
    };

    const isFreeCashEligible = (product, item, freeCash) => {
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

  // Calculate total cart value (excluding free cash applied)
  const cartTotal = Object.values(cartItems).reduce((sum, cartItem) => {
    const price = cartItem.discountedPrice || cartItem.price;
    return sum + price * cartItem.quantity;
  }, 0);

  if (cartTotal < freeCash.valid_above_amount) {
    return false;
  }

  if (freeCash.is_cash_applied_on__all_products) {
    return true;
  }

  // Check category restrictions
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

    // Update cash applied for all items when applyFreeCash changes
    const updateAllCashApplied = async () => {
        if (!products || products.length === 0) {
            console.warn("Products not loaded yet, skipping cash update");
            return;
        }

        const updatedItems = {};
        let hasChanges = false;
        let remainingFreeCash = freeCash ? freeCash.amount : 0;

        // Sort items by total value (descending) to prioritize higher value items
        const sortedCartItems = Object.entries(cartItems).sort(([, itemA], [, itemB]) => {
            const totalA = (itemA.discountedPrice || itemA.price) * itemA.quantity;
            const totalB = (itemB.discountedPrice || itemB.price) * itemB.quantity;
            return totalB - totalA;
        });

        for (const [cartKey, item] of sortedCartItems) {
            let cashApplied = 0;
            
            if (applyFreeCash && freeCash && remainingFreeCash > 0) {
                const product = products.find((p) => p._id === item.productId);
                if (product && isFreeCashEligible(product, item, freeCash)) {
                    const itemTotal = (item.discountedPrice || item.price) * item.quantity;
                    cashApplied = Math.min(remainingFreeCash, itemTotal);
                    remainingFreeCash -= cashApplied;
                }
            }

            if (cashApplied !== item.cashApplied) {
                hasChanges = true;
                updatedItems[cartKey] = { ...item, cashApplied };

                // Update on backend
                try {
                    await axios.put(
                        "https://api.simplyrks.cloud/api/cart",
                        {
                            product_id: item.productId,
                            variant_name: item.variantName,
                            size: item.sizeString,
                            quantity: item.quantity,
                            cash_applied: cashApplied,
                        },
                        {
                            withCredentials: true,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );
                } catch (error) {
                    console.error("Error updating cash applied for item:", error);
                }
            } else {
                updatedItems[cartKey] = item;
            }
        }

        if (hasChanges) {
            setCartItems(updatedItems);
        }
    };

    const getCartTotal = () => {
        let total = Object.values(cartItems).reduce((sum, item) => {
            const price = item.discountedPrice || item.price;
            return sum + price * item.quantity;
        }, 0);

        let totalFreeCashApplied = 0;
        if (applyFreeCash && freeCash) {
            totalFreeCashApplied = Object.values(cartItems).reduce((sum, item) => {
                return sum + (item.cashApplied || 0);
            }, 0);
        }

        return Math.max(0, total - totalFreeCashApplied);
    };

    const getUniqueCartItemsCount = () => {
        return Object.keys(cartItems).length;
    };

    const getTotalItemsCount = () => {
        return Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
    };

    const clearCart = async () => {
        try {
            setLoading(true);
            // Clear cart on backend
            const response = await axios.delete("https://api.simplyrks.cloud/api/cart/clear", {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                // Clear cart on frontend
                setCartItems({});
                setApplyFreeCash(false); // Reset free cash checkbox
            }
        } catch (err) {
            setError("Failed to clear cart");
            console.error("Error clearing cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        applyFreeCash,
        setApplyFreeCash,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        getCartTotal,
        getUniqueCartItemsCount,
        getTotalItemsCount,
        fetchCartFromBackend,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
};