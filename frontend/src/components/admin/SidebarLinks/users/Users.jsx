"use client"

import { useEffect, useState, useContext, useMemo, useRef } from "react"
import {
  Search, Filter, Trash2, DollarSign, Key, ChevronLeft, ChevronRight, X, AlertTriangle,
  UsersIcon, Phone, Mail, MessageCircle, Clock, ShoppingBag, Gift, RefreshCw, Download, Upload, FileDown, UserPlus, Send
} from "lucide-react";
import { UserContext } from "../../../../../Context/UserContext";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CashModal({
  show,
  onClose,
  onSubmit,
  cashForm,
  setCashForm,
  isFreeCashValidForAllProducts,
  onAllProductsChange,
  loadingCategories,
  categoriesFetchingError,
  renderCategoryDropdowns,
  categoryPath,
  selectedCategoryIds,
  allCategoriesFlat,
  setSelectedCategoryIds,
  mainCategoryError,
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Pay Cash to User</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={cashForm.amount}
                onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Above ₹</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashForm.validAbove}
                onChange={(e) => setCashForm({ ...cashForm, validAbove: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 for no minimum"
              />
            </div>
            <div>
              <input
                type="checkbox"
                checked={isFreeCashValidForAllProducts}
                onChange={onAllProductsChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Valid for all products</label>
            </div>
            {!isFreeCashValidForAllProducts && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Category Hierarchy</label>
                {loadingCategories ? (
                  <span>Loading categories...</span>
                ) : categoriesFetchingError ? (
                  <span className="text-red-500 text-sm">{categoriesFetchingError}</span>
                ) : (
                  <div className="space-y-3">
                    {renderCategoryDropdowns()}
                    {categoryPath && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        Category Path:{" "}
                        {selectedCategoryIds.map((id, index) => {
                          const category = allCategoriesFlat.find((cat) => cat._id === id)
                          if (!category) return null
                          return (
                            <span key={id}>
                              <button
                                type="button"
                                onClick={() => setSelectedCategoryIds(selectedCategoryIds.slice(0, index + 1))}
                                className="font-medium text-blue-700 hover:underline"
                              >
                                {category.categoryName}
                              </button>
                              {index < selectedCategoryIds.length - 1 && <span className="mx-1">{" > "}</span>}
                            </span>
                          )
                        })}
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedCategoryIds.length === 1
                            ? "Applies to main category and all its sub-levels"
                            : "Applies to selected sub-category and its sub-levels"}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {mainCategoryError && (
                  <span className="text-red-500 text-xs">{mainCategoryError}</span>
                )}
              </div>
            )}
            {isFreeCashValidForAllProducts && (
              <p className="text-sm text-gray-500 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                Valid for all products - category selection disabled.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={cashForm.endDate}
                onChange={(e) => setCashForm({ ...cashForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for no expiry"
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
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:-800 dark:text-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!cashForm.amount || parseFloat(cashForm.amount) <= 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay Cash
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const {users, loadingUsers, usersError, refetchUsers} = useContext(UserContext);
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
  });
  const [allCategoriesTree, setAllCategoriesTree] = useState([]); // Nested tree from /all
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]); // Flattened for path lookup
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]); // [main_id, sub_id, ...]
  const [categoryPath, setCategoryPath] = useState(""); // Path display
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesFetchingError, setCategoriesFetchingError] = useState("");
  const [mainCategoryError, setMainCategoryError] = useState("");

  // Modal states
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showRevokeCashModal, setShowRevokeCashModal] = useState(false)
  const [isFreeCashValidForAllProducts, setIsFreeCashValidForAllProducts] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null)
  const [cashForm, setCashForm] = useState({
    amount: "",
    validAbove: "",
    endDate: "",
    selectedMainCategory: "",
    selectedSubCategory: "",
    validForAllProducts: false
  })
  const [newPassword, setNewPassword] = useState("")
  const [showEmailModal, setShowEmailModal] = useState(false)
const [showAddUserModal, setShowAddUserModal] = useState(false)
const [emailForm, setEmailForm] = useState({ subject: "", body: "" })
const [userForm, setUserForm] = useState({
  first_name: "", middle_name: "", last_name: "", email: "", phone_number: "",
  whatsapp_number: "", state: "", city: "", address: "", zip_code: "", password: ""
})
const fileInputRef = useRef(null);

  // Fetch categories from /all (from AddProduct.jsx)
  useEffect(() => {
  const getCategories = async () => {
    try {
      const res = await axios.get("https://api.simplyrks.cloud/api/category/fetch-categories", {withCredentials: true});
      if (res.status === 200) {
        const flatCats = res.data.categories;
        const activeFlatCats = flatCats.filter(cat => cat.isActive === true);
        const buildTree = (flatCats) => {
          const tree = [];
          const map = {};
          flatCats.forEach(cat => {
            map[cat._id] = { ...cat, subcategories: [] };
          });
          flatCats.forEach(cat => {
            if (cat.parent_category_id === null) {
              tree.push(map[cat._id]);
            } else if (map[cat.parent_category_id]) {
              map[cat.parent_category_id].subcategories.push(map[cat._id]);
            }
          });
          return tree;
        };
        setAllCategoriesTree(buildTree(activeFlatCats));
        setAllCategoriesFlat(flattenCategories(activeFlatCats));
        setLoadingCategories(false);
        setCategoriesFetchingError("");
      }
    } catch (error) {
      setCategoriesFetchingError("Cannot fetch categories");
      console.error("Category fetch error:", error);
      setLoadingCategories(false);
    }
  };
  getCategories();
}, []);

  // From AddProduct.jsx: Flatten categories for path
  const flattenCategories = (categories, parentPath = "", parentId = null) => {
    let flatList = []
    categories.forEach((cat) => {
      const currentPath = parentPath ? `${parentPath} > ${cat.categoryName}` : cat.categoryName
      flatList.push({ ...cat, path: currentPath, parentId: parentId })
      if (cat.subcategories && cat.subcategories.length > 0) {
        flatList = flatList.concat(flattenCategories(cat.subcategories, currentPath, cat._id))
      }
    })
    return flatList
  }

  // From AddProduct.jsx: Find category in tree
  const findCategoryInTree = (categoryId, categories) => {
    for (const cat of categories) {
      if (cat._id === categoryId) {
        return cat
      }
      if (cat.subcategories && cat.subcategories.length > 0) {
        const found = findCategoryInTree(categoryId, cat.subcategories)
        if (found) {
          return found
        }
      }
    }
    return null
  }

  // From AddProduct.jsx: Update path
  useEffect(() => {
    const pathNames = selectedCategoryIds
      .map((id) => allCategoriesFlat.find((cat) => cat._id === id)?.categoryName)
      .filter(Boolean)
    setCategoryPath(pathNames.join(" > "))
  }, [selectedCategoryIds, allCategoriesFlat])

  // From AddProduct.jsx: Handle category selection
  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean)
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level)
    }
    setSelectedCategoryIds(newSelectedCategoryIds)
    const mainId = newSelectedCategoryIds[0] || ""
    const subId = newSelectedCategoryIds.length > 1 ? newSelectedCategoryIds[newSelectedCategoryIds.length - 1] : ""
    setCashForm((prev) => ({
      ...prev,
      selectedMainCategory: mainId,
      selectedSubCategory: subId,
    }));
    setMainCategoryError("");
  }

  // Handle all-products checkbox
  const handleAllProductsChange = (e) => {
    const checked = e.target.checked;
    setIsFreeCashValidForAllProducts(checked);
    setCashForm((prev) => ({ ...prev, validForAllProducts: checked }));
    if (checked) {
      setSelectedCategoryIds([]);
      setCategoryPath("");
      setCashForm((prev) => ({
        ...prev,
        selectedMainCategory: "",
        selectedSubCategory: "",
      }));
      setMainCategoryError("");
    }
  };

  const usersPerPage = 10

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery)

    if (activeFilter === "active-status" && filterValues.lastActiveBefore) {
      const lastActiveDate = new Date(user.lastActive)
      const filterDate = new Date(filterValues.lastActiveBefore)
      if (lastActiveDate >= filterDate) return false
    }

    if (activeFilter === "last-order" && filterValues.lastOrderBefore) {
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

  // Handlers
  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSelectAll = () => {
  if (selectedUsers.length === paginatedUsers.length) {
    setSelectedUsers([])
  } else {
    setSelectedUsers(paginatedUsers.map((user) => user._id))
  }
}

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

  const handleBulkSendCash = () => {
    setShowCashModal(true)
  }

  const handleBulkRevokeCash = () => {
    setShowRevokeCashModal(true)
  }

  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true)
  }

  const confirmBan = () => {
    setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? { ...user, status: "banned" } : user)))
    setShowBanModal(false)
    setSelectedUser(null)
  }

 const confirmDelete = async () => {
  try {
    const userIds = selectedUser ? [selectedUser._id] : selectedUsers;
    const res = await axios.post('https://api.simplyrks.cloud/api/user/delete', 
      { userIds: userIds }, 
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      await refetchUsers();
      setSelectedUsers([]);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error deleting users");
  }
}

const handleSendEmail = (user) => {
  setSelectedUser(user)
  setShowEmailModal(true)
}

const handleBulkSendEmail = () => {
  setShowEmailModal(true)
}

const confirmSendEmail = async (e) => {
  e.preventDefault();
  try {
    const userIds = selectedUser ? [selectedUser._id] : selectedUsers;
    const res = await axios.post('https://api.simplyrks.cloud/api/user/send-email', 
      { userIds: userIds, subject: emailForm.subject, body: emailForm.body },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      setShowEmailModal(false);
      setEmailForm({ subject: "", body: "" });
      setSelectedUsers([]);
      setSelectedUser(null);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error sending email");
  }
};

const handleImport = () => {
  fileInputRef.current?.click();
};

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post('https://api.simplyrks.cloud/api/user/import', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.status === 200) {
      toast.success(res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        toast.warning(`${res.data.errorCount} errors occurred`);
        console.log("Import errors:", res.data.errors);
      }
      await refetchUsers();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error importing users");
  }
  e.target.value = '';
};

const handleExport = async () => {
  try {
    const res = await axios.get('https://api.simplyrks.cloud/api/user/export', {
      withCredentials: true,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_export.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Users exported successfully");
  } catch (error) {
    toast.error("Error exporting users");
  }
};

const handleSampleDownload = async () => {
  try {
    const res = await axios.get('https://api.simplyrks.cloud/api/user/sample', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_customers.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Sample downloaded successfully");
  } catch (error) {
    toast.error("Error downloading sample");
  }
};

const handleAddUser = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('https://api.simplyrks.cloud/api/auth/register', userForm, { withCredentials: true });
    if (res.status === 200) {
      toast.success("User added successfully");
      await refetchUsers();
      setShowAddUserModal(false);
      setUserForm({ first_name: "", middle_name: "", last_name: "", email: "", phone_number: "",
        whatsapp_number: "", state: "", city: "", address: "", zip_code: "", password: "" });
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error adding user");
  }
};

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
    setCashForm({ amount: "", validAbove: "", endDate: "", selectedMainCategory: "", selectedSubCategory: "", validForAllProducts: false })
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

  const handleCashModalFormSubmit = async (e) => {
  e.preventDefault();
  
  const cleanedCashForm = {
    amount: cashForm.amount.toString().trim(),
    validAbove: cashForm.validAbove.toString().trim() || "0",
    endDate: cashForm.endDate.trim() || "",
    selectedMainCategory: isFreeCashValidForAllProducts ? "" : cashForm.selectedMainCategory.trim(),
    selectedSubCategory: isFreeCashValidForAllProducts ? "" : cashForm.selectedSubCategory.trim(),
    validForAllProducts: isFreeCashValidForAllProducts,
  };

  const amountNum = parseFloat(cleanedCashForm.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    toast.error("Amount must be a positive number");
    return;
  }
  if (!isFreeCashValidForAllProducts && !cleanedCashForm.selectedMainCategory) {
    setMainCategoryError("Please select a main category");
    return;
  }

  try {
  const userIds = selectedUser ? [selectedUser._id] : selectedUsers;
  const res = await axios.post('https://api.simplyrks.cloud/api/free-cash/bulk-add', 
    { cashForm: cleanedCashForm, userIds: userIds },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message);
      await refetchUsers();
      setShowCashModal(false);
      setCashForm({ amount: "", validAbove: "", endDate: "", selectedMainCategory: "", selectedSubCategory: "", validForAllProducts: false });
      setIsFreeCashValidForAllProducts(false);
      setSelectedCategoryIds([]);
      setCategoryPath("");
      setSelectedUsers([]);
      setSelectedUser(null);
      setMainCategoryError("");
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error adding free cash");
  }
};

  // From AddProduct.jsx: Render dynamic category dropdowns with exact same logic
  const renderCategoryDropdowns = () => {
    const dropdowns = []

    // Main Category Dropdown (Level 0)
    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
    dropdowns.push(
      <div key={`category-dropdown-0`} className="space-y-2">
        <label htmlFor={`category-level-0`} className="block text-sm font-medium text-gray-700 mb-1">
          Main Category
        </label>
        <div className="relative">
          <select
            id={`category-level-0`}
            value={selectedCategoryIds[0] || ""}
            onChange={(e) => handleCategorySelect(0, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-900"
          >
            <option value="">Select main category</option>
            {mainCategoryOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>,
    )

    // Sub Category Dropdown (Dynamic, always refers to the next level based on the last selected category)
    const lastSelectedCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1]
    const lastSelectedCategoryInTree = findCategoryInTree(lastSelectedCategoryId, allCategoriesTree)
    const subCategoryOptions = lastSelectedCategoryInTree ? lastSelectedCategoryInTree.subcategories || [] : []

    if (selectedCategoryIds.length > 0 && subCategoryOptions.length > 0) {
      dropdowns.push(
        <div key={`category-dropdown-sub`} className="space-y-2">
          <label htmlFor={`category-level-sub`} className="block text-sm font-medium text-gray-700 mb-1">
            Sub Category
          </label>
          <div className="relative">
            <select
              id={`category-level-sub`}
              value={selectedCategoryIds[selectedCategoryIds.length] || ""} // This will be empty initially for the next level
              onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-900"
            >
              <option value="">Select sub category</option>
              {subCategoryOptions.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>,
      )
    }

    return <div className="space-y-4">{dropdowns}</div>
  }

  if (usersError) return <div>Error while fetching users: {usersError}</div>;
  if (loadingUsers) return <div>Loading users...</div>;
  if (!users || users.length === 0) return <div>No users to display</div>;

  const newUsers = users.filter((user) => user.role !== "admin");

  // Modal Components
  const ConfirmModal = ({ show, onClose, onConfirm, title, message, type = "danger" }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
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
              <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:-800 dark:text-gray-100 font-medium transition-colors"
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

  const PasswordModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
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
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:-800 dark:text-gray-100 font-medium transition-colors"
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

  function EmailModal({ show, onClose, onSubmit, emailForm, setEmailForm }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Send Email</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email subject" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
              <textarea value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                placeholder="Enter email body" required />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Send Email</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddUserModal({ show, onClose, onSubmit, userForm, setUserForm }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input type="text" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="First name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
              <input type="text" value={userForm.middle_name} onChange={(e) => setUserForm({ ...userForm, middle_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Middle name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input type="text" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Last name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input type="text" value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone number" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
              <input type="text" value={userForm.whatsapp_number} onChange={(e) => setUserForm({ ...userForm, whatsapp_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="WhatsApp number" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input type="text" value={userForm.state} onChange={(e) => setUserForm({ ...userForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="State" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input type="text" value={userForm.city} onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input type="text" value={userForm.zip_code} onChange={(e) => setUserForm({ ...userForm, zip_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Zip code" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input type="text" value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Address" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" required /></div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-blue-600 rounded-lg font-medium transition-colors">Add User</button>
          </div>
        </form>
      </div>
    </div>
  )
}

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <ToastContainer position="top-right" autoClose={3000} />
    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" style={{ display: 'none' }} />
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
    <p className="text-gray-600">Manage and monitor user accounts</p>
  </div>
  <div className="flex items-center gap-3">
    <button onClick={() => setShowAddUserModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-blue-600 rounded-lg font-medium transition-colors">
      <UserPlus className="w-4 h-4 mr-2" />Add User
    </button>
    <button onClick={handleImport} className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-green-600 rounded-lg font-medium transition-colors">
      <Upload className="w-4 h-4 mr-2" />Import
    </button>
    <button onClick={handleExport} className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-green-600 rounded-lg font-medium transition-colors">
      <Download className="w-4 h-4 mr-2" />Export
    </button>
    <button onClick={handleSampleDownload} className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-blue-600 rounded-lg font-medium transition-colors">
      <FileDown className="w-4 h-4 mr-2" />Sample
    </button>
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <UsersIcon className="w-4 h-4" /><span>{filteredUsers.length} users</span>
    </div>
  </div>
</div>
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
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
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {activeFilter && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-10">
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
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">{selectedUsers.length} users selected</span>
                <div className="flex gap-2">
                 <button onClick={handleBulkDelete} className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
  <Trash2 className="w-4 h-4 mr-2" />Delete Selected
</button>
<button onClick={handleBulkSendCash} className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
  <DollarSign className="w-4 h-4 mr-2" />Pay Cash
</button>
<button onClick={handleBulkSendEmail} className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
  <Send className="w-4 h-4 mr-2" />Send Email
</button>
                  <button
                    onClick={handleBulkRevokeCash}
                    className="inline-flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Revoke Cash
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                  {selectedUsers.length === 0 && (
  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
    Actions
  </th>
)}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                {paginatedUsers.map((user, index) => (
  <tr key={user._id} className="hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
onChange={() => handleUserSelect(user._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.first_name.charAt(0).toUpperCase()}
                          {user.last_name.charAt(0).toUpperCase()}
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
                        {user.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                        {user.whatsapp_number}
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
                    {selectedUsers.length === 0 && (
  <td className="px-6 py-4 whitespace-nowrap">
    <div className="flex justify-center space-x-2">
      <button onClick={() => handleDeleteUser(user)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
      <button onClick={() => handlePayCash(user)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Pay Cash">
        <DollarSign className="w-4 h-4" />
      </button>
      <button onClick={() => handleChangePassword(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Change Password">
        <Key className="w-4 h-4" />
      </button>
      <button onClick={() => handleSendEmail(user)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Send Email">
        <Send className="w-4 h-4" />
      </button>
    </div>
  </td>
)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginatedUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50 dark:bg-gray-800 border border-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
      <CashModal
        show={showCashModal}
        onClose={() => setShowCashModal(false)}
        onSubmit={handleCashModalFormSubmit}
        cashForm={cashForm}
        setCashForm={setCashForm}
        isFreeCashValidForAllProducts={isFreeCashValidForAllProducts}
        onAllProductsChange={handleAllProductsChange}
        loadingCategories={loadingCategories}
        categoriesFetchingError={categoriesFetchingError}
        renderCategoryDropdowns={renderCategoryDropdowns}
        categoryPath={categoryPath}
        selectedCategoryIds={selectedCategoryIds}
        allCategoriesFlat={allCategoriesFlat}
        setSelectedCategoryIds={setSelectedCategoryIds}
        mainCategoryError={mainCategoryError}
      />
      <PasswordModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={confirmChangePassword}
      />
      <EmailModal show={showEmailModal} onClose={() => setShowEmailModal(false)} onSubmit={confirmSendEmail} emailForm={emailForm} setEmailForm={setEmailForm} />
<AddUserModal show={showAddUserModal} onClose={() => setShowAddUserModal(false)} onSubmit={handleAddUser} userForm={userForm} setUserForm={setUserForm} />
    </div>
  );
}