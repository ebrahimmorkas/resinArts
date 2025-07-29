"use client"

import { useState } from "react"

// Mock data for products to be restocked
const mockProducts = [
  {
    id: "PRD-001",
    name: "Ocean Wave Resin Coasters (Set of 4)",
    currentStock: 15,
    price: 45.0,
    category: "Coasters",
    lastRestock: "2024-07-10T10:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Coaster",
  },
  {
    id: "PRD-002",
    name: "Galaxy Resin Keychain",
    currentStock: 50,
    price: 12.5,
    category: "Keychains",
    lastRestock: "2024-07-05T14:30:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Keychain",
  },
  {
    id: "PRD-003",
    name: "Abstract Resin Wall Art (Large)",
    currentStock: 3,
    price: 250.0,
    category: "Wall Art",
    lastRestock: "2024-06-20T09:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=WallArt",
  },
  {
    id: "PRD-004",
    name: "Floral Resin Pendant Necklace",
    currentStock: 22,
    price: 35.0,
    category: "Jewelry",
    lastRestock: "2024-07-12T11:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Necklace",
  },
  {
    id: "PRD-005",
    name: "Geode Resin Coasters (Set of 2)",
    currentStock: 8,
    price: 30.0,
    category: "Coasters",
    lastRestock: "2024-07-01T16:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Geode",
  },
  {
    id: "PRD-006",
    name: "Customizable Resin Letter (A-Z)",
    currentStock: 40,
    price: 18.0,
    category: "Decor",
    lastRestock: "2024-07-08T13:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Letter",
  },
  {
    id: "PRD-007",
    name: "Resin Ocean Tray",
    currentStock: 7,
    price: 85.0,
    category: "Trays",
    lastRestock: "2024-06-25T10:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Tray",
  },
  {
    id: "PRD-008",
    name: "Miniature Resin Terrarium",
    currentStock: 12,
    price: 25.0,
    category: "Decor",
    lastRestock: "2024-07-03T15:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Terrarium",
  },
  {
    id: "PRD-009",
    name: "Resin Flower Bookmark",
    currentStock: 30,
    price: 8.0,
    category: "Bookmarks",
    lastRestock: "2024-07-11T09:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=Bookmark",
  },
  {
    id: "PRD-010",
    name: "Resin Art Phone Grip",
    currentStock: 25,
    price: 15.0,
    category: "Accessories",
    lastRestock: "2024-07-09T12:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=PhoneGrip",
  },
  {
    id: "PRD-011",
    name: "Resin Coaster Set - Marble",
    currentStock: 5,
    price: 50.0,
    category: "Coasters",
    lastRestock: "2024-07-15T10:00:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=MarbleCoaster",
  },
  {
    id: "PRD-012",
    name: "Resin Ocean Art Frame",
    currentStock: 2,
    price: 180.0,
    category: "Wall Art",
    lastRestock: "2024-07-14T14:30:00Z",
    imageUrl: "/placeholder.svg?height=60&width=60&text=OceanFrame",
  },
]

const RestockPanel = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState(1)

  // Filter products based on search term
  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleRestockClick = (product) => {
    setSelectedProduct(product)
    setRestockQuantity(1) // Reset quantity to 1
    setShowRestockModal(true)
  }

  const handleConfirmRestock = () => {
    if (selectedProduct && restockQuantity > 0) {
      console.log(`Restocking ${selectedProduct.name} (ID: ${selectedProduct.id}) with ${restockQuantity} units.`)
      // Here you would typically send this data to your backend API
      // For mock data, you might update the currentStock directly, but for a real app, this would be handled server-side.
      setShowRestockModal(false)
      setSelectedProduct(null)
      setRestockQuantity(1)
      alert(`Successfully requested restock of ${restockQuantity} units for ${selectedProduct.name}!`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate("main")}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Restock Inventory
                </h1>
                <p className="mt-1 text-sm text-blue-600">Manage and restock your product inventory</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Stock Report
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, ID, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 border border-blue-300 rounded-xl leading-5 bg-white/50 placeholder-blue-400 text-gray-900 sm:text-sm backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/70 backdrop-blur-sm shadow rounded-2xl border border-blue-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Products ({filteredProducts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                    Last Restock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-blue-700 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.currentStock < 10
                            ? "bg-red-100 text-red-800"
                            : product.currentStock < 25
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.currentStock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {formatDate(product.lastRestock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleRestockClick(product)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-b-2xl shadow-lg border-t border-blue-200 px-6 py-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-blue-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span>{" "}
                    of <span className="font-medium">{filteredProducts.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-blue-300 bg-white text-sm font-medium text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-blue-300 bg-white text-sm font-medium text-blue-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-blue-300 bg-white text-sm font-medium text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Restock {selectedProduct.name}</h3>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  src={selectedProduct.imageUrl || "/placeholder.svg"}
                  alt={selectedProduct.name}
                />
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">Current Stock: {selectedProduct.currentStock} units</p>
                </div>
              </div>
              <div>
                <label htmlFor="restock-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Restock
                </label>
                <input
                  type="number"
                  id="restock-quantity"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  min="1"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowRestockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestock}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all duration-200"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestockPanel;