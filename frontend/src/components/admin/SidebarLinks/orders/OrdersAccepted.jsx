"use client"

import { useState } from "react"

// Mock data for accepted orders
const mockAcceptedOrders = [
  {
    id: "ORD-2024-001",
    customer: {
      name: "John Doe",
      email: "john.doe@company.com",
      phone: "+1 (555) 123-4567",
      avatar: null,
    },
    productId: "PRD-001",
    productName: "Wireless Bluetooth Headphones",
    total: 1299.99,
    acceptedDate: "2024-01-15T10:30:00Z",
    deliveryDate: "2024-01-20T14:00:00Z",
    orderNumber: "#ORD-2024-001",
    paymentMethod: "Credit Card",
    shippingAddress: "123 Main St, New York, NY 10001",
    trackingNumber: "TRK123456789",
    productDetails: {
      id: "PRD-001",
      name: "Wireless Bluetooth Headphones",
      description: "Premium quality wireless headphones with noise cancellation",
      price: 1299.99,
      category: "Electronics",
      brand: "TechPro",
      sku: "TP-WBH-001",
      inStock: 45,
    },
  },
  {
    id: "ORD-2024-002",
    customer: {
      name: "Sarah Wilson",
      email: "sarah.wilson@enterprise.com",
      phone: "+1 (555) 987-6543",
      avatar: null,
    },
    productId: "PRD-002",
    productName: "Smart Fitness Watch",
    total: 899.99,
    acceptedDate: "2024-01-14T14:22:00Z",
    deliveryDate: "2024-01-19T16:30:00Z",
    orderNumber: "#ORD-2024-002",
    paymentMethod: "PayPal",
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
    trackingNumber: "TRK987654321",
    productDetails: {
      id: "PRD-002",
      name: "Smart Fitness Watch",
      description: "Advanced fitness tracking with heart rate monitor",
      price: 899.99,
      category: "Wearables",
      brand: "FitTech",
      sku: "FT-SFW-002",
      inStock: 23,
    },
  },
  {
    id: "ORD-2024-003",
    customer: {
      name: "Michael Johnson",
      email: "m.johnson@corporation.com",
      phone: "+1 (555) 456-7890",
      avatar: null,
    },
    productId: "PRD-003",
    productName: "Gaming Mechanical Keyboard",
    total: 2549.99,
    acceptedDate: "2024-01-13T09:15:00Z",
    deliveryDate: "2024-01-18T11:45:00Z",
    orderNumber: "#ORD-2024-003",
    paymentMethod: "Credit Card",
    shippingAddress: "789 Pine St, Chicago, IL 60601",
    trackingNumber: "TRK456789123",
    productDetails: {
      id: "PRD-003",
      name: "Gaming Mechanical Keyboard",
      description: "RGB backlit mechanical keyboard for gaming",
      price: 2549.99,
      category: "Gaming",
      brand: "GamePro",
      sku: "GP-GMK-003",
      inStock: 12,
    },
  },
]

// Function to get initials from name
const getInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2)
}

// Function to generate consistent color based on name
const getAvatarColor = (name) => {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-green-500",
  ]
  const index = name.length % colors.length
  return colors[index]
}

const OrdersAccepted = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Calculate statistics
  const stats = {
    total: mockAcceptedOrders.length,
    totalRevenue: mockAcceptedOrders.reduce((sum, order) => sum + order.total, 0),
    avgOrderValue: mockAcceptedOrders.reduce((sum, order) => sum + order.total, 0) / mockAcceptedOrders.length,
    todayOrders: mockAcceptedOrders.filter(
      (order) => new Date(order.acceptedDate).toDateString() === new Date().toDateString(),
    ).length,
  }

  // Filter orders
  const filteredOrders = mockAcceptedOrders.filter((order) => {
    const matchesSearch =
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate("main")}
                className="inline-flex items-center px-3 py-2 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Accepted Orders
                </h1>
                <p className="mt-1 text-sm text-emerald-600">Successfully processed and confirmed orders</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-emerald-300 rounded-lg shadow-sm text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Report
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-600 truncate">Total Accepted</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-600 truncate">Total Revenue</dt>
                  <dd className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-600 truncate">Avg Order Value</dt>
                  <dd className="text-2xl font-bold text-gray-900">${stats.avgOrderValue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-600 truncate">Today's Orders</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.todayOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search accepted orders, customers, tracking numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-3 py-3 border border-emerald-300 rounded-xl leading-5 bg-white/50 placeholder-emerald-400 text-gray-900 sm:text-sm backdrop-blur-sm"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-3 text-base border border-emerald-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl bg-white/50 backdrop-blur-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order)}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(order.customer.name)}`}
                  >
                    {getInitials(order.customer.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {order.customer.name}
                    </h3>
                    <p className="text-sm text-emerald-600">{order.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5"></div>
                    Accepted
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Product</p>
                  <p className="text-sm text-gray-900 truncate" title={order.productName}>
                    {order.productName}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="text-lg font-bold text-emerald-600">${order.total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Accepted Date</p>
                    <p className="text-sm text-gray-900">{formatDate(order.acceptedDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                  <p className="text-sm text-emerald-600 font-mono">{order.trackingNumber}</p>
                </div>

                <div className="pt-3 border-t border-emerald-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Expected Delivery</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(order.deliveryDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-12 max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-emerald-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accepted orders found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search criteria.</p>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 px-6 py-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-lg text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-lg text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-emerald-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> of{" "}
                  <span className="font-medium">{filteredOrders.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-emerald-300 bg-white text-sm font-medium text-emerald-500 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-emerald-300 bg-white text-sm font-medium text-emerald-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-emerald-300 bg-white text-sm font-medium text-emerald-500 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.productName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg font-semibold">
                        ${selectedOrder.total.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{selectedOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                      <p className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg font-mono">
                        {selectedOrder.trackingNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedOrder.shippingAddress}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accepted Date</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                      {formatDate(selectedOrder.acceptedDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                      {formatDate(selectedOrder.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all duration-200">
                  Track Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersAccepted;
