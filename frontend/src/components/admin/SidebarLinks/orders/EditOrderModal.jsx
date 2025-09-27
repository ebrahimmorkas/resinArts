import React, { useState } from "react";
import { X } from "lucide-react";
import axios from 'axios';

function EditOrderModal({ onClose, order }) {
  const [products, setProducts] = useState(order.orderedProducts);

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
    const res = await axios.post(`https://api.simplyrks.cloud/api/order/edit-order/${order._id}`, {products}, {withCredentials: true});
    if(res.status === 200) {
        console.log("Product Updated");
        onClose();
    } else {
        console.log("Problem in updated");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">Edit the order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Start of modal content */}
        <form onSubmit={handleEditOrder} className="p-6">
          {products.map((product, index) => (
            <div key={index} className="mb-4 border-b pb-2">
              <p className="font-semibold">{product.product_name}</p>

              {product.variant_name && (
                <div className="ml-4 text-sm text-gray-600">
                  <p>Variant: {product.variant_name}</p>
                  <p>Size: {product.size}</p>
                </div>
              )}

              <div className="mt-2">
                <label className="text-sm">Enter new stock</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-24 ml-2"
                  value={product.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total: ${product.total}
                </p>
              </div>
            </div>
          ))}

          {/* Single Save Button */}
          <div className="mt-4 text-right">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditOrderModal;
