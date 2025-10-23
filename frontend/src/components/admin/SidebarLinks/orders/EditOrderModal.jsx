import React, { useState } from "react";
import { X } from "lucide-react";
import axios from 'axios';
import ShippingPriceModal from "./ShippingPriceModal";
import ConfirmationModal from "./ConfirmationModal";

function EditOrderModal({ onClose, order }) {
  const [products, setProducts] = useState(order.orderedProducts);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [pendingOrderUpdate, setPendingOrderUpdate] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isEditShippingMode, setIsEditShippingMode] = useState(false);

  // update product quantity directly in state
  const handleQuantityChange = (index, value) => {
    setProducts((prevProducts) => {
      const updated = [...prevProducts]; // copy array
      updated[index] = {
        ...updated[index], // copy product object
        quantity: Number(value), // update only quantity
        total: Number(value) * updated[index].price, // keep total in sync
      };
      return updated;
    });
  };

  // submit handler (send whole updated products array)
  const handleEditOrder = async (e) => {
  e.preventDefault();
  console.log("Updated Products:", products);
  
  // Check if all products have 0 quantity
  const allZeroQuantity = products.every(prod => prod.quantity === 0);
  
  if (allZeroQuantity && products.length > 0) {
    // All products have 0 quantity - reject the order
    try {
      const res = await axios.post(
        'http://localhost:3000/api/order/reject-zero-quantity-order',
        { orderId: order._id, email: order.email },
        { withCredentials: true }
      );
      
      if (res.status === 200) {
        console.log("Order rejected due to zero quantity");
        alert("Order has been rejected as all products have zero quantity.");
        onClose();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order. Please try again.");
    }
    return;
  }
  
  try {
    const res = await axios.post(
      `http://localhost:3000/api/order/edit-order/${order._id}`, 
      { products }, 
      { withCredentials: true }
    );
    
    if (res.status === 200) {
      if (res.data.requiresManualShipping) {
        // Manual shipping entry required
        console.log("Manual shipping price entry required");
        setPendingOrderUpdate(res.data.order);
        setShowShippingModal(true);
      } else if (res.data.requiresConfirmation) {
        // Show confirmation modal
        console.log("Confirmation required");
        setPendingOrderUpdate(res.data);
        setShowConfirmationModal(true);
      } else {
        // Order updated successfully
        console.log("Product Updated");
        if (res.data.shippingRecalculated) {
          console.log("Shipping price was automatically recalculated");
        }
        onClose();
      }
    } else {
      console.log("Problem in updating");
    }
  } catch (error) {
    console.error("Error updating order:", error);
    alert("Failed to update order. Please try again.");
  }
};

  const handleShippingModalClose = (success) => {
  setShowShippingModal(false);
  if (success) {
    // Shipping price was successfully added
    setPendingOrderUpdate(null);
    onClose();
  } else if (showConfirmationModal) {
    // Came from confirmation modal, go back
    handleShippingModalCloseFromConfirmation(success);
  } else {
    setPendingOrderUpdate(null);
  }
};

const handleConfirmationConfirm = async () => {
  // Check if shipping is pending - if yes, open shipping modal
  if (pendingOrderUpdate.newShippingPrice === 'Pending') {
    setShowConfirmationModal(false);
    setShowShippingModal(true);
    return;
  }
  
  // Otherwise proceed with confirmation
  try {
    const res = await axios.post(
      `http://localhost:3000/api/order/confirm-order-update`,
      {
        orderId: order._id,
        products: products,
        confirmedShippingPrice: pendingOrderUpdate.newShippingPrice,
        email: order.email,
        currentStatus: order.status
      },
      { withCredentials: true }
    );
    
    if (res.status === 200) {
      console.log("Order confirmed and updated");
      setShowConfirmationModal(false);
      setPendingOrderUpdate(null);
      onClose();
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    alert("Failed to confirm order update. Please try again.");
  }
};

const handleEditShippingFromConfirmation = async (action, value) => {
  if (action === 'free') {
    // Set shipping to 0 immediately
    try {
      const res = await axios.post(
        `http://localhost:3000/api/order/confirm-order-update`,
        {
          orderId: order._id,
          products: products,
          confirmedShippingPrice: 0,
          email: order.email,
          currentStatus: order.status
        },
        { withCredentials: true }
      );
      
      if (res.status === 200) {
        console.log("Order updated with free shipping");
        setShowConfirmationModal(false);
        setPendingOrderUpdate(null);
        onClose();
      }
    } catch (error) {
      console.error("Error setting free shipping:", error);
      alert("Failed to set free shipping. Please try again.");
    }
  } else if (action === 'reuse') {
    // Reuse old shipping price
    try {
      const res = await axios.post(
        `http://localhost:3000/api/order/confirm-order-update`,
        {
          orderId: order._id,
          products: products,
          confirmedShippingPrice: value,
          email: order.email,
          currentStatus: order.status
        },
        { withCredentials: true }
      );
      
      if (res.status === 200) {
        console.log("Order updated with reused shipping price");
        setShowConfirmationModal(false);
        setPendingOrderUpdate(null);
        onClose();
      }
    } catch (error) {
      console.error("Error reusing shipping price:", error);
      alert("Failed to reuse shipping price. Please try again.");
    }
  } else if (action === 'edit') {
    // Open shipping price modal in EDIT mode
    setShowConfirmationModal(false);
    setIsEditShippingMode(true);
    setShowShippingModal(true);
  }
};

const handleShippingModalCloseFromConfirmation = (success) => {
  setShowShippingModal(false);
  if (success) {
    // Shipping price was successfully updated
    setPendingOrderUpdate(null);
    onClose();
  } else {
    // User cancelled, go back to confirmation modal
    setShowConfirmationModal(true);
  }
};

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
          {/* Modal Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit the order</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Start of modal content */}
          <form onSubmit={handleEditOrder} className="p-6">
            {products.map((product, index) => (
              <div key={index} className="mb-4 border-b pb-2 dark:border-gray-700">
                <p className="font-semibold dark:text-white">{product.product_name}</p>

                {product.variant_name && (
                  <div className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>Variant: {product.variant_name}</p>
                    <p>Size: {product.size}</p>
                  </div>
                )}

                <div className="mt-2">
                  <label className="text-sm dark:text-gray-300">Enter new stock</label>
                  <input
                    type="number"
                    className="border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded px-2 py-1 w-24 ml-2"
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total: ₹{product.total}
                  </p>
                </div>
              </div>
            ))}

            {/* Single Save Button */}
            <div className="mt-4 text-right">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Shipping Price Modal - appears if manual entry is required */}
      {showShippingModal && pendingOrderUpdate && (
  <ShippingPriceModal
    onClose={(success) => {
      setShowShippingModal(false);
      setIsEditShippingMode(false);
      if (success) {
        setPendingOrderUpdate(null);
        onClose();
      } else if (showConfirmationModal || pendingOrderUpdate.newShippingPrice === 'Pending') {
        // Go back to confirmation modal
        setShowConfirmationModal(true);
      } else {
        setPendingOrderUpdate(null);
      }
    }}
    orderId={order._id}
    email={order.email}
    isEditMode={isEditShippingMode || (pendingOrderUpdate.newShippingPrice !== 'Pending')}
    currentShippingPrice={isEditShippingMode ? pendingOrderUpdate.newShippingPrice : 0}
  />
)}

      {showConfirmationModal && pendingOrderUpdate && (
  <ConfirmationModal
    isOpen={showConfirmationModal}
    onClose={() => {
      setShowConfirmationModal(false);
      setPendingOrderUpdate(null);
    }}
    onConfirm={handleConfirmationConfirm}
    orderData={{
      products: products,
      newPrice: pendingOrderUpdate.newPrice,
      newShippingPrice: pendingOrderUpdate.newShippingPrice,
      newTotalPrice: pendingOrderUpdate.newTotalPrice
    }}
    oldOrderData={{
      oldPrice: order.price,
      oldShippingPrice: order.shipping_price,
      oldTotalPrice: order.total_price
    }}
    onEditShipping={handleEditShippingFromConfirmation}
  />
)}
    </>
  );
}

export default EditOrderModal;