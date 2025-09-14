import React, { useState } from 'react'
import { X } from "lucide-react"
import axios from "axios";

function ShippingPriceModal({onClose, orderId, email}) {
    const [shippingPriceValue, setShippingPriceValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitOfShippingPriceForm = async (e) => {
        e.preventDefault();
        
        if(parseInt(shippingPriceValue) > 0) {
            setIsLoading(true);
            try {
                const res = await axios.post("http://localhost:3000/api/order/shipping-price-update", {shippingPriceValue, orderId, email}, {withCredentials: true});
                
                if(res.status === 200) {
                    // Response status code is 200
                    console.log("Updated successfully");
                    onClose(); // Call the function to close modal
                } else {
                    // Response status code is not 200
                    console.log("Not updated - unexpected status:", res.status);
                }
            } catch(error) {
                console.log("Error:", error.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Input is not validated
            alert("Please enter a valid shipping price greater than 0");
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Enter Shipping Price</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form for entering shipping price */}
                <div className="p-6">
                    <div className="mb-4">
                        <label htmlFor="shippingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                            Shipping Price
                        </label>
                        <input 
                            type="number" 
                            id="shippingPrice"
                            value={shippingPriceValue} 
                            onChange={(e) => setShippingPriceValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter shipping price"
                            min="1"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handleSubmitOfShippingPriceForm}
                            disabled={isLoading || !shippingPriceValue}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Adding..." : "Add Shipping Price"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShippingPriceModal