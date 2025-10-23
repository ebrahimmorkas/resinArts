// Updated ShippingPriceModal.jsx
import React, { useState, useEffect } from 'react'
import { X, DollarSign } from "lucide-react"
import axios from "axios";

function ShippingPriceModal({onClose, orderId, email, isEditMode = false, currentShippingPrice = 0, fromConfirmationModal = false, updatedProducts = null, currentOrderStatus = null}) {
    const [shippingPriceValue, setShippingPriceValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isEditMode && currentShippingPrice > 0) {
            setShippingPriceValue(currentShippingPrice.toString());
        } else {
            setShippingPriceValue("");
        }
    }, [isEditMode, currentShippingPrice]);

    

    const handleSubmitOfShippingPriceForm = async (e) => {
    e.preventDefault();
    
    const priceValue = parseFloat(shippingPriceValue);
    if (!isNaN(priceValue) && priceValue >= 0) {
        setIsLoading(true);
        setErrorMessage("");
        
        // Validate orderId
        if (!orderId) {
            setErrorMessage("Order ID is missing. Please try again.");
            setIsLoading(false);
            return;
        }
        
        try {
            let res;
            
            // If called from ConfirmationModal, use confirm-order-update endpoint
            if (fromConfirmationModal && updatedProducts) {
                res = await axios.post("http://localhost:3000/api/order/confirm-order-update", {
                    orderId,
                    products: updatedProducts,
                    confirmedShippingPrice: priceValue,
                    email,
                    currentStatus: currentOrderStatus
                }, { withCredentials: true });
            } else {
                // Normal flow - just update shipping price
                res = await axios.post("http://localhost:3000/api/order/shipping-price-update", {
                    shippingPriceValue: priceValue,
                    orderId,
                    email,
                    isEdit: isEditMode
                }, { withCredentials: true });
            }
            
            if (res.status === 200) {
                console.log(isEditMode ? "Shipping price updated successfully" : "Shipping price added successfully");
                onClose(true); // Pass true to indicate success
            } else {
                console.log("Not updated - unexpected status:", res.status);
                setErrorMessage("Failed to update shipping price. Please try again.");
            }
        } catch (error) {
            console.log("Error:", error.message);
            if (error.response && error.response.status === 400 && error.response.data.message.includes("Insufficient stock")) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage(error.response?.data?.message || "Failed to update shipping price. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    } else {
        setErrorMessage("Please enter a valid shipping price (0 or greater)");
    }
};

    const modalTitle = isEditMode ? "Edit Shipping Price" : "Add Shipping Price";
    const buttonText = isEditMode ? "Update Shipping Price" : "Add Shipping Price";

    if (errorMessage && errorMessage.includes("Insufficient stock")) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
                    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
                        <h2 className="text-xl font-bold text-red-600">Error</h2>
                        <button onClick={onClose} className="text-red-400 hover:text-red-600">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-700 mb-4">{errorMessage}</p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-red-600 text-black text-sm font-medium rounded-lg hover:bg-red-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modalTitle}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                            {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleSubmitOfShippingPriceForm}>
                        <div className="mb-6">
                            <label htmlFor="shippingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                Shipping Price (₹)
                            </label>
                            <input 
                                type="number" 
                                id="shippingPrice"
                                value={shippingPriceValue} 
                                onChange={(e) => setShippingPriceValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                placeholder="Enter shipping price"
                                min="0"
                                step="0.01"
                                disabled={isLoading}
                                required
                            />
                            {isEditMode && currentShippingPrice > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Current shipping price: ₹{currentShippingPrice}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                type="submit"
                                disabled={isLoading || parseFloat(shippingPriceValue) <= 0}
                                className="flex-1 px-4 py-2 bg-blue-600 text-green-600 text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? "Updating..." : buttonText}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ShippingPriceModal