"use client"

import { useState, useMemo, useEffect, useContext } from "react"
import { Search, Download, Check, X, XCircle, Clock, Truck, CheckCircle, Eye, User, Package, AlertTriangle, ChevronLeft, ChevronRight, Filter, Calendar } from "lucide-react"
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import io from 'socket.io-client';

import axios from "axios"
import { ProductContext } from "../../../../../Context/ProductContext"
import ShippingPriceModal from "./ShippingPriceModal"
import StatusModal from "./StatusModal";
import EditOrderModal from "./EditOrderModal"

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Accepted: "bg-green-100 text-green-800",
  Dispatched: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
  Completed: "bg-purple-100 text-purple-800",
  "In Progress": "bg-orange-100 text-orange-800",
}

const statusIcons = {
  Pending: Clock,
  Accepted: Check,
  Dispatched: Truck,
  Rejected: X,
  Completed: CheckCircle,
  "In Progress": Clock,
}

// Function to get stock for a product
const getStock = (details, variantAndSizeDetails) => {
  console.log(details);
  console.log("From get stock");
  
  for (const detail of details) {
    if (detail.hasVariants) {
      console.log("It has variants");
      variantLoop: for (const variant of detail.variants) {
        moreDetailLoop: for (const moreDetail of variant.moreDetails) {
          if (moreDetail.size._id.toString() === variantAndSizeDetails.size_id.toString()) {
            return moreDetail.stock;
          }
        }
      }
      console.log(variantAndSizeDetails);
    } else {
      console.log("It does not have variants");
      return detail.stock;
    }
  }
}

// Order Details Modal Component
function OrderDetailsModal({ order, isOpen, onClose, onStatusChange, productMappedWithOrderId }) {
  if (!isOpen || !order) return null;

  const StatusIcon = statusIcons[order.status];
  const [showShippingPriceModal, setShowShippingPriceModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [status, setStatus] = useState("");
  const [orderId, setOrderId] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalQuantity = order.orderedProducts.reduce((sum, product) => sum + product.quantity, 0);

  // Function to handle status change for backend
  const handleStatusChangeBackend = async (status, orderId) => {
    try {
      const res = await axios.post('http://localhost:3000/api/order/status-change', { status, orderId }, { withCredentials: true });
      if (res.status === 200) {
        console.log("Order status changed successfully");
        setStatus(status);
        setShowStatusModal(true);
      } else {
        console.log("Order status change request cannot be processed");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function that will handle the editing of the order
  const handleEdit = async (order) => {
    setCurrentOrder(order);
    setShowEditModal(true);
  };

  // Function to check stock status and return appropriate styling
  const getStockStatus = (orderedQuantity, currentStock) => {
    if (currentStock === undefined || currentStock === null) {
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-600 dark:text-gray-400",
        status: "Unknown Stock",
        icon: AlertTriangle,
      };
    }

    if (orderedQuantity <= currentStock) {
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        status: "In Stock",
        icon: Check,
      };
    } else {
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        status: "Low Stock",
        icon: X,
      };
    }
  };

  // Start of order details modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Order ID: {order._id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Order Status and Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onStatusChange(order._id, "Accepted");
                  setOrderId(order._id);
                  setShowShippingPriceModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-green-600 text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  order.status === "Accepted" ||
                  !productMappedWithOrderId ||
                  order.orderedProducts.some((product, index) => {
                    const stock = getStock(productMappedWithOrderId.products[index], order.orderedProducts[index]);
                    return stock === undefined || stock < product.quantity;
                  })
                }
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </button>
              <button
                onClick={() => {
                  onStatusChange(order._id, "Rejected");
                  handleStatusChangeBackend("Rejected", order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={order.status === "Rejected"}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={() => {
                  onStatusChange(order._id, "Confirm");
                  handleStatusChangeBackend("Confirm", order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-blue-600white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={order.status === "Confirm"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm
              </button>
              {/*<button
                onClick={() => {
                  onStatusChange(order._id, "In Progress");
                  handleStatusChangeBackend("In Progress", order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={order.status === "In Progress"}
              > 
                <Clock className="h-4 w-4 mr-2" />
                In Progress
              </button> */}
              <button
                onClick={() => {
                  onStatusChange(order._id, "Dispatched");
                  handleStatusChangeBackend("Dispatched", order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-green-600 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={order.status === "Dispatched"}
              >
                <Truck className="h-4 w-4 mr-2" />
                Dispatch
              </button>
              <button
                onClick={() => {
                  onStatusChange(order._id, "Completed");
                  handleStatusChangeBackend("Completed", order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-green-600 text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={order.status === "Completed"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </button>
              <button
                onClick={() => {
                  handleEdit(order);
                  setOrderId(order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium">{order.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="font-medium text-xs">{order.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium">{order.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="font-medium">{order.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">WhatsApp:</span>
                  <span className="font-medium">{order.whatsapp_number}</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                  <span className="font-medium text-xs">{order._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Products:</span>
                  <span className="font-medium">{order.orderedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                  <span className="font-medium">{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">₹{order.price}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Ordered Products</h3>
            </div>
            <div className="space-y-4">
              {order.orderedProducts.map((product, index) => {
                const stock = getStock(productMappedWithOrderId.products[index], order.orderedProducts[index]);
                const stockStatus = getStockStatus(product.quantity, stock);
                const StockIcon = stockStatus.icon;

                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${stockStatus.bgColor} border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-start space-x-4">
                      <img
                        src={product.image_url || "/placeholder.svg?height=80&width=80"}
                        alt={product.product_name}
                        className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{product.product_name}</h4>
                          <div
                            className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.textColor}`}
                          >
                            <StockIcon className="h-3 w-3 mr-1" />
                            {stockStatus.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Product ID:</span>
                              <div className="font-medium text-xs break-all">{product.product_id}</div>
                            </div>
                            {product.variant_id && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Variant ID:</span>
                                <div className="font-medium text-xs break-all">{product.variant_id}</div>
                              </div>
                            )}
                            {product.size_id && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Size ID:</span>
                                <div className="font-medium text-xs break-all">{product.size_id}</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {product.variant_name && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Variant:</span>
                                <div className="font-medium">{product.variant_name}</div>
                              </div>
                            )}
                            {product.size && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                                <div className="font-medium">{product.size}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Unit Price:</span>
                              <div className="font-medium">₹{product.price}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Ordered Quantity:</span>
                              <div className="font-medium">{product.quantity}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                              <div className={`font-medium ${stockStatus.textColor}`}>
                                {stock !== undefined ? stock : "Unknown"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <div className="font-semibold text-lg">₹{product.total}</div>
                            </div>
                          </div>
                        </div>

                        {/* Stock Status Message */}
                        <div className={`mt-3 p-2 rounded text-xs ${stockStatus.bgColor} ${stockStatus.textColor}`}>
                          {stock !== undefined ? (
                            product.quantity <= stock ? (
                              <span>✓ Sufficient stock available ({stock} in stock)</span>
                            ) : (
                              <span>
                                ⚠ Insufficient stock! Need {product.quantity - stock} more items
                              </span>
                            )
                          ) : (
                            <span>⚠ Stock information not available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {showShippingPriceModal && <ShippingPriceModal onClose={() => setShowShippingPriceModal(false)} orderId={orderId} email={order.email} />}
      {showStatusModal && (
        <StatusModal
          onClose={() => {
            setStatus("");
            setShowStatusModal(false);
          }}
          status={status}
        />
      )}
      {showEditModal && <EditOrderModal onClose={() => setShowEditModal(false)} order={currentOrder} />}
    </div>
  );
  // End of order details modal
}

export default function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const { products, loading, error } = useContext(ProductContext);
  const [orderedProducts, setOrderedProducts] = useState({});
  const [singleOrderedProduct, setSingleOrderedProduct] = useState(null);

  // PDF generation function
  const generateOrderPDF = async (order, orderIndex) => {
    try {
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.width = '794px'; // A4 width in pixels at 96 DPI
      pdfContent.style.padding = '40px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.backgroundColor = 'white';
      pdfContent.style.color = 'black';

      // Calculate totals
      const totalQuantity = order.orderedProducts.reduce((sum, product) => sum + product.quantity, 0);
      const formattedDate = formatOrderDate(order.createdAt, orderIndex);

      // Generate HTML content
      pdfContent.innerHTML = `
        <div style="max-width: 714px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-weight: bold; font-size: 24px;">MM</span>
              </div>
              <div style="text-align: left;">
                <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">MOULD MARKET</h1>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">Order Invoice</p>
              </div>
            </div>
          </div>

          <!-- Order Info Grid -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; margin-right: 20px;">
              <h3 style="color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Order Details</h3>
              <p style="margin: 8px 0;"><strong>Order ID:</strong> ${order._id}</p>
              <p style="margin: 8px 0;"><strong>Order Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: ${order.status === 'Completed' ? '#dcfce7' : order.status === 'Pending' ? '#fef3c7' : order.status === 'Rejected' ? '#fecaca' : '#dbeafe'}; color: ${order.status === 'Completed' ? '#166534' : order.status === 'Pending' ? '#92400e' : order.status === 'Rejected' ? '#dc2626' : '#1d4ed8'}; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${order.status}</span></p>
              <p style="margin: 8px 0;"><strong>Total Products:</strong> ${order.orderedProducts.length}</p>
              <p style="margin: 8px 0;"><strong>Total Quantity:</strong> ${totalQuantity}</p>
            </div>
            <div style="flex: 1;">
              <h3 style="color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Customer Information</h3>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${order.user_name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${order.email}</p>
              <p style="margin: 8px 0;"><strong>Phone:</strong> ${order.phone_number}</p>
              <p style="margin: 8px 0;"><strong>WhatsApp:</strong> ${order.whatsapp_number}</p>
              <p style="margin: 8px 0; font-size: 10px; color: #6b7280;"><strong>User ID:</strong> ${order.user_id}</p>
            </div>
          </div>

          <!-- Products Section -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 20px;">Ordered Products</h3>
            ${order.orderedProducts.map((product, index) => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f9fafb;">
                <div style="display: flex; align-items: start;">
                  <div style="width: 80px; height: 80px; margin-right: 20px; flex-shrink: 0;">
                    <img src="${product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEM0NiA0MCA0MCA0NiA0MCA1MFY2MEM0MCA2MCA0NiA2MCA1MCA2MEg2MEM2MCA2MCA2MCA1NCA2MCA1MFY0MEM2MCA0MCA1NCA0MCA1MCA0MEg0MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2Zz4K'}" 
                         alt="${product.product_name}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #d1d5db;" />
                  </div>
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">${product.product_name}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                      <div>
                        ${product.variant_name ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Variant:</strong> ${product.variant_name}</p>` : ''}
                        ${product.size ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Size:</strong> ${product.size}</p>` : ''}
                        <p style="margin: 4px 0; font-size: 14px;"><strong>Unit Price:</strong> ₹{product.price}</p>
                      </div>
                      <div>
                        <p style="margin: 4px 0; font-size: 14px;"><strong>Quantity:</strong> ${product.quantity}</p>
                        <p style="margin: 4px 0; font-size: 16px; color: #059669;"><strong>Total: ₹{product.total}</strong></p>
                      </div>
                    </div>
                    <div style="font-size: 10px; color: #6b7280; background: #f3f4f6; padding: 8px; border-radius: 4px;">
                      <p style="margin: 2px 0;"><strong>Product ID:</strong> ${product.product_id}</p>
                      ${product.variant_id ? `<p style="margin: 2px 0;"><strong>Variant ID:</strong> ${product.variant_id}</p>` : ''}
                      ${product.size_id ? `<p style="margin: 2px 0;"><strong>Size ID:</strong> ${product.size_id}</p>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Total Section -->
          <div style="border-top: 2px solid #3b82f6; padding-top: 20px; margin-bottom: 40px;">
            <div style="text-align: right;">
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block; min-width: 300px;">
                <p style="margin: 8px 0; font-size: 16px;"><strong>Subtotal:</strong> ₹{order.price}</p>
                <p style="margin: 12px 0 0 0; font-size: 20px; color: #059669; border-top: 1px solid #d1d5db; padding-top: 12px;">
                  <strong>Total: ${order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Signature Section -->
          <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 30px;">
            <div style="flex: 1;"></div>
            <div style="text-align: center; min-width: 250px;">
              <div style="border-bottom: 1px solid #374151; margin-bottom: 8px; height: 60px;"></div>
              <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Authorized Signature</strong></p>
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Mould Market</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Generated on ${new Date().toLocaleDateString()} | Mould Market Order Management System</p>
            <p style="color: #6b7280; font-size: 10px; margin: 5px 0 0 0;">Thank you for your business!</p>
          </div>
        </div>
      `;

      // Append to body temporarily
      pdfContent.style.position = 'fixed';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      document.body.appendChild(pdfContent);

      // Wait for images to load
      const images = pdfContent.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve even on error to continue
          }
        });
      });

      await Promise.all(imagePromises);

      // Generate canvas from HTML
      const canvas = await html2canvas(pdfContent, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: pdfContent.scrollHeight
      });

      // Remove temporary div
      document.body.removeChild(pdfContent);

      // Create PDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // If content is too long, split into multiple pages
      const totalHeight = imgHeight * ratio;
      if (totalHeight > pdfHeight) {
        let yOffset = 0;
        let pageNumber = 1;

        while (yOffset < totalHeight) {
          const remainingHeight = totalHeight - yOffset;
          const pageHeight = Math.min(pdfHeight, remainingHeight);
          
          if (pageNumber > 1) {
            pdf.addPage();
          }

          pdf.addImage(
            imgData,
            'PNG',
            imgX,
            -yOffset,
            imgWidth * ratio,
            imgHeight * ratio
          );

          yOffset += pdfHeight;
          pageNumber++;
        }
      } else {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }

      // Save PDF
      pdf.save(`MouldMarket_Order_${order._id.substring(0, 8)}_${formattedDate.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Dummy dates generator for orders without createdAt
  const generateDummyDate = (index) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
    return baseDate.toISOString();
  };

  // Format date function
  const formatOrderDate = (dateString, index) => {
    if (!dateString) {
      dateString = generateDummyDate(index);
    }
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  // Date filter functions
  const isToday = (dateString) => {
    const today = new Date();
    const orderDate = new Date(dateString);
    return today.toDateString() === orderDate.toDateString();
  };

  const isYesterday = (dateString) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const orderDate = new Date(dateString);
    return yesterday.toDateString() === orderDate.toDateString();
  };

  const isSingleDate = (dateString, targetDate) => {
    const orderDate = new Date(dateString);
    const target = new Date(targetDate);
    return orderDate.toDateString() === target.toDateString();
  };

  const isInDateRange = (dateString, startDate, endDate) => {
    const orderDate = new Date(dateString);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return orderDate >= start && orderDate <= end;
  };

  // Excel export function
  const exportToExcel = (data, filename) => {
    const exportData = data.map((order, index) => ({
      'Sr No.': index + 1,
      'Order ID': order._id,
      'User Name': order.user_name,
      'Phone': order.phone_number,
      'WhatsApp': order.whatsapp_number,
      'Email': order.email,
      'Total Price': order.total_price === "Pending" ? "Pending" : `₹${order.total_price}`,
      'Status': order.status,
      'Ordered At': formatOrderDate(order.createdAt, index),
      'User ID': order.user_id,
      'Products': order.orderedProducts.map(p => p.product_name).join(', '),
      'Quantities': order.orderedProducts.map(p => p.quantity).join(', '),
      'Subtotal': `₹${order.price}`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Fetching the orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/order/all", {
          withCredentials: true,
        });

        if (res.status === 200) {
          console.log(res.data.orders);
          const ordersData = Array.isArray(res.data.orders) ? res.data.orders : [];
          setOrders(ordersData);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setIsError("Failed to fetch orders");
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const loadProducts = () => {
      if (!loading) {
        console.log(products);
      }
    };
    loadProducts();
  }, [loading]);

  // Map products to orders
  useEffect(() => {
    const productsMapperWithOrderId = {};
    if (products.length > 0) {
      orders.forEach(order => {
        const p = [];
        order.orderedProducts.forEach(product => {
          p.push(products.filter(prod => prod._id.toString() === product.product_id.toString()));
        });
        productsMapperWithOrderId[order._id] = { products: p };
      });
      setOrderedProducts(productsMapperWithOrderId);
      console.log(productsMapperWithOrderId);
    }
  }, [orders, products]);

  useEffect(() => {
  const socket = io('http://localhost:3000', {
    withCredentials: true,
    auth: { token: localStorage.getItem('token') },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server:', socket.id);
    socket.emit('join', 'admin_room');
  });

  socket.on('newOrder', (newOrder) => {
    console.log('New order received:', newOrder);
    // Validate newOrder
    if (newOrder && newOrder._id && newOrder.orderedProducts && Array.isArray(newOrder.orderedProducts)) {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    } else {
      console.error('Invalid new order received:', newOrder);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  return () => {
    socket.disconnect();
    console.log('Disconnected from Socket.IO server');
  };
}, []);

  // Enhanced filter orders based on search term, status, and date
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const searchableFields = [
          order._id,
          order.user_name,
          order.email,
          order.phone_number,
          order.whatsapp_number,
          order.status,
          ...order.orderedProducts.map((p) => p.product_name),
          ...order.orderedProducts.map((p) => p.variant_name).filter(Boolean),
        ];

        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((order, index) => {
        const orderDate = order.createdAt || generateDummyDate(index);
        
        switch (dateFilter) {
          case 'today':
            return isToday(orderDate);
          case 'yesterday':
            return isYesterday(orderDate);
          case 'single':
            if (singleDate) {
              return isSingleDate(orderDate, singleDate);
            }
            return true;
          case 'custom':
            if (customStartDate && customEndDate) {
              return isInDateRange(orderDate, customStartDate, customEndDate);
            }
            return true;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, customStartDate, customEndDate, singleDate]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, statusFilter, dateFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Calculate stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalOrders,
      pending: statusCounts.Pending || 0,
      accepted: statusCounts.Accepted || 0,
      dispatched: statusCounts.Dispatched || 0,
      rejected: statusCounts.Rejected || 0,
      completed: statusCounts.Completed || 0,
      inProgress: statusCounts["In Progress"] || 0,
    };
  }, [orders]);

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Update local state immediately for better UX
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)),
      );

      // Update selected order if it's currently open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Handle order row click
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setSingleOrderedProduct(orderedProducts[order._id] || null);
    setIsModalOpen(true);
  };

  // Handle accept/reject with backend calls
  const handleAccept = async (e, order) => {
    e.stopPropagation();
    handleStatusChange(order._id, "Accepted");
    setSelectedOrder(order);
    setSingleOrderedProduct(orderedProducts[order._id] || null);
    setIsModalOpen(true);
  };

  const handleReject = async (e, orderId) => {
    e.stopPropagation();
    try {
      const res = await axios.post('http://localhost:3000/api/order/status-change', { status: "Rejected", orderId }, { withCredentials: true });
      if (res.status === 200) {
        handleStatusChange(orderId, "Rejected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Handle download by status
  const handleDownload = (statusType) => {
    let dataToExport = orders;
    let filename = "all_orders";

    switch (statusType) {
      case 'pending':
        dataToExport = orders.filter(order => order.status.toLowerCase() === 'pending');
        filename = "pending_orders";
        break;
      case 'accepted':
        dataToExport = orders.filter(order => order.status.toLowerCase() === 'accepted');
        filename = "accepted_orders";
        break;
      case 'dispatched':
        dataToExport = orders.filter(order => order.status.toLowerCase() === 'dispatched');
        filename = "dispatched_orders";
        break;
      case 'rejected':
        dataToExport = orders.filter(order => order.status.toLowerCase() === 'rejected');
        filename = "rejected_orders";
        break;
      case 'completed':
        dataToExport = orders.filter(order => order.status.toLowerCase() === 'completed');
        filename = "completed_orders";
        break;
      default:
        dataToExport = orders;
        filename = "all_orders";
    }

    exportToExcel(dataToExport, filename);
  };

  // Truncate order ID for display
  const truncateOrderId = (orderId) => {
  if (!orderId || typeof orderId !== 'string') {
    console.warn('Invalid orderId:', orderId);
    return 'Unknown ID';
  }
  if (orderId.length > 12) {
    return `${orderId.substring(0, 12)}...`;
  }
  return orderId;
};
  const getStatusBadge = (status) => {
    const statusStyles = {
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Processing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Shipped': 'bg-blue-100 text-blue-800 border-blue-200',
      'Pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'Accepted': 'bg-green-100 text-green-800 border-green-200',
      'Dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'In Progress': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-gray-100 -800 dark:text-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{isError}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-lg">Loading products and orders...</div>
      </div>
    );
  }

  // Main content starts from here
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Orders Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Manage and track all your orders efficiently</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
              <div className="p-2 bg-blue-200 rounded-full">
                <Package className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <div className="text-sm text-blue-600 font-medium mb-3">Total Orders</div>
            <button
              onClick={() => handleDownload("total")}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="p-2 bg-yellow-200 rounded-full">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
            <div className="text-sm text-yellow-600 font-medium mb-3">Pending</div>
            <button
              onClick={() => handleDownload("pending")}
              className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full hover:bg-yellow-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
              <div className="p-2 bg-green-200 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium mb-3">Accepted</div>
            <button
              onClick={() => handleDownload("accepted")}
              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-blue-700">{stats.dispatched}</div>
              <div className="p-2 bg-blue-200 rounded-full">
                <Truck className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <div className="text-sm text-blue-600 font-medium mb-3">Dispatched</div>
            <button
              onClick={() => handleDownload("dispatched")}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
              <div className="p-2 bg-red-200 rounded-full">
                <XCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
            <div className="text-sm text-red-600 font-medium mb-3">Rejected</div>
            <button
              onClick={() => handleDownload("rejected")}
              className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-purple-700">{stats.completed}</div>
              <div className="p-2 bg-purple-200 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-700" />
              </div>
            </div>
            <div className="text-sm text-purple-600 font-medium mb-3">Completed</div>
            <button
              onClick={() => handleDownload("completed")}
              className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors font-medium"
            >
              <Download className="h-3 w-3 inline mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Table Header - Fixed */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Orders Table</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders, customers, products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-900 border border-gray-300 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="confirm">Confirm</option>
                    <option value="in progress">In Progress</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Date Filter */}
                <div className="flex space-x-2">
                  <div className="relative">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-900 border border-gray-300 rounded-lg px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="single">Single Date</option>
                      <option value="custom">Date Range</option>
                    </select>
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  
                  {dateFilter === 'single' && (
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}

                  {dateFilter === 'custom' && (
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Export Button */}
                <button 
                  onClick={() => exportToExcel(filteredOrders, 'filtered_orders')}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Content - Scrollable */}
          <div className="overflow-y-auto max-h-[600px]">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Sr No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    User Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    WhatsApp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Total Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Ordered At
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                {currentOrders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-blue-600" title={order._id}>{truncateOrderId(order._id)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.whatsapp_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={order.email}>
                        {order.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium">
                        {order.total_price === "Pending" ? "Pending" : `${order.total_price}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatOrderDate(order.createdAt, startIndex + index)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleAccept(e, order)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            order.status === "Accepted" ||
                            !orderedProducts[order._id] ||
                            order.orderedProducts.some((product, idx) => {
                              const stock = getStock(orderedProducts[order._id].products[idx], order.orderedProducts[idx]);
                              return stock === undefined || stock < product.quantity;
                            })
                          }
                          title="Accept Order"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleReject(e, order._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={order.status === "Rejected"}
                          title="Reject Order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateOrderPDF(order, startIndex + index);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show message when no orders */}
          {currentOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No orders found</p>
              {(searchTerm || statusFilter || dateFilter) && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria or filters</p>
              )}
            </div>
          )}

          {/* Table Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                {/* Items per page */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">entries per page</span>
                </div>

                {/* Pagination */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                      let pageNumber;
                      if (totalPages <= 7) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 4) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNumber = totalPages - 6 + index;
                      } else {
                        pageNumber = currentPage - 3 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          onStatusChange={handleStatusChange}
          productMappedWithOrderId={singleOrderedProduct}
        />
      </div>
    </div>
  );
}