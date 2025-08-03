"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Upload, X, ChevronDown, AlertCircle, Info } from "lucide-react"
import axios from "axios"

// Dimension units
const dimensionUnits = ["cm", "m", "inch"]

export default function AddProduct() {
  // Main product fields
  const [productData, setProductData] = useState({
    name: "",
    stock: "",
    price: "",
    image: null,
    selectedCategories: [], // Array to store selected category IDs
  })

  // Product details (key-value pairs)
  const [productDetails, setProductDetails] = useState([
    { id: Date.now(), key: "", value: "" },
    { id: Date.now() + 1, key: "", value: "" },
  ])

  // Main product bulk pricing (when main price is filled)
  const [mainBulkPricing, setMainBulkPricing] = useState([])

  // Variants data
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      colorName: "",
      image: null,
      sizes: [
        {
          id: Date.now(),
          length: "",
          breadth: "",
          height: "",
          unit: "cm",
        },
      ],
      price: "",
      isPriceCommon: "yes",
      stock: "",
      isStockCommon: "yes",
      variantPrices: {},
      variantStocks: {},
      bulkPricing: {},
      optionalDetails: {},
    },
  ])

  // Form validation states
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)
  const [variantImagePreviews, setVariantImagePreviews] = useState({})
  const [categories, setCategories] = useState([])
  const [mainCategories, setMainCategories] = useState([])
  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [selectedPath, setSelectedPath] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const apiUrl = 'http://localhost:3000'
      console.log("Fetching categories from:", `${apiUrl}/api/category/all`)
      const response = await axios.get(`${apiUrl}/api/category/all`, {
        withCredentials: true,
      })
      console.log("Categories fetched:", response.data)
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid category data received")
      }
      setCategories(response.data)
      const mainCats = response.data.filter(
        (cat) => !cat.parentCategoryId && !cat.parent_category_id
      )
      console.log("Main categories set:", mainCats)
      setMainCategories(mainCats)
      let allCategories = [...response.data]
      response.data.forEach((cat) => {
        if (cat.subcategories && Array.isArray(cat.subcategories)) {
          allCategories = [...allCategories, ...cat.subcategories]
        }
      })
      setCategories(allCategories)
      console.log("All categories set:", allCategories)
    } catch (error) {
      console.error("Error fetching categories:", error.response?.data || error.message)
      const errorMessage =
        error.response?.status === 401
          ? "Unauthorized: Please log in as an admin."
          : error.response?.status === 403
          ? "Forbidden: Admin access required."
          : error.response?.data?.error || "Failed to load categories. Please check your connection or server status."
      setFetchError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Handle main category change
  const handleMainCategoryChange = useCallback(
    (e) => {
      const selectedId = e.target.value
      setErrors((prev) => ({ ...prev, category_0: "" }))
      if (!selectedId) {
        setProductData((prev) => ({
          ...prev,
          selectedCategories: [],
        }))
        setSelectedPath([])
        setSubCategoryOptions([])
        return
      }
      const selectedCategory = categories.find((cat) => cat._id === selectedId)
      if (!selectedCategory) {
        console.error("Selected main category not found:", selectedId)
        return
      }
      setProductData((prev) => ({
        ...prev,
        selectedCategories: [selectedId],
      }))
      setSelectedPath([selectedCategory])
      let subs = selectedCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter(
          (cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId
        )
      }
      setSubCategoryOptions(subs)
    },
    [categories]
  )

  // Handle subcategory change
  const handleSubCategoryChange = useCallback(
    (e) => {
      const selectedId = e.target.value
      if (!selectedId) {
        const parentCategory = selectedPath[0]
        setProductData((prev) => ({
          ...prev,
          selectedCategories: [parentCategory._id],
        }))
        setSelectedPath([parentCategory])
        let subs = parentCategory.subcategories || []
        if (subs.length === 0) {
          subs = categories.filter(
            (cat) => cat.parentCategoryId === parentCategory._id || cat.parent_category_id === parentCategory._id
          )
        }
        setSubCategoryOptions(subs)
        return
      }
      let selectedCategory = subCategoryOptions.find((cat) => cat._id === selectedId)
      if (!selectedCategory) {
        selectedCategory = categories.find((cat) => cat._id === selectedId)
      }
      if (!selectedCategory) {
        console.error("Selected subcategory not found:", selectedId)
        return
      }
      const newSelectedPath = [...selectedPath, selectedCategory]
      setProductData((prev) => ({
        ...prev,
        selectedCategories: newSelectedPath.map((cat) => cat._id),
      }))
      setSelectedPath(newSelectedPath)
      let subs = selectedCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter(
          (cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId
        )
      }
      setSubCategoryOptions(subs)
    },
    [categories, selectedPath, subCategoryOptions]
  )

  // Handle breadcrumb click
  const handleBreadcrumbClick = useCallback(
    (index) => {
      const newSelectedPath = selectedPath.slice(0, index + 1)
      setSelectedPath(newSelectedPath)
      const lastCategory = newSelectedPath[newSelectedPath.length - 1]
      let subs = lastCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter(
          (cat) => cat.parentCategoryId === lastCategory._id || cat.parent_category_id === lastCategory._id
        )
      }
      setSubCategoryOptions(subs)
      setProductData((prev) => ({
        ...prev,
        selectedCategories: newSelectedPath.map((cat) => cat._id),
      }))
    },
    [categories, selectedPath]
  )

  // Generate category path for display
  const getCategoryPath = () => {
    return selectedPath.map((cat, index) => (
      <span key={cat._id}>
        <button
          type="button"
          onClick={() => handleBreadcrumbClick(index)}
          className="text-blue-600 hover:underline"
        >
          {cat.categoryName}
        </button>
        {index < selectedPath.length - 1 && <span className="mx-1">&gt;</span>}
      </span>
    ))
  }

  // Render category dropdowns
  const renderCategoryDropdowns = () => {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedPath[0]?._id || ""}
              onChange={handleMainCategoryChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-colors ${
                errors.category_0 ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select main category</option>
              {mainCategories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.category_0 && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.category_0}
            </p>
          )}
        </div>
        {subCategoryOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Category
            </label>
            <div className="relative">
              <select
                value={selectedPath[selectedPath.length - 1]?._id || ""}
                onChange={handleSubCategoryChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-colors"
              >
                <option value="">Select sub category</option>
                {subCategoryOptions.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </>
    )
  }

  // Check if any main field is filled
  const isAnyMainFieldFilled = () => {
    return productData.stock || productData.price || productData.image
  }

  // Check if main fields are completely filled
  const areMainFieldsFilled = () => {
    return productData.name && productData.stock && productData.price && productData.image
  }

  // Handle main product data changes
  const handleProductDataChange = (field, value) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProductData((prev) => ({
        ...prev,
        image: file,
      }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle variant image upload
  const handleVariantImageUpload = (variantId, e) => {
    const file = e.target.files[0]
    if (file) {
      setVariants((prev) =>
        prev.map((variant) => {
          if (variant.id === variantId) {
            return { ...variant, image: file }
          }
          return variant
        }),
      )
      const reader = new FileReader()
      reader.onload = (e) => {
        setVariantImagePreviews((prev) => ({
          ...prev,
          [variantId]: e.target.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Product details functions
  const addProductDetail = () => {
    setProductDetails((prev) => [...prev, { id: Date.now(), key: "", value: "" }])
  }

  const removeProductDetail = (detailId) => {
    if (productDetails.length > 1) {
      setProductDetails((prev) => prev.filter((detail) => detail.id !== detailId))
    }
  }

  const updateProductDetail = (detailId, field, value) => {
    setProductDetails((prev) =>
      prev.map((detail) => {
        if (detail.id === detailId) {
          return { ...detail, [field]: value }
        }
        return detail
      }),
    )
  }

  // Main bulk pricing functions
  const addMainBulkPricing = () => {
    setMainBulkPricing((prev) => [
      ...prev,
      {
        id: Date.now(),
        wholesalePrice: "",
        quantity: "",
      },
    ])
  }

  const removeMainBulkPricing = (bulkId) => {
    setMainBulkPricing((prev) => prev.filter((bulk) => bulk.id !== bulkId))
  }

  const updateMainBulkPricing = (bulkId, field, value) => {
    setMainBulkPricing((prev) =>
      prev.map((bulk) => {
        if (bulk.id === bulkId) {
          return { ...bulk, [field]: value }
        }
        return bulk
      }),
    )
  }

  // Validate main bulk pricing
  const validateMainBulkPricing = (newBulk, index) => {
    const basePrice = Number.parseFloat(productData.price)
    const wholesalePrice = Number.parseFloat(newBulk.wholesalePrice)
    const quantity = Number.parseInt(newBulk.quantity)

    if (wholesalePrice >= basePrice) {
      return "Wholesale price must be less than the retail price"
    }

    for (let i = 0; i < index; i++) {
      const prevBulk = mainBulkPricing[i]
      const prevWholesalePrice = Number.parseFloat(prevBulk.wholesalePrice)
      const prevQuantity = Number.parseInt(prevBulk.quantity)

      if (wholesalePrice >= prevWholesalePrice) {
        return "Wholesale price must be less than the previous wholesale price"
      }

      if (quantity <= prevQuantity) {
        return "Quantity must be greater than the previous quantity"
      }
    }

    return null
  }

  // Add new variant
  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      colorName: "",
      image: null,
      sizes: [
        {
          id: Date.now(),
          length: "",
          breadth: "",
          height: "",
          unit: "cm",
        },
      ],
      price: "",
      isPriceCommon: "yes",
      stock: "",
      isStockCommon: "yes",
      variantPrices: {},
      variantStocks: {},
      bulkPricing: {},
      optionalDetails: {},
    }
    setVariants((prev) => [...prev, newVariant])
  }

  // Remove variant
  const removeVariant = (variantId) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== variantId))
    setVariantImagePreviews((prev) => {
      const { [variantId]: removed, ...rest } = prev
      return rest
    })
  }

  // Update variant data
  const updateVariant = (variantId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedVariant = { ...variant, [field]: value }
          if (field === "isPriceCommon") {
            updatedVariant.variantPrices = {}
            updatedVariant.bulkPricing = {}
          }
          if (field === "isStockCommon") {
            updatedVariant.variantStocks = {}
          }
          return updatedVariant
        }
        return variant
      }),
    )
  }

  // Add size to variant
  const addSizeToVariant = (variantId) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const newSize = {
            id: Date.now(),
            length: "",
            breadth: "",
            height: "",
            unit: "cm",
          }
          return {
            ...variant,
            sizes: [...variant.sizes, newSize],
          }
        }
        return variant
      }),
    )
  }

  // Remove size from variant
  const removeSizeFromVariant = (variantId, sizeId) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizes: variant.sizes.filter((size) => size.id !== sizeId),
          }
        }
        return variant
      }),
    )
  }

  // Update size in variant
  const updateSizeInVariant = (variantId, sizeId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizes: variant.sizes.map((size) => {
              if (size.id === sizeId) {
                return { ...size, [field]: value }
              }
              return size
            }),
          }
        }
        return variant
      }),
    )
  }

  // Generate variant combinations
  const generateVariantCombinations = (variant) => {
    if (!variant.colorName) return []

    return variant.sizes
      .filter((size) => {
        const filledDimensions = [size.length, size.breadth, size.height].filter((dim) => dim.trim() !== "").length
        return filledDimensions >= 2
      })
      .map((size) => {
        const dimensions = [size.length, size.breadth, size.height].filter((dim) => dim.trim() !== "").join(" X ")
        return {
          key: `${variant.colorName}-${size.id}`,
          display: `${variant.colorName}, ${dimensions} ${size.unit}`,
          sizeId: size.id,
        }
      })
  }

  // Update variant price for specific combination
  const updateVariantPrice = (variantId, combinationKey, price) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            variantPrices: {
              ...variant.variantPrices,
              [combinationKey]: price,
            },
          }
        }
        return variant
      }),
    )
  }

  // Update variant stock for specific combination
  const updateVariantStock = (variantId, combinationKey, stock) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            variantStocks: {
              ...variant.variantStocks,
              [combinationKey]: stock,
            },
          }
        }
        return variant
      }),
    )
  }

  // Optional details functions for variants
  const addOptionalDetail = (variantId, combinationKey) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const existingDetails = variant.optionalDetails[combinationKey] || []
          return {
            ...variant,
            optionalDetails: {
              ...variant.optionalDetails,
              [combinationKey]: [
                ...existingDetails,
                {
                  id: Date.now(),
                  key: "",
                  value: "",
                },
              ],
            },
          }
        }
        return variant
      }),
    )
  }

  const removeOptionalDetail = (variantId, combinationKey, detailId) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedDetails = variant.optionalDetails[combinationKey].filter((detail) => detail.id !== detailId)
          return {
            ...variant,
            optionalDetails: {
              ...variant.optionalDetails,
              [combinationKey]: updatedDetails,
            },
          }
        }
        return variant
      }),
    )
  }

  const updateOptionalDetail = (variantId, combinationKey, detailId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedDetails = variant.optionalDetails[combinationKey].map((detail) => {
            if (detail.id === detailId) {
              return { ...detail, [field]: value }
            }
            return detail
          })
          return {
            ...variant,
            optionalDetails: {
              ...variant.optionalDetails,
              [combinationKey]: updatedDetails,
            },
          }
        }
        return variant
      }),
    )
  }

  // Add bulk pricing for variant combination
  const addBulkPricing = (variantId, combinationKey) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const existingBulkPricing = variant.bulkPricing[combinationKey] || []
          const newBulkPricing = {
            id: Date.now(),
            wholesalePrice: "",
            quantity: "",
          }
          return {
            ...variant,
            bulkPricing: {
              ...variant.bulkPricing,
              [combinationKey]: [...existingBulkPricing, newBulkPricing],
            },
          }
        }
        return variant
      }),
    )
  }

  // Update bulk pricing
  const updateBulkPricing = (variantId, combinationKey, bulkPricingId, field, value) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedBulkPricing = variant.bulkPricing[combinationKey].map((bulk) => {
            if (bulk.id === bulkPricingId) {
              return { ...bulk, [field]: value }
            }
            return bulk
          })
          return {
            ...variant,
            bulkPricing: {
              ...variant.bulkPricing,
              [combinationKey]: updatedBulkPricing,
            },
          }
        }
        return variant
      }),
    )
  }

  // Remove bulk pricing
  const removeBulkPricing = (variantId, combinationKey, bulkPricingId) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id === variantId) {
          const updatedBulkPricing = variant.bulkPricing[combinationKey].filter((bulk) => bulk.id !== bulkPricingId)
          return {
            ...variant,
            bulkPricing: {
              ...variant.bulkPricing,
              [combinationKey]: updatedBulkPricing,
            },
          }
        }
        return variant
      }),
    )
  }

  // Validate bulk pricing
  const validateBulkPricing = (variant, combinationKey, newBulkPricing, currentIndex) => {
    const basePrice = variant.isPriceCommon === "yes" ? variant.price : variant.variantPrices[combinationKey]
    const existingBulkPricing = variant.bulkPricing[combinationKey] || []
    const wholesalePrice = Number.parseFloat(newBulkPricing.wholesalePrice)
    const quantity = Number.parseInt(newBulkPricing.quantity)

    if (wholesalePrice >= Number.parseFloat(basePrice)) {
      return "Wholesale price must be less than the retail price"
    }

    for (let i = 0; i < currentIndex; i++) {
      const existing = existingBulkPricing[i]
      const existingWholesalePrice = Number.parseFloat(existing.wholesalePrice)
      const existingQuantity = Number.parseInt(existing.quantity)

      if (wholesalePrice >= existingWholesalePrice) {
        return "Wholesale price must be less than the previous wholesale price"
      }

      if (quantity <= existingQuantity) {
        return "Quantity must be greater than the previous quantity"
      }
    }

    return null
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!productData.name) newErrors.name = "Product name is required"
    if (!productData.selectedCategories.length) newErrors.category_0 = "Main category is required"

    if (!isAnyMainFieldFilled()) {
      variants.forEach((variant, index) => {
        if (!variant.colorName) {
          newErrors[`variant_${index}_color`] = "Color name is required"
        }
        variant.sizes.forEach((size, sizeIndex) => {
          const filledDimensions = [size.length, size.breadth, size.height].filter((dim) => dim.trim() !== "").length
          if (filledDimensions < 2) {
            newErrors[`variant_${index}_size_${sizeIndex}`] = "At least 2 dimensions are required"
          }
        })
      })
    } else {
      if (!productData.stock) newErrors.stock = "Stock is required"
      if (!productData.price) newErrors.price = "Price is required"
      if (!productData.image) newErrors.image = "Image is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("name", productData.name)
    formDataToSend.append("stock", productData.stock)
    formDataToSend.append("price", productData.price)
    if (productData.image) formDataToSend.append("image", productData.image)
    formDataToSend.append("details", JSON.stringify(productDetails.filter((detail) => detail.key && detail.value)))
    formDataToSend.append("categoryId", productData.selectedCategories[productData.selectedCategories.length - 1] || "")
    formDataToSend.append("categoryPath", JSON.stringify(productData.selectedCategories))
    formDataToSend.append("mainBulkPricing", JSON.stringify(isAnyMainFieldFilled() ? mainBulkPricing : []))
    formDataToSend.append("variants", JSON.stringify(isAnyMainFieldFilled() ? [] : variants))

    try {
      const response = await axios.post("http://localhost:3000/api/product/add", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })
      console.log("Product added successfully:", response.data)
      alert("Product added successfully!")
      setProductData({ name: "", stock: "", price: "", image: null, selectedCategories: [] })
      setSelectedPath([])
      setSubCategoryOptions([])
      setImagePreview(null)
      setProductDetails([
        { id: Date.now(), key: "", value: "" },
        { id: Date.now() + 1, key: "", value: "" },
      ])
      setMainBulkPricing([])
      setVariants([
        {
          id: Date.now(),
          colorName: "",
          image: null,
          sizes: [
            {
              id: Date.now(),
              length: "",
              breadth: "",
              height: "",
              unit: "cm",
            },
          ],
          price: "",
          isPriceCommon: "yes",
          stock: "",
          isStockCommon: "yes",
          variantPrices: {},
          variantStocks: {},
          bulkPricing: {},
          optionalDetails: {},
        },
      ])
      setVariantImagePreviews({})
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Failed to add product. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Add New Product</h1>
            <p className="text-blue-100 mt-1">Fill in the details to add a new product to your inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Main Product Fields */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h2>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) => handleProductDataChange("name", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Categories */}
              {loading ? (
                <p className="text-gray-600">Loading categories...</p>
              ) : fetchError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 text-sm flex items-center gap-1 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    {fetchError}
                  </p>
                  <button
                    type="button"
                    onClick={fetchCategories}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : mainCategories.length === 0 ? (
                <p className="text-gray-600">No categories available. Please add categories first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderCategoryDropdowns()}
                </div>
              )}

              {/* Category Path */}
              {selectedPath.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Category Path:</span> {getCategoryPath()}
                  </p>
                </div>
              )}

              {/* Product Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Product Details</label>
                  <button
                    type="button"
                    onClick={addProductDetail}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Detail
                  </button>
                </div>

                <div className="space-y-3">
                  {productDetails.map((detail, index) => (
                    <div key={detail.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={detail.key}
                        onChange={(e) => updateProductDetail(detail.id, "key", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detail name (e.g., Material)"
                      />
                      <input
                        type="text"
                        value={detail.value}
                        onChange={(e) => updateProductDetail(detail.id, "value", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detail value (e.g., Cotton)"
                      />
                      {productDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductDetail(detail.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-white mr-2" />
                  <p className="text-white font-bold">
                    If you want variants for this product, don't fill the fields below (Stock, Price, Image)
                  </p>
                </div>
              </div>

              {/* Stock and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={productData.stock}
                    onChange={(e) => handleProductDataChange("stock", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.stock ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter stock quantity"
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.stock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productData.price}
                    onChange={(e) => handleProductDataChange("price", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter price"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.price}
                    </p>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        errors.image ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        {productData.image ? productData.image.name : "Choose image file"}
                      </span>
                    </label>
                    {errors.image && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.image}
                      </p>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Main Bulk Pricing */}
              {productData.price && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">Bulk Pricing</h3>
                    <button
                      type="button"
                      onClick={addMainBulkPricing}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Bulk Price
                    </button>
                  </div>

                  {mainBulkPricing.map((bulk, index) => (
                    <div key={bulk.id} className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-800">Bulk Price {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMainBulkPricing(bulk.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Wholesale Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={bulk.wholesalePrice}
                            onChange={(e) => updateMainBulkPricing(bulk.id, "wholesalePrice", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                            placeholder="Wholesale price"
                          />
                          {bulk.wholesalePrice && validateMainBulkPricing(bulk, index) && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validateMainBulkPricing(bulk, index)}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            <span className="font-bold">This quantity will be included</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={bulk.quantity}
                            onChange={(e) => updateMainBulkPricing(bulk.id, "quantity", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                            placeholder="Minimum quantity"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Variants Section */}
            {!isAnyMainFieldFilled() && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Product Variants
                  </h2>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </button>
                </div>

                {variants.map((variant, variantIndex) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-800">Variant {variantIndex + 1}</h3>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Color Name and Image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={variant.colorName}
                          onChange={(e) => updateVariant(variant.id, "colorName", e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors[`variant_${variantIndex}_color`] ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Enter color name (e.g., Red, Blue, etc.)"
                        />
                        {errors[`variant_${variantIndex}_color`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors[`variant_${variantIndex}_color`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Variant Image</label>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleVariantImageUpload(variant.id, e)}
                              className="hidden"
                              id={`variant-image-upload-${variant.id}`}
                            />
                            <label
                              htmlFor={`variant-image-upload-${variant.id}`}
                              className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <Upload className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-600 text-sm">
                                {variant.image ? variant.image.name : "Choose image"}
                              </span>
                            </label>
                          </div>
                          {variantImagePreviews[variant.id] && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                              <img
                                src={variantImagePreviews[variant.id] || "/placeholder.svg"}
                                alt="Variant Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Sizes <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => addSizeToVariant(variant.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Size
                        </button>
                      </div>

                      <div className="space-y-4">
                        {variant.sizes.map((size, sizeIndex) => (
                          <div key={size.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Size {sizeIndex + 1}</span>
                              {variant.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSizeFromVariant(variant.id, size.id)}
                                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Length</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={size.length}
                                  onChange={(e) => updateSizeInVariant(variant.id, size.id, "length", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Length"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Breadth</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={size.breadth}
                                  onChange={(e) => updateSizeInVariant(variant.id, size.id, "breadth", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Breadth"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={size.height}
                                  onChange={(e) => updateSizeInVariant(variant.id, size.id, "height", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Height"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                                <select
                                  value={size.unit}
                                  onChange={(e) => updateSizeInVariant(variant.id, size.id, "unit", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                >
                                  {dimensionUnits.map((unit) => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {errors[`variant_${variantIndex}_size_${sizeIndex}`] && (
                              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors[`variant_${variantIndex}_size_${sizeIndex}`]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="space-y-4">
                      {variant.sizes.length === 1 ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter price"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {variant.isPriceCommon === "yes" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter price"
                              />
                            </div>
                          )}
                          <div className={variant.isPriceCommon === "no" ? "col-span-full" : ""}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Is this price common for all sizes?
                            </label>
                            <select
                              value={variant.isPriceCommon}
                              onChange={(e) => updateVariant(variant.id, "isPriceCommon", e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {variant.isPriceCommon === "no" && variant.sizes.length > 1 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">Set price for each combination:</h4>
                          {generateVariantCombinations(variant).map((combination) => (
                            <div key={combination.key} className="space-y-3">
                              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <span className="flex-1 text-sm font-medium text-gray-700">{combination.display}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variant.variantPrices[combination.key] || ""}
                                  onChange={(e) => updateVariantPrice(variant.id, combination.key, e.target.value)}
                                  className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Price"
                                />
                              </div>

                              <div className="ml-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Optional Details</span>
                                  <button
                                    type="button"
                                    onClick={() => addOptionalDetail(variant.id, combination.key)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Detail
                                  </button>
                                </div>

                                {(variant.optionalDetails[combination.key] || []).map((detail) => (
                                  <div key={detail.id} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={detail.key}
                                      onChange={(e) =>
                                        updateOptionalDetail(
                                          variant.id,
                                          combination.key,
                                          detail.id,
                                          "key",
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="Detail name"
                                    />
                                    <input
                                      type="text"
                                      value={detail.value}
                                      onChange={(e) =>
                                        updateOptionalDetail(
                                          variant.id,
                                          combination.key,
                                          detail.id,
                                          "value",
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="Detail value"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeOptionalDetail(variant.id, combination.key, detail.id)}
                                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stock Section */}
                    <div className="space-y-4">
                      {variant.sizes.length === 1 ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter stock quantity"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {variant.isStockCommon === "yes" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter stock quantity"
                              />
                            </div>
                          )}
                          <div className={variant.isStockCommon === "no" ? "col-span-full" : ""}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Is this stock common for all combinations?
                            </label>
                            <select
                              value={variant.isStockCommon}
                              onChange={(e) => updateVariant(variant.id, "isStockCommon", e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {variant.isStockCommon === "no" && variant.sizes.length > 1 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">Set stock for each combination:</h4>
                          {generateVariantCombinations(variant).map((combination) => (
                            <div key={combination.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <span className="flex-1 text-sm font-medium text-gray-700">{combination.display}</span>
                              <input
                                type="number"
                                min="0"
                                value={variant.variantStocks[combination.key] || ""}
                                onChange={(e) => updateVariantStock(variant.id, combination.key, e.target.value)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Stock"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bulk Pricing Section */}
                    {!productData.price && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 border-t border-gray-200 pt-4">Bulk Pricing</h4>

                        {variant.isPriceCommon === "yes" || variant.sizes.length === 1 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Bulk pricing for all combinations
                              </span>
                              <button
                                type="button"
                                onClick={() => addBulkPricing(variant.id, "common")}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Add Bulk Price
                              </button>
                            </div>

                            {(variant.bulkPricing.common || []).map((bulk, bulkIndex) => (
                              <div key={bulk.id} className="bg-purple-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-purple-800">
                                    Bulk Price {bulkIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeBulkPricing(variant.id, "common", bulk.id)}
                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Wholesale Price ($)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={bulk.wholesalePrice}
                                      onChange={(e) =>
                                        updateBulkPricing(
                                          variant.id,
                                          "common",
                                          bulk.id,
                                          "wholesalePrice",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                      placeholder="Wholesale price"
                                    />
                                    {bulk.wholesalePrice && validateBulkPricing(variant, "common", bulk, bulkIndex) && (
                                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {validateBulkPricing(variant, "common", bulk, bulkIndex)}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      <span className="font-bold">This quantity will be included</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={bulk.quantity}
                                      onChange={(e) =>
                                        updateBulkPricing(
                                          variant.id,
                                          "common",
                                          bulk.id,
                                          "quantity",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                      placeholder="Minimum quantity"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {generateVariantCombinations(variant).map((combination) => (
                              <div key={combination.key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-700">{combination.display}</span>
                                  <button
                                    type="button"
                                    onClick={() => addBulkPricing(variant.id, combination.key)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Bulk Price
                                  </button>
                                </div>

                                {(variant.bulkPricing[combination.key] || []).map((bulk, bulkIndex) => (
                                  <div key={bulk.id} className="bg-purple-50 p-3 rounded-lg mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-purple-800">
                                        Bulk Price {bulkIndex + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeBulkPricing(variant.id, combination.key, bulk.id)}
                                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Wholesale Price ($)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={bulk.wholesalePrice}
                                          onChange={(e) =>
                                            updateBulkPricing(
                                              variant.id,
                                              combination.key,
                                              bulk.id,
                                              "wholesalePrice",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                          placeholder="Wholesale price"
                                        />
                                        {bulk.wholesalePrice &&
                                          validateBulkPricing(variant, combination.key, bulk, bulkIndex) && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              {validateBulkPricing(variant, combination.key, bulk, bulkIndex)}
                                            </p>
                                          )}
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          <span className="font-bold">This quantity will be included</span>
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={bulk.quantity}
                                          onChange={(e) =>
                                            updateBulkPricing(
                                              variant.id,
                                              combination.key,
                                              bulk.id,
                                              "quantity",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                          placeholder="Minimum quantity"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}