"use client"

import { useState, useEffect, useCallback, useRef } from "react" // Import useRef
import { fetchCategories, addProduct } from "../../../../utils/api"
import { X, Plus, AlertCircle } from "lucide-react" // Using Lucide React for icons

// Helper to flatten category tree for easy lookup and path building
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

// Helper to find a category by ID in the nested tree
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

export default function AddProduct() {
  const [productName, setProductName] = useState("")
  const [allCategoriesTree, setAllCategoriesTree] = useState([]) // Nested tree structure
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]) // Flattened for easy lookup

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]) // Array of selected category IDs for dynamic dropdowns
  const [categoryPath, setCategoryPath] = useState("")

  const [productDetails, setProductDetails] = useState([{ key: "", value: "" }])
  const [stock, setStock] = useState("")
  const [price, setPrice] = useState("")
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([{ file: null, preview: null }])
  const [bulkPricing, setBulkPricing] = useState([{ wholesalePrice: "", quantity: "" }])

  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState([]) // Array of variant objects

  // Refs for direct file input clicks
  const mainAdditionalImageInputRef = useRef([])
  const variantImageInputRefs = useRef([])
  const mdAdditionalImageInputRefs = useRef([])

  // State to track if basic info fields (price, stock, image) are filled
  const isBasicInfoFilled =
    stock !== "" ||
    price !== "" ||
    mainImage !== null ||
    additionalImages.some((img) => img.file !== null) ||
    bulkPricing.some((bp) => bp.wholesalePrice !== "" || bp.quantity !== "")
  // State to track if any variant field is filled
  const isVariantInfoFilled =
    variants.length > 0 &&
    variants.some(
      (variant) =>
        variant.colorName !== "" ||
        variant.variantImage.file !== null ||
        variant.optionalDetails.some((od) => od.key !== "" || od.value !== "") ||
        variant.moreDetails.some(
          (md) =>
            md.size.length !== "" ||
            md.size.breadth !== "" ||
            md.size.height !== "" ||
            md.additionalImages.some((img) => img.file !== null) ||
            md.optionalDetails.some((od) => od.key !== "" || od.value !== "") ||
            md.price !== "" ||
            md.stock !== "" ||
            md.bulkPricingCombinations.some((bpc) => bpc.wholesalePrice !== "" || bpc.quantity !== ""),
        ),
    )

  // Effect to manage conditional visibility
  useEffect(() => {
    if (isVariantInfoFilled) {
      setStock("")
      setPrice("")
      setMainImage(null)
      setMainImagePreview(null)
      setAdditionalImages([{ file: null, preview: null }])
      setBulkPricing([{ wholesalePrice: "", quantity: "" }])
      setHasVariants(true)
    } else if (isBasicInfoFilled) {
      setVariants([])
      setHasVariants(false)
    }
  }, [isBasicInfoFilled, isVariantInfoFilled])

  // Fetch categories on component mount
  useEffect(() => {
    const getCategories = async () => {
      try {
        const categories = await fetchCategories()
        setAllCategoriesTree(categories)
        setAllCategoriesFlat(flattenCategories(categories))
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    getCategories()
  }, [])

  // Update category path based on selections
  useEffect(() => {
    const pathNames = selectedCategoryIds
      .map((id) => allCategoriesFlat.find((cat) => cat._id === id)?.categoryName)
      .filter(Boolean)
    setCategoryPath(pathNames.join(" > "))
  }, [selectedCategoryIds, allCategoriesFlat])

  // Handle main image preview
  useEffect(() => {
    if (mainImage) {
      const objectUrl = URL.createObjectURL(mainImage)
      setMainImagePreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setMainImagePreview(null)
    }
  }, [mainImage])

  // Handlers for dynamic fields (Product Details, Variant Optional Details, MD Optional Details)
  const addKeyValuePair = (setter, currentArray) => setter([...currentArray, { key: "", value: "" }])
  const updateKeyValuePair = (setter, currentArray, index, field, value) => {
    const newArray = [...currentArray]
    newArray[index][field] = value
    setter(newArray)
  }
  const removeKeyValuePair = (setter, currentArray, index) => {
    const newArray = currentArray.filter((_, i) => i !== index)
    setter(newArray)
  }

  // Handlers for dynamic image fields (Additional Images, Variant Image, MD Additional Images)
  const addImageField = (setter, currentArray) => setter([...currentArray, { file: null, preview: null }])
  const updateImageField = (setter, currentArray, index, file) => {
    const newArray = [...currentArray]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      newArray[index] = { file, preview: objectUrl }
    } else {
      if (newArray[index]?.preview) URL.revokeObjectURL(newArray[index].preview)
      newArray[index] = { file: null, preview: null }
    }
    setter(newArray)
  }
  const removeImageField = (setter, currentArray, index) => {
    const newArray = currentArray.filter((_, i) => {
      if (i === index && currentArray[i]?.preview) {
        URL.revokeObjectURL(currentArray[i].preview)
      }
      return i !== index
    })
    setter(newArray)
  }

  // Handlers for dynamic bulk pricing fields
  const addBulkPricingField = (setter, currentArray) => setter([...currentArray, { wholesalePrice: "", quantity: "" }])
  const updateBulkPricingField = (setter, currentArray, index, field, value) => {
    const newArray = [...currentArray]
    newArray[index][field] = value
    setter(newArray)
  }
  const removeBulkPricingField = (setter, currentArray, index) => {
    const newArray = currentArray.filter((_, i) => i !== index)
    setter(newArray)
  }

  // Variant specific handlers
  const addVariant = () => {
    setHasVariants(true)
    const newVariant = {
      colorName: "",
      variantImage: { file: null, preview: null },
      optionalDetails: [{ key: "", value: "" }],
      moreDetails: [
        {
          size: { length: "", breadth: "", height: "", unit: "cm" },
          additionalImages: [{ file: null, preview: null }],
          optionalDetails: [{ key: "", value: "" }],
          price: "",
          stock: "",
          bulkPricingCombinations: [{ wholesalePrice: "", quantity: "" }],
          reuseAdditionalImages: "no",
          reuseOptionalDetails: "no",
          reusedImageSource: "",
          reusedOptionalDetailSource: "",
        },
      ],
      isPriceSame: "yes", // Default for variant price
      isStockSame: "yes", // Default for variant stock
      commonPrice: "",
      commonStock: "",
      commonBulkPricingCombinations: [{ wholesalePrice: "", quantity: "" }],
      isDefault: variants.length === 0, // First variant added is default
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index)
    // If the removed variant was default, and there are other variants, set the first one as default
    if (variants[index].isDefault && newVariants.length > 0) {
      newVariants[0].isDefault = true
    }
    setVariants(newVariants)
    if (newVariants.length === 0) {
      setHasVariants(false)
    }
  }

  const updateVariantField = (index, field, value) => {
    const newVariants = [...variants]
    if (field === "isDefault" && value === true) {
      // If setting this variant as default, unset others
      newVariants.forEach((v, i) => {
        if (i !== index) {
          v.isDefault = false
        }
      })
    }
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  // Size section handlers (formerly More Details)
  const addSizeSection = (variantIndex) => {
    const newVariants = [...variants]
    newVariants[variantIndex].moreDetails.push({
      size: { length: "", breadth: "", height: "", unit: "cm" },
      additionalImages: [{ file: null, preview: null }],
      optionalDetails: [{ key: "", value: "" }],
      price: "",
      stock: "",
      bulkPricingCombinations: [{ wholesalePrice: "", quantity: "" }],
      reuseAdditionalImages: "no",
      reuseOptionalDetails: "no",
      reusedImageSource: "",
      reusedOptionalDetailSource: "",
    })
    setVariants(newVariants)
  }

  const removeSizeSection = (variantIndex, mdIndex) => {
    const newVariants = [...variants]
    newVariants[variantIndex].moreDetails = newVariants[variantIndex].moreDetails.filter((_, i) => i !== mdIndex)
    setVariants(newVariants)
  }

  const updateSizeSectionField = (variantIndex, mdIndex, field, value) => {
    const newVariants = [...variants]
    newVariants[variantIndex].moreDetails[mdIndex][field] = value
    setVariants(newVariants)
  }

  // Size fields within a Size Section
  const updateSingleSizeField = (variantIndex, mdIndex, field, value) => {
    const newVariants = [...variants]
    newVariants[variantIndex].moreDetails[mdIndex].size[field] = value
    setVariants(newVariants)
  }

  // Logic for generating reuse options for Additional Images/Optional Details
  const getReuseOptions = useCallback(
    (currentVariantIndex, currentMdIndex, type) => {
      const options = []
      variants.forEach((variant, vIdx) => {
        // Only include sections from the current variant
        if (vIdx === currentVariantIndex) {
          variant.moreDetails.forEach((md, mdIdx) => {
            // Only include sections that are NOT reusing and are before the current section
            const isBeforeCurrent = mdIdx < currentMdIndex
            const isNotReusing =
              (type === "images" && md.reuseAdditionalImages === "no") ||
              (type === "optionalDetails" && md.reuseOptionalDetails === "no")

            // Only offer reuse if the source actually has data
            const hasData =
              type === "images"
                ? md.additionalImages.some((img) => img.file !== null || img.preview !== null)
                : md.optionalDetails.some((od) => od.key !== "" || od.value !== "")

            if (isBeforeCurrent && isNotReusing && hasData) {
              const sizeInfo = md.size
                ? `${md.size.length || "?"}x${md.size.breadth || "?"}x${md.size.height || "?"}`
                : "N/A"
              options.push({
                id: `${vIdx}-${mdIdx}`,
                label: `${variant.colorName || "Variant"} - Size Section ${mdIdx + 1} (${sizeInfo})`, // Updated label
                data: type === "images" ? md.additionalImages : md.optionalDetails,
              })
            }
          })
        }
      })
      return options
    },
    [variants],
  )

  const handleReuseSelection = (variantIndex, mdIndex, type, selectedId) => {
    const newVariants = [...variants]
    const selectedOption = getReuseOptions(variantIndex, mdIndex, type).find((opt) => opt.id === selectedId)

    if (selectedOption) {
      if (type === "images") {
        // Revoke old previews for the current section's images
        newVariants[variantIndex].moreDetails[mdIndex].additionalImages.forEach((img) => {
          if (img?.preview) URL.revokeObjectURL(img.preview)
        })
        // Copy the data (which includes file and preview for images)
        // Ensure file objects are copied for re-upload
        newVariants[variantIndex].moreDetails[mdIndex].additionalImages = selectedOption.data.map((item) => ({
          file: item.file, // Copy the file object
          preview: item.file ? URL.createObjectURL(item.file) : item.preview, // Re-create blob URL if file exists, else use existing preview
        }))
        newVariants[variantIndex].moreDetails[mdIndex].reusedImageSource = selectedId
      } else {
        // Copy the data (key-value pairs)
        newVariants[variantIndex].moreDetails[mdIndex].optionalDetails = selectedOption.data.map((item) => ({
          ...item,
        }))
        newVariants[variantIndex].moreDetails[mdIndex].reusedOptionalDetailSource = selectedId
      }
    }
    setVariants(newVariants)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()

    // Determine final category ID
    const finalCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1] || ""

    // Prepare product data object
    const productData = {
      name: productName,
      mainCategory: selectedCategoryIds[0] || "", // First selected category is main
      subCategory: finalCategoryId, // Last selected category is sub (could be main if only one selected)
      categoryPath: categoryPath,
      productDetails: productDetails.filter((pd) => pd.key && pd.value),
      hasVariants: hasVariants,
    }

    if (!hasVariants) {
      productData.stock = stock
      productData.price = price
      productData.bulkPricing = bulkPricing.filter((bp) => bp.wholesalePrice && bp.quantity)
    }

    // Append main product image
    if (mainImage) {
      formData.append("image", mainImage)
    }

    // Append additional images for basic product
    additionalImages.forEach((img) => {
      if (img.file) {
        formData.append(`additionalImages`, img.file)
      }
    })

    // Process variants for FormData
    if (hasVariants) {
      productData.variants = variants.map((variant) => {
        const variantObj = {
          colorName: variant.colorName,
          optionalDetails: variant.optionalDetails.filter((od) => od.key && od.value),
          isDefault: variant.isDefault, // Include isDefault
          isPriceSame: variant.isPriceSame,
          isStockSame: variant.isStockSame, // Include isStockSame
          // If only one size section, implicitly common price/stock
          commonPrice:
            variant.moreDetails.length === 1 || variant.isPriceSame === "yes" ? variant.commonPrice : undefined,
          commonStock:
            variant.moreDetails.length === 1 || variant.isStockSame === "yes" ? variant.commonStock : undefined,
          commonBulkPricingCombinations:
            variant.moreDetails.length === 1 || variant.isPriceSame === "yes"
              ? variant.commonBulkPricingCombinations.filter((bpc) => bpc.wholesalePrice && bpc.quantity)
              : [],
          moreDetails: variant.moreDetails.map((md) => {
            const mdObj = {
              size: md.size,
              // If reusing optional details, send the copied data directly
              optionalDetails:
                md.reuseOptionalDetails === "yes"
                  ? md.optionalDetails
                  : md.optionalDetails.filter((od) => od.key && od.value),
              // For additional images, we don't send the preview URLs in productData,
              // as files are appended separately. The backend will handle the URLs.
              additionalImages: [], // This will be populated by the backend after file uploads
            }
            // Only include price/stock/bulk pricing if not common for variant AND multiple sizes exist
            if (variant.isPriceSame === "no" && variant.moreDetails.length > 1) {
              mdObj.price = md.price
              mdObj.bulkPricingCombinations = md.bulkPricingCombinations.filter(
                (bpc) => bpc.wholesalePrice && bpc.quantity,
              )
            }
            if (variant.isStockSame === "no" && variant.moreDetails.length > 1) {
              mdObj.stock = md.stock
            }
            return mdObj
          }),
        }
        return variantObj
      })

      // Append variant images and moreDetails additional images to FormData
      variants.forEach((variant, variantIndex) => {
        if (variant.variantImage.file) {
          formData.append(`variants[${variantIndex}].variantImage`, variant.variantImage.file)
        }
        variant.moreDetails.forEach((md, mdIndex) => {
          // Always append file if it exists, regardless of reuse flag.
          // If reuse was selected, the file object was copied to md.additionalImages.
          md.additionalImages.forEach((img) => {
            if (img.file) {
              formData.append(`variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`, img.file)
            }
          })
        })
      })
    }

    formData.append("productData", JSON.stringify(productData))

    try {
      const response = await addProduct(formData)
      console.log("Product added successfully:", response)
      alert("Product added successfully!")
      // Reset form or redirect
    } catch (error) {
      console.error("Error adding product:", error.message)
      alert(`Error adding product: ${error.message}`)
    }
  }

  // Tailwind CSS classes for common elements - refined for beauty
  const cardClass = "bg-white rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 border border-gray-100"
  const sectionHeaderClass = "flex justify-between items-center pb-4 mb-6 border-b border-gray-200"
  const sectionTitleClass = "text-2xl md:text-3xl font-extrabold text-gray-800"
  const subSectionTitleClass = "text-xl font-bold text-gray-700"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"
  const inputClass =
    "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-base transition duration-200 ease-in-out"
  const buttonClass =
    "inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
  const primaryButtonClass = `${buttonClass} text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500`
  const secondaryButtonClass = `${buttonClass} text-purple-700 bg-purple-100 hover:bg-purple-200 focus:ring-purple-500`
  const outlineButtonClass = `${buttonClass} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-purple-500`
  const destructiveButtonClass = `${buttonClass} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`
  const selectClass =
    "mt-1 block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-base rounded-lg shadow-sm appearance-none bg-white transition duration-200 ease-in-out"
  const checkboxClass =
    "h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition duration-200 ease-in-out"

  // Dynamic Category Dropdowns
  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean)

    // If a category is unselected (value is ""), clear all subsequent levels
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level)
    }

    setSelectedCategoryIds(newSelectedCategoryIds)
  }

  const renderCategoryDropdowns = () => {
    const dropdowns = []

    // Main Category Dropdown (Level 0)
    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
    dropdowns.push(
      <div key={`category-dropdown-0`} className="space-y-2">
        <label htmlFor={`category-level-0`} className={labelClass}>
          Main Category
        </label>
        <div className="relative">
          <select
            id={`category-level-0`}
            value={selectedCategoryIds[0] || ""}
            onChange={(e) => handleCategorySelect(0, e.target.value)}
            className={selectClass}
            // Removed required attribute
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
          <label htmlFor={`category-level-sub`} className={labelClass}>
            Sub Category
          </label>
          <div className="relative">
            <select
              id={`category-level-sub`}
              value={selectedCategoryIds[selectedCategoryIds.length] || ""} // This will be empty initially for the next level
              onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
              className={selectClass}
              // Removed required attribute
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

    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{dropdowns}</div>
  }

  return (
    <div className="container mx-auto p-4 md:p-8 lg:p-12 max-w-7xl font-sans">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-gray-900 tracking-tight">
        Add New Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Information Section */}
        <div className={cardClass}>
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>Basic Information</h2>
          </div>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="productName" className={labelClass}>
                  Product Name
                </label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  className={inputClass}
                  // Removed required attribute
                />
              </div>
              {/* Category Dropdowns */}
              <div className="col-span-full">
                {renderCategoryDropdowns()}
                {categoryPath && (
                  <div className="text-sm text-gray-600 mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    Category Path:{" "}
                    {selectedCategoryIds.map((id, index) => {
                      const category = allCategoriesFlat.find((cat) => cat._id === id)
                      if (!category) return null
                      return (
                        <span key={id}>
                          <button
                            type="button"
                            onClick={() => setSelectedCategoryIds(selectedCategoryIds.slice(0, index + 1))}
                            className="font-medium text-purple-700 hover:underline"
                          >
                            {category.categoryName}
                          </button>
                          {index < selectedCategoryIds.length - 1 && <span className="mx-1">{" > "}</span>}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product Details (Key-Value Pairs) */}
            <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className={subSectionTitleClass}>Product Details</h3>
                <button
                  type="button"
                  className={outlineButtonClass}
                  onClick={() => addKeyValuePair(setProductDetails, productDetails)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Detail
                </button>
              </div>
              {productDetails.map((detail, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label htmlFor={`detail-key-${index}`} className={labelClass}>
                      Key
                    </label>
                    <input
                      id={`detail-key-${index}`}
                      type="text"
                      value={detail.key}
                      onChange={(e) =>
                        updateKeyValuePair(setProductDetails, productDetails, index, "key", e.target.value)
                      }
                      placeholder="e.g., Material"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label htmlFor={`detail-value-${index}`} className={labelClass}>
                      Value
                    </label>
                    <input
                      id={`detail-value-${index}`}
                      type="text"
                      value={detail.value}
                      onChange={(e) =>
                        updateKeyValuePair(setProductDetails, productDetails, index, "value", e.target.value)
                      }
                      placeholder="e.g., Cotton"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    className={`${destructiveButtonClass} p-2`}
                    onClick={() => removeKeyValuePair(setProductDetails, productDetails, index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Conditional Message */}
            <div
              className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md shadow-sm flex items-center space-x-3"
              role="alert"
            >
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-500" />
              <p className="text-base font-medium">
                Fill below fields only if you don't have any product variants. If you add variants, these fields will be
                ignored.
              </p>
            </div>

            {/* Price, Stock, Image, Additional Images, Bulk Pricing (Conditional) */}
            {!hasVariants && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="stock" className={labelClass}>
                      Stock
                    </label>
                    <input
                      id="stock"
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="Enter stock quantity"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price" className={labelClass}>
                      Price
                    </label>
                    <input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter price"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mainImage" className={labelClass}>
                    Product Main Image
                  </label>
                  <input
                    id="mainImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMainImage(e.target.files[0])}
                    className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer`}
                  />
                  {mainImagePreview && (
                    <div className="mt-2">
                      <img
                        src={mainImagePreview || "/placeholder.svg"}
                        alt="Main Product Preview"
                        className="h-24 w-24 object-cover rounded-md shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className={subSectionTitleClass}>Additional Images</h3>
                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => {
                        addImageField(setAdditionalImages, additionalImages)
                        // Trigger click on the newly added input field
                        // This assumes the ref array is updated synchronously
                        setTimeout(() => {
                          if (mainAdditionalImageInputRef.current[additionalImages.length]) {
                            mainAdditionalImageInputRef.current[additionalImages.length].click()
                          }
                        }, 0)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add More Image
                    </button>
                  </div>
                  {additionalImages.map((image, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <label htmlFor={`additional-image-${index}`} className={labelClass}>
                          Image {index + 1}
                        </label>
                        <input
                          id={`additional-image-${index}`}
                          type="file"
                          accept="image/*"
                          ref={(el) => (mainAdditionalImageInputRef.current[index] = el)} // Assign ref
                          onChange={(e) =>
                            updateImageField(setAdditionalImages, additionalImages, index, e.target.files[0])
                          }
                          className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer`}
                        />
                        {image.preview && (
                          <div className="mt-2">
                            <img
                              src={image.preview || "/placeholder.svg"}
                              alt={`Additional ${index + 1} Preview`}
                              className="h-20 w-20 object-cover rounded-md shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`${destructiveButtonClass} p-2`}
                        onClick={() => removeImageField(setAdditionalImages, additionalImages, index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bulk Pricing Section */}
                <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className={subSectionTitleClass}>Bulk Pricing</h3>
                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => addBulkPricingField(setBulkPricing, bulkPricing)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Bulk Pricing
                    </button>
                  </div>
                  {bulkPricing.map((bp, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label htmlFor={`wholesale-price-${index}`} className={labelClass}>
                          Wholesale Price
                        </label>
                        <input
                          id={`wholesale-price-${index}`}
                          type="number"
                          value={bp.wholesalePrice}
                          onChange={(e) =>
                            updateBulkPricingField(setBulkPricing, bulkPricing, index, "wholesalePrice", e.target.value)
                          }
                          placeholder="Enter wholesale price"
                          className={inputClass}
                        />
                        {price &&
                          bp.wholesalePrice &&
                          Number.parseFloat(bp.wholesalePrice) >= Number.parseFloat(price) && (
                            <p className="text-red-500 text-sm mt-1">Wholesale price must be less than main price.</p>
                          )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label htmlFor={`quantity-${index}`} className={labelClass}>
                          Quantity
                        </label>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          value={bp.quantity}
                          onChange={(e) =>
                            updateBulkPricingField(setBulkPricing, bulkPricing, index, "quantity", e.target.value)
                          }
                          placeholder="Enter quantity"
                          className={inputClass}
                        />
                        <p className="text-sm font-bold text-gray-700 mt-1">This will be included</p>
                      </div>
                      <button
                        type="button"
                        className={`${destructiveButtonClass} p-2`}
                        onClick={() => removeBulkPricingField(setBulkPricing, bulkPricing, index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product Variant Section */}
        {hasVariants && (
          <div className={cardClass}>
            <div className={sectionHeaderClass}>
              <h2 className={sectionTitleClass}>Product Variants</h2>
            </div>
            <div className="space-y-10">
              {variants.map((variant, variantIndex) => (
                <div
                  key={variantIndex}
                  className="bg-gray-50 rounded-xl p-6 space-y-8 border-2 border-dashed border-gray-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Variant {variantIndex + 1}</h3>
                    <button
                      type="button"
                      className={`${destructiveButtonClass} p-2`}
                      onClick={() => removeVariant(variantIndex)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label htmlFor={`color-name-${variantIndex}`} className={labelClass}>
                        Color Name
                      </label>
                      <input
                        id={`color-name-${variantIndex}`}
                        type="text"
                        value={variant.colorName}
                        onChange={(e) => updateVariantField(variantIndex, "colorName", e.target.value)}
                        placeholder="e.g., Red"
                        className={inputClass}
                        // Removed required attribute
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor={`variant-image-${variantIndex}`} className={labelClass}>
                        Variant Image
                      </label>
                      <input
                        id={`variant-image-${variantIndex}`}
                        type="file"
                        accept="image/*"
                        ref={(el) => (variantImageInputRefs.current[variantIndex] = el)} // Assign ref
                        onChange={(e) =>
                          updateVariantField(variantIndex, "variantImage", {
                            file: e.target.files[0],
                            preview: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null,
                          })
                        }
                        className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer`}
                      />
                      {variant.variantImage.preview && (
                        <div className="mt-2">
                          <img
                            src={variant.variantImage.preview || "/placeholder.svg"}
                            alt="Variant Preview"
                            className="h-24 w-24 object-cover rounded-md shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Set as Default Checkbox */}
                  <div className="flex items-center space-x-3 mt-4">
                    <input
                      id={`default-variant-${variantIndex}`}
                      type="checkbox"
                      checked={variant.isDefault}
                      onChange={(e) => updateVariantField(variantIndex, "isDefault", e.target.checked)}
                      className={checkboxClass}
                    />
                    <label
                      htmlFor={`default-variant-${variantIndex}`}
                      className="text-base font-medium text-gray-700 cursor-pointer"
                    >
                      Set as default
                    </label>
                  </div>

                  {/* Variant-specific Optional Details */}
                  <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-white">
                    <div className="flex justify-between items-center">
                      <h4 className={subSectionTitleClass}>Variant Optional Details (Optional)</h4>
                      <button
                        type="button"
                        className={outlineButtonClass}
                        onClick={() => {
                          updateVariantField(variantIndex, "optionalDetails", [
                            ...variant.optionalDetails,
                            { key: "", value: "" },
                          ])
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Optional Detail
                      </button>
                    </div>
                    {variant.optionalDetails.map((detail, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <label htmlFor={`variant-optional-key-${variantIndex}-${index}`} className={labelClass}>
                            Key
                          </label>
                          <input
                            id={`variant-optional-key-${variantIndex}-${index}`}
                            type="text"
                            value={detail.key}
                            onChange={(e) => {
                              const newDetails = [...variant.optionalDetails]
                              newDetails[index].key = e.target.value
                              updateVariantField(variantIndex, "optionalDetails", newDetails)
                            }}
                            placeholder="e.g., Material"
                            className={inputClass}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label htmlFor={`variant-optional-value-${variantIndex}-${index}`} className={labelClass}>
                            Value
                          </label>
                          <input
                            id={`variant-optional-value-${variantIndex}-${index}`}
                            type="text"
                            value={detail.value}
                            onChange={(e) => {
                              const newDetails = [...variant.optionalDetails]
                              newDetails[index].value = e.target.value
                              updateVariantField(variantIndex, "optionalDetails", newDetails)
                            }}
                            placeholder="e.g., Cotton"
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="button"
                          className={`${destructiveButtonClass} p-2`}
                          onClick={() => {
                            const newDetails = variant.optionalDetails.filter((_, i) => i !== index)
                            updateVariantField(variantIndex, "optionalDetails", newDetails)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Size Sections (formerly More Details Sections) */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className={subSectionTitleClass}>Size Sections</h3>
                      <button type="button" className={outlineButtonClass} onClick={() => addSizeSection(variantIndex)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Size Section
                      </button>
                    </div>
                    {variant.moreDetails.map((md, mdIndex) => (
                      <div
                        key={mdIndex}
                        className="bg-white rounded-xl p-6 space-y-8 border-2 border-dotted border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-bold text-gray-800">Size Section {mdIndex + 1}</h4>
                          <button
                            type="button"
                            className={`${destructiveButtonClass} p-2`}
                            onClick={() => removeSizeSection(variantIndex, mdIndex)}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Single Size Fields - Dimensions and Unit in one line */}
                        <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                          <h5 className="text-md font-semibold text-gray-800">Dimensions</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div className="space-y-2">
                              <label htmlFor={`length-${variantIndex}-${mdIndex}`} className={labelClass}>
                                Length
                              </label>
                              <input
                                id={`length-${variantIndex}-${mdIndex}`}
                                type="number"
                                value={md.size.length}
                                onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "length", e.target.value)}
                                placeholder="Length"
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor={`breadth-${variantIndex}-${mdIndex}`} className={labelClass}>
                                Breadth
                              </label>
                              <input
                                id={`breadth-${variantIndex}-${mdIndex}`}
                                type="number"
                                value={md.size.breadth}
                                onChange={(e) =>
                                  updateSingleSizeField(variantIndex, mdIndex, "breadth", e.target.value)
                                }
                                placeholder="Breadth"
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor={`height-${variantIndex}-${mdIndex}`} className={labelClass}>
                                Height
                              </label>
                              <input
                                id={`height-${variantIndex}-${mdIndex}`}
                                type="number"
                                value={md.size.height}
                                onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "height", e.target.value)}
                                placeholder="Height"
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor={`unit-${variantIndex}-${mdIndex}`} className={labelClass}>
                                Unit
                              </label>
                              <div className="relative">
                                <select
                                  id={`unit-${variantIndex}-${mdIndex}`}
                                  value={md.size.unit}
                                  onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "unit", e.target.value)}
                                  className={`${selectClass} w-full`}
                                  // Removed required attribute
                                >
                                  <option value="cm">cm</option>
                                  <option value="m">m</option>
                                  <option value="inch">inch</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <svg
                                    className="fill-current h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Images for this Size Section */}
                        <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-md font-semibold text-gray-800">
                              Additional Images for this Size (Optional)
                            </h5>
                            <button
                              type="button"
                              className={outlineButtonClass}
                              onClick={() => {
                                addImageField(
                                  (arr) => updateSizeSectionField(variantIndex, mdIndex, "additionalImages", arr),
                                  md.additionalImages,
                                )
                                setTimeout(() => {
                                  if (
                                    mdAdditionalImageInputRefs.current[
                                      `${variantIndex}-${mdIndex}-${md.additionalImages.length}`
                                    ]
                                  ) {
                                    mdAdditionalImageInputRefs.current[
                                      `${variantIndex}-${mdIndex}-${md.additionalImages.length}`
                                    ].click()
                                  }
                                }, 0)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add More Image
                            </button>
                          </div>
                          {getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                            <div className="space-y-2">
                              <label htmlFor={`reuse-images-${variantIndex}-${mdIndex}`} className={labelClass}>
                                Do you want to reuse additional images?
                              </label>
                              <div className="relative">
                                <select
                                  id={`reuse-images-${variantIndex}-${mdIndex}`}
                                  value={md.reuseAdditionalImages}
                                  onChange={(e) => {
                                    updateSizeSectionField(
                                      variantIndex,
                                      mdIndex,
                                      "reuseAdditionalImages",
                                      e.target.value,
                                    )
                                    if (e.target.value === "no") {
                                      updateSizeSectionField(variantIndex, mdIndex, "additionalImages", [
                                        { file: null, preview: null },
                                      ]) // Reset if not reusing
                                      updateSizeSectionField(variantIndex, mdIndex, "reusedImageSource", "")
                                    }
                                  }}
                                  className={selectClass}
                                >
                                  <option value="no">No</option>
                                  <option value="yes">Yes</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <svg
                                    className="fill-current h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}

                          {md.reuseAdditionalImages === "yes" &&
                            getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                              <div className="space-y-2">
                                <label
                                  htmlFor={`reused-image-source-${variantIndex}-${mdIndex}`}
                                  className={labelClass}
                                >
                                  Select source
                                </label>
                                <div className="relative">
                                  <select
                                    id={`reused-image-source-${variantIndex}-${mdIndex}`}
                                    value={md.reusedImageSource}
                                    onChange={(e) =>
                                      handleReuseSelection(variantIndex, mdIndex, "images", e.target.value)
                                    }
                                    className={selectClass}
                                  >
                                    <option value="">Select source</option>
                                    {getReuseOptions(variantIndex, mdIndex, "images").map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                      className="fill-current h-4 w-4"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}

                          {md.reuseAdditionalImages === "no" &&
                            md.additionalImages.map((image, index) => (
                              <div key={index} className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="flex-1 space-y-2">
                                  <label
                                    htmlFor={`md-additional-image-${variantIndex}-${mdIndex}-${index}`}
                                    className={labelClass}
                                  >
                                    Image {index + 1}
                                  </label>
                                  <input
                                    id={`md-additional-image-${variantIndex}-${mdIndex}-${index}`}
                                    type="file"
                                    accept="image/*"
                                    ref={(el) =>
                                      (mdAdditionalImageInputRefs.current[`${variantIndex}-${mdIndex}-${index}`] = el)
                                    } // Assign ref
                                    onChange={(e) => {
                                      const newImages = [...md.additionalImages]
                                      if (newImages[index]?.preview) URL.revokeObjectURL(newImages[index].preview)
                                      newImages[index] = {
                                        file: e.target.files[0],
                                        preview: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null,
                                      }
                                      updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                    }}
                                    className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer`}
                                  />
                                  {image.preview && (
                                    <div className="mt-2">
                                      <img
                                        src={image.preview || "/placeholder.svg"}
                                        alt={`MD Add ${index + 1} Preview`}
                                        className="h-20 w-20 object-cover rounded-md shadow-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className={`${destructiveButtonClass} p-2`}
                                  onClick={() => {
                                    const newImages = md.additionalImages.filter((_, i) => i !== index)
                                    if (md.additionalImages[index]?.preview)
                                      URL.revokeObjectURL(md.additionalImages[index].preview)
                                    updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* Optional Details for this size */}
                        <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h5 className="text-md font-semibold text-gray-800">
                              Optional Details for this Size (Optional)
                            </h5>
                            <button
                              type="button"
                              className={outlineButtonClass}
                              onClick={() => {
                                updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", [
                                  ...md.optionalDetails,
                                  { key: "", value: "" },
                                ])
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" /> Add Optional Detail
                            </button>
                          </div>
                          {getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                            <div className="space-y-2">
                              <label
                                htmlFor={`reuse-optional-details-${variantIndex}-${mdIndex}`}
                                className={labelClass}
                              >
                                Do you want to reuse optional details?
                              </label>
                              <div className="relative">
                                <select
                                  id={`reuse-optional-details-${variantIndex}-${mdIndex}`}
                                  value={md.reuseOptionalDetails}
                                  onChange={(e) => {
                                    updateSizeSectionField(
                                      variantIndex,
                                      mdIndex,
                                      "reuseOptionalDetails",
                                      e.target.value,
                                    )
                                    if (e.target.value === "no") {
                                      updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", [
                                        { key: "", value: "" },
                                      ]) // Reset if not reusing
                                      updateSizeSectionField(variantIndex, mdIndex, "reusedOptionalDetailSource", "")
                                    }
                                  }}
                                  className={selectClass}
                                >
                                  <option value="no">No</option>
                                  <option value="yes">Yes</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                  <svg
                                    className="fill-current h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}

                          {md.reuseOptionalDetails === "yes" &&
                            getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                              <div className="space-y-2">
                                <label
                                  htmlFor={`reused-optional-detail-source-${variantIndex}-${mdIndex}`}
                                  className={labelClass}
                                >
                                  Select source
                                </label>
                                <div className="relative">
                                  <select
                                    id={`reused-optional-detail-source-${variantIndex}-${mdIndex}`}
                                    value={md.reusedOptionalDetailSource}
                                    onChange={(e) =>
                                      handleReuseSelection(variantIndex, mdIndex, "optionalDetails", e.target.value)
                                    }
                                    className={selectClass}
                                  >
                                    <option value="">Select source</option>
                                    {getReuseOptions(variantIndex, mdIndex, "optionalDetails").map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                      className="fill-current h-4 w-4"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}

                          {md.reuseOptionalDetails === "no" &&
                            md.optionalDetails.map((detail, index) => (
                              <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                  <label
                                    htmlFor={`md-optional-key-${variantIndex}-${mdIndex}-${index}`}
                                    className={labelClass}
                                  >
                                    Key
                                  </label>
                                  <input
                                    id={`md-optional-key-${variantIndex}-${mdIndex}-${index}`}
                                    type="text"
                                    value={detail.key}
                                    onChange={(e) => {
                                      const newDetails = [...md.optionalDetails]
                                      newDetails[index].key = e.target.value
                                      updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                    }}
                                    placeholder="e.g., Feature"
                                    className={inputClass}
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <label
                                    htmlFor={`md-optional-value-${variantIndex}-${mdIndex}-${index}`}
                                    className={labelClass}
                                  >
                                    Value
                                  </label>
                                  <input
                                    id={`md-optional-value-${variantIndex}-${mdIndex}-${index}`}
                                    type="text"
                                    value={detail.value}
                                    onChange={(e) => {
                                      const newDetails = [...md.optionalDetails]
                                      newDetails[index].value = e.target.value
                                      updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                    }}
                                    placeholder="e.g., Waterproof"
                                    className={inputClass}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className={`${destructiveButtonClass} p-2`}
                                  onClick={() => {
                                    const newDetails = md.optionalDetails.filter((_, i) => i !== index)
                                    updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* Price & Stock for this specific Size Section (only if not common for variant) */}
                        {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                          <div className="space-y-2">
                            <label htmlFor={`md-price-${variantIndex}-${mdIndex}`} className={labelClass}>
                              Price ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x
                              {md.size?.height || "?"})
                            </label>
                            <input
                              id={`md-price-${variantIndex}-${mdIndex}`}
                              type="number"
                              value={md.price}
                              onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "price", e.target.value)}
                              placeholder="Enter price"
                              className={inputClass}
                            />
                          </div>
                        )}
                        {variant.moreDetails.length > 1 && variant.isStockSame === "no" && (
                          <div className="space-y-2">
                            <label htmlFor={`md-stock-${variantIndex}-${mdIndex}`} className={labelClass}>
                              Stock ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x
                              {md.size?.height || "?"})
                            </label>
                            <input
                              id={`md-stock-${variantIndex}-${mdIndex}`}
                              type="number"
                              value={md.stock}
                              onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "stock", e.target.value)}
                              placeholder="Enter stock"
                              className={inputClass}
                            />
                          </div>
                        )}
                        {variant.moreDetails.length > 1 &&
                          (variant.isPriceSame === "no" || variant.isStockSame === "no") && (
                            <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
                              <div className="flex justify-between items-center">
                                <h5 className="text-md font-semibold text-gray-800">
                                  Bulk Pricing Combinations ({variant.colorName} - {md.size?.length || "?"}x
                                  {md.size?.breadth || "?"}x{md.size?.height || "?"})
                                </h5>
                                <button
                                  type="button"
                                  className={outlineButtonClass}
                                  onClick={() => {
                                    updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", [
                                      ...md.bulkPricingCombinations,
                                      { wholesalePrice: "", quantity: "" },
                                    ])
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add Bulk Pricing
                                </button>
                              </div>
                              {md.bulkPricingCombinations.map((bpc, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                                  <div className="flex-1 space-y-2">
                                    <label
                                      htmlFor={`md-bpc-wholesale-${variantIndex}-${mdIndex}-${index}`}
                                      className={labelClass}
                                    >
                                      Wholesale Price
                                    </label>
                                    <input
                                      id={`md-bpc-wholesale-${variantIndex}-${mdIndex}-${index}`}
                                      type="number"
                                      value={bpc.wholesalePrice}
                                      onChange={(e) => {
                                        const newBPC = [...md.bulkPricingCombinations]
                                        newBPC[index].wholesalePrice = e.target.value
                                        updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                      }}
                                      placeholder="Enter wholesale price"
                                      className={inputClass}
                                    />
                                    {md.price &&
                                      bpc.wholesalePrice &&
                                      Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(md.price) && (
                                        <p className="text-red-500 text-sm mt-1">
                                          Wholesale price must be less than this price.
                                        </p>
                                      )}
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <label
                                      htmlFor={`md-bpc-quantity-${variantIndex}-${mdIndex}-${index}`}
                                      className={labelClass}
                                    >
                                      Quantity
                                    </label>
                                    <input
                                      id={`md-bpc-quantity-${variantIndex}-${mdIndex}-${index}`}
                                      type="number"
                                      value={bpc.quantity}
                                      onChange={(e) => {
                                        const newBPC = [...md.bulkPricingCombinations]
                                        newBPC[index].quantity = e.target.value
                                        updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                      }}
                                      placeholder="Enter quantity"
                                      className={inputClass}
                                    />
                                    <p className="text-sm font-bold text-gray-700 mt-1">This will be included</p>
                                  </div>
                                  <button
                                    type="button"
                                    className={`${destructiveButtonClass} p-2`}
                                    onClick={() => {
                                      const newBPC = md.bulkPricingCombinations.filter((_, i) => i !== index)
                                      updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  {/* Price & Stock for Variant (Common or Per Size Section) */}
                  {/* Display these dropdowns only if there are multiple size sections */}
                  {variant.moreDetails.length > 1 && (
                    <>
                      <div className="space-y-2">
                        <label className={labelClass}>Is price same for all size sections?</label>
                        <div className="relative">
                          <select
                            value={variant.isPriceSame}
                            onChange={(e) => updateVariantField(variantIndex, "isPriceSame", e.target.value)}
                            className={selectClass}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Is stock same for all size sections?</label>
                        <div className="relative">
                          <select
                            value={variant.isStockSame}
                            onChange={(e) => updateVariantField(variantIndex, "isStockSame", e.target.value)}
                            className={selectClass}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg
                              className="fill-current h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common Price, Stock, Bulk Pricing (always shown if single size, or if 'yes' selected for multiple sizes) */}
                  {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                    <div className="space-y-2">
                      <label htmlFor={`common-price-${variantIndex}`} className={labelClass}>
                        Common Price
                      </label>
                      <input
                        id={`common-price-${variantIndex}`}
                        type="number"
                        value={variant.commonPrice}
                        onChange={(e) => updateVariantField(variantIndex, "commonPrice", e.target.value)}
                        placeholder="Enter common price"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {(variant.moreDetails.length === 1 || variant.isStockSame === "yes") && (
                    <div className="space-y-2">
                      <label htmlFor={`common-stock-${variantIndex}`} className={labelClass}>
                        Common Stock
                      </label>
                      <input
                        id={`common-stock-${variantIndex}`}
                        type="number"
                        value={variant.commonStock}
                        onChange={(e) => updateVariantField(variantIndex, "commonStock", e.target.value)}
                        placeholder="Enter common stock"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                    <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-white">
                      <div className="flex justify-between items-center">
                        <h4 className={subSectionTitleClass}>Common Bulk Pricing Combinations</h4>
                        <button
                          type="button"
                          className={outlineButtonClass}
                          onClick={() => {
                            updateVariantField(variantIndex, "commonBulkPricingCombinations", [
                              ...variant.commonBulkPricingCombinations,
                              { wholesalePrice: "", quantity: "" },
                            ])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Common Bulk Pricing
                        </button>
                      </div>
                      {variant.commonBulkPricingCombinations.map((bpc, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-2">
                            <label htmlFor={`common-bpc-wholesale-${variantIndex}-${index}`} className={labelClass}>
                              Wholesale Price
                            </label>
                            <input
                              id={`common-bpc-wholesale-${variantIndex}-${index}`}
                              type="number"
                              value={bpc.wholesalePrice}
                              onChange={(e) => {
                                const newBPC = [...variant.commonBulkPricingCombinations]
                                newBPC[index].wholesalePrice = e.target.value
                                updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                              }}
                              placeholder="Enter wholesale price"
                              className={inputClass}
                            />
                            {variant.commonPrice &&
                              bpc.wholesalePrice &&
                              Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(variant.commonPrice) && (
                                <p className="text-red-500 text-sm mt-1">
                                  Wholesale price must be less than common price.
                                </p>
                              )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <label htmlFor={`common-bpc-quantity-${variantIndex}-${index}`} className={labelClass}>
                              Quantity
                            </label>
                            <input
                              id={`common-bpc-quantity-${variantIndex}-${index}`}
                              type="number"
                              value={bpc.quantity}
                              onChange={(e) => {
                                const newBPC = [...variant.commonBulkPricingCombinations]
                                newBPC[index].quantity = e.target.value
                                updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                              }}
                              placeholder="Enter quantity"
                              className={inputClass}
                            />
                            <p className="text-sm font-bold text-gray-700 mt-1">This will be included</p>
                          </div>
                          <button
                            type="button"
                            className={`${destructiveButtonClass} p-2`}
                            onClick={() => {
                              const newBPC = variant.commonBulkPricingCombinations.filter((_, i) => i !== index)
                              updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className={secondaryButtonClass} onClick={addVariant}>
                <Plus className="h-5 w-5 mr-2" /> Add Product Variant
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <button type="submit" className={`${primaryButtonClass} px-8 py-3 text-lg`}>
            Add Product
          </button>
          {!hasVariants && (
            <button
              type="button"
              className={`${outlineButtonClass} px-8 py-3 text-lg`}
              onClick={() => setHasVariants(true)}
            >
              Add Variant Section
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
