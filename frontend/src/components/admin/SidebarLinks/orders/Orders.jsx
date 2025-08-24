"use client"

import { useState, useMemo, useEffect, useContext } from "react"
import { Search, Download, Check, X, XCircle, Clock, Truck, CheckCircle, Eye, User, Package, AlertTriangle } from "lucide-react"

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

// Order Details Modal Component
function OrderDetailsModal({ order, isOpen, onClose, onStatusChange, productMappedWithOrderId }) {
  if (!isOpen || !order) return null

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
    })
  }

  const totalQuantity = order.orderedProducts.reduce((sum, product) => sum + product.quantity, 0)

  // Function to handle status change for backend
  const handleStatusChangeBackend = async (status, orderId) => {
    try {
      const res = await axios.post('http://localhost:3000/api/order/status-change', {status, orderId}, {withCredentials: true}) ;
      if(res.status === 200) {
        console.log("Order status changed successfully");
        setStatus(status);
        setShowStatusModal(true)
      } else {
        console.log("Order status change request cannot be processed")
        }
    } catch(error) {
      console.log(error);
    }
  }

  // Function that will handle the editing of the order:
  const handleEdit = async (order) => {
    setCurrentOrder(order);
    setShowEditModal(true);
    // try {
    //   const res = await axios.post('http://localhost:3000/api/order/edit-order', order, {withCredentials: true});

    //   // if(res.status === 200) {
    //   //   console.log("dited successfully");
    //   // } else {
    //   //   console.log("Cannot edit");
    //   // }
    // } catch(error) {
    //   console.log(error);
    // }
  }

  // Function to check stock status and return appropriate styling
  const getStockStatus = (orderedQuantity, currentStock) => {
    if (currentStock === undefined || currentStock === null) {
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        status: "Unknown Stock",
        icon: AlertTriangle,
      }
    }

    if (orderedQuantity <= currentStock) {
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        status: "In Stock",
        icon: Check,
      }
    } else {
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        status: "Low Stock",
        icon: X,
      }
    }
  }

  const getStock = (details, variantAndSizeDetails) => {
    // const stocks = [];
    console.log(details);
    console.log("From get stock")
    
    for (const detail of details) {
        if(detail.hasVariants) {
            console.log("It has variants")
            variantLoop: for (const variant of detail.variants) {
                moreDetailLoop: for (const moreDetail of variant.moreDetails) {
                    if(moreDetail.size._id.toString() === variantAndSizeDetails.size_id.toString()) {
                        // stocks.push(moreDetail.stock);
                        return moreDetail.stock
                        // break variantLoop; 
                    }
                }
            }
            console.log(variantAndSizeDetails)
        } else {
            console.log("It does not have variants")
            // stocks.push(detail.stock);
            return detail.stock;
            // break;
        }
    }
    console.log(stocks);
    // return stocks;
}

  // Start of order details modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">Order ID: {order._id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Order Status and Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
                >
                  {/* <StatusIcon className="h-4 w-4 mr-2" /> */}
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
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={order.status === "Accepted"}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </button>
              <button
                onClick={
                  () => {
                    onStatusChange(order._id, "Rejected")
                    handleStatusChangeBackend("Rejected", order._id);
                  }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={order.status === "Rejected"}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={
                  () => {
                    onStatusChange(order._id, "Rejected")
                    handleStatusChangeBackend("Confirm", order._id);
                  }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={order.status === "Rejected"}
              >
                <X className="h-4 w-4 mr-2" />
                Confirm
              </button>
              <button
                onClick={() => onStatusChange(order._id, "In Progress")}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                disabled={order.status === "In Progress"}
              >
                <Clock className="h-4 w-4 mr-2" />
                In Progress
              </button>
              <button
                onClick={() => {
                  onStatusChange(order._id, "Dispatched");
                  handleStatusChangeBackend("Dispatched", order._id)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={order.status === "Completed"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </button>
              <button
                onClick={() => {
                  handleEdit(order)
                  setOrderId(order._id);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{order.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-medium text-xs">{order.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{order.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium">{order.whatsapp_number}</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-xs">{order._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Products:</span>
                  <span className="font-medium">{order.orderedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${order.price}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {order.total_price === "Pending" ? "Pending" : `$${order.total_price}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Ordered Products</h3>
            </div>
            <div className="space-y-4">
              {order.orderedProducts.map((product, index) => {
                const stock = getStock(productMappedWithOrderId[order._id].products[index], order.orderedProducts[index])
                const stockStatus = getStockStatus(product.quantity, stock)
                const StockIcon = stockStatus.icon

                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${stockStatus.bgColor} border-gray-200`}>
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
                              <span className="text-gray-600">Product ID:</span>
                              <div className="font-medium text-xs break-all">{product.product_id}</div>
                            </div>
                            {product.variant_id && (
                              <div>
                                <span className="text-gray-600">Variant ID:</span>
                                <div className="font-medium text-xs break-all">{product.variant_id}</div>
                              </div>
                            )}
                            {product.size_id && (
                              <div>
                                <span className="text-gray-600">Size ID:</span>
                                <div className="font-medium text-xs break-all">{product.size_id}</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {product.variant_name && (
                              <div>
                                <span className="text-gray-600">Variant:</span>
                                <div className="font-medium">{product.variant_name}</div>
                              </div>
                            )}
                            {product.size && (
                              <div>
                                <span className="text-gray-600">Size:</span>
                                <div className="font-medium">{product.size}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Unit Price:</span>
                              <div className="font-medium">${product.price}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-600">Ordered Quantity:</span>
                              <div className="font-medium">{product.quantity}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Current Stock:</span>
                              <div className={`font-medium ${stockStatus.textColor}`}>
                                {stock !== undefined ? stock : "Unknown"}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <div className="font-semibold text-lg">${product.total}</div>
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
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
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
      {showStatusModal && <StatusModal onClose={() => {
        setStatus("");
        setShowStatusModal(false);
      }} status={status} />}
      {showEditModal && <EditOrderModal onClose={() => setShowEditModal(false)} order={currentOrder} />}
    </div>

  )
  // End of order details modal
}

export default function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {products, loading, error} = useContext(ProductContext);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const [singleOrderedProduct, setSingleOrderedProduct] = useState(null);

  // Fetching the orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/order/all", {
          withCredentials: true,
        })

        if (res.status === 200) {
          console.log(res.data.orders)
          const ordersData = Array.isArray(res.data.orders) ? res.data.orders : []
          setOrders(ordersData)
        }
      } catch (isError) {
        console.isError("isError fetching orders:", isError)
        setIsError("Failed to fetch orders")
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  useEffect(() => {
  const loadProducts = () => {
    if(!loading) {
    console.log(products);
    }
  }
  loadProducts();
  }, [loading])

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    return orders.filter((order) => {
      const searchableFields = [
        order._id,
        order.user_name,
        order.email,
        order.phone_number,
        order.whatsapp_number,
        order.status,
        ...order.orderedProducts.map((p) => p.product_name),
        ...order.orderedProducts.map((p) => p.variant_name).filter(Boolean),
      ]

      return searchableFields.some(
        (field) => field && field.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      )
    })
  }, [orders, searchTerm])

  useEffect(() => {
    const productsMapperWithOrderId = [];
    if(products.length > 0) {
    orders.forEach(order => {
      const p = [];
      order.orderedProducts.forEach(product => {
        p.push(products.filter(prod => prod._id.toString() === product.product_id.toString()))
      })
      const item = {};
      item[order._id] = {}
      item[order._id]["products"] = p
      productsMapperWithOrderId.push(item)
    })
    setOrderedProducts(productsMapperWithOrderId)
    console.log(productsMapperWithOrderId);
  }
  }, [orders, products])
  

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  // Calculate stats
  const stats = useMemo(() => {
    const totalOrders = orders.length
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    return {
      total: totalOrders,
      pending: statusCounts.Pending || 0,
      accepted: statusCounts.Accepted || 0,
      dispatched: statusCounts.Dispatched || 0,
      rejected: statusCounts.Rejected || 0,
      completed: statusCounts.Completed || 0,
      inProgress: statusCounts["In Progress"] || 0,
    }
  }, [orders])

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Update local state immediately for better UX
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order)),
      )

      // Update selected order if it's currently open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
      }

      // Here you would make an API call to update the status on the server
      // await axios.put(`http://localhost:3000/api/order/${orderId}/status`, { status: newStatus })
    } catch (isError) {
      console.isError("isError updating order status:", isError)
      // Revert the change if API call fails
      // You might want to show an isError message to the user
    }
  }

  // Handle order row click
  const handleOrderClick = (order, orderedProduct) => {
    setSelectedOrder(order)
    setSingleOrderedProduct(orderedProduct);
    setIsModalOpen(true)
  }

  // Handle download (placeholder function)
  const handleDownload = (type) => {
    console.log(`DownisLoading ${type} data...`)
    // Implement actual download logic here
  }

  // Truncate order ID for display
  const truncateOrderId = (orderId) => {
    if (orderId.length > 12) {
      return `${orderId.substring(0, 12)}...`
    }
    return orderId
  }

  // Tailwind classes
  const cardClass = "bg-white rounded-xl shadow-lg p-6 border border-gray-100"
  const buttonClass =
    "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200"
  const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-700`
  const successButtonClass = `${buttonClass} bg-green-600 text-white hover:bg-green-700`
  const dangerButtonClass = `${buttonClass} bg-red-600 text-white hover:bg-red-700`

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{isError}</span>
        </div>
      </div>
    )
  }

  if(error) {
     return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if(loading) {
  return <p>Loading products and orders</p>
  }

  // Main content starts from here
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders Management</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600 mb-3">Total Orders</div>
          <button
            onClick={() => handleDownload("total")}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600 mb-3">Pending</div>
          <button
            onClick={() => handleDownload("pending")}
            className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-sm text-gray-600 mb-3">Accepted</div>
          <button
            onClick={() => handleDownload("accepted")}
            className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-blue-600">{stats.dispatched}</div>
          <div className="text-sm text-gray-600 mb-3">Dispatched</div>
          <button
            onClick={() => handleDownload("dispatched")}
            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600 mb-3">Rejected</div>
          <button
            onClick={() => handleDownload("rejected")}
            className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
          <div className="text-sm text-gray-600 mb-3">Completed</div>
          <button
            onClick={() => handleDownload("completed")}
            className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
          >
            <Download className="h-3 w-3 inline mr-1" />
            Download
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`${cardClass} mb-6`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search orders by order ID, user name, email, phone, etc..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order, index) => {
                const StatusIcon = statusIcons[order.status]

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order, orderedProducts[index])}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600" title={order._id}>
                      {truncateOrderId(order._id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.whatsapp_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {order.total_price === "Pending" ? "Pending" : `$${order.total_price}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                      >
                        {/* <StatusIcon className="h-3 w-3 mr-1" /> */}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrderClick(order, orderedProducts[index])
                          }}
                          className={`${primaryButtonClass} text-xs`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order._id, "Accepted")
                          }}
                          className={`${successButtonClass} text-xs`}
                          disabled={order.status === "Accepted"}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(order._id, "Rejected")
                          }}
                          className={`${dangerButtonClass} text-xs`}
                          disabled={order.status === "Rejected"}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Show message when no orders */}
        {currentOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found</p>
            {searchTerm && <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> of{" "}
                  <span className="font-medium">{filteredOrders.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 10))].map((_, i) => {
                    let pageNumber
                    if (totalPages <= 10) {
                      pageNumber = i + 1
                    } else {
                      const start = Math.max(1, currentPage - 5)
                      const end = Math.min(totalPages, start + 9)
                      pageNumber = start + i
                      if (pageNumber > end) return null
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
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
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
        onStatusChange={handleStatusChange}
        productMappedWithOrderId={singleOrderedProduct}
      />
    </div>
  )
  // End of main content
}