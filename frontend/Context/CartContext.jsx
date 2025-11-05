"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { FreeCashContext } from "./FreeCashContext";
import { ProductContext } from "./ProductContext";
import { AuthContext } from "./AuthContext";

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
    
    const { freeCash, checkFreeCashEligibility } = useContext(FreeCashContext);
    const { products } = useContext(ProductContext);
    const { user } = useContext(AuthContext);

    axios.defaults.withCredentials = true;

    // Load cart on mount and when user changes
    useEffect(() => {
        if (user) {
            // User is logged in - fetch from backend and merge with localStorage
            migrateGuestCartToBackend();
        } else {
            // Guest user - load from localStorage
            loadCartFromLocalStorage();
        }
    }, [user]);

    // When free cash context loads, check for eligibility and refresh cart
    useEffect(() => {
        if (freeCash !== null && Object.keys(cartItems).length > 0 && user) {
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
        if (Object.keys(cartItems).length > 0 && user) {
            updateAllCashApplied();
        }
    }, [applyFreeCash]);

    // Load cart from localStorage (guest users)
    const loadCartFromLocalStorage = () => {
        try {
            const savedCart = localStorage.getItem('guestCart');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            } else {
                setCartItems({});
            }
        } catch (error) {
            console.error("Error loading cart from localStorage:", error);
            setCartItems({});
        }
    };

    // Save cart to localStorage (guest users)
    const saveCartToLocalStorage = (cart) => {
        try {
            localStorage.setItem('guestCart', JSON.stringify(cart));
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    };

    // Migrate guest cart to backend after login
    const migrateGuestCartToBackend = async () => {
        try {
            setLoading(true);
            const guestCart = localStorage.getItem('guestCart');
            
            // Fetch backend cart first
            const response = await axios.get("https://api.mouldmarket.in/api/cart", {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            let backendCart = {};
            if (response.status === 200) {
                const cartData = response.data;
                cartData.forEach((item) => {
                    const cartKey = `${item.product_id}-${item.variant_name || "default"}-${item.size || "default"}`;
                    backendCart[cartKey] = {
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
                        bulkPricing: item.bulk_pricing || [],
                        cashApplied: item.cash_applied || 0,
                        userId: item.user_id,
                    };
                });
            }

            // If there's a guest cart, merge it
            if (guestCart) {
                const guestCartItems = JSON.parse(guestCart);
                
                // Merge guest cart with backend cart
                for (const [cartKey, guestItem] of Object.entries(guestCartItems)) {
                    if (backendCart[cartKey]) {
                        // Item exists in backend, increase quantity
                        await axios.put(
                            "https://api.mouldmarket.in/api/cart",
                            {
                                product_id: guestItem.productId,
                                variant_name: guestItem.variantName,
                                size: guestItem.sizeString,
                                quantity: backendCart[cartKey].quantity + guestItem.quantity,
                                cash_applied: 0,
                            },
                            {
                                withCredentials: true,
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                        backendCart[cartKey].quantity += guestItem.quantity;
                    } else {
                        // Item doesn't exist in backend, add it
                        const cartItemData = {
                            image_url: guestItem.imageUrl,
                            product_id: guestItem.productId,
                            product_name: guestItem.productName,
                            quantity: guestItem.quantity,
                            price: guestItem.price,
                            cash_applied: 0,
                            discounted_price: guestItem.discountedPrice || guestItem.price,
                        };

                        if (guestItem.variantId) cartItemData.variant_id = guestItem.variantId;
                        if (guestItem.detailsId) cartItemData.details_id = guestItem.detailsId;
                        if (guestItem.sizeId) cartItemData.size_id = guestItem.sizeId;
                        if (guestItem.variantName) cartItemData.variant_name = guestItem.variantName;
                        if (guestItem.sizeString) cartItemData.size = guestItem.sizeString;

                        await axios.post("https://api.mouldmarket.in/api/cart", cartItemData, {
                            withCredentials: true,
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });
                        backendCart[cartKey] = guestItem;
                    }
                }

                // Clear guest cart from localStorage
                localStorage.removeItem('guestCart');
            }

            setCartItems(backendCart);
            
            // Check for free cash availability
            if (checkFreeCashEligibility) {
                await checkFreeCashEligibility();
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
        const cartKey = `${productId}-${colorName || "default"}-${sizeString || "default"}`;

        if (!user) {
            // Guest user - save to localStorage (synchronous, no loading needed)
            const newCartItems = {
                ...cartItems,
                [cartKey]: {
                    productId,
                    variantName: colorName || null,
                    sizeString: sizeString || null,
                    quantity: (cartItems[cartKey]?.quantity || 0) + quantity,
                    price: productData.price,
                    discountedPrice: productData.discountedPrice || productData.price,
                    imageUrl: productData.imageUrl,
                    productName: productData.productName,
                    variantId: productData.variantId,
                    detailsId: productData.detailsId,
                    sizeId: productData.sizeId,
                    cashApplied: 0,
                },
            };
            setCartItems(newCartItems);
            saveCartToLocalStorage(newCartItems);
            return;
        }

        // Logged in user - optimistic update first (instant feedback)
        const optimisticCartItems = {
    ...cartItems,
    [cartKey]: {
        productId,
        variantName: colorName || null,
        sizeString: sizeString || null,
        quantity: (cartItems[cartKey]?.quantity || 0) + quantity,
        price: productData.price,
        discountedPrice: productData.discountedPrice || productData.price,
        imageUrl: productData.imageUrl,
        productName: productData.productName,
        variantId: productData.variantId,
        detailsId: productData.detailsId,
        sizeId: productData.sizeId,
        bulkPricing: productData.bulkPricing || [], // Add this line
        cashApplied: 0,
    },
};
        setCartItems(optimisticCartItems);

        // Then update backend in background
        // Store bulk pricing data in cart item
const bulkPricingData = productData.bulkPricing || [];

// Background API call
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
            bulk_pricing: productData.bulkPricing || [], 
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

        // Background API call
        axios.post("https://api.mouldmarket.in/api/cart", cartItemData, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        }).then(response => {
            if (response.status === 200 || response.status === 201) {
                // Update with server response (includes correct cashApplied)
                setCartItems((prev) => ({
                    ...prev,
                    [cartKey]: {
                        ...prev[cartKey],
                        cashApplied,
                    },
                }));
            }
        }).catch(err => {
            // Rollback on error
            setCartItems(cartItems);
            setError("Failed to add item to cart");
            console.error("Error adding to cart:", err);
        });

    } catch (err) {
        setError("Failed to add item to cart");
        console.error("Error adding to cart:", err);
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

        if (!user) {
            // Guest user - update localStorage
            const newCartItems = {
                ...cartItems,
                [cartKey]: {
                    ...cartItems[cartKey],
                    quantity: newQuantity,
                },
            };
            setCartItems(newCartItems);
            saveCartToLocalStorage(newCartItems);
            return;
        }

        // Logged in user - optimistic update
        const optimisticCartItems = {
            ...cartItems,
            [cartKey]: {
                ...cartItems[cartKey],
                quantity: newQuantity,
            },
        };
        setCartItems(optimisticCartItems);

        // Background API call
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

        axios.put(
            "https://api.mouldmarket.in/api/cart",
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
        ).then(response => {
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
        }).catch(err => {
            // Rollback on error
            setCartItems(cartItems);
            setError("Failed to update quantity");
            console.error("Error updating quantity:", err);
        });
    } catch (err) {
        setError("Failed to update quantity");
        console.error("Error updating quantity:", err);
    }
};

    const removeFromCart = async (cartKey) => {
    try {
        const item = cartItems[cartKey];
        if (!item) return;

        if (!user) {
            // Guest user - remove from localStorage
            const newCartItems = { ...cartItems };
            delete newCartItems[cartKey];
            setCartItems(newCartItems);
            saveCartToLocalStorage(newCartItems);
            return;
        }

        // Logged in user - optimistic update
        const optimisticCartItems = { ...cartItems };
        delete optimisticCartItems[cartKey];
        setCartItems(optimisticCartItems);

        // Background API call
        axios.delete("https://api.mouldmarket.in/api/cart", {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                product_id: item.productId,
                variant_name: item.variantName,
                size: item.sizeString,
            },
        }).catch(err => {
            // Rollback on error
            setCartItems(cartItems);
            setError("Failed to remove item");
            console.error("Error removing from cart:", err);
        });
    } catch (err) {
        setError("Failed to remove item");
        console.error("Error removing from cart:", err);
    }
};

    const isFreeCashEligible = (product, item, freeCash) => {
        if (!freeCash || !user) return false;

        const now = new Date();
        if (
            freeCash.is_cash_used ||
            freeCash.is_cash_expired ||
            now < new Date(freeCash.start_date) ||
            (freeCash.end_date && now > new Date(freeCash.end_date))
        ) {
            return false;
        }

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

    const updateAllCashApplied = async () => {
        if (!user || !products || products.length === 0) {
            return;
        }

        const updatedItems = {};
        let hasChanges = false;
        let remainingFreeCash = freeCash ? freeCash.amount : 0;

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

                try {
                    await axios.put(
                        "https://api.mouldmarket.in/api/cart",
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
        if (applyFreeCash && freeCash && user) {
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
            
            if (!user) {
                // Guest user - clear localStorage
                setCartItems({});
                localStorage.removeItem('guestCart');
                setLoading(false);
                return;
            }

            // Logged in user - clear backend
            const response = await axios.delete("https://api.mouldmarket.in/api/cart/clear", {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setCartItems({});
                setApplyFreeCash(false);
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
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};