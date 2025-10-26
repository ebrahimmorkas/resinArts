"use client"

import { useState, useEffect, useMemo, useContext } from "react"
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
import Navbar from "../../components/client/common/Navbar"
import Footer from "../../components/client/common/Footer"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { CompanySettingsContext } from "../../../Context/CompanySettingsContext"

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
  confirm: {
    label: "Confirmed",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: CheckCircle,
  },
  dispatched: {
    label: "Dispatched",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: Truck,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
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
  color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600",
},
  refund_pending: {
    label: "Refund Pending",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
}

const ongoingStatuses = ["pending", "accepted", "confirm", "dispatched", "completed"]

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
        navigate('/auth/login');
      }
      return Promise.reject(error);
    },
  );
}

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// Date filter functions
const isToday = (dateString) => {
  if (!dateString) return false;
  try {
    const today = new Date();
    const checkDate = new Date(dateString);
    return checkDate.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

const isYesterday = (dateString) => {
  if (!dateString) return false;
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(dateString);
    return checkDate.toDateString() === yesterday.toDateString();
  } catch {
    return false;
  }
};

const isSameDate = (dateString, targetDate) => {
  if (!dateString || !targetDate) return false;
  try {
    const date1 = new Date(dateString);
    const date2 = new Date(targetDate);
    return date1.toDateString() === date2.toDateString();
  } catch {
    return false;
  }
};

const isDateInRange = (dateString, startDate, endDate) => {
  if (!dateString || !startDate || !endDate) return false;
  try {
    const checkDate = new Date(dateString);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start/end of day for proper comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return checkDate >= start && checkDate <= end;
  } catch {
    return false;
  }
};

const isSameYear = (dateString, year) => {
  if (!dateString || !year) return false;
  try {
    const date = new Date(dateString);
    return date.getFullYear() === parseInt(year);
  } catch {
    return false;
  }
};

const isYearInRange = (dateString, startYear, endYear) => {
  if (!dateString || !startYear || !endYear) return false;
  try {
    const year = new Date(dateString).getFullYear();
    return year >= parseInt(startYear) && year <= parseInt(endYear);
  } catch {
    return false;
  }
};

const getValidPaymentStatuses = (orderStatus) => {
  // Payment can be 'paid' only for confirm, dispatched, completed
  if (["confirm", "dispatched", "completed"].includes(orderStatus)) {
    return ["paid", "pending"];
  }
  // For all other statuses, payment status should be pending only
  return ["pending"];
};

// Safe number conversion
const safeNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

// Simple Excel export without external library
const exportToExcel = (data) => {
  try {
    const headers = ['Sr No.', 'Order ID', 'Ordered At', 'Products', 'Quantity', 'Amount', 'Status', 'Payment', 'Shipping Address'];
    
    let csvContent = headers.join(',') + '\n';
    
    data.forEach((order, index) => {
      const row = [
        index + 1,
        `"${order.id}"`,
        `"${formatDate(order.orderedAt)}"`,
        `"${order.items.map(item => item.name).join('; ')}"`,
        order.items.reduce((total, item) => total + safeNumber(item.quantity), 0),
        `"$${safeNumber(order.total).toFixed(2)}"`,
        `"${statusConfig[order.status]?.label || order.status}"`,
        `"${paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}"`,
        `"${order.shippingAddress.replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export data. Please try again.');
  }
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
  // Search functionality states for Navbar
// const [searchQuery, setSearchQuery] = useState("")
const [searchResults, setSearchResults] = useState([])
const [showSearchResults, setShowSearchResults] = useState(false)
const [isSearching, setIsSearching] = useState(false)
  // const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();
  const { companySettings, loadingSettings } = useContext(CompanySettingsContext);

  // Setup axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

// Auto-switch payment filter when status filter changes
useEffect(() => {
  const statusToPaymentMap = {
    "all": "all",
    "pending": "all",
    "accepted": "all",
    "rejected": "all",
    "confirm": "paid",
    "dispatched": "paid",
    "completed": "paid",
  };

  const newPaymentFilter = statusToPaymentMap[statusFilter] || "all";
  setPaymentFilter(newPaymentFilter);
}, [statusFilter]);

  // Fetch orders directly from DB
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("Fetching orders for userId:", userId);
        setLoadingOrders(true);
        const res = await axios.post(
          "https://api.simplyrks.cloud/api/user/find-user",
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
      id: order._id || '',
      date: order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      orderedAt: order.createdAt,
      items: (order.orderedProducts || []).map((product) => ({
        name: (product.product_name || 'Unknown Product') + (product.variant_name ? ` - ${product.variant_name}` : ""),
        quantity: safeNumber(product.quantity, 1),
        price: safeNumber(product.price, 0),
        image: product.image_url || '',
        size: product.size || null,
      })),
      itemsTotal: safeNumber(order.price, 0),
      shippingPrice: safeNumber(order.shipping_price, 0),
      total: safeNumber(order.total_price, 0),
      status: (order.status || 'pending').toLowerCase(),
      trackingNumber: order._id || '',
      estimatedDelivery: null,
      shippingAddress: userAddress
        ? `${userAddress.address || ''}, ${userAddress.city || ''}, ${userAddress.state || ''} ${userAddress.zipCode || ''}`
        : "Address not available",
      paymentStatus: order.payment_status ? order.payment_status.toLowerCase() : "pending",
    };
  };

  // Filter and search functionality using useMemo
const filteredOrders = useMemo(() => {
  return orders.map(transformOrder).filter((order) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "ongoing") {
      matchesStatus = ongoingStatuses.includes(order.status);
    } else if (statusFilter !== "all") {
      matchesStatus = order.status === statusFilter;
    }

    // Payment filter - considering status-based rules
    let matchesPayment = true;
    if (paymentFilter !== "all") {
      const validPaymentStatuses = getValidPaymentStatuses(order.status);
      if (paymentFilter === "paid") {
        matchesPayment = order.paymentStatus === "paid" && validPaymentStatuses.includes("paid");
      } else if (paymentFilter === "pending") {
        matchesPayment = order.paymentStatus === "pending" || !validPaymentStatuses.includes("paid");
      }
    }

    // Date filter
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
  }, [searchQuery, ordersPerPage, statusFilter, paymentFilter, dateFilter]);

  const handleExportToExcel = () => {
    if (filteredOrders.length === 0) {
      alert('No data to export');
      return;
    }
    exportToExcel(filteredOrders);
  };

 const downloadInvoice = async (order, e) => {
  e.stopPropagation();
  try {
    const doc = new jsPDF();
    
    // Center "INVOICE" text
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const invoiceText = "INVOICE";
    const invoiceTextWidth = doc.getTextWidth(invoiceText);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(invoiceText, (pageWidth - invoiceTextWidth) / 2, 20);
    
    // Logo and Company Name centered below INVOICE
    let logoY = 30;
    const logoSize = 25;
    const centerX = pageWidth / 2;
    
    // Load company logo if available
    if (companySettings?.companyLogo) {
      try {
        const logoImg = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = function () {
            resolve(this);
          };
          img.onerror = function () {
            reject(new Error('Logo load failed'));
          };
          img.src = companySettings.companyLogo;
        });
        
        // Add logo centered
        doc.addImage(logoImg, "JPEG", centerX - logoSize / 2, logoY, logoSize, logoSize);
        logoY += logoSize + 5;
      } catch (error) {
        console.log("Could not add logo to PDF");
      }
    }
    
    // Company name centered below logo
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    const companyName = loadingSettings ? "Loading..." : companySettings?.companyName || "OULA MARKET";
    const companyNameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - companyNameWidth) / 2, logoY + 5);
    
    // Contact information (left aligned)
    let contactY = logoY + 15;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Email: ${companySettings?.adminEmail || "support@oulamarket.com"}`, 20, contactY);
    doc.text(`Phone: ${companySettings?.adminPhoneNumber || "+1 (555) 123-4567"}`, 20, contactY + 6);
    doc.text(`WhatsApp: ${companySettings?.adminWhatsappNumber || "+1 (555) 987-6543"}`, 20, contactY + 12);
    
    const addressLines = doc.splitTextToSize(
      `Address: ${companySettings?.adminAddress || "123 Business Ave"}, ${companySettings?.adminCity || "Commerce City"}, ${companySettings?.adminState || "CC"} ${companySettings?.adminPincode || "12345"}`,
      170
    );
    let addressY = contactY + 18;
    addressLines.forEach((line) => {
      doc.text(line, 20, addressY);
      addressY += 6;
    });
    
    // Invoice details (right aligned)
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`Invoice #: ${order.id}`, 120, contactY);
    doc.text(`Date: ${formatDate(order.orderedAt)}`, 120, contactY + 6);
    doc.text(`Status: ${statusConfig[order.status]?.label || order.status}`, 120, contactY + 12);
    
    // Bill To section
    const billToY = addressY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("BILL TO:", 20, billToY);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    const addressLinesBill = doc.splitTextToSize(order.shippingAddress, 170);
    let addressYBill = billToY + 10;
    addressLinesBill.forEach((line) => {
      doc.text(line, 20, addressYBill);
      addressYBill += 5;
    });
    
    // Items section
    const itemsStartY = addressYBill + 10;
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
    
    // Load all images first
    const imagePromises = order.items.map(item => {
      return new Promise((resolve) => {
        if (item.image && item.image !== "/placeholder.svg") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = function () {
            resolve({ success: true, img: this });
          };
          img.onerror = function () {
            resolve({ success: false });
          };
          img.src = item.image;
        } else {
          resolve({ success: false });
        }
      });
    });

    const loadedImages = await Promise.all(imagePromises);

    // Now add items with loaded images
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const imageData = loadedImages[i];
      const itemTotal = safeNumber(item.price) * safeNumber(item.quantity);
      
      if (imageData.success) {
        try {
          doc.addImage(imageData.img, "JPEG", 20, yPosition - 5, 15, 10);
        } catch (error) {
          console.log("Could not add image to PDF");
          doc.setFillColor(240, 240, 240);
          doc.rect(20, yPosition - 5, 15, 10, "F");
          doc.setFontSize(6);
          doc.text("IMG", 25, yPosition);
          doc.setFontSize(9);
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
      doc.text(safeNumber(item.quantity).toString(), 120, yPosition);
      doc.text(`$${safeNumber(item.price).toFixed(2)}`, 140, yPosition);
      doc.text(`$${itemTotal.toFixed(2)}`, 170, yPosition);
      yPosition += 15;
    }
    
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    doc.setFont(undefined, "normal");
    doc.text(`Items Subtotal:`, 120, yPosition);
    doc.text(`$${safeNumber(order.itemsTotal).toFixed(2)}`, 170, yPosition);
    yPosition += 8;
    doc.text(`Shipping:`, 120, yPosition);
    doc.text(`$${safeNumber(order.shippingPrice).toFixed(2)}`, 170, yPosition);
    yPosition += 8;
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL:`, 120, yPosition);
    doc.text(`$${safeNumber(order.total).toFixed(2)}`, 170, yPosition);
    yPosition += 20;
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text("Thank you for your business!", 20, yPosition);
    doc.text(`For support, contact us at ${companySettings?.adminEmail || "support@oulamarket.com"}`, 20, yPosition + 5);
    const filename = `invoice-${order.id.substring(0, 10)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Error generating invoice:", error);
    alert('Error generating invoice. Please try again.');
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

  // Search handlers for Navbar
const handleSearchChange = (query) => {
  setSearchQuery(query)
  // Orders page doesn't need search functionality, so we keep it simple
  setSearchResults([])
  setShowSearchResults(false)
}

const handleSearchResultClick = () => {
  // No-op for orders page
  setShowSearchResults(false)
}

const handleClearSearch = () => {
  setSearchQuery("")
  setSearchResults([])
  setShowSearchResults(false)
}

const highlightMatchedText = (text, query) => {
  // Simple highlight function
  return text
}

const handleSearchKeyPress = (e) => {
  // No-op for orders page
  if (e.key === 'Enter') {
    setShowSearchResults(false)
  }
}

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold -800 dark:text-gray-100">Order Details</h2>
                <p className="text-gray-600 dark:text-gray-400">{order.id}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold -800 dark:text-gray-100 mb-2">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                      <span>{formatDate(order.orderedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Items Total:</span>
                      <span className="font-semibold">${safeNumber(order.itemsTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                      <span className="font-semibold">${safeNumber(order.shippingPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="font-semibold">${safeNumber(order.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                      <PaymentStatusBadge order={order} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold -800 dark:text-gray-100 mb-2">Tracking</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tracking Number:</span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold -800 dark:text-gray-100 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{order.shippingAddress}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold -800 dark:text-gray-100 mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=48&width=48";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium -800 dark:text-gray-100">{item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {safeNumber(item.quantity)}
                        {item.size && ` • Size: ${item.size}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(safeNumber(item.price) * safeNumber(item.quantity)).toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${safeNumber(item.price).toFixed(2)} each</p>
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
                <span className="text-2xl font-bold text-blue-600 ml-2">${safeNumber(order.total).toFixed(2)}</span>
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
    <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
  <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-900 dark:text-gray-100 text-lg">Loading orders...</p>
      </div>
    </div>
  );
}

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        isSearching={isSearching}
        onSearchResultClick={handleSearchResultClick}
        onClearSearch={handleClearSearch}
        highlightMatchedText={highlightMatchedText}
        handleSearchKeyPress={handleSearchKeyPress}
      />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-6 flex items-center space-x-4">
          <button 
            onClick={handleBackClick} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your orders</p>
          </div>
        </div>

        {/* Professional Table Container */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
                    className="pl-10 pr-4 py-2 bopl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-80"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
>
  <option value="all">All Statuses</option>
  <option value="pending">Pending</option>
  <option value="accepted">Accepted</option>
  <option value="confirm">Confirmed</option>
  <option value="dispatched">Dispatched</option>
  <option value="completed">Completed</option>
  <option value="rejected">Rejected</option>
</select>
                  <select
  value={paymentFilter}
  onChange={(e) => setPaymentFilter(e.target.value)}
  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
>
  <option value="all">All Payments</option>
  <option value="paid">Paid</option>
  <option value="pending">Payment Pending</option>
</select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    onClick={handleExportToExcel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-4 flex-wrap">
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
          <div className="overflow-hidden border-t border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '80px' }}>
                      Sr No.
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '200px' }}>
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '140px' }}>
                      Ordered At
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '250px' }}>
                      Products
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '100px' }}>
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Payment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ minWidth: '120px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {currentData.map((order, index) => (
                    <tr key={order.id} onClick={() => handleView(order)} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100" style={{ minWidth: '80px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={{ minWidth: '200px' }}>
                        <span className="font-medium text-blue-600">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100" style={{ minWidth: '140px' }}>
                        {formatDate(order.orderedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100" style={{ minWidth: '250px' }}>
                        <div className="truncate" title={order.items.map(item => item.name).join(', ')}>
                          {order.items.length > 0 ? order.items[0].name : 'No items'}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100" style={{ minWidth: '100px' }}>
                        {order.items.reduce((total, item) => total + safeNumber(item.quantity), 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100" style={{ minWidth: '120px' }}>
                        <span className="font-medium">${safeNumber(order.total).toFixed(2)}</span>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "ongoing" || paymentFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't placed any orders yet."}
              </p>
            </div>
          )}

          {/* Table Footer */}
          {totalPages > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                {/* Items per page */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-black dark:text-gray-300">Show</span>
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">entries per page</span>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                ? 'bg-blue-600 text-blue-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:bg-gray-800'
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
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
      
      <Footer />
    </>
  );
}