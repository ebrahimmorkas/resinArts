"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Ban,
  Trash2,
  DollarSign,
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  UsersIcon,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  ShoppingBag,
  Gift,
  RefreshCw,
} from "lucide-react"

// Mock users data
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    whatsapp: "+1234567890",
    lastActive: "2024-01-15",
    orders: 12,
    status: "active",
    hasCash: false,
    cashAmount: 0,
    joinDate: "2023-06-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1234567891",
    whatsapp: "+1234567891",
    lastActive: "2024-01-14",
    orders: 8,
    status: "active",
    hasCash: true,
    cashAmount: 50,
    joinDate: "2023-08-20",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1234567892",
    whatsapp: "+1234567892",
    lastActive: "2024-01-10",
    orders: 25,
    status: "banned",
    hasCash: false,
    cashAmount: 0,
    joinDate: "2023-03-10",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1234567893",
    whatsapp: "+1234567893",
    lastActive: "2024-01-12",
    orders: 5,
    status: "active",
    hasCash: true,
    cashAmount: 25,
    joinDate: "2023-11-05",
  },
  {
    id: 5,
    name: "David Brown",
    email: "david.brown@example.com",
    phone: "+1234567894",
    whatsapp: "+1234567894",
    lastActive: "2024-01-08",
    orders: 18,
    status: "active",
    hasCash: false,
    cashAmount: 0,
    joinDate: "2023-05-22",
  },
]

export default function Users() {
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilter, setActiveFilter] = useState("")
  const [filterValues, setFilterValues] = useState({
    lastActiveBefore: "",
    lastOrderBefore: "",
    ordersType: "below",
    ordersAmount: "",
    selectedDate: "",
  })

  // Modal states
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showRevokeCashModal, setShowRevokeCashModal] = useState(false)

  const [selectedUser, setSelectedUser] = useState(null)
  const [cashForm, setCashForm] = useState({
    amount: "",
    validAbove: "",
    endDate: "",
  })
  const [newPassword, setNewPassword] = useState("")

  const usersPerPage = 10

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)

    // Apply active filters
    if (activeFilter === "active-status" && filterValues.lastActiveBefore) {
      const lastActiveDate = new Date(user.lastActive)
      const filterDate = new Date(filterValues.lastActiveBefore)
      if (lastActiveDate >= filterDate) return false
    }

    if (activeFilter === "last-order" && filterValues.lastOrderBefore) {
      // This would need actual last order date from backend
      // For now, using lastActive as placeholder
      const lastOrderDate = new Date(user.lastActive)
      const filterDate = new Date(filterValues.lastOrderBefore)
      if (lastOrderDate >= filterDate) return false
    }

    if (activeFilter === "orders" && filterValues.ordersAmount) {
      const amount = Number.parseInt(filterValues.ordersAmount)
      if (filterValues.ordersType === "below" && user.orders >= amount) return false
      if (filterValues.ordersType === "above" && user.orders <= amount) return false
    }

    if (activeFilter === "free-cash") {
      if (!user.hasCash) return false
    }

    if (activeFilter === "date" && filterValues.selectedDate) {
      // This would filter by join date or specific date
      const userDate = new Date(user.joinDate)
      const filterDate = new Date(filterValues.selectedDate)
      if (userDate.toDateString() !== filterDate.toDateString()) return false
    }

    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map((user) => user.id))
    }
  }

  // Action handlers
  const handleBanUser = (user) => {
    setSelectedUser(user)
    setShowBanModal(true)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handlePayCash = (user) => {
    setSelectedUser(user)
    setShowCashModal(true)
  }

  const handleChangePassword = (user) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }

  const handleRevokeCash = (user) => {
    setSelectedUser(user)
    setShowRevokeCashModal(true)
  }

  // Bulk actions
  const handleBulkSendCash = () => {
    setShowCashModal(true)
  }

  const handleBulkRevokeCash = () => {
    setShowRevokeCashModal(true)
  }

  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true)
  }

  // Confirm actions
  const confirmBan = () => {
    setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? { ...user, status: "banned" } : user)))
    setShowBanModal(false)
    setSelectedUser(null)
  }

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))
    } else {
      setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.id)))
      setSelectedUsers([])
    }
    setShowDeleteModal(false)
    setShowBulkDeleteModal(false)
    setSelectedUser(null)
  }

  const confirmPayCash = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, hasCash: true, cashAmount: Number.parseInt(cashForm.amount) } : user,
        ),
      )
    } else {
      setUsers((prev) =>
        prev.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, hasCash: true, cashAmount: Number.parseInt(cashForm.amount) }
            : user,
        ),
      )
      setSelectedUsers([])
    }
    setShowCashModal(false)
    setCashForm({ amount: "", validAbove: "", endDate: "" })
    setSelectedUser(null)
  }

  const confirmRevokeCash = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, hasCash: false, cashAmount: 0 } : user)),
      )
    } else {
      setUsers((prev) =>
        prev.map((user) => (selectedUsers.includes(user.id) ? { ...user, hasCash: false, cashAmount: 0 } : user)),
      )
      setSelectedUsers([])
    }
    setShowRevokeCashModal(false)
    setSelectedUser(null)
  }

  const confirmChangePassword = () => {
    // Here you would make API call to change password
    console.log(`Changing password for user ${selectedUser.id} to: ${newPassword}`)
    setShowPasswordModal(false)
    setNewPassword("")
    setSelectedUser(null)
  }

  const applyFilter = () => {
    setCurrentPage(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setActiveFilter("")
    setFilterValues({
      lastActiveBefore: "",
      lastOrderBefore: "",
      ordersType: "below",
      ordersAmount: "",
      selectedDate: "",
    })
    setShowFilters(false)
  }

  // Modal Components
  const ConfirmModal = ({ show, onClose, onConfirm, title, message, type = "danger" }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`p-3 rounded-full ${
                type === "danger" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 text-sm">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                type === "danger"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CashModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Pay Cash to User</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount (₹)</label>
              <input
                type="number"
                value={cashForm.amount}
                onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Above ₹</label>
              <input
                type="number"
                value={cashForm.validAbove}
                onChange={(e) => setCashForm({ ...cashForm, validAbove: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum order amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={cashForm.endDate}
                onChange={(e) => setCashForm({ ...cashForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> If you do not enter the end date, you need to revoke cash manually.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!cashForm.amount}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay Cash
            </button>
          </div>
        </div>
      </div>
    )
  }

  const PasswordModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!newPassword}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
              <p className="text-gray-600">Manage and monitor user accounts</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UsersIcon className="w-4 h-4" />
              <span>{filteredUsers.length} users found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {activeFilter && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-10">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                        <select
                          value={activeFilter}
                          onChange={(e) => setActiveFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Filter</option>
                          <option value="active-status">Active Status</option>
                          <option value="last-order">Last Order</option>
                          <option value="orders">Orders Count</option>
                          <option value="free-cash">Free Cash</option>
                          <option value="date">Date</option>
                        </select>
                      </div>

                      {/* Dynamic Filter Fields */}
                      {activeFilter === "active-status" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Active Before</label>
                          <input
                            type="date"
                            value={filterValues.lastActiveBefore}
                            onChange={(e) => setFilterValues({ ...filterValues, lastActiveBefore: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {activeFilter === "last-order" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Order Before</label>
                          <input
                            type="date"
                            value={filterValues.lastOrderBefore}
                            onChange={(e) => setFilterValues({ ...filterValues, lastOrderBefore: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {activeFilter === "orders" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Orders Count</label>
                            <select
                              value={filterValues.ordersType}
                              onChange={(e) => setFilterValues({ ...filterValues, ordersType: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="below">Below</option>
                              <option value="above">Above</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Enter count"
                              value={filterValues.ordersAmount}
                              onChange={(e) => setFilterValues({ ...filterValues, ordersAmount: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {activeFilter === "date" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                          <input
                            type="date"
                            value={filterValues.selectedDate}
                            onChange={(e) => setFilterValues({ ...filterValues, selectedDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={applyFilter}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={clearFilters}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">{selectedUsers.length} users selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkSendCash}
                    className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Send Cash
                  </button>
                  <button
                    onClick={handleBulkRevokeCash}
                    className="inline-flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Revoke Cash
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="flex items-center gap-2">
                            {user.status === "banned" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Banned
                              </span>
                            )}
                            {user.hasCash && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ₹{user.cashAmount} Cash
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        {user.whatsapp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(user.lastActive).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <ShoppingBag className="w-4 h-4 mr-2 text-gray-400" />
                        {user.orders}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {selectedUsers.length > 0 ? (
                        <span className="text-gray-400 text-sm">Bulk actions selected</span>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleBanUser(user)}
                            disabled={user.status === "banned"}
                            className="inline-flex items-center px-2 py-1 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            {user.status === "banned" ? "Banned" : "Ban"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center px-2 py-1 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                          {user.hasCash ? (
                            <button
                              onClick={() => handleRevokeCash(user)}
                              className="inline-flex items-center px-2 py-1 border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded text-xs font-medium transition-colors"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayCash(user)}
                              className="inline-flex items-center px-2 py-1 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 rounded text-xs font-medium transition-colors"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Pay Cash
                            </button>
                          )}
                          <button
                            onClick={() => handleChangePassword(user)}
                            className="inline-flex items-center px-2 py-1 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Password
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {paginatedUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
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

      {/* Modals */}
      <ConfirmModal
        show={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={confirmBan}
        title="Ban User"
        message={`Are you sure you want to ban ${selectedUser?.name}? This action will restrict their access.`}
        type="warning"
      />

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        type="danger"
      />

      <ConfirmModal
        show={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Users"
        message={`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`}
        type="danger"
      />

      <ConfirmModal
        show={showRevokeCashModal}
        onClose={() => setShowRevokeCashModal(false)}
        onConfirm={confirmRevokeCash}
        title="Revoke Cash"
        message={
          selectedUser
            ? `Are you sure you want to revoke ₹${selectedUser?.cashAmount} cash from ${selectedUser?.name}?`
            : `Are you sure you want to revoke cash from ${selectedUsers.length} selected users?`
        }
        type="warning"
      />

      <CashModal show={showCashModal} onClose={() => setShowCashModal(false)} onConfirm={confirmPayCash} />

      <PasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={confirmChangePassword}
      />
    </div>
  )
}
