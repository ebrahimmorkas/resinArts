"use client"

import { useState, useEffect, useMemo } from "react"
import jsPDF from "jspdf"
import * as XLSX from 'xlsx'
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
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"

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
  dispatched: {
    label: "Dispatched",
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
  "payment pending": {
    label: "Payment Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
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

const ongoingStatuses = ["pending", "accepted", "confirmed", "processing", "shipped", "dispatched", "delivered"]

// Axios interceptor to handle JWT expiration
const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.data?.message?.includes("token") ||
        error.response?.data?.message?.includes("expired") ||
        error.response?.data?.message?.includes("unauthorized")
      ) {
        console.log("JWT token expired or unauthorized - redirecting to login");
        alert("Your session has expired. Please log in again.");
        navigate('/login');
      }
      return Promise.reject(error);
    },
  );
}

// Date formatting function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Date filter functions
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return checkDate.toDateString() === yesterday.toDateString();
};

const isSameDate = (date1, date2) => {
  return new Date(date1).toDateString() === new Date(date2).toDateString();
};

const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return checkDate >= start && checkDate <= end;
};

const isSameYear = (date, year) => {
  return new Date(date).getFullYear() === parseInt(year);
};

const isYearInRange = (date, startYear, endYear) => {
  const year = new Date(date).getFullYear();
  return year >= parseInt(startYear) && year <= parseInt(endYear);
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ongoing");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orders, setOrders] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [customStartYear, setCustomStartYear] = useState("");
  const [customEndYear, setCustomEndYear] = useState("");
  const { userId } = useParams();
  const navigate = useNavigate();

  // Setup axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  // Fetch orders directly from DB
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("Fetching orders for userId:", userId);
        setLoadingOrders(true);
        const res = await axios.post(
          "http://localhost:3000/api/user/find-user",
          { userId },
          { withCredentials: true }
        );
        console.log("API response:", res.data);
        if (res.status === 200) {
          const fetchedOrders = res.data.orders || [];
          const fetchedAddress = res.data.userAddress || null;
          setOrders(fetchedOrders);
          setUserAddress(fetchedAddress);
        } else {
          console.log("Unexpected response status:", res.status);
          setOrders([]);
          setUserAddress(null);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (error.response?.status === 400) {
          console.log("Invalid userId or no orders:", error.response.data);
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Authentication error - redirecting to login");
          navigate('/login');
        }
        setOrders([]);
        setUserAddress(null);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (userId) {
      fetchOrders();
    } else {
      console.error("No userId provided in URL");
      setLoadingOrders(false);
    }
  }, [userId, navigate]);

  // Transform backend data to match frontend expectations
  const transformOrder = (order) => {
    return {
      id: order._id,
      date: new Date(order.createdAt || Date.now()).toISOString().split("T")[0],
      orderedAt: order.createdAt,
      items: order.orderedProducts.map((product) => ({
        name: product.product_name + (product.variant_name ? ` - ${product.variant_name}` : ""),
        quantity: product.quantity,
        price: product.price,
        image: product.image_url,
        size: product.size || null,
      })),
      itemsTotal: order.price,
      shippingPrice: order.shipping_price || 0,
      total: order.total_price,
      status: order.status.toLowerCase(),
      trackingNumber: order._id,
      estimatedDelivery: null,
      shippingAddress: userAddress
        ? `${userAddress.address}, ${userAddress.city}, ${userAddress.state} ${userAddress.zipCode}`
        : "Address not available",
      paymentStatus: order.payment_status ? order.payment_status.toLowerCase() : "pending",
    };
  };

  // Filter and search functionality using useMemo
  const filteredOrders = useMemo(() => {
    return orders.map(transformOrder).filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "ongoing") {
        matchesStatus = ongoingStatuses.includes(order.status);
      } else if (statusFilter !== "all") {
        matchesStatus = order.status === statusFilter;
      }

      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = isToday(order.orderedAt);
      } else if (dateFilter === "yesterday") {
        matchesDate = isYesterday(order.orderedAt);
      } else if (dateFilter === "custom" && customDate) {
        matchesDate = isSameDate(order.orderedAt, customDate);
      } else if (dateFilter === "range" && customStartDate && customEndDate) {
        matchesDate = isDateInRange(order.orderedAt, customStartDate, customEndDate);
      } else if (dateFilter === "year" && customYear) {
        matchesDate = isSameYear(order.orderedAt, customYear);
      } else if (dateFilter === "yearRange" && customStartYear && customEndYear) {
        matchesDate = isYearInRange(order.orderedAt, customStartYear, customEndYear);
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter, customDate, customStartDate, customEndDate, customYear, customStartYear, customEndYear, userAddress]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentData = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ordersPerPage]);

  // Export to Excel function
  const exportToExcel = () => {
    const exportData = filteredOrders.map((order, index) => ({
      'Sr No.': index + 1,
      'Order ID': order.id,
      'Ordered At': formatDate(order.orderedAt),
      'Products': order.items.map(item => item.name).join(', '),
      'Quantity': order.items.reduce((total, item) => total + item.quantity, 0),
      'Amount': `$${order.total.toFixed(2)}`,
      'Status': statusConfig[order.status]?.label || order.status,
      'Payment': paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus,
      'Shipping Address': order.shippingAddress
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    
    // Auto-size columns
    const range = XLSX.utils.decode_range(ws['!ref']);
    const cols = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let max_width = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = ws[cell_ref];
        if (cell && cell.v) {
          const cell_width = cell.v.toString().length;
          if (cell_width > max_width) {
            max_width = cell_width;
          }
        }
      }
      cols[C] = { width: Math.min(max_width + 2, 50) };
    }
    ws['!cols'] = cols;

    const fileName = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadInvoice = async (order, e) => {
    e.stopPropagation();
    try {
      const doc = new jsPDF();
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("OULA MARKET", 20, 30);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Email: support@oulamarket.com", 20, 40);
      doc.text("Phone: +1 (555) 123-4567", 20, 45);
      doc.text("WhatsApp: +1 (555) 987-6543", 20, 50);
      doc.text("Address: 123 Business Ave, Commerce City, CC 12345", 20, 55);
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("INVOICE", 120, 30);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(`Invoice #: ${order.id}`, 120, 40);
      doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 120, 45);
      doc.text(`Status: ${statusConfig[order.status]?.label || order.status}`, 120, 50);
      doc.text(`Payment: ${paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}`, 120, 55);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("BILL TO:", 20, 75);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const addressLines = doc.splitTextToSize(order.shippingAddress, 170);
      let addressY = 85;
      addressLines.forEach((line) => {
        doc.text(line, 20, addressY);
        addressY += 5;
      });
      const itemsStartY = addressY + 10;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("ITEMS:", 20, itemsStartY);
      const tableStartY = itemsStartY + 10;
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Image", 20, tableStartY);
      doc.text("Item", 40, tableStartY);
      doc.text("Qty", 120, tableStartY);
      doc.text("Price", 140, tableStartY);
      doc.text("Total", 170, tableStartY);
      doc.line(20, tableStartY + 3, 190, tableStartY + 3);
      let yPosition = tableStartY + 10;
      doc.setFont(undefined, "normal");
      for (const item of order.items) {
        const itemTotal = item.price * item.quantity;
        if (item.image && item.image !== "/placeholder.svg") {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
              doc.addImage(this, "JPEG", 20, yPosition - 5, 15, 10);
            };
            img.src = item.image;
          } catch (error) {
            console.log("Could not add image to PDF");
          }
        } else {
          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPosition - 5, 15, 10, "F");
          doc.setFontSize(6);
          doc.text("IMG", 25, yPosition);
          doc.setFontSize(9);
        }
        const itemName = item.name.length > 35 ? item.name.substring(0, 35) + "..." : item.name;
        doc.text(itemName, 40, yPosition);
        doc.text(item.quantity.toString(), 120, yPosition);
        doc.text(`$${item.price}`, 140, yPosition);
        doc.text(`$${itemTotal}`, 170, yPosition);
        yPosition += 15;
      }
      yPosition += 5;
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      doc.setFont(undefined, "normal");
      doc.text(`Items Subtotal:`, 120, yPosition);
      doc.text(`$${order.itemsTotal}`, 170, yPosition);
      yPosition += 8;
      doc.text(`Shipping:`, 120, yPosition);
      doc.text(`$${order.shippingPrice}`, 170, yPosition);
      yPosition += 8;
      doc.setFont(undefined, "bold");
      doc.setFontSize(12);
      doc.text(`TOTAL:`, 120, yPosition);
      doc.text(`$${order.total}`, 170, yPosition);
      yPosition += 20;
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text("Thank you for your business!", 20, yPosition);
      doc.text("For support, contact us at support@oulamarket.com", 20, yPosition + 5);
      const filename = `invoice-${order.id.substring(0, 10)}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error generating invoice:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Your session has expired. Please log in again.");
        navigate('/login');
      }
    }
  };

  const getPaymentStatus = (order) => {
    if (order.status === "returned") {
      return order.paymentStatus === "refund_pending" ? "refund_pending" : "refunded";
    }
    if (order.status === "pending" || order.status === "accepted" || order.status === "rejected") {
      return "pending";
    }
    return order.paymentStatus || "pending";
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const PaymentStatusBadge = ({ order }) => {
    const paymentStatus = getPaymentStatus(order);
    const config = paymentStatusConfig[paymentStatus] || paymentStatusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
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
                      <span>{formatDate(order.orderedAt)}</span>
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
                      <span className="font-semibold">${order.shippingPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">${order.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <PaymentStatusBadge order={order} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Tracking</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>
                  </div>
                </div>
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
                        e.target.src = "/placeholder.svg?height=48&width=48";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                        {item.size && ` • Size: ${item.size}`}
                      </p>
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
                <span className="text-2xl font-bold text-blue-600 ml-2">${order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
  };

  if (loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-6 flex items-center space-x-4">
          <button 
            onClick={handleBackClick} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage your orders</p>
          </div>
        </div>

        {/* Professional Table Container */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Orders Management</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders, products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ongoing">Ongoing Orders</option>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                    <option value="returned">Returned</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Payment Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="refund_pending">Refund Pending</option>
                  </select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="custom">Custom Date</option>
                    <option value="range">Date Range</option>
                    <option value="year">Custom Year</option>
                    <option value="yearRange">Year Range</option>
                  </select>
                  <button 
                    onClick={exportToExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Orders
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter Inputs */}
          {dateFilter !== "all" && dateFilter !== "today" && dateFilter !== "yesterday" && (
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                {dateFilter === "custom" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mr-2">Select Date:</label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
                {dateFilter === "range" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mr-2">From:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mr-2">To:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                {dateFilter === "year" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mr-2">Year:</label>
                    <input
                      type="number"
                      min="2020"
                      max={new Date().getFullYear()}
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="YYYY"
                    />
                  </div>
                )}
                {dateFilter === "yearRange" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mr-2">From Year:</label>
                      <input
                        type="number"
                        min="2020"
                        max={new Date().getFullYear()}
                        value={customStartYear}
                        onChange={(e) => setCustomStartYear(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mr-2">To Year:</label>
                      <input
                        type="number"
                        min="2020"
                        max={new Date().getFullYear()}
                        value={customEndYear}
                        onChange={(e) => setCustomEndYear(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="YYYY"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Table Container with Horizontal Scroll and Sticky Header */}
          <div className="overflow-hidden border-t border-gray-200">
            <div className="overflow-x-auto overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '80px' }}>
                      Sr No.
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '200px' }}>
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                      Ordered At
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '250px' }}>
                      Products
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '100px' }}>
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                      Payment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" style={{ minWidth: '120px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((order, index) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '80px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '200px' }}>
                        <span className="font-medium text-blue-600">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                        {formatDate(order.orderedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900" style={{ minWidth: '250px' }}>
                        <div className="truncate" title={order.items.map(item => item.name).join(', ')}>
                          {order.items[0].name}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '100px' }}>
                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900" style={{ minWidth: '120px' }}>
                        <span className="font-medium">${order.total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                        <PaymentStatusBadge order={order} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '120px' }}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleView(order)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => downloadInvoice(order, e)}
                            disabled={order.status === "pending" || order.status === "rejected"}
                            className={`p-1.5 rounded-md transition-colors ${
                              order.status === "pending" || order.status === "rejected"
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={order.status === "pending" || order.status === "rejected" ? "Invoice Unavailable" : "Download Invoice"}
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
          </div>

          {/* Empty State */}
          {currentData.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== "ongoing" || paymentFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't placed any orders yet."}
              </p>
            </div>
          )}

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={ordersPerPage}
                  onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
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
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}