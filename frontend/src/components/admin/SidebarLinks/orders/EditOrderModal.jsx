import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import axios from 'axios';
import ShippingPriceModal from "./ShippingPriceModal";
import ConfirmationModal from "./ConfirmationModal";
import AddProductToOrderModal from "./AddProductToOrderModal";

function EditOrderModal({ onClose, order }) {
  const [products, setProducts] = useState(order.orderedProducts);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [pendingOrderUpdate, setPendingOrderUpdate] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isEditShippingMode, setIsEditShippingMode] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

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
        'https://api.mouldmarket.in/api/order/reject-zero-quantity-order',
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
  
  // Validate stock for newly added products
  const newlyAddedProducts = products.filter(p => p.isNewlyAdded);
  if (newlyAddedProducts.length > 0) {
    console.log("Validating stock for newly added products...");
    const stockValidations = await Promise.all(
      newlyAddedProducts.map(p => validateProductStock(p))
    );
    
    const insufficientStock = [];
    newlyAddedProducts.forEach((product, index) => {
      const validation = stockValidations[index];
      if (!validation.sufficient) {
        insufficientStock.push({
          name: product.product_name,
          variant: product.variant_name || '',
          size: product.size || '',
          requested: product.quantity,
          available: validation.available
        });
      }
    });
    
    if (insufficientStock.length > 0) {
      const errorMessage = insufficientStock.map(item => 
        `${item.name}${item.variant ? ` (${item.variant})` : ''}${item.size ? ` - ${item.size}` : ''}: Requested ${item.requested}, Available ${item.available}`
      ).join('\n');
      
      alert(`Insufficient stock for newly added products:\n\n${errorMessage}\n\nPlease adjust quantities and try again.`);
      return;
    }
  }
  
  try {
    // Remove isNewlyAdded flag before sending to backend
    const productsToSend = products.map(p => {
      const { isNewlyAdded, ...rest } = p;
      return rest;
    });
    
    const res = await axios.post(
      `https://api.mouldmarket.in/api/order/edit-order/${order._id}`, 
      { products: productsToSend }, 
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
      `https://api.mouldmarket.in/api/order/confirm-order-update`,
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
        `https://api.mouldmarket.in/api/order/confirm-order-update`,
        {
          orderId: order._id,
          products: products,  // ← This sends updated quantities
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
        `https://api.mouldmarket.in/api/order/confirm-order-update`,
        {
          orderId: order._id,
          products: products,  // ← This sends updated quantities
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

// While editing if user want to add new product
const handleAddProducts = (newProducts) => {
  setProducts((prevProducts) => {
    const productsWithBadge = newProducts.map(p => ({
      ...p,
      isNewlyAdded: true
    }));
    const updatedProducts = [...prevProducts, ...productsWithBadge];
    return updatedProducts;
  });
};

// Validate stock for a product (works for both existing and newly added)
const validateProductStock = async (product) => {
  try {
    const res = await axios.get(`https://api.mouldmarket.in/api/product/${product.product_id}`, {
      withCredentials: true
    });
    
    if (res.status === 200) {
      const productData = res.data;
      
      if (!product.variant_id) {
        // Product without variants
        return {
          available: productData.stock,
          sufficient: productData.stock >= product.quantity
        };
      } else {
        // Product with variants
        const variant = productData.variants.find(v => v._id === product.variant_id);
        if (variant) {
          const sizeDetail = variant.moreDetails.find(md => md._id === product.size_id);
          if (sizeDetail) {
            return {
              available: sizeDetail.stock,
              sufficient: sizeDetail.stock >= product.quantity
            };
          }
        }
      }
    }
    return { available: 0, sufficient: false };
  } catch (error) {
    console.error('Error validating stock:', error);
    return { available: 0, sufficient: false };
  }
};

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[calc(100vh-4rem)]">
          {/* Modal Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit the order</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Start of modal content */}
          <form onSubmit={handleEditOrder} className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {products.map((product, index) => (
  <div key={index} className="mb-4 border-b pb-2 dark:border-gray-700">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold dark:text-white">{product.product_name}</p>
          {product.isNewlyAdded && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              Newly Added
            </span>
          )}
        </div>

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
    </div>
  </div>
))}

            {/* Action Buttons */}
<div className="mt-6 flex flex-col sm:flex-row gap-3">
  <button
    type="button"
    onClick={() => setShowAddProductModal(true)}
    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-green-600 dark:text-gray-400 rounded-lg hover:bg-green-700 transition-colors font-medium"
  >
    <Plus className="h-5 w-5" />
    Add Product
  </button>
  <button
    type="submit"
    className="flex-1 bg-blue-500 hover:bg-blue-600 text-blue-600 dark:text-white px-6 py-2 rounded-lg transition-colors font-medium"
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
    fromConfirmationModal={true}
    updatedProducts={products}
    currentOrderStatus={order.status}
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
{showAddProductModal && (
  <AddProductToOrderModal
    onClose={() => setShowAddProductModal(false)}
    onAddProducts={handleAddProducts}
    existingProducts={products}
  />
)}
    </>
  );
}

export default EditOrderModal;