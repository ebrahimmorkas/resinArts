"use client"

import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react"
import {useParams} from "react-router-dom";
import axios from 'axios';

// Mock orders data with updated status system
const mockOrders = [
  {
    id: "ORD-2024-001",
    date: "2024-01-15",
    items: [
      {
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 150,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop",
      },
      {
        name: "Smart Fitness Watch",
        quantity: 1,
        price: 100,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 250,
    shippingPrice: 15,
    total: 265,
    status: "delivered",
    trackingNumber: "ORD-2024-001",
    estimatedDelivery: "2024-01-18",
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-002",
    date: "2024-01-20",
    items: [
      {
        name: "Organic Cotton T-Shirt",
        quantity: 2,
        price: 25,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 50,
    shippingPrice: 10,
    total: 60,
    status: "shipped",
    trackingNumber: "ORD-2024-002",
    estimatedDelivery: "2024-01-25",
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-003",
    date: "2024-01-22",
    items: [
      {
        name: "Professional Camera Lens",
        quantity: 1,
        price: 299,
        image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=60&h=60&fit=crop",
      },
      {
        name: "Luxury Leather Wallet",
        quantity: 1,
        price: 80,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 379,
    shippingPrice: 18,
    total: 397,
    status: "processing",
    trackingNumber: "ORD-2024-003",
    estimatedDelivery: "2024-01-28",
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-004",
    date: "2024-01-25",
    items: [
      {
        name: "Gaming Mechanical Keyboard",
        quantity: 1,
        price: 120,
        image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 120,
    shippingPrice: 0,
    total: 120,
    status: "cancelled",
    trackingNumber: "ORD-2024-004",
    estimatedDelivery: null,
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentStatus: "refunded",
  },
  {
    id: "ORD-2024-005",
    date: "2024-01-28",
    items: [
      {
        name: "Wireless Bluetooth Speaker",
        quantity: 1,
        price: 75,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=60&h=60&fit=crop",
      },
      {
        name: "Designer Sunglasses",
        quantity: 1,
        price: 120,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 195,
    shippingPrice: "pending",
    total: "pending",
    status: "pending",
    trackingNumber: "ORD-2024-005",
    estimatedDelivery: "2024-02-02",
    shippingAddress: "123 Main St, New York, NY 10001",
    paymentStatus: "pending",
  },
  {
    id: "ORD-2024-006",
    date: "2024-01-30",
    items: [
      {
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 150,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 150,
    shippingPrice: 12,
    total: 162,
    status: "confirmed",
    trackingNumber: "ORD-2024-006",
    estimatedDelivery: "2024-02-03",
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-007",
    date: "2024-02-01",
    items: [
      {
        name: "Smart Fitness Watch",
        quantity: 1,
        price: 100,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop",
      },
      {
        name: "Organic Cotton T-Shirt",
        quantity: 3,
        price: 25,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 175,
    shippingPrice: 12,
    total: 187,
    status: "accepted",
    trackingNumber: "ORD-2024-007",
    estimatedDelivery: "2024-02-04",
    shippingAddress: "789 Pine St, Chicago, IL 60601",
    paymentStatus: "pending",
  },
  {
    id: "ORD-2024-008",
    date: "2024-02-03",
    items: [
      {
        name: "Professional Camera Lens",
        quantity: 1,
        price: 299,
        image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 299,
    shippingPrice: 0,
    total: 299,
    status: "rejected",
    trackingNumber: "ORD-2024-008",
    estimatedDelivery: null,
    shippingAddress: "321 Elm St, Miami, FL 33101",
    paymentStatus: "pending",
  },
  {
    id: "ORD-2024-009",
    date: "2024-02-05",
    items: [
      {
        name: "Luxury Leather Wallet",
        quantity: 1,
        price: 80,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 80,
    shippingPrice: 8,
    total: 88,
    status: "returned",
    trackingNumber: "ORD-2024-009",
    estimatedDelivery: null,
    shippingAddress: "555 Maple Dr, Seattle, WA 98101",
    paymentStatus: "refund_pending",
  },
  {
    id: "ORD-2024-010",
    date: "2024-02-07",
    items: [
      {
        name: "Gaming Mechanical Keyboard",
        quantity: 1,
        price: 120,
        image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 120,
    shippingPrice: 15,
    total: 135,
    status: "completed",
    trackingNumber: "ORD-2024-010",
    estimatedDelivery: null,
    shippingAddress: "777 Cedar St, Boston, MA 02101",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-011",
    date: "2024-02-08",
    items: [
      {
        name: "Wireless Mouse",
        quantity: 1,
        price: 45,
        image: "https://images.unsplash.com/photo-1527864550417-724758594e93?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 45,
    shippingPrice: "pending",
    total: "pending",
    status: "pending",
    trackingNumber: "ORD-2024-011",
    estimatedDelivery: "2024-02-12",
    shippingAddress: "999 Broadway, New York, NY 10001",
    paymentStatus: "pending",
  },
  {
    id: "ORD-2024-012",
    date: "2024-02-09",
    items: [
      {
        name: "Bluetooth Earbuds",
        quantity: 1,
        price: 89,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=60&h=60&fit=crop",
      },
    ],
    itemsTotal: 89,
    shippingPrice: 0,
    total: 89,
    status: "rejected",
    trackingNumber: "ORD-2024-012",
    estimatedDelivery: null,
    shippingAddress: "456 Tech Ave, San Francisco, CA 94102",
    paymentStatus: "pending",
  },
]

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle2,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: CheckCircle,
  },
  processing: {
    label: "Processing",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
  },
  returned: {
    label: "Returned",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: RotateCcw,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
}

const paymentStatusConfig = {
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  pending: {
    label: "Payment Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  refunded: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  refund_pending: {
    label: "Refund Pending",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
}

// Default ongoing statuses
const ongoingStatuses = ["pending", "accepted", "confirmed", "processing", "shipped", "delivered"]

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ongoing")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const ordersPerPage = 5
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orders, setOrders] = useState(null);
  const {userId} = useParams();

  useEffect(() => {
    // Check whether the user exists or not 
    const fetchOrders = async () => {
      // console.log(userId);
      try {
        const res = await axios.post('http://localhost:3000/api/user/find-user', {userId}, {withCredentials: true});
        if(res.status === 200) {
          setOrders(res.data.orders);
        }
      } catch(error) {
        console.log("Error " + error);
      }
    };
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    console.log(orders);
    setLoadingOrders(false);
  }, [orders])

  // Filter orders based on search and status
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

    let matchesStatus = true
    if (statusFilter === "ongoing") {
      matchesStatus = ongoingStatuses.includes(order.status)
    } else if (statusFilter !== "all") {
      matchesStatus = order.status === statusFilter
    }

    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter
    return matchesSearch && matchesStatus && matchesPayment
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage)

  const downloadInvoice = async (order, e) => {
    e.stopPropagation()

    // Create invoice content using jsPDF
    const doc = new jsPDF()

    // Company Logo and Header
    doc.setFontSize(24)
    doc.setFont(undefined, "bold")
    doc.text("OULA MARKET", 20, 30)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("Email: support@oulamarket.com", 20, 40)
    doc.text("Phone: +1 (555) 123-4567", 20, 45)
    doc.text("WhatsApp: +1 (555) 987-6543", 20, 50)
    doc.text("Address: 123 Business Ave, Commerce City, CC 12345", 20, 55)

    // Invoice Header
    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("INVOICE", 150, 30)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Invoice #: ${order.id}`, 150, 40)
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 150, 45)
    doc.text(`Status: ${statusConfig[order.status].label}`, 150, 50)
    doc.text(`Payment: ${paymentStatusConfig[getPaymentStatus(order)].label}`, 150, 55)

    // Customer Information
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("BILL TO:", 20, 75)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(order.shippingAddress, 20, 85)

    // Items Header
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("ITEMS:", 20, 105)

    // Table Headers
    doc.setFontSize(9)
    doc.setFont(undefined, "bold")
    doc.text("Item", 20, 115)
    doc.text("Qty", 120, 115)
    doc.text("Price", 140, 115)
    doc.text("Total", 170, 115)

    // Draw line under headers
    doc.line(20, 118, 190, 118)

    // Items List
    let yPosition = 125
    doc.setFont(undefined, "normal")

    order.items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity

      doc.text(item.name, 20, yPosition)
      doc.text(item.quantity.toString(), 120, yPosition)
      doc.text(`$${item.price}`, 140, yPosition)
      doc.text(`$${itemTotal}`, 170, yPosition)

      yPosition += 8
    })

    // Totals Section
    yPosition += 10
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    doc.setFont(undefined, "normal")
    doc.text(`Items Subtotal:`, 120, yPosition)
    doc.text(`$${order.itemsTotal}`, 170, yPosition)
    yPosition += 8

    if (order.shippingPrice === "pending") {
      doc.text(`Shipping:`, 120, yPosition)
      doc.text(`Pending`, 170, yPosition)
    } else {
      doc.text(`Shipping:`, 120, yPosition)
      doc.text(`$${order.shippingPrice}`, 170, yPosition)
    }
    yPosition += 8

    doc.setFont(undefined, "bold")
    doc.setFontSize(12)
    if (order.total === "pending") {
      doc.text(`TOTAL:`, 120, yPosition)
      doc.text(`Pending`, 170, yPosition)
    } else {
      doc.text(`TOTAL:`, 120, yPosition)
      doc.text(`$${order.total}`, 170, yPosition)
    }

    // Footer
    yPosition += 20
    doc.setFontSize(8)
    doc.setFont(undefined, "normal")
    doc.text("Thank you for your business!", 20, yPosition)
    doc.text("For support, contact us at support@oulamarket.com", 20, yPosition + 5)

    // Save the PDF
    doc.save(`invoice-${order.id}.pdf`)
  }

  const getPaymentStatus = (order) => {
    if (order.status === "returned") {
      return order.paymentStatus === "refund_pending" ? "refund_pending" : "refunded"
    }
    if (order.status === "pending" || order.status === "accepted" || order.status === "rejected") {
      return "pending"
    }
    return "paid"
  }

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status]
    const IconComponent = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const PaymentStatusBadge = ({ order }) => {
    const paymentStatus = getPaymentStatus(order)
    const config = paymentStatusConfig[paymentStatus]

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                <p className="text-gray-600">{order.id}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Total:</span>
                      <span className="font-semibold">${order.itemsTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-semibold">
                        {order.shippingPrice === "pending" ? (
                          <span className="text-yellow-600">Pending</span>
                        ) : (
                          `$${order.shippingPrice}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">
                        {order.total === "pending" ? (
                          <span className="text-yellow-600">Pending</span>
                        ) : (
                          `$${order.total}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <PaymentStatusBadge order={order} />
                    </div>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Tracking</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking Number:</span>
                        <span className="font-mono">{order.trackingNumber}</span>
                      </div>
                      {order.estimatedDelivery && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Delivery:</span>
                          <span>{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600">{order.shippingAddress}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price * item.quantity}</p>
                      <p className="text-sm text-gray-600">${item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <button
                onClick={(e) => downloadInvoice(order, e)}
                disabled={order.status === "pending" || order.status === "rejected"}
                className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md transition-colors ${
                  order.status === "pending" || order.status === "rejected"
                    ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                {order.status === "pending" || order.status === "rejected" ? "Invoice Unavailable" : "Download Invoice"}
              </button>
              <div className="text-right">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600 ml-2">
                  {order.total === "pending" ? "Pending" : `$${order.total}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <p className="text-gray-600">Track and manage your orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ShoppingBag className="w-4 h-4" />
              <span>{filteredOrders.length} orders found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 w-full">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders by ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="ongoing">Ongoing Orders</option>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                  <option value="returned">Returned</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Payment Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Payment Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="refund_pending">Refund Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipping
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              {loadingOrders ? (<div>Loading Your Orders</div>) : (
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        {order.trackingNumber && (
                          <div className="text-xs text-gray-500 font-mono">{order.trackingNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <img
                              key={index}
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-8 h-8 rounded-full border-2 border-white object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=32&width=32"
                              }}
                            />
                          ))}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.items.length} item{order.items.length > 1 ? "s" : ""}
                          </div>
                          <div className="text-gray-500 truncate max-w-32">
                            {order.items[0].name}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        {order.itemsTotal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {order.shippingPrice === "pending" ? (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                            {order.shippingPrice}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-bold text-gray-900">
                        {order.total === "pending" ? (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                            {order.total}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge order={order} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={(e) => downloadInvoice(order, e)}
                          disabled={order.status === "pending" || order.status === "rejected"}
                          className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md transition-colors ${
                            order.status === "pending" || order.status === "rejected"
                              ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                              : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          }`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody> )}
            </table>
          </div>

          {/* Empty State */}
          {paginatedOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== "ongoing"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't placed any orders yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6 w-full">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + ordersPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    

      {/* Order Details Modal */}
      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  )
}
