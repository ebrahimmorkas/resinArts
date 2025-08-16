"use client"

import { useState, useMemo } from "react"
import { Search, Download, Check, X, Clock, Truck, CheckCircle } from "lucide-react"

// Mock data for orders
const mockOrders = [
  {
    id: 1,
    orderId: "ORD-2024-001",
    userId: "USR-001",
    userName: "John Doe",
    productId: "PRD-001",
    productName: "Wireless Headphones",
    variantId: "VAR-001",
    sizeId: "SIZE-001",
    phone: "+1234567890",
    whatsapp: "+1234567890",
    email: "john.doe@email.com",
    color: "Black",
    size: "Medium",
    quantity: 2,
    currentStock: 15,
    totalPrice: 299.98,
    category: "Electronics",
    subCategory: "Audio",
    status: "accepted",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 2,
    orderId: "ORD-2024-002",
    userId: "USR-002",
    userName: "Jane Smith",
    productId: "PRD-002",
    productName: "Cotton T-Shirt",
    variantId: "VAR-002",
    sizeId: "SIZE-002",
    phone: "+1234567891",
    whatsapp: "+1234567891",
    email: "jane.smith@email.com",
    color: "Blue",
    size: "Large",
    quantity: 1,
    currentStock: 8,
    totalPrice: 29.99,
    category: "Clothing",
    subCategory: "T-Shirts",
    status: "dispatched",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 3,
    orderId: "ORD-2024-003",
    userId: "USR-003",
    userName: "Mike Johnson",
    productId: "PRD-003",
    productName: "Gaming Mouse",
    variantId: "VAR-003",
    sizeId: "SIZE-003",
    phone: "+1234567892",
    whatsapp: "+1234567892",
    email: "mike.johnson@email.com",
    color: "Red",
    size: "One Size",
    quantity: 1,
    currentStock: 25,
    totalPrice: 79.99,
    category: "Electronics",
    subCategory: "Computer Accessories",
    status: "rejected",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 4,
    orderId: "ORD-2024-004",
    userId: "USR-004",
    userName: "Sarah Wilson",
    productId: "PRD-004",
    productName: "Yoga Mat",
    variantId: "VAR-004",
    sizeId: "SIZE-004",
    phone: "+1234567893",
    whatsapp: "+1234567893",
    email: "sarah.wilson@email.com",
    color: "Purple",
    size: "Standard",
    quantity: 1,
    currentStock: 12,
    totalPrice: 49.99,
    category: "Sports",
    subCategory: "Fitness",
    status: "completed",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 5,
    orderId: "ORD-2024-005",
    userId: "USR-005",
    userName: "David Brown",
    productId: "PRD-005",
    productName: "Coffee Mug",
    variantId: "VAR-005",
    sizeId: "SIZE-005",
    phone: "+1234567894",
    whatsapp: "+1234567894",
    email: "david.brown@email.com",
    color: "White",
    size: "350ml",
    quantity: 3,
    currentStock: 30,
    totalPrice: 44.97,
    category: "Home & Kitchen",
    subCategory: "Drinkware",
    status: "In progress",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 6,
    orderId: "ORD-2024-006",
    userId: "USR-006",
    userName: "Emily Davis",
    productId: "PRD-006",
    productName: "Smartphone Case",
    variantId: "VAR-006",
    sizeId: "SIZE-006",
    phone: "+1234567895",
    whatsapp: "+1234567895",
    email: "emily.davis@email.com",
    color: "Clear",
    size: "iPhone 14",
    quantity: 2,
    currentStock: 18,
    totalPrice: 39.98,
    category: "Electronics",
    subCategory: "Phone Accessories",
    status: "accepted",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 7,
    orderId: "ORD-2024-007",
    userId: "USR-007",
    userName: "Robert Miller",
    productId: "PRD-007",
    productName: "Running Shoes",
    variantId: "VAR-007",
    sizeId: "SIZE-007",
    phone: "+1234567896",
    whatsapp: "+1234567896",
    email: "robert.miller@email.com",
    color: "Black/White",
    size: "US 10",
    quantity: 1,
    currentStock: 5,
    totalPrice: 129.99,
    category: "Footwear",
    subCategory: "Athletic Shoes",
    status: "dispatched",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 8,
    orderId: "ORD-2024-008",
    userId: "USR-008",
    userName: "Lisa Anderson",
    productId: "PRD-008",
    productName: "Desk Lamp",
    variantId: "VAR-008",
    sizeId: "SIZE-008",
    phone: "+1234567897",
    whatsapp: "+1234567897",
    email: "lisa.anderson@email.com",
    color: "Silver",
    size: "Adjustable",
    quantity: 1,
    currentStock: 7,
    totalPrice: 89.99,
    category: "Home & Office",
    subCategory: "Lighting",
    status: "In progress",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 9,
    orderId: "ORD-2024-009",
    userId: "USR-009",
    userName: "Chris Taylor",
    productId: "PRD-009",
    productName: "Backpack",
    variantId: "VAR-009",
    sizeId: "SIZE-009",
    phone: "+1234567898",
    whatsapp: "+1234567898",
    email: "chris.taylor@email.com",
    color: "Navy Blue",
    size: "25L",
    quantity: 1,
    currentStock: 20,
    totalPrice: 69.99,
    category: "Bags",
    subCategory: "Backpacks",
    status: "completed",
    image: "/placeholder.svg?height=50&width=50",
  },
  {
    id: 10,
    orderId: "ORD-2024-010",
    userId: "USR-010",
    userName: "Amanda White",
    productId: "PRD-010",
    productName: "Water Bottle",
    variantId: "VAR-010",
    sizeId: "SIZE-010",
    phone: "+1234567899",
    whatsapp: "+1234567899",
    email: "amanda.white@email.com",
    color: "Stainless Steel",
    size: "500ml",
    quantity: 2,
    currentStock: 35,
    totalPrice: 59.98,
    category: "Sports",
    subCategory: "Hydration",
    status: "rejected",
    image: "/placeholder.svg?height=50&width=50",
  },
]

const statusColors = {
  accepted: "bg-green-100 text-green-800",
  dispatched: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-purple-100 text-purple-800",
  "In progress": "bg-yellow-100 text-yellow-800",
}

const statusIcons = {
  accepted: Check,
  dispatched: Truck,
  rejected: X,
  completed: CheckCircle,
  "In progress": Clock,
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [orders, setOrders] = useState(mockOrders)

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders

    return orders.filter((order) =>
      Object.values(order).some((value) => value.toString().toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [orders, searchTerm])

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
      accepted: statusCounts.accepted || 0,
      dispatched: statusCounts.dispatched || 0,
      rejected: statusCounts.rejected || 0,
      completed: statusCounts.completed || 0,
      inProgress: statusCounts["In progress"] || 0,
    }
  }, [orders])

  // Handle status change
  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
    )
  }

  // Handle download (placeholder function)
  const handleDownload = (type) => {
    console.log(`Downloading ${type} data...`)
    // Implement actual download logic here
  }

  // Tailwind classes
  const cardClass = "bg-white rounded-xl shadow-lg p-6 border border-gray-100"
  const buttonClass =
    "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200"
  const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:bg-blue-700`
  const successButtonClass = `${buttonClass} bg-green-600 text-white hover:bg-green-700`
  const dangerButtonClass = `${buttonClass} bg-red-600 text-white hover:bg-red-700`
  const warningButtonClass = `${buttonClass} bg-yellow-600 text-white hover:bg-yellow-700`

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

        <div className={`${cardClass} text-center`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600 mb-3">In Progress</div>
          <button
            onClick={() => handleDownload("inProgress")}
            className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100 transition-colors"
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
            placeholder="Search orders by order ID, user name, product name, email, phone, etc..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page when searching
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
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size ID
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
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Category
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
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={order.image || "/placeholder.svg"}
                        alt={order.productName}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.variantId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.sizeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.whatsapp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.subCategory}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(order.id, "accepted")}
                          className={`${successButtonClass} text-xs`}
                          disabled={order.status === "accepted"}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "rejected")}
                          className={`${dangerButtonClass} text-xs`}
                          disabled={order.status === "rejected"}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "In progress")}
                          className={`${warningButtonClass} text-xs`}
                          disabled={order.status === "In progress"}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          On Hold
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
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
      </div>
    </div>
  )
}
