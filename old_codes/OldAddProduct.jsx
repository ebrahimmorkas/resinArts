"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Trash2, Plus } from "lucide-react"
import axios from "axios"

const PriceRangeSection = React.memo(
  ({
    ranges,
    onRangeChange,
    onAddRange,
    onRemoveRange,
    title,
    isRequired = false,
    isRetailPriceDisabled = false,
    errors = {}, // NEW: Pass errors prop
    parentIndex, // NEW: For specific error keys
    sectionType, // NEW: To differentiate error keys
  }) => {
    const getError = (field, index) => {
      const key = `${sectionType}_${parentIndex}_${index}_${field}`
      return errors[key]
    }

    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-blue-800">
            {title} {isRequired && <span className="text-red-500">*</span>}{" "}
            <span className="font-bold"> (The threshold quantity will be included in retail price)</span>
          </h4>
          <button
            type="button"
            onClick={onAddRange}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={12} />
            Add Range
          </button>
        </div>
        <div className="space-y-3">
          {ranges.map((range, index) => (
            <div key={range._id || `range-${index}`} className="bg-white dark:bg-gray-900 p-3 rounded-md border border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Retail Price {index === 0 && isRequired ? "*" : ""}
                  </label>
                  <input
                    type="number"
                    value={range.retailPrice || ""}
                    onChange={(e) => onRangeChange(index, "retailPrice", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required={index === 0 && isRequired}
                    disabled={index > 0 || isRetailPriceDisabled} // Disable for subsequent ranges and if explicitly disabled
                  />
                  {getError("retailPrice", index) && (
                    <p className="text-red-500 text-xs mt-1">{getError("retailPrice", index)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Wholesale Price {index === 0 && isRequired ? "*" : ""}
                  </label>
                  <input
                    type="number"
                    value={range.wholesalePrice || ""}
                    onChange={(e) => onRangeChange(index, "wholesalePrice", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required={index === 0 && isRequired}
                  />
                  {getError("wholesalePrice", index) && (
                    <p className="text-red-500 text-xs mt-1">{getError("wholesalePrice", index)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Threshold Quantity {index === 0 && isRequired ? "*" : ""}
                  </label>
                  <input
                    type="number"
                    value={range.thresholdQuantity || ""}
                    onChange={(e) => onRangeChange(index, "thresholdQuantity", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                    min="1"
                    required={index === 0 && isRequired}
                  />
                  {getError("thresholdQuantity", index) && (
                    <p className="text-red-500 text-xs mt-1">{getError("thresholdQuantity", index)}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  {ranges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveRange(index)}
                      className="p-2 rounded-md transition-colors duration-200 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
)

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    categoryPath: [],
  })
  const [errors, setErrors] = useState({})
  const [details, setDetails] = useState([
    { name: "", value: "" },
    { name: "", value: "" },
    { name: "", value: "" },
  ])
 const [colorVariants, setColorVariants] = useState([
  {
    color: "",
    image: null, // This will be sent as a file and converted to imageUrl on the backend
    imageUrl: "", // Optional: Add to store the URL if you fetch it back
    price: "",
    isDefault: true,
    optionalDetails: [],
    priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
    forAllSizes: "yes",
    availableSizes: [],
  },
]);
  const [sizeVariants, setSizeVariants] = useState([
    {
      size: "",
      price: "",
      optionalDetails: [],
      priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
      isDefault: true,
      useDimensions: false,
      length: "",
      breadth: "",
      height: "",
      forAllColors: "yes",
      availableColors: [],
    },
  ])
  const [pricingSections, setPricingSections] = useState([
    {
      color: "",
      size: "",
      priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }], // Moved here
    },
  ])
  const [basePriceRanges, setBasePriceRanges] = useState([
    { retailPrice: "", wholesalePrice: "", thresholdQuantity: "" },
  ])
  const [categories, setCategories] = useState([])
  const [mainCategories, setMainCategories] = useState([])
  const [selectedPath, setSelectedPath] = useState([])
  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [fetchError, setFetchError] = useState("")

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"]

  const isBasePriceFilled = !!formData.price
  const isColorPriceFilled = colorVariants.some((v) => v.price && v.price !== "")
  const isSizePriceFilled = sizeVariants.some((v) => v.price && v.price !== "")
  const isPricingSectionFilled = pricingSections.some(
    (s) =>
      s.priceRanges &&
      s.priceRanges.some(
        (r) =>
          (r.retailPrice && r.retailPrice !== "") ||
          (r.wholesalePrice && r.wholesalePrice !== "") ||
          (r.thresholdQuantity && r.thresholdQuantity !== ""),
      ),
  )

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Fetching categories from /api/category/all...")
      const response = await axios.get("https://api.simplyrks.cloud/api/category/all", { withCredentials: true })
      const categoriesData = response.data
      console.log("Fetched categories:", JSON.stringify(categoriesData, null, 2))
      if (!Array.isArray(categoriesData)) {
        throw new Error("Invalid category data received")
      }
      setCategories(categoriesData)
      const mainCats = categoriesData.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
      setMainCategories(mainCats)
      console.log("Main categories set:", mainCats)
      let allCategories = [...categoriesData]
      categoriesData.forEach((cat) => {
        if (cat.subcategories && Array.isArray(cat.subcategories)) {
          allCategories = [...allCategories, ...cat.subcategories]
        }
      })
      setCategories(allCategories)
      console.log("All categories set:", allCategories)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching categories:", error.message)
      setFetchError("Failed to load categories. Please try again.")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleMainCategoryChange = useCallback(
    (e) => {
      const selectedId = e.target.value
      setErrors((prev) => ({ ...prev, category: "" })) // Clear category error
      if (!selectedId) {
        setFormData((prev) => ({
          ...prev,
          category: "",
          categoryPath: [],
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
      setFormData((prev) => ({
        ...prev,
        category: selectedId,
        categoryPath: [selectedId],
      }))
      setSelectedPath([selectedCategory])
      let subs = selectedCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter((cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId)
      }
      setSubCategoryOptions(subs)
    },
    [categories],
  )

  const handleSubCategoryChange = useCallback(
    (e) => {
      const selectedId = e.target.value
      if (!selectedId) {
        const parentCategory = selectedPath[0]
        setFormData((prev) => ({
          ...prev,
          category: parentCategory._id,
          categoryPath: [parentCategory._id],
        }))
        setSelectedPath([parentCategory])
        let subs = parentCategory.subcategories || []
        if (subs.length === 0) {
          subs = categories.filter(
            (cat) => cat.parentCategoryId === parentCategory._id || cat.parent_category_id === parentCategory._id,
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
      setFormData((prev) => ({
        ...prev,
        category: selectedId,
        categoryPath: newSelectedPath.map((cat) => cat._id),
      }))
      setSelectedPath(newSelectedPath)
      let subs = selectedCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter((cat) => cat.parentCategoryId === selectedId || cat.parent_category_id === selectedId)
      }
      setSubCategoryOptions(subs)
    },
    [categories, selectedPath, subCategoryOptions],
  )

  const handleBreadcrumbClick = useCallback(
    (index) => {
      const newSelectedPath = selectedPath.slice(0, index + 1)
      setSelectedPath(newSelectedPath)
      const lastCategory = newSelectedPath[newSelectedPath.length - 1]
      let subs = lastCategory.subcategories || []
      if (subs.length === 0) {
        subs = categories.filter(
          (cat) => cat.parentCategoryId === lastCategory._id || cat.parent_category_id === lastCategory._id,
        )
      }
      setSubCategoryOptions(subs)
      setFormData((prev) => ({
        ...prev,
        category: lastCategory._id,
        categoryPath: newSelectedPath.map((cat) => cat._id),
      }))
    },
    [categories, selectedPath],
  )

  const getCategoryBreadCrumb = () => {
    return selectedPath.map((cat, index) => (
      <span key={cat._id}>
        <button type="button" onClick={() => handleBreadcrumbClick(index)} className="text-blue-600 hover:underline">
          {cat.categoryName}
        </button>
        {index < selectedPath.length - 1 && <span className="mx-1">&gt;</span>}
      </span>
    ))
  }

  const renderCategoryDropdowns = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Main Category *</label>
          <select
            value={selectedPath[0]?._id || ""}
            onChange={handleMainCategoryChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            required
          >
            <option value="">Select Main Category</option>
            {mainCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.categoryName}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>
        {subCategoryOptions.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
            <select
              value={selectedPath[selectedPath.length - 1]?._id || ""}
              onChange={handleSubCategoryChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">Select Subcategory</option>
              {subCategoryOptions.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  }

  const validatePriceRangeField = useCallback(
    (currentRanges, index, field, value, sectionType, parentIndex) => {
      const newErrors = { ...errors }
      const keyPrefix = `${sectionType}_${parentIndex}_${index}`

      // Clear specific field error
      delete newErrors[`${keyPrefix}_${field}`]

      const updatedRanges = [...currentRanges]
      updatedRanges[index] = { ...updatedRanges[index], [field]: value }

      const retailPrice = Number.parseFloat(updatedRanges[index].retailPrice)
      const wholesalePrice = Number.parseFloat(updatedRanges[index].wholesalePrice)
      const thresholdQuantity = Number.parseInt(updatedRanges[index].thresholdQuantity)

      // Wholesale price validation (Point 1)
      if (field === "wholesalePrice" && !isNaN(retailPrice) && !isNaN(wholesalePrice) && wholesalePrice > retailPrice) {
        newErrors[`${keyPrefix}_wholesalePrice`] = "Wholesale price cannot be greater than retail price."
      } else if (
        field === "retailPrice" &&
        !isNaN(retailPrice) &&
        !isNaN(wholesalePrice) &&
        wholesalePrice > retailPrice
      ) {
        // Re-validate wholesale if retail changes
        delete newErrors[`${keyPrefix}_wholesalePrice`]
      }

      // Threshold quantity validation (Point 4)
      if (index > 0) {
        const prevThreshold = Number.parseInt(currentRanges[index - 1].thresholdQuantity)
        if (!isNaN(thresholdQuantity) && !isNaN(prevThreshold) && thresholdQuantity <= prevThreshold) {
          newErrors[`${keyPrefix}_thresholdQuantity`] =
            "Threshold quantity must be greater than the previous range's threshold."
        } else if (
          field === "thresholdQuantity" &&
          !isNaN(thresholdQuantity) &&
          !isNaN(prevThreshold) &&
          thresholdQuantity > prevThreshold
        ) {
          // Clear error if valid
          delete newErrors[`${keyPrefix}_thresholdQuantity`]
        }
      }

      setErrors(newErrors)
    },
    [errors],
  )

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setErrors((prev) => ({ ...prev, [field]: "" })) // Clear general field error

    if (field === "price") {
      setBasePriceRanges((prev) => {
        const updatedRanges = [...prev]
        if (updatedRanges[0]) {
          updatedRanges[0].retailPrice = value
        } else {
          updatedRanges.push({ retailPrice: value, wholesalePrice: "", thresholdQuantity: "" })
        }
        return updatedRanges
      })
      if (value) {
        // Clear other pricing fields
        setColorVariants((prev) =>
          prev.map((v) => ({
            ...v,
            price: "",
            priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
            forAllSizes: "yes",
            availableSizes: [],
          })),
        )
        setSizeVariants((prev) =>
          prev.map((v) => ({
            ...v,
            price: "",
            priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
          })),
        )
        setPricingSections([
          { color: "", size: "", priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }] },
        ])
      }
    }
  }

  const handleBasePriceRangeChange = useCallback(
    (index, field, value) => {
      setBasePriceRanges((prev) => {
        const updatedRanges = [...prev]
        updatedRanges[index][field] = value
        validatePriceRangeField(updatedRanges, index, field, value, "basePrice", 0)
        return updatedRanges
      })
    },
    [validatePriceRangeField],
  )

  const addBasePriceRange = () => {
    const lastRange = basePriceRanges[basePriceRanges.length - 1]
    const newRetailPrice = lastRange.wholesalePrice || ""
    const newThresholdQuantity = lastRange.thresholdQuantity ? Number.parseInt(lastRange.thresholdQuantity) + 1 : "" // Increment threshold
    setBasePriceRanges([
      ...basePriceRanges,
      { retailPrice: newRetailPrice, wholesalePrice: "", thresholdQuantity: newThresholdQuantity },
    ])
  }

  const removeBasePriceRange = (index) => {
    if (basePriceRanges.length > 1) {
      setBasePriceRanges(basePriceRanges.filter((_, i) => i !== index))
      // Clear errors related to removed range
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`basePrice_0_${index}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...details]
    updatedDetails[index][field] = value
    setDetails(updatedDetails)
  }

  const addMoreDetails = () => {
    setDetails([...details, { name: "", value: "" }])
  }

  const removeDetail = (index) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index))
    }
  }

  const handleColorVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...colorVariants]
    updatedVariants[variantIndex][field] = value
    setErrors((prev) => ({ ...prev, [`color_${variantIndex}`]: "" })) // Clear general color variant error

    if (field === "isDefault" && value) {
      updatedVariants.forEach((variant, index) => {
        variant.isDefault = index === variantIndex
      })
    }
    if (field === "price" && value === "0") {
      updatedVariants[variantIndex][field] = ""
    }
    if (field === "forAllSizes" && value === "yes") {
      updatedVariants[variantIndex].availableSizes = []
    }
    if (field === "price" && value) {
      updatedVariants[variantIndex].priceRanges[0].retailPrice = value
      // Clear other pricing fields
      setFormData((prev) => ({ ...prev, price: "" }))
      setBasePriceRanges([{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }])
      setSizeVariants((prev) =>
        prev.map((v) => ({
          ...v,
          price: "",
          priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        })),
      )
      setPricingSections([
        { color: "", size: "", priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }] },
      ])
    }
    setColorVariants(updatedVariants)
  }

  const handleColorAvailableSizesChange = (variantIndex, size) => {
    const updatedVariants = [...colorVariants]
    const currentSizes = updatedVariants[variantIndex].availableSizes
    if (currentSizes.includes(size)) {
      updatedVariants[variantIndex].availableSizes = currentSizes.filter((s) => s !== size)
    } else {
      updatedVariants[variantIndex].availableSizes = [...currentSizes, size]
    }
    setColorVariants(updatedVariants)
    setErrors((prev) => ({ ...prev, [`color_${variantIndex}`]: "" })) // Clear general color variant error
  }

  const handleColorOptionalDetailChange = (variantIndex, detailIndex, field, value) => {
    const updatedVariants = [...colorVariants]
    updatedVariants[variantIndex].optionalDetails[detailIndex][field] = value
    setColorVariants(updatedVariants)
  }

  const addColorOptionalDetail = (variantIndex) => {
    const updatedVariants = [...colorVariants]
    updatedVariants[variantIndex].optionalDetails.push({ name: "", value: "" })
    setColorVariants(updatedVariants)
  }

  const removeColorOptionalDetail = (variantIndex, detailIndex) => {
    const updatedVariants = [...colorVariants]
    updatedVariants[variantIndex].optionalDetails = updatedVariants[variantIndex].optionalDetails.filter(
      (_, i) => i !== detailIndex,
    )
    setColorVariants(updatedVariants)
  }

  const handleColorPriceRangeChange = useCallback(
    (variantIndex, rangeIndex, field, value) => {
      setColorVariants((prev) => {
        const updatedVariants = [...prev]
        updatedVariants[variantIndex].priceRanges[rangeIndex][field] = value
        validatePriceRangeField(
          updatedVariants[variantIndex].priceRanges,
          rangeIndex,
          field,
          value,
          "colorPrice",
          variantIndex,
        )
        return updatedVariants
      })
    },
    [validatePriceRangeField],
  )

  const addColorPriceRange = (variantIndex) => {
    const updatedVariants = [...colorVariants]
    const lastRange = updatedVariants[variantIndex].priceRanges[updatedVariants[variantIndex].priceRanges.length - 1]
    const newRetailPrice = lastRange.wholesalePrice || ""
    const newThresholdQuantity = lastRange.thresholdQuantity ? Number.parseInt(lastRange.thresholdQuantity) + 1 : ""
    updatedVariants[variantIndex].priceRanges.push({
      retailPrice: newRetailPrice,
      wholesalePrice: "",
      thresholdQuantity: newThresholdQuantity,
    })
    setColorVariants(updatedVariants)
  }

  const removeColorPriceRange = (variantIndex, rangeIndex) => {
    const updatedVariants = [...colorVariants]
    if (updatedVariants[variantIndex].priceRanges.length > 1) {
      updatedVariants[variantIndex].priceRanges = updatedVariants[variantIndex].priceRanges.filter(
        (_, i) => i !== rangeIndex,
      )
      setColorVariants(updatedVariants)
      // Clear errors related to removed range
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`colorPrice_${variantIndex}_${rangeIndex}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const addColorVariant = () => {
    setColorVariants([
      ...colorVariants,
      {
        color: "",
        image: null,
        price: "",
        isDefault: false,
        optionalDetails: [],
        priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        forAllSizes: "yes",
        availableSizes: [],
      },
    ])
  }

  const removeColorVariant = (index) => {
    if (colorVariants.length > 1) {
      setColorVariants(colorVariants.filter((_, i) => i !== index))
      // Clear errors related to removed variant
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`color_${index}`) || key.startsWith(`colorPrice_${index}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const handleImageUpload = (variantIndex, event) => {
  const file = event.target.files[0];
  if (file) {
    const updatedVariants = [...colorVariants];
    updatedVariants[variantIndex].image = file;
    updatedVariants[variantIndex].imageUrl = ""; // Clear imageUrl if a new file is uploaded
    setColorVariants(updatedVariants);
  }
};

  const handleSizeVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...sizeVariants]
    updatedVariants[variantIndex][field] = value
    setErrors((prev) => ({ ...prev, [`size_${variantIndex}`]: "" })) // Clear general size variant error

    if (field === "isDefault" && value) {
      updatedVariants.forEach((variant, index) => {
        variant.isDefault = index === variantIndex
      })
    }
    if (field === "price" && value === "0") {
      updatedVariants[variantIndex][field] = ""
    }
    if (field === "forAllColors" && value === "yes") {
      updatedVariants[variantIndex].availableColors = []
    }
    if (field === "price" && value) {
      updatedVariants[variantIndex].priceRanges[0].retailPrice = value
      // Clear other pricing fields
      setFormData((prev) => ({ ...prev, price: "" }))
      setBasePriceRanges([{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }])
      setColorVariants((prev) =>
        prev.map((v) => ({
          ...v,
          price: "",
          priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
          forAllSizes: "yes",
          availableSizes: [],
        })),
      )
      setPricingSections([
        { color: "", size: "", priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }] },
      ])
    }
    setSizeVariants(updatedVariants)
  }

  const handleSizeAvailableColorsChange = (variantIndex, color) => {
    const updatedVariants = [...sizeVariants]
    const currentColors = updatedVariants[variantIndex].availableColors
    if (currentColors.includes(color)) {
      updatedVariants[variantIndex].availableColors = currentColors.filter((c) => c !== color)
    } else {
      updatedVariants[variantIndex].availableColors = [...currentColors, color]
    }
    setSizeVariants(updatedVariants)
  }

  const toggleDimensions = (variantIndex) => {
    const updatedVariants = [...sizeVariants]
    updatedVariants[variantIndex].useDimensions = !updatedVariants[variantIndex].useDimensions
    if (!updatedVariants[variantIndex].useDimensions) {
      updatedVariants[variantIndex].length = ""
      updatedVariants[variantIndex].breadth = ""
      updatedVariants[variantIndex].height = ""
      updatedVariants[variantIndex].size = ""
    } else {
      updatedVariants[variantIndex].size = ""
    }
    setSizeVariants(updatedVariants)
  }

  const handleSizePriceRangeChange = useCallback(
    (variantIndex, rangeIndex, field, value) => {
      setSizeVariants((prev) => {
        const updatedVariants = [...prev]
        updatedVariants[variantIndex].priceRanges[rangeIndex][field] = value
        validatePriceRangeField(
          updatedVariants[variantIndex].priceRanges,
          rangeIndex,
          field,
          value,
          "sizePrice",
          variantIndex,
        )
        return updatedVariants
      })
    },
    [validatePriceRangeField],
  )

  const addSizePriceRange = (variantIndex) => {
    const updatedVariants = [...sizeVariants]
    const lastRange = updatedVariants[variantIndex].priceRanges[updatedVariants[variantIndex].priceRanges.length - 1]
    const newRetailPrice = lastRange.wholesalePrice || ""
    const newThresholdQuantity = lastRange.thresholdQuantity ? Number.parseInt(lastRange.thresholdQuantity) + 1 : ""
    updatedVariants[variantIndex].priceRanges.push({
      retailPrice: newRetailPrice,
      wholesalePrice: "",
      thresholdQuantity: newThresholdQuantity,
    })
    setSizeVariants(updatedVariants)
  }

  const removeSizePriceRange = (variantIndex, rangeIndex) => {
    const updatedVariants = [...sizeVariants]
    if (updatedVariants[variantIndex].priceRanges.length > 1) {
      updatedVariants[variantIndex].priceRanges = updatedVariants[variantIndex].priceRanges.filter(
        (_, i) => i !== rangeIndex,
      )
      setSizeVariants(updatedVariants)
      // Clear errors related to removed range
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`sizePrice_${variantIndex}_${rangeIndex}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const handleSizeOptionalDetailChange = (variantIndex, detailIndex, field, value) => {
    const updatedVariants = [...sizeVariants]
    updatedVariants[variantIndex].optionalDetails[detailIndex][field] = value
    setSizeVariants(updatedVariants)
  }

  const addSizeOptionalDetail = (variantIndex) => {
    const updatedVariants = [...sizeVariants]
    updatedVariants[variantIndex].optionalDetails.push({ name: "", value: "" })
    setSizeVariants(updatedVariants)
  }

  const removeSizeOptionalDetail = (variantIndex, detailIndex) => {
    const updatedVariants = [...sizeVariants]
    updatedVariants[variantIndex].optionalDetails = updatedVariants[variantIndex].optionalDetails.filter(
      (_, i) => i !== detailIndex,
    )
    setSizeVariants(updatedVariants)
  }

  const addSizeVariant = () => {
    setSizeVariants([
      ...sizeVariants,
      {
        size: "",
        price: "",
        optionalDetails: [],
        priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        isDefault: false,
        useDimensions: false,
        length: "",
        breadth: "",
        height: "",
        forAllColors: "yes",
        availableColors: [],
      },
    ])
  }

  const removeSizeVariant = (index) => {
    if (sizeVariants.length > 1) {
      setSizeVariants(sizeVariants.filter((_, i) => i !== index))
      // Clear errors related to removed variant
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`size_${index}`) || key.startsWith(`sizePrice_${index}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const handlePricingSectionChange = (index, field, value) => {
    const updatedPricing = [...pricingSections]
    updatedPricing[index][field] = value
    setErrors((prev) => ({ ...prev, [`pricingSection_${index}_${field}`]: "" })) // Clear specific field error

    if (field === "color" || field === "size") {
      // If color or size changes, clear price ranges for that section
      updatedPricing[index].priceRanges = [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }]
    }

    // Clear other pricing fields if this section becomes active
    if (value && (field === "color" || field === "size")) {
      setFormData((prev) => ({ ...prev, price: "" }))
      setBasePriceRanges([{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }])
      setColorVariants((prev) =>
        prev.map((v) => ({
          ...v,
          price: "",
          priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
          forAllSizes: "yes",
          availableSizes: [],
        })),
      )
      setSizeVariants((prev) =>
        prev.map((v) => ({
          ...v,
          price: "",
          priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        })),
      )
    }
    setPricingSections(updatedPricing)
  }

  const handlePricingSectionPriceRangeChange = useCallback(
    (sectionIndex, rangeIndex, field, value) => {
      setPricingSections((prev) => {
        const updatedPricing = [...prev]
        updatedPricing[sectionIndex].priceRanges[rangeIndex][field] = value
        validatePriceRangeField(
          updatedPricing[sectionIndex].priceRanges,
          rangeIndex,
          field,
          value,
          "pricingSection",
          sectionIndex,
        )
        return updatedPricing
      })
    },
    [validatePriceRangeField],
  )

  const addPricingSectionPriceRange = (sectionIndex) => {
    const updatedPricing = [...pricingSections]
    const lastRange = updatedPricing[sectionIndex].priceRanges[updatedPricing[sectionIndex].priceRanges.length - 1]
    const newRetailPrice = lastRange.wholesalePrice || ""
    const newThresholdQuantity = lastRange.thresholdQuantity ? Number.parseInt(lastRange.thresholdQuantity) + 1 : ""
    updatedPricing[sectionIndex].priceRanges.push({
      retailPrice: newRetailPrice,
      wholesalePrice: "",
      thresholdQuantity: newThresholdQuantity,
    })
    setPricingSections(updatedPricing)
  }

  const removePricingSectionPriceRange = (sectionIndex, rangeIndex) => {
    const updatedPricing = [...pricingSections]
    if (updatedPricing[sectionIndex].priceRanges.length > 1) {
      updatedPricing[sectionIndex].priceRanges = updatedPricing[sectionIndex].priceRanges.filter(
        (_, i) => i !== rangeIndex,
      )
      setPricingSections(updatedPricing)
      // Clear errors related to removed range
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`pricingSection_${sectionIndex}_${rangeIndex}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const addPricingSection = () => {
    setPricingSections([
      ...pricingSections,
      { color: "", size: "", priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }] },
    ])
  }

  const removePricingSection = (index) => {
    if (pricingSections.length > 1) {
      setPricingSections(pricingSections.filter((_, i) => i !== index))
      // Clear errors related to removed section
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`pricingSection_${index}`)) {
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const isVariantEmpty = (variant, type) => {
    if (type === "color") {
      return (
        !variant.color &&
        !variant.image &&
        !variant.price &&
        !variant.isDefault &&
        variant.optionalDetails.every((detail) => !detail.name && !detail.value) &&
        variant.priceRanges.every((range) => !range.retailPrice && !range.wholesalePrice && !range.thresholdQuantity) &&
        variant.forAllSizes === "yes" &&
        !variant.availableSizes.length
      )
    } else if (type === "size") {
      return (
        !variant.size &&
        !variant.price &&
        !variant.isDefault &&
        !variant.length &&
        !variant.breadth &&
        !variant.height &&
        !variant.availableColors.length &&
        variant.optionalDetails.every((detail) => !detail.name && !detail.value) &&
        variant.priceRanges.every((range) => !range.retailPrice && !range.wholesalePrice && !range.thresholdQuantity)
      )
    } else if (type === "pricingSection") {
      return (
        !variant.color &&
        !variant.size &&
        variant.priceRanges.every((range) => !range.retailPrice && !range.wholesalePrice && !range.thresholdQuantity)
      )
    } else if (type === "basePriceRange") {
      return !variant.retailPrice && !variant.wholesalePrice && !variant.thresholdQuantity
    } else if (type === "detail") {
      return !variant.name && !variant.value
    }
    return true
  }

  const validateFormOnSubmit = useCallback(() => {
    const newErrors = {}

    if (!formData.name) newErrors.name = "Product name is required"
    if (!formData.stock || isNaN(formData.stock) || Number.parseFloat(formData.stock) < 0)
      newErrors.stock = "Valid stock quantity is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!colorVariants[0].color) newErrors.color_0 = "At least one color variant is required"

    // Validate that at least one pricing method is filled
    const activePriceMethods = [
      isBasePriceFilled,
      isColorPriceFilled,
      isSizePriceFilled,
      isPricingSectionFilled,
    ].filter(Boolean).length

    if (activePriceMethods === 0) {
      newErrors.price = "At least one pricing method (base, color variant, size variant, or combination) is required."
    } else if (activePriceMethods > 1) {
      newErrors.price = "Only one pricing method (base, color variant, size variant, or combination) can be set."
    }

    // Base Price Ranges validation
    if (isBasePriceFilled) {
      if (basePriceRanges.length === 0) {
        newErrors.base_price = "At least one price range is required for base price."
      } else {
        const firstRange = basePriceRanges[0]
        if (Number.parseFloat(formData.price) !== Number.parseFloat(firstRange.retailPrice)) {
          newErrors.base_price = "Base price must be same as Retail Price of the first range."
        }
        if (!firstRange.retailPrice || !firstRange.wholesalePrice || !firstRange.thresholdQuantity) {
          newErrors.base_price =
            "Retail Price, Wholesale Price, and Threshold Quantity are required for the first base price range."
        }
      }
      basePriceRanges.forEach((range, index) => {
        const retail = Number.parseFloat(range.retailPrice)
        const wholesale = Number.parseFloat(range.wholesalePrice)
        const threshold = Number.parseInt(range.thresholdQuantity)

        if (isNaN(retail) || retail < 0) newErrors[`basePrice_0_${index}_retailPrice`] = "Invalid Retail Price."
        if (isNaN(wholesale) || wholesale < 0)
          newErrors[`basePrice_0_${index}_wholesalePrice`] = "Invalid Wholesale Price."
        if (isNaN(threshold) || threshold < 1)
          newErrors[`basePrice_0_${index}_thresholdQuantity`] = "Invalid Threshold Quantity."

        if (!isNaN(retail) && !isNaN(wholesale) && wholesale > retail) {
          newErrors[`basePrice_0_${index}_wholesalePrice`] = "Wholesale price cannot be greater than retail price."
        }
        if (index > 0) {
          const prevThreshold = Number.parseInt(basePriceRanges[index - 1].thresholdQuantity)
          if (!isNaN(threshold) && !isNaN(prevThreshold) && threshold <= prevThreshold) {
            newErrors[`basePrice_0_${index}_thresholdQuantity`] =
              "Threshold quantity must be greater than the previous range's threshold."
          }
        }
      })
    }

    // Color Variants validation
    colorVariants.forEach((variant, variantIndex) => {
      if (!variant.color) {
        newErrors[`color_${variantIndex}`] = "Color is required."
      }
      if (variant.price) {
        if (variant.priceRanges.length === 0) {
          newErrors[`color_price_${variantIndex}`] = "At least one price range is required for this color variant."
        } else {
          const firstRange = variant.priceRanges[0]
          if (Number.parseFloat(variant.price) !== Number.parseFloat(firstRange.retailPrice)) {
            newErrors[`color_price_${variantIndex}`] =
              "Color variant price must be same as Retail Price of the first range."
          }
          if (!firstRange.retailPrice || !firstRange.wholesalePrice || !firstRange.thresholdQuantity) {
            newErrors[`color_price_${variantIndex}`] =
              "Retail Price, Wholesale Price, and Threshold Quantity are required for the first price range when price is set."
          }
        }
        variant.priceRanges.forEach((range, rangeIndex) => {
          const retail = Number.parseFloat(range.retailPrice)
          const wholesale = Number.parseFloat(range.wholesalePrice)
          const threshold = Number.parseInt(range.thresholdQuantity)

          if (isNaN(retail) || retail < 0)
            newErrors[`colorPrice_${variantIndex}_${rangeIndex}_retailPrice`] = "Invalid Retail Price."
          if (isNaN(wholesale) || wholesale < 0)
            newErrors[`colorPrice_${variantIndex}_${rangeIndex}_wholesalePrice`] = "Invalid Wholesale Price."
          if (isNaN(threshold) || threshold < 1)
            newErrors[`colorPrice_${variantIndex}_${rangeIndex}_thresholdQuantity`] = "Invalid Threshold Quantity."

          if (!isNaN(retail) && !isNaN(wholesale) && wholesale > retail) {
            newErrors[`colorPrice_${variantIndex}_${rangeIndex}_wholesalePrice`] =
              "Wholesale price cannot be greater than retail price."
          }
          if (rangeIndex > 0) {
            const prevThreshold = Number.parseInt(variant.priceRanges[rangeIndex - 1].thresholdQuantity)
            if (!isNaN(threshold) && !isNaN(prevThreshold) && threshold <= prevThreshold) {
              newErrors[`colorPrice_${variantIndex}_${rangeIndex}_thresholdQuantity`] =
                "Threshold quantity must be greater than the previous range's threshold."
            }
          }
        })
      }
      if (variant.forAllSizes === "no" && !variant.availableSizes.length) {
        newErrors[`color_${variantIndex}`] = "At least one size must be selected if not available for all sizes."
      }
    })

    // Size Variants validation
    const useDimensions = sizeVariants.some((variant) => variant.useDimensions)
    const useDropdown = sizeVariants.some((variant) => !variant.useDimensions && variant.size)

    if (useDimensions && useDropdown) {
      newErrors.size = "All size variants must use either the size dropdown or dimensions, not both."
    }

    sizeVariants.forEach((variant, variantIndex) => {
      if (useDimensions) {
        if (!variant.length || !variant.breadth || !variant.height) {
          newErrors[`size_${variantIndex}`] = "Length, Breadth, and Height are required for all size variants."
        }
      } else if (!variant.size) {
        newErrors[`size_${variantIndex}`] = "Size is required for all size variants."
      }
      if (variant.forAllColors === "no" && !variant.availableColors.length) {
        newErrors[`size_${variantIndex}`] = "At least one color must be selected if not available for all colors."
      }
      if (variant.price) {
        if (variant.priceRanges.length === 0) {
          newErrors[`size_price_${variantIndex}`] = "At least one price range is required for this size variant."
        } else {
          const firstRange = variant.priceRanges[0]
          if (Number.parseFloat(variant.price) !== Number.parseFloat(firstRange.retailPrice)) {
            newErrors[`size_price_${variantIndex}`] =
              "Size variant price must be same as Retail Price of the first range."
          }
          if (!firstRange.retailPrice || !firstRange.wholesalePrice || !firstRange.thresholdQuantity) {
            newErrors[`size_price_${variantIndex}`] =
              "Retail Price, Wholesale Price, and Threshold Quantity are required for the first price range when price is set."
          }
        }
        variant.priceRanges.forEach((range, rangeIndex) => {
          const retail = Number.parseFloat(range.retailPrice)
          const wholesale = Number.parseFloat(range.wholesalePrice)
          const threshold = Number.parseInt(range.thresholdQuantity)

          if (isNaN(retail) || retail < 0)
            newErrors[`sizePrice_${variantIndex}_${rangeIndex}_retailPrice`] = "Invalid Retail Price."
          if (isNaN(wholesale) || wholesale < 0)
            newErrors[`sizePrice_${variantIndex}_${rangeIndex}_wholesalePrice`] = "Invalid Wholesale Price."
          if (isNaN(threshold) || threshold < 1)
            newErrors[`sizePrice_${variantIndex}_${rangeIndex}_thresholdQuantity`] = "Invalid Threshold Quantity."

          if (!isNaN(retail) && !isNaN(wholesale) && wholesale > retail) {
            newErrors[`sizePrice_${variantIndex}_${rangeIndex}_wholesalePrice`] =
              "Wholesale price cannot be greater than retail price."
          }
          if (rangeIndex > 0) {
            const prevThreshold = Number.parseInt(variant.priceRanges[rangeIndex - 1].thresholdQuantity)
            if (!isNaN(threshold) && !isNaN(prevThreshold) && threshold <= prevThreshold) {
              newErrors[`sizePrice_${variantIndex}_${rangeIndex}_thresholdQuantity`] =
                "Threshold quantity must be greater than the previous range's threshold."
            }
          }
        })
      }
    })

    // Pricing Combinations validation
    if (isPricingSectionFilled) {
      pricingSections.forEach((section, sectionIndex) => {
        if (!section.color || !section.size) {
          newErrors[`pricingSection_${sectionIndex}_general`] = "Color and Size are required for each combination."
        }
        if (section.priceRanges.length === 0) {
          newErrors[`pricingSection_${sectionIndex}_general`] =
            "At least one price range is required for this combination."
        } else {
          section.priceRanges.forEach((range, rangeIndex) => {
            const retail = Number.parseFloat(range.retailPrice)
            const wholesale = Number.parseFloat(range.wholesalePrice)
            const threshold = Number.parseInt(range.thresholdQuantity)

            if (isNaN(retail) || retail < 0)
              newErrors[`pricingSection_${sectionIndex}_${rangeIndex}_retailPrice`] = "Invalid Retail Price."
            if (isNaN(wholesale) || wholesale < 0)
              newErrors[`pricingSection_${sectionIndex}_${rangeIndex}_wholesalePrice`] = "Invalid Wholesale Price."
            if (isNaN(threshold) || threshold < 1)
              newErrors[`pricingSection_${sectionIndex}_${rangeIndex}_thresholdQuantity`] =
                "Invalid Threshold Quantity."

            if (!isNaN(retail) && !isNaN(wholesale) && wholesale > retail) {
              newErrors[`pricingSection_${sectionIndex}_${rangeIndex}_wholesalePrice`] =
                "Wholesale price cannot be greater than retail price."
            }
            if (rangeIndex > 0) {
              const prevThreshold = Number.parseInt(section.priceRanges[rangeIndex - 1].thresholdQuantity)
              if (!isNaN(threshold) && !isNaN(prevThreshold) && threshold <= prevThreshold) {
                newErrors[`pricingSection_${sectionIndex}_${rangeIndex}_thresholdQuantity`] =
                  "Threshold quantity must be greater than the previous range's threshold."
              }
            }
          })
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [
    formData.name,
    formData.stock,
    formData.category,
    formData.price,
    colorVariants,
    sizeVariants,
    pricingSections,
    basePriceRanges,
    isBasePriceFilled,
    isColorPriceFilled,
    isSizePriceFilled,
    isPricingSectionFilled,
  ])

 const handleSubmit = async (e) => {
  e.preventDefault() // Prevent default form submission

  const isValid = validateFormOnSubmit()
  if (!isValid) {
    setShowErrorModal(true)
    return
  }

  setIsSubmitting(true)
  try {
    const formDataToSend = new FormData()
    formDataToSend.append("name", formData.name)
    formDataToSend.append("price", formData.price)
    formDataToSend.append("stock", formData.stock)
    formDataToSend.append("category", formData.category)
    formDataToSend.append("categoryPath", JSON.stringify(formData.categoryPath))

    const filteredDetails = details.filter((detail) => !isVariantEmpty(detail, "detail"))
    formDataToSend.append("details", JSON.stringify(filteredDetails))

    // Filter and process color variants
    const filteredColorVariants = colorVariants.filter((variant) => !isVariantEmpty(variant, "color"))
    
    // Append images for color variants in the same order as the variants
    filteredColorVariants.forEach((variant, index) => {
      if (variant.image) {
        // Append each image with the field name 'colorImages'
        formDataToSend.append("colorImages", variant.image)
        console.log(`Appending image for color variant ${index}: ${variant.color}`)
      } else {
        console.log(`No image for color variant ${index}: ${variant.color}`)
      }
    })

    // Send color variants data without the image file objects
    const colorVariantsData = filteredColorVariants.map(({ image, ...rest }) => rest)
    formDataToSend.append("colorVariants", JSON.stringify(colorVariantsData))

    const filteredSizeVariants = sizeVariants.filter((variant) => !isVariantEmpty(variant, "size"))
    formDataToSend.append("sizeVariants", JSON.stringify(filteredSizeVariants))

    const filteredPricingSections = pricingSections.filter((section) => !isVariantEmpty(section, "pricingSection"))
    formDataToSend.append("pricingSections", JSON.stringify(filteredPricingSections))

    const filteredBasePriceRanges = basePriceRanges.filter((range) => !isVariantEmpty(range, "basePriceRange"))
    formDataToSend.append("basePriceRanges", JSON.stringify(filteredBasePriceRanges))

    // Log FormData contents for debugging
    console.log("FormData contents:")
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes)`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }

    const response = await axios.post("https://api.simplyrks.cloud/api/product/add", formDataToSend, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    })

    console.log("Product added successfully:", response.data)
    setIsSubmitting(false)
    setShowSuccessModal(true)
    
    // Reset form state
    setFormData({ name: "", price: "", stock: "", category: "", categoryPath: [] })
    setDetails([
      { name: "", value: "" },
      { name: "", value: "" },
      { name: "", value: "" },
    ])
    setColorVariants([
      {
        color: "",
        image: null,
        price: "",
        isDefault: true,
        optionalDetails: [],
        priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        forAllSizes: "yes",
        availableSizes: [],
      },
    ])
    setSizeVariants([
      {
        size: "",
        price: "",
        optionalDetails: [],
        priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }],
        isDefault: true,
        useDimensions: false,
        length: "",
        breadth: "",
        height: "",
        forAllColors: "yes",
        availableColors: [],
      },
    ])
    setPricingSections([
      { color: "", size: "", priceRanges: [{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }] },
    ])
    setBasePriceRanges([{ retailPrice: "", wholesalePrice: "", thresholdQuantity: "" }])
    setSelectedPath([])
    setSubCategoryOptions([])
  } catch (error) {
    console.error("Error adding product:", error)
    setIsSubmitting(false)
    setShowErrorModal(true)
    setErrors((prev) => ({
      ...prev,
      server: error.response?.data?.error || "Failed to add product. Please try again.",
    }))
  }
}

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-green-600 mb-4">Product Added Successfully!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your product has been added to the inventory.</p>
        <button
          onClick={() => setShowSuccessModal(false)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )

  const ErrorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Product Not Added</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Please check the errors below and try again.</p>
        {errors.server && <p className="text-red-500 text-sm mb-4">{errors.server}</p>}
        <button
          onClick={() => setShowErrorModal(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      {fetchError && (
        <div className="text-center py-8">
          <p className="text-red-500">{fetchError}</p>
          <button
            onClick={fetchCategories}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !fetchError && (
        <div>
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-white text-lg">Adding your product...</p>
              </div>
            </div>
          )}
          {showSuccessModal && <SuccessModal />}
          {showErrorModal && <ErrorModal />}
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold -800 dark:text-gray-100 mb-3 tracking-tight">Add New Product</h1>
            <p className="text-gray-500 text-base">Complete the form below to add a new product to your inventory</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter product name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                {!isColorPriceFilled && !isSizePriceFilled && !isPricingSectionFilled && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFormChange("price", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleFormChange("stock", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="0"
                    min="0"
                    required
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                </div>
              </div>
              {isBasePriceFilled && (
                <PriceRangeSection
                  ranges={basePriceRanges}
                  onRangeChange={handleBasePriceRangeChange}
                  onAddRange={addBasePriceRange}
                  onRemoveRange={removeBasePriceRange}
                  title="Price Ranges"
                  isRequired={true}
                  isRetailPriceDisabled={true}
                  errors={errors}
                  parentIndex={0}
                  sectionType="basePrice"
                />
              )}
              {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>}
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Category Selection</h2>
              {categories.length > 0 ? (
                <div className="space-y-4">
                  {renderCategoryDropdowns()}
                  {selectedPath.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Selected Category Path:</p>
                      <p className="text-blue-600 font-semibold text-lg">{getCategoryBreadCrumb()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No categories available. Please add categories first.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Product Details</h2>
              <div className="space-y-4">
                {details.map((detail, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={detail.name}
                        onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="Detail name (e.g., Material)"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={detail.value}
                        onChange={(e) => handleDetailChange(index, "value", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="e.g., Cotton"
                      />
                    </div>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetail(index)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMoreDetails}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Plus size={16} />
                Add more details
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Color Variants</h2>
              <div className="space-y-6">
                {colorVariants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                      <h3 className="text-lg font-semibold -800 dark:text-gray-100">Color Variant {variantIndex + 1}</h3>
                      {colorVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColorVariant(variantIndex)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Color *</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleColorVariantChange(variantIndex, "color", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          placeholder="e.g., Red, Blue, #FF5733"
                          required
                        />
                        {errors[`color_${variantIndex}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`color_${variantIndex}`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(variantIndex, e)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          accept="image/*"
                        />
                      </div>
                      {!isBasePriceFilled && !isSizePriceFilled && !isPricingSectionFilled && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleColorVariantChange(variantIndex, "price", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleColorVariantChange(variantIndex, "isDefault", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">Set as default variant</span>
                      </label>
                    </div>

                    {!isSizePriceFilled && !isPricingSectionFilled && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">For All Sizes?</label>
                        <select
                          value={variant.forAllSizes}
                          onChange={(e) => handleColorVariantChange(variantIndex, "forAllSizes", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}

                    {variant.forAllSizes === "no" && !isSizePriceFilled && !isPricingSectionFilled && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Sizes *</label>
                        <div className="relative">
                          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 space-y-2">
                            {sizeOptions.map((size, index) => (
                              <div key={index} className="flex items-center">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.availableSizes.includes(size)}
                                    onChange={() => handleColorAvailableSizesChange(variantIndex, size)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span>{size}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        {errors[`color_${variantIndex}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`color_${variantIndex}`]}</p>
                        )}
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleColorVariantChange(variantIndex, "isDefault", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">Set as default variant</span>
                      </label>
                    </div>
                    {variant.price && !isBasePriceFilled && !isSizePriceFilled && !isPricingSectionFilled && (
                      <PriceRangeSection
                        ranges={variant.priceRanges}
                        onRangeChange={(rangeIndex, field, value) =>
                          handleColorPriceRangeChange(variantIndex, rangeIndex, field, value)
                        }
                        onAddRange={() => addColorPriceRange(variantIndex)}
                        onRemoveRange={(rangeIndex) => removeColorPriceRange(variantIndex, rangeIndex)}
                        title={`Price Range for ${variant.color || "Color " + (variantIndex + 1)}`}
                        isRequired={true}
                        isRetailPriceDisabled={true}
                        errors={errors}
                        parentIndex={variantIndex}
                        sectionType="colorPrice"
                      />
                    )}
                    {errors[`color_price_${variantIndex}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`color_price_${variantIndex}`]}</p>
                    )}
                    {variant.optionalDetails.length > 0 && (
                      <div className="mb-4 mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Optional Details</h4>
                        <div className="space-y-2">
                          {variant.optionalDetails.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex flex-col sm:flex-row gap-2 items-start">
                              <input
                                type="text"
                                value={detail.name}
                                onChange={(e) =>
                                  handleColorOptionalDetailChange(variantIndex, detailIndex, "name", e.target.value)
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={detail.value}
                                onChange={(e) =>
                                  handleColorOptionalDetailChange(variantIndex, detailIndex, "value", e.target.value)
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => removeColorOptionalDetail(variantIndex, detailIndex)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => addColorOptionalDetail(variantIndex)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <Plus size={14} />
                      Add optional details
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addColorVariant}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                Add Color Variant
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Size Variants</h2>
              {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
              <div className="space-y-6">
                {sizeVariants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                      <h3 className="text-lg font-semibold -800 dark:text-gray-100">Size Variant {variantIndex + 1}</h3>
                      {sizeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSizeVariant(variantIndex)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                        {!variant.useDimensions ? (
                          <div>
                            <select
                              value={variant.size}
                              onChange={(e) => handleSizeVariantChange(variantIndex, "size", e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              required
                            >
                              <option value="">Select Size</option>
                              {sizeOptions.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => toggleDimensions(variantIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Enter dimensions
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={variant.length}
                                onChange={(e) => handleSizeVariantChange(variantIndex, "length", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Length"
                                min="0"
                                step="0.01"
                              />
                              <input
                                type="number"
                                value={variant.breadth}
                                onChange={(e) => handleSizeVariantChange(variantIndex, "breadth", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Breadth"
                                min="0"
                                step="0.01"
                              />
                              <input
                                type="number"
                                value={variant.height}
                                onChange={(e) => handleSizeVariantChange(variantIndex, "height", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Height"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDimensions(variantIndex)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Use size dropdown
                            </button>
                          </div>
                        )}
                        {errors[`size_${variantIndex}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`size_${variantIndex}`]}</p>
                        )}
                      </div>
                      {!isBasePriceFilled && !isColorPriceFilled && !isPricingSectionFilled && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleSizeVariantChange(variantIndex, "price", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                    {!isColorPriceFilled && !isPricingSectionFilled && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">For All Colors?</label>
                        <select
                          value={variant.forAllColors}
                          onChange={(e) => handleSizeVariantChange(variantIndex, "forAllColors", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    )}
                    {variant.forAllColors === "no" && !isColorPriceFilled && !isPricingSectionFilled && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Colors *</label>
                        <div className="relative">
                          <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-900 space-y-2">
                            {colorVariants.map((colorVariant, index) => (
                              <div key={index} className="flex items-center">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.availableColors.includes(colorVariant.color)}
                                    onChange={() => handleSizeAvailableColorsChange(variantIndex, colorVariant.color)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    disabled={!colorVariant.color}
                                  />
                                  <span>{colorVariant.color || `Color ${index + 1}`}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleSizeVariantChange(variantIndex, "isDefault", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">Set as default variant</span>
                      </label>
                    </div>
                    {variant.price && !isBasePriceFilled && !isColorPriceFilled && !isPricingSectionFilled && (
                      <PriceRangeSection
                        ranges={variant.priceRanges}
                        onRangeChange={(rangeIndex, field, value) =>
                          handleSizePriceRangeChange(variantIndex, rangeIndex, field, value)
                        }
                        onAddRange={() => addSizePriceRange(variantIndex)}
                        onRemoveRange={(rangeIndex) => removeSizePriceRange(variantIndex, rangeIndex)}
                        title={`Price Range for ${variant.size || "Size " + (variantIndex + 1)}`}
                        isRequired={true}
                        isRetailPriceDisabled={true}
                        errors={errors}
                        parentIndex={variantIndex}
                        sectionType="sizePrice"
                      />
                    )}
                    {errors[`size_price_${variantIndex}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`size_price_${variantIndex}`]}</p>
                    )}
                    {variant.optionalDetails.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Optional Details</h4>
                        <div className="space-y-2">
                          {variant.optionalDetails.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex flex-col sm:flex-row gap-2 items-start">
                              <input
                                type="text"
                                value={detail.name}
                                onChange={(e) =>
                                  handleSizeOptionalDetailChange(variantIndex, detailIndex, "name", e.target.value)
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={detail.value}
                                onChange={(e) =>
                                  handleSizeOptionalDetailChange(variantIndex, detailIndex, "value", e.target.value)
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                placeholder="Value"
                              />
                              <button
                                type="button"
                                onClick={() => removeSizeOptionalDetail(variantIndex, detailIndex)}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-start sm:self-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => addSizeOptionalDetail(variantIndex)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <Plus size={16} />
                      Add optional details
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSizeVariant}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus size={16} />
                Add Size Variant
              </button>
            </div>

            {!isBasePriceFilled && !isColorPriceFilled && !isSizePriceFilled && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-semibold -800 dark:text-gray-100 mb-6">Pricing Combinations</h2>
                <div className="space-y-6">
                  {pricingSections.map((section, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <h3 className="text-lg font-semibold -800 dark:text-gray-100">Pricing Combination {index + 1}</h3>
                        {pricingSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePricingSection(index)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                          <select
                            value={section.color}
                            onChange={(e) => handlePricingSectionChange(index, "color", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          >
                            <option value="">Select Color</option>
                            {colorVariants.map((variant, i) => (
                              <option key={i} value={variant.color}>
                                {variant.color || "Color " + (i + 1)}
                              </option>
                            ))}
                          </select>
                          {errors[`pricingSection_${index}_color`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`pricingSection_${index}_color`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                          <select
                            value={section.size}
                            onChange={(e) => handlePricingSectionChange(index, "size", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          >
                            <option value="">Select Size</option>
                            {sizeVariants.map((variant, i) => (
                              <option
                                key={i}
                                value={variant.size || `${variant.length}x${variant.breadth}x${variant.height}`}
                              >
                                {variant.size ||
                                  `${variant.length}x${variant.breadth}x${variant.height}` ||
                                  "Size " + (i + 1)}
                              </option>
                            ))}
                          </select>
                          {errors[`pricingSection_${index}_size`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`pricingSection_${index}_size`]}</p>
                          )}
                        </div>
                      </div>
                      {errors[`pricingSection_${index}_general`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`pricingSection_${index}_general`]}</p>
                      )}
                      <PriceRangeSection
                        ranges={section.priceRanges}
                        onRangeChange={(rangeIndex, field, value) =>
                          handlePricingSectionPriceRangeChange(index, rangeIndex, field, value)
                        }
                        onAddRange={() => addPricingSectionPriceRange(index)}
                        onRemoveRange={(rangeIndex) => removePricingSectionPriceRange(index, rangeIndex)}
                        title={`Price Range for Combination ${index + 1}`}
                        isRequired={true}
                        errors={errors}
                        parentIndex={index}
                        sectionType="pricingSection"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPricingSection}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus size={16} />
                  Add Pricing Combination
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 text-white rounded-lg transition-colors duration-200 ${
                  isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Adding Product..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AddProduct