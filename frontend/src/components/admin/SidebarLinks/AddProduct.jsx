"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchCategories, addProduct, fetchCompanySettings } from "../../../../utils/api"
import { X, Plus, AlertCircle, Upload, Image as ImageIcon, Package, Tag, DollarSign, Layers, Check } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, message = "Adding Product..." }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
        <h4 className="font-semibold text-gray-900 mb-2">{message}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Please wait while we process your request...</p>
      </div>
    </div>
  )
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [productName, setProductName] = useState("")
  const [allCategoriesTree, setAllCategoriesTree] = useState([])
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([])

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [categoryPath, setCategoryPath] = useState("")

  const [productDetails, setProductDetails] = useState([{ key: "", value: "" }])
  const [stock, setStock] = useState("")
  const [price, setPrice] = useState("")
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([{ file: null, preview: null }])
  const [bulkPricing, setBulkPricing] = useState([{ wholesalePrice: "", quantity: "" }])

  // Start of use state variables for dimension based pricing
  const [hasDimensionPricing, setHasDimensionPricing] = useState("no")
const [dimensionPricingType, setDimensionPricingType] = useState("dynamic") // 'static' or 'dynamic'
const [dimensionPricingData, setDimensionPricingData] = useState([
  { length: "", breadth: "", height: "", price: "", pricingType: "dynamic", stock: "", bulkPricing: [{ wholesalePrice: "", quantity: "" }] }
])
// End of use state variables for dimension based pricing
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState([])


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
  
  // If dimension pricing is enabled, hide price field and variants
  if (hasDimensionPricing === "yes") {
    setPrice("")
    setVariants([])
    setHasVariants(false)
  }
}, [isBasicInfoFilled, isVariantInfoFilled, hasDimensionPricing])

  // Fetch categories on component mount
  useEffect(() => {
    const getCategories = async () => {
      try {
        const categories = await fetchCategories()
        setAllCategoriesTree(categories)
        setAllCategoriesFlat(flattenCategories(categories))
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast.error("Failed to fetch categories")
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

  // Handlers for dynamic fields
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

  // Handlers for dynamic image fields
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
      isPriceSame: "yes",
      isStockSame: "yes",
      commonPrice: "",
      commonStock: "",
      commonBulkPricingCombinations: [{ wholesalePrice: "", quantity: "" }],
      isDefault: variants.length === 0,
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index)
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
      newVariants.forEach((v, i) => {
        if (i !== index) {
          v.isDefault = false
        }
      })
    }
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  // Size section handlers
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

  const updateSingleSizeField = (variantIndex, mdIndex, field, value) => {
    const newVariants = [...variants]
    newVariants[variantIndex].moreDetails[mdIndex].size[field] = value
    setVariants(newVariants)
  }

  // Logic for generating reuse options
  const getReuseOptions = useCallback(
    (currentVariantIndex, currentMdIndex, type) => {
      const options = []
      variants.forEach((variant, vIdx) => {
        if (vIdx === currentVariantIndex) {
          variant.moreDetails.forEach((md, mdIdx) => {
            const isBeforeCurrent = mdIdx < currentMdIndex
            const isNotReusing =
              (type === "images" && md.reuseAdditionalImages === "no") ||
              (type === "optionalDetails" && md.reuseOptionalDetails === "no")

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
                label: `${variant.colorName || "Variant"} - Size Section ${mdIdx + 1} (${sizeInfo})`,
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
        newVariants[variantIndex].moreDetails[mdIndex].additionalImages.forEach((img) => {
          if (img?.preview) URL.revokeObjectURL(img.preview)
        })
        newVariants[variantIndex].moreDetails[mdIndex].additionalImages = selectedOption.data.map((item) => ({
          file: item.file,
          preview: item.file ? URL.createObjectURL(item.file) : item.preview,
        }))
        newVariants[variantIndex].moreDetails[mdIndex].reusedImageSource = selectedId
      } else {
        newVariants[variantIndex].moreDetails[mdIndex].optionalDetails = selectedOption.data.map((item) => ({
          ...item,
        }))
        newVariants[variantIndex].moreDetails[mdIndex].reusedOptionalDetailSource = selectedId
      }
    }
    setVariants(newVariants)
  }

  // Dimension pricing handlers
const addDimensionPricing = () => {
  setDimensionPricingData([...dimensionPricingData, { 
    length: "", 
    breadth: "", 
    height: "", 
    price: "", 
    pricingType: dimensionPricingType,
    stock: "",
    bulkPricing: [{ wholesalePrice: "", quantity: "" }]
  }])
}

const updateDimensionPricing = (index, field, value) => {
  const newData = [...dimensionPricingData]
  newData[index][field] = value
  setDimensionPricingData(newData)
}

const removeDimensionPricing = (index) => {
  const newData = dimensionPricingData.filter((_, i) => i !== index)
  setDimensionPricingData(newData)
}

// Bulk pricing handlers for static dimensions
const addStaticDimensionBulkPricing = (dimensionIndex) => {
  const newData = [...dimensionPricingData]
  newData[dimensionIndex].bulkPricing.push({ wholesalePrice: "", quantity: "" })
  setDimensionPricingData(newData)
}

const updateStaticDimensionBulkPricing = (dimensionIndex, bulkIndex, field, value) => {
  const newData = [...dimensionPricingData]
  newData[dimensionIndex].bulkPricing[bulkIndex][field] = value
  setDimensionPricingData(newData)
}

const removeStaticDimensionBulkPricing = (dimensionIndex, bulkIndex) => {
  const newData = [...dimensionPricingData]
  newData[dimensionIndex].bulkPricing = newData[dimensionIndex].bulkPricing.filter((_, i) => i !== bulkIndex)
  setDimensionPricingData(newData)
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
    // Validate dimension pricing if enabled
    if (hasDimensionPricing === "yes") {
      if (dimensionPricingType === "static") {
        const hasValidDimensionData = dimensionPricingData.some(
          (item) => item.length && item.breadth && item.price && item.stock
        )
        
        if (!hasValidDimensionData) {
          toast.error("Please fill at least one complete dimension entry (Length, Breadth, Price, and Stock are required for static pricing)")
          setIsLoading(false)
          return
        }
      } else {
        const hasValidDimensionData = dimensionPricingData.some(
          (item) => item.length && item.breadth && item.price
        )
        
        if (!hasValidDimensionData) {
          toast.error("Please fill at least one complete dimension pricing entry (Length, Breadth, and Price are required)")
          setIsLoading(false)
          return
        }
      }
    }

    const formData = new FormData()

      const finalCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1] || ""

 const productData = {
  name: productName,
  mainCategory: selectedCategoryIds[0] || "",
  subCategory: finalCategoryId,
  categoryPath: categoryPath,
  productDetails: productDetails.filter((pd) => pd.key && pd.value),
  hasVariants: hasVariants,
  hasDimensionPricing: hasDimensionPricing,
  dimensionPricingData: hasDimensionPricing === "yes" 
  ? dimensionPricingData
      .filter(d => dimensionPricingType === "static" 
        ? (d.length && d.breadth && d.price && d.stock)
        : (d.length && d.breadth && d.price)
      )
      .map(d => ({
        length: d.length,
        breadth: d.breadth,
        height: d.height || "",
        price: d.price,
        pricingType: dimensionPricingType,
        stock: dimensionPricingType === "static" ? d.stock : undefined,
        bulkPricing: dimensionPricingType === "static" 
          ? d.bulkPricing.filter(bp => bp.wholesalePrice && bp.quantity)
          : undefined
      }))
  : []
}

      if (!hasVariants) {
        productData.stock = stock
        productData.price = price
        productData.bulkPricing = bulkPricing.filter((bp) => bp.wholesalePrice && bp.quantity)
      }

      if (mainImage) {
        formData.append("image", mainImage)
      }

      additionalImages.forEach((img) => {
        if (img.file) {
          formData.append(`additionalImages`, img.file)
        }
      })

      if (hasVariants) {
        productData.variants = variants.map((variant) => {
          const variantObj = {
            colorName: variant.colorName,
            optionalDetails: variant.optionalDetails.filter((od) => od.key && od.value),
            isDefault: variant.isDefault,
            isPriceSame: variant.isPriceSame,
            isStockSame: variant.isStockSame,
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
                optionalDetails:
                  md.reuseOptionalDetails === "yes"
                    ? md.optionalDetails
                    : md.optionalDetails.filter((od) => od.key && od.value),
                additionalImages: [],
              }
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

        variants.forEach((variant, variantIndex) => {
          if (variant.variantImage.file) {
            formData.append(`variants[${variantIndex}].variantImage`, variant.variantImage.file)
          }
          variant.moreDetails.forEach((md, mdIndex) => {
            md.additionalImages.forEach((img) => {
              if (img.file) {
                formData.append(`variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`, img.file)
              }
            })
          })
        })
      }

      formData.append("productData", JSON.stringify(productData))

      const response = await addProduct(formData)
      console.log("Product added successfully:", response)
      toast.success("Product added successfully! 🎉", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      
      // Reset form
setProductName("")
setSelectedCategoryIds([])
setCategoryPath("")
setProductDetails([{ key: "", value: "" }])
setStock("")
setPrice("")
setMainImage(null)
setMainImagePreview(null)
setAdditionalImages([{ file: null, preview: null }])
setBulkPricing([{ wholesalePrice: "", quantity: "" }])
setVariants([])
setHasVariants(false)
setHasDimensionPricing("no")
setDimensionPricingType("dynamic")
setDimensionPricingData([{ length: "", breadth: "", height: "", price: "", pricingType: "dynamic", stock: "", bulkPricing: [{ wholesalePrice: "", quantity: "" }] }])

    } catch (error) {
  console.error("Error adding product:", error);

  const errorMessage =
    error.response?.data?.error ||  // From backend (like "Cannot add more than 100 products.")
    error.message ||                // From thrown errors
    "Something went wrong while adding the product.";

  toast.error(errorMessage, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
}
 finally {
      setIsLoading(false)
    }
  }

  // Professional styling classes
  const cardClass = "bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
  const sectionClass = "p-8"
  const headerClass = "border-b border-gray-100 px-8 py-6 bg-gradient-to-r from-gray-50 to-white"
  const titleClass = "text-2xl font-bold text-gray-900 flex items-center gap-3"
  const subtitleClass = "text-gray-600 dark:text-gray-400 mt-1"
  const inputClass = "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 placeholder-gray-400"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2"
  const buttonClass = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  const primaryButtonClass = `${buttonClass} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500`
  const secondaryButtonClass = `${buttonClass} bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-200 dark:border-gray-700 focus:ring-gray-500`
  const dangerButtonClass = `${buttonClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500`
  const selectClass = `${inputClass} cursor-pointer appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`;

  // Dynamic Category Dropdowns
  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean)
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level)
    }
    setSelectedCategoryIds(newSelectedCategoryIds)
  }

  const renderCategoryDropdowns = () => {
    const dropdowns = []

    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
    dropdowns.push(
      <div key={`category-dropdown-0`} className="space-y-2">
        <label htmlFor={`category-level-0`} className={`${inputClass} dark:text-white`}>
          <Tag className="inline w-4 h-4 mr-2" />
          Main Category
        </label>
        <select
          id={`category-level-0`}
          value={selectedCategoryIds[0] || ""}
          onChange={(e) => handleCategorySelect(0, e.target.value)}
          className={selectClass}
        >
          <option value="">Select main category</option>
          {mainCategoryOptions.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>,
    )

    const lastSelectedCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1]
    const lastSelectedCategoryInTree = findCategoryInTree(lastSelectedCategoryId, allCategoriesTree)
    const subCategoryOptions = lastSelectedCategoryInTree ? lastSelectedCategoryInTree.subcategories || [] : []

    if (selectedCategoryIds.length > 0 && subCategoryOptions.length > 0) {
      dropdowns.push(
        <div key={`category-dropdown-sub`} className="space-y-2">
          <label htmlFor={`category-level-sub`} className={`${inputClass} dark:text-white`}>
            <Layers className="inline w-4 h-4 mr-2" />
            Sub Category
          </label>
          <select
            id={`category-level-sub`}
            value={selectedCategoryIds[selectedCategoryIds.length] || ""}
            onChange={(e) => handleCategorySelect(selectedCategoryIds.length, e.target.value)}
            className={selectClass}
          >
            <option value="">Select sub category</option>
            {subCategoryOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>,
      )
    }

    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{dropdowns}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <LoadingOverlay isLoading={isLoading} />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Add New Product
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create and manage your product catalog with our comprehensive product management system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className={cardClass}>
            <div className={headerClass}>
              <h2 className={titleClass}>
                <Package className="w-8 h-8 text-blue-600" />
                Basic Information
              </h2>
              <p className={subtitleClass}>Essential details about your product</p>
            </div>
            <div className={sectionClass}>
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="productName" className={`${inputClass} dark:text-white`}>
                      Product Name *
                    </label>
                    <input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter your product name"
                      className={`${inputClass} dark:text-gray-400`}
                    />
                  </div>
                  <div className="space-y-6">
                    {renderCategoryDropdowns()}
                  </div>
                </div>

                {categoryPath && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <Check className="w-5 h-5" />
                      Category Path: {categoryPath}
                    </div>
                  </div>
                )}

                {/* Product Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Product Specifications</h3>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => addKeyValuePair(setProductDetails, productDetails)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Detail
                    </button>
                  </div>
                  {productDetails.map((detail, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`${inputClass} dark:text-white`}>Specification</label>
                        <input
                          type="text"
                          value={detail.key}
                          onChange={(e) =>
                            updateKeyValuePair(setProductDetails, productDetails, index, "key", e.target.value)
                          }
                          placeholder="e.g., Material, Weight, Color"
                          className={`${inputClass} dark:text-gray-400`}
                        />
                      </div>
                      <div className="space-y-2 flex gap-4 items-end">
                        <div className="flex-1">
                          <label className={`${inputClass} dark:text-white`}>Value</label>
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) =>
                              updateKeyValuePair(setProductDetails, productDetails, index, "value", e.target.value)
                            }
                            placeholder="e.g., Cotton, 500g, Blue"
                            className={`${inputClass} dark:text-gray-400`}
                          />
                        </div>
                        <button
                          type="button"
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                          onClick={() => removeKeyValuePair(setProductDetails, productDetails, index)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                  </div>

                {/* Dimension Based Pricing Dropdown */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                  <div className="space-y-4">
                    <label htmlFor="dimensionPricing" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Does product have dimension based pricing?
                    </label>
                    <select
                      id="dimensionPricing"
                      value={hasDimensionPricing}
onChange={async (e) => {
  const value = e.target.value
  setHasDimensionPricing(value)
  
  // Fetch company settings when user selects "yes"
  if (value === "yes") {
    try {
      const settings = await fetchCompanySettings()
      const fetchedPricingType = settings.dimensionBasedPricing || "dynamic"
      setDimensionPricingType(fetchedPricingType)
      
      // Update all dimension pricing data with the pricing type
      setDimensionPricingData(prevData => 
        prevData.map(item => ({ 
          ...item, 
          pricingType: fetchedPricingType,
          stock: item.stock || "",
          bulkPricing: item.bulkPricing || [{ wholesalePrice: "", quantity: "" }]
        }))
      )
    } catch (error) {
      console.error("Failed to fetch company settings:", error)
      toast.error("Failed to fetch company settings")
      // Reset to "no" if fetch fails
      setHasDimensionPricing("no")
    }
  }
}}
                      className={selectClass}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Dimension Based Pricing Section */}
                {hasDimensionPricing === "yes" && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Dimension Based Pricing
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Mode: <span className="font-medium capitalize">{dimensionPricingType}</span>
                        </p>
                      </div>
                      {dimensionPricingType === "static" && (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={addDimensionPricing}
                        >
                          <Plus className="w-4 h-4" />
                          Add Dimension
                        </button>
                      )}
                    </div>

                    {dimensionPricingData.map((item, index) => (
  <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
    {dimensionPricingType === "static" && dimensionPricingData.length > 1 && (
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">Dimension Set {index + 1}</h4>
        <button
          type="button"
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-white"
          onClick={() => removeDimensionPricing(index)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <label className={labelClass}>
          Length (cm) *
        </label>
        <input
          type="number"
          value={item.length}
          onChange={(e) => updateDimensionPricing(index, "length", e.target.value)}
          placeholder="Length"
          className={`${inputClass} dark:text-gray-400`}
          required
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass}>
          Breadth (cm) *
        </label>
        <input
          type="number"
          value={item.breadth}
          onChange={(e) => updateDimensionPricing(index, "breadth", e.target.value)}
          placeholder="Breadth"
          className={`${inputClass} dark:text-gray-400`}
          required
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass}>
          Height (cm)
        </label>
        <input
          type="number"
          value={item.height}
          onChange={(e) => updateDimensionPricing(index, "height", e.target.value)}
          placeholder="Height (optional)"
          className={`${inputClass} dark:text-gray-400`}
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass}>
          Price ($) *
        </label>
        <input
          type="number"
          value={item.price}
          onChange={(e) => updateDimensionPricing(index, "price", e.target.value)}
          placeholder="Price"
          className={`${inputClass} dark:text-gray-400`}
          required
        />
      </div>
    </div>

    {/* Stock and Bulk Pricing for Static Dimensions */}
    {dimensionPricingType === "static" && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className={labelClass}>
              <Package className="inline w-4 h-4 mr-2" />
              Stock Quantity *
            </label>
            <input
              type="number"
              value={item.stock}
              onChange={(e) => updateDimensionPricing(index, "stock", e.target.value)}
              placeholder="Stock quantity"
              className={`${inputClass} dark:text-gray-400`}
              required
            />
          </div>
        </div>

        {/* Bulk Pricing for this dimension */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h5 className="text-md font-semibold text-gray-900 dark:text-white">
              Bulk Pricing for this Dimension
            </h5>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => addStaticDimensionBulkPricing(index)}
            >
              <Plus className="w-4 h-4" />
              Add Bulk Price
            </button>
          </div>
          {item.bulkPricing && item.bulkPricing.map((bp, bpIndex) => (
            <div key={bpIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
              <div className="space-y-2">
                <label className={labelClass}>Wholesale Price ($)</label>
                <input
                  type="number"
                  value={bp.wholesalePrice}
                  onChange={(e) => updateStaticDimensionBulkPricing(index, bpIndex, "wholesalePrice", e.target.value)}
                  placeholder="Bulk price"
                  className={`${inputClass} dark:text-gray-400`}
                />
                {item.price && bp.wholesalePrice && parseFloat(bp.wholesalePrice) >= parseFloat(item.price) && (
                  <p className="text-red-500 text-sm">Must be less than regular price</p>
                )}
              </div>
              <div className="space-y-2 flex gap-4 items-end">
                <div className="flex-1">
                  <label className={labelClass}>Minimum Quantity</label>
                  <input
                    type="number"
                    value={bp.quantity}
                    onChange={(e) => updateStaticDimensionBulkPricing(index, bpIndex, "quantity", e.target.value)}
                    placeholder="Min qty"
                    className={`${inputClass} dark:text-gray-400`}
                  />
                </div>
                <button
                  type="button"
                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                  onClick={() => removeStaticDimensionBulkPricing(index, bpIndex)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
))}
                  </div>
                )}

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2">Important Notice</h4>
                      <p className="text-amber-800">
                        Fill the fields below only if you don't have product variants. If you add variants, these basic fields will be ignored.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Product Fields */}
                {!hasVariants && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label htmlFor="stock" className={`${inputClass} dark:text-white`}>
                          <Package className="inline w-4 h-4 mr-2" />
                          Stock Quantity
                        </label>
                        <input
                          id="stock"
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Available quantity"
                          className={`${inputClass} dark:text-gray-400`}
                        />
                      </div>
                      {hasDimensionPricing === "no" && (
                        <div className="space-y-2">
                          <label htmlFor="price" className={`${inputClass} dark:text-white`}>
                            <DollarSign className="inline w-4 h-4 mr-2" />
                            Price ($)
                          </label>
                          <input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Product price"
                            className={`${inputClass} dark:text-gray-400`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Main Image Upload */}
                    <div className="space-y-4">
                      <label htmlFor="mainImage" className={`${inputClass} dark:text-white`}>
                        <ImageIcon className="inline w-4 h-4 mr-2" />
                        Product Main Image
                      </label>
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                        <input
                          id="mainImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setMainImage(e.target.files[0])}
                          className="hidden"
                        />
                        <label htmlFor="mainImage" className="cursor-pointer">
                          {mainImagePreview ? (
                            <div className="space-y-4">
                              <img
                                src={mainImagePreview}
                                alt="Main Product Preview"
                                className="h-40 w-40 object-cover rounded-xl mx-auto shadow-lg"
                              />
                              <p className="text-sm text-gray-600 dark:text-gray-400">Click to change image</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                              <div>
                                <p className="text-lg font-medium text-gray-900">Upload Product Image</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">PNG, JPG up to 10MB</p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Additional Images */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Images</h3>
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() => {
                            addImageField(setAdditionalImages, additionalImages)
                            setTimeout(() => {
                              if (mainAdditionalImageInputRef.current[additionalImages.length]) {
                                mainAdditionalImageInputRef.current[additionalImages.length].click()
                              }
                            }, 0)
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Add Image
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {additionalImages.map((image, index) => (
                          <div key={index} className="relative">
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                              <input
                                id={`additional-image-${index}`}
                                type="file"
                                accept="image/*"
                                ref={(el) => (mainAdditionalImageInputRef.current[index] = el)}
                                onChange={(e) =>
                                  updateImageField(setAdditionalImages, additionalImages, index, e.target.files[0])
                                }
                                className="hidden"
                              />
                              <label htmlFor={`additional-image-${index}`} className="cursor-pointer block">
                                {image.preview ? (
                                  <img
                                    src={image.preview}
                                    alt={`Additional ${index + 1}`}
                                    className="h-24 w-24 object-cover rounded-lg mx-auto shadow-md"
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Image {index + 1}</p>
                                  </div>
                                )}
                              </label>
                            </div>
                            <button
                              type="button"
                              className="dark:text-white absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              onClick={() => removeImageField(setAdditionalImages, additionalImages, index)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk Pricing */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bulk Pricing Options</h3>
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() => addBulkPricingField(setBulkPricing, bulkPricing)}
                        >
                          <Plus className="w-4 h-4" />
                          Add Pricing Tier
                        </button>
                      </div>
                      {bulkPricing.map((bp, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                          <div className="space-y-2">
                            <label className={`${inputClass} dark:text-white`}>Wholesale Price ($)</label>
                            <input
                              type="number"
                              value={bp.wholesalePrice}
                              onChange={(e) =>
                                updateBulkPricingField(setBulkPricing, bulkPricing, index, "wholesalePrice", e.target.value)
                              }
                              placeholder="Bulk price"
                              className={`${inputClass} dark:text-gray-400`}
                            />
                            {price &&
                              bp.wholesalePrice &&
                              Number.parseFloat(bp.wholesalePrice) >= Number.parseFloat(price) && (
                                <p className="text-red-500 text-sm">Must be less than regular price</p>
                              )}
                          </div>
                          <div className="space-y-2 flex gap-4 items-end">
                            <div className="flex-1">
                              <label className={`${inputClass} dark:text-white`}>Minimum Quantity</label>
                              <input
                                type="number"
                                value={bp.quantity}
                                onChange={(e) =>
                                  updateBulkPricingField(setBulkPricing, bulkPricing, index, "quantity", e.target.value)
                                }
                                placeholder="Min qty"
                                className={`${inputClass} dark:text-gray-400`}
                              />
                            </div>
                            <button
                              type="button"
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                              onClick={() => removeBulkPricingField(setBulkPricing, bulkPricing, index)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Product Variants Section */}
          {hasVariants && (
            <div className={cardClass}>
              <div className={headerClass}>
                <h2 className={titleClass}>
                  <Layers className="w-8 h-8 text-purple-600" />
                  Product Variants
                </h2>
                <p className={subtitleClass}>Create different variations of your product</p>
              </div>
              <div className={sectionClass}>
                <div className="space-y-10">
                  {variants.map((variant, variantIndex) => (
                    <div
                      key={variantIndex}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 dark:border-gray-700 p-8 space-y-8"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Variant {variantIndex + 1}
                          {variant.isDefault && (
                            <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              Default
                            </span>
                          )}
                        </h3>
                        <button
                          type="button"
                          className={`${dangerButtonClass} dark:text-white`}
                          onClick={() => removeVariant(variantIndex)}
                        >
                          <X className="w-4 h-4" />
                          Remove Variant
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className={`${inputClass} dark:text-white`}>Color/Variant Name</label>
                          <input
                            type="text"
                            value={variant.colorName}
                            onChange={(e) => updateVariantField(variantIndex, "colorName", e.target.value)}
                            placeholder="e.g., Red, Blue, Large"
                            className={`${inputClass} dark:text-gray-400`}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className={`${inputClass} dark:text-white`}>Variant Image</label>
                          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                              id={`variant-image-${variantIndex}`}
                              type="file"
                              accept="image/*"
                              ref={(el) => (variantImageInputRefs.current[variantIndex] = el)}
                              onChange={(e) =>
                                updateVariantField(variantIndex, "variantImage", {
                                  file: e.target.files[0],
                                  preview: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null,
                                })
                              }
                              className="hidden"
                            />
                            <label htmlFor={`variant-image-${variantIndex}`} className="cursor-pointer block">
                              {variant.variantImage.preview ? (
                                <img
                                  src={variant.variantImage.preview}
                                  alt="Variant Preview"
                                  className="h-20 w-20 object-cover rounded-xl mx-auto shadow-md"
                                />
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload variant image</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Default Variant Checkbox */}
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                        <input
                          id={`default-variant-${variantIndex}`}
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => updateVariantField(variantIndex, "isDefault", e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`default-variant-${variantIndex}`} className="font-medium text-blue-900 cursor-pointer">
                          Set as default variant
                        </label>
                      </div>

                      {/* Variant Optional Details */}
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Variant Specifications</h4>
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => {
                              updateVariantField(variantIndex, "optionalDetails", [
                                ...variant.optionalDetails,
                                { key: "", value: "" },
                              ])
                            }}
                          >
                            <Plus className="w-4 h-4" />
                            Add Detail
                          </button>
                        </div>
                        {variant.optionalDetails.map((detail, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className={`${inputClass} dark:text-white`}>Specification</label>
                              <input
                                type="text"
                                value={detail.key}
                                onChange={(e) => {
                                  const newDetails = [...variant.optionalDetails]
                                  newDetails[index].key = e.target.value
                                  updateVariantField(variantIndex, "optionalDetails", newDetails)
                                }}
                                placeholder="e.g., Material"
                                className={`${inputClass} dark:text-gray-400`}
                              />
                            </div>
                            <div className="space-y-2 flex gap-4 items-end">
                              <div className="flex-1">
                                <label className={`${inputClass} dark:text-white`}>Value</label>
                                <input
                                  type="text"
                                  value={detail.value}
                                  onChange={(e) => {
                                    const newDetails = [...variant.optionalDetails]
                                    newDetails[index].value = e.target.value
                                    updateVariantField(variantIndex, "optionalDetails", newDetails)
                                  }}
                                  placeholder="e.g., Cotton"
                                  className={`${inputClass} dark:text-gray-400`}
                                />
                              </div>
                              <button
                                type="button"
                                className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                                onClick={() => {
                                  const newDetails = variant.optionalDetails.filter((_, i) => i !== index)
                                  updateVariantField(variantIndex, "optionalDetails", newDetails)
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Size Sections */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-semibold text-gray-900">Size Configurations</h3>
                          <button 
                            type="button" 
                            className={secondaryButtonClass} 
                            onClick={() => addSizeSection(variantIndex)}
                          >
                            <Plus className="w-4 h-4" />
                            Add Size
                          </button>
                        </div>
                        {variant.moreDetails.map((md, mdIndex) => (
                          <div
                            key={mdIndex}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="text-lg font-semibold -800 dark:text-gray-100">Size Configuration {mdIndex + 1}</h4>
                              <button
                                type="button"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-white"
                                onClick={() => removeSizeSection(variantIndex, mdIndex)}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Dimensions */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                              <h5 className="font-semibold -800 dark:text-gray-100">Dimensions</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>Length</label>
                                  <input
                                    type="number"
                                    value={md.size.length}
                                    onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "length", e.target.value)}
                                    placeholder="0"
                                    className={`${inputClass} dark:text-gray-400`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>Width</label>
                                  <input
                                    type="number"
                                    value={md.size.breadth}
                                    onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "breadth", e.target.value)}
                                    placeholder="0"
                                    className={`${inputClass} dark:text-gray-400`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>Height</label>
                                  <input
                                    type="number"
                                    value={md.size.height}
                                    onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "height", e.target.value)}
                                    placeholder="0"
                                    className={`${inputClass} dark:text-gray-400`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>Unit</label>
                                  <select
                                    value={md.size.unit}
                                    onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "unit", e.target.value)}
                                    className={selectClass}
                                  >
                                    <option value="cm">cm</option>
                                    <option value="m">m</option>
                                    <option value="inch">inch</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Additional Images for this Size Section */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                              <div className="flex justify-between items-center">
                                <h5 className="text-md font-semibold -800 dark:text-gray-100">
                                  Additional Images for this Size (Optional)
                                </h5>
                                <button
                                  type="button"
                                  className={secondaryButtonClass}
                                  onClick={() => {
                                    const setter = (arr) => updateSizeSectionField(variantIndex, mdIndex, "additionalImages", arr);
                                    addImageField(setter, md.additionalImages)
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
                                  <Plus className="w-4 h-4" />
                                  Add Image
                                </button>
                              </div>
                              {getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>
                                    Do you want to reuse additional images?
                                  </label>
                                  <select
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
                                </div>
                              )}

                              {md.reuseAdditionalImages === "yes" &&
                                getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                                  <div className="space-y-2">
                                    <label className={`${inputClass} dark:text-white`}>
                                      Select source
                                    </label>
                                    <select
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
                                  </div>
                                )}

                              {md.reuseAdditionalImages === "no" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {md.additionalImages.map((image, index) => (
                                    <div key={index} className="relative">
                                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                                        <input
                                          id={`md-additional-image-${variantIndex}-${mdIndex}-${index}`}
                                          type="file"
                                          accept="image/*"
                                          ref={(el) =>
                                            (mdAdditionalImageInputRefs.current[`${variantIndex}-${mdIndex}-${index}`] = el)
                                          }
                                          onChange={(e) => {
                                            const newImages = [...md.additionalImages]
                                            if (newImages[index]?.preview) URL.revokeObjectURL(newImages[index].preview)
                                            newImages[index] = {
                                              file: e.target.files[0],
                                              preview: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null,
                                            }
                                            updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                          }}
                                          className="hidden"
                                        />
                                        <label htmlFor={`md-additional-image-${variantIndex}-${mdIndex}-${index}`} className="cursor-pointer block">
                                          {image.preview ? (
                                            <img
                                              src={image.preview}
                                              alt={`Additional ${index + 1}`}
                                              className="h-24 w-24 object-cover rounded-lg mx-auto shadow-md"
                                            />
                                          ) : (
                                            <div className="space-y-2">
                                              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                                              <p className="text-sm text-gray-600 dark:text-gray-400">Image {index + 1}</p>
                                            </div>
                                          )}
                                        </label>
                                      </div>
                                      <button
                                        type="button"
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors dark:text-white"
                                        onClick={() => {
                                          const newImages = md.additionalImages.filter((_, i) => i !== index)
                                          if (md.additionalImages[index]?.preview)
                                            URL.revokeObjectURL(md.additionalImages[index].preview)
                                          updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Optional Details for this size */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                              <div className="flex justify-between items-center">
                                <h5 className="text-md font-semibold -800 dark:text-gray-100">
                                  Optional Details for this Size (Optional)
                                </h5>
                                <button
                                  type="button"
                                  className={secondaryButtonClass}
                                  onClick={() => {
                                    updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", [
                                      ...md.optionalDetails,
                                      { key: "", value: "" },
                                    ])
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Detail
                                </button>
                              </div>
                              {getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                <div className="space-y-2">
                                  <label className={`${inputClass} dark:text-white`}>
                                    Do you want to reuse optional details?
                                  </label>
                                  <select
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
                                </div>
                              )}

                              {md.reuseOptionalDetails === "yes" &&
                                getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                  <div className="space-y-2">
                                    <label className={`${inputClass} dark:text-white`}>
                                      Select source
                                    </label>
                                    <select
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
                                  </div>
                                )}

                              {md.reuseOptionalDetails === "no" && (
                                <div className="space-y-4">
                                  {md.optionalDetails.map((detail, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className={`${inputClass} dark:text-white`}>Key</label>
                                        <input
                                          type="text"
                                          value={detail.key}
                                          onChange={(e) => {
                                            const newDetails = [...md.optionalDetails]
                                            newDetails[index].key = e.target.value
                                            updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                          }}
                                          placeholder="e.g., Feature"
                                          className={`${inputClass} dark:text-gray-400`}
                                        />
                                      </div>
                                      <div className="space-y-2 flex gap-4 items-end">
                                        <div className="flex-1">
                                          <label className={`${inputClass} dark:text-white`}>Value</label>
                                          <input
                                            type="text"
                                            value={detail.value}
                                            onChange={(e) => {
                                              const newDetails = [...md.optionalDetails]
                                              newDetails[index].value = e.target.value
                                              updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                            }}
                                            placeholder="e.g., Waterproof"
                                            className={`${inputClass} dark:text-gray-400`}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                                          onClick={() => {
                                            const newDetails = md.optionalDetails.filter((_, i) => i !== index)
                                            updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Price & Stock for this specific Size Section (only if not common for variant) */}
                            {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                              <div className="space-y-2">
                                <label className={`${inputClass} dark:text-white`}>
                                  Price ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x
                                  {md.size?.height || "?"})
                                </label>
                                <input
                                  type="number"
                                  value={md.price}
                                  onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "price", e.target.value)}
                                  placeholder="Enter price"
                                  className={`${inputClass} dark:text-gray-400`}
                                />
                              </div>
                            )}
                            {variant.moreDetails.length > 1 && variant.isStockSame === "no" && (
                              <div className="space-y-2">
                                <label className={`${inputClass} dark:text-white`}>
                                  Stock ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x
                                  {md.size?.height || "?"})
                                </label>
                                <input
                                  type="number"
                                  value={md.stock}
                                  onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "stock", e.target.value)}
                                  placeholder="Enter stock"
                                  className={`${inputClass} dark:text-gray-400`}
                                />
                              </div>
                            )}
                            {variant.moreDetails.length > 1 &&
                              variant.isPriceSame === "no" && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-md font-semibold -800 dark:text-gray-100">
                                      Bulk Pricing Combinations ({variant.colorName} - {md.size?.length || "?"}x
                                      {md.size?.breadth || "?"}x{md.size?.height || "?"})
                                    </h5>
                                    <button
                                      type="button"
                                      className={secondaryButtonClass}
                                      onClick={() => {
                                        updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", [
                                          ...md.bulkPricingCombinations,
                                          { wholesalePrice: "", quantity: "" },
                                        ])
                                      }}
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Bulk Pricing
                                    </button>
                                  </div>
                                  {md.bulkPricingCombinations.map((bpc, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                                      <div className="space-y-2">
                                        <label className={`${inputClass} dark:text-white`}>Wholesale Price ($)</label>
                                        <input
                                          type="number"
                                          value={bpc.wholesalePrice}
                                          onChange={(e) => {
                                            const newBPC = [...md.bulkPricingCombinations]
                                            newBPC[index].wholesalePrice = e.target.value
                                            updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                          }}
                                          placeholder="Enter wholesale price"
                                          className={`${inputClass} dark:text-gray-400`}
                                        />
                                        {md.price &&
                                          bpc.wholesalePrice &&
                                          Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(md.price) && (
                                            <p className="text-red-500 text-sm">
                                              Wholesale price must be less than this price.
                                            </p>
                                          )}
                                      </div>
                                      <div className="space-y-2 flex gap-4 items-end">
                                        <div className="flex-1">
                                          <label className={`${inputClass} dark:text-white`}>Quantity</label>
                                          <input
                                            type="number"
                                            value={bpc.quantity}
                                            onChange={(e) => {
                                              const newBPC = [...md.bulkPricingCombinations]
                                              newBPC[index].quantity = e.target.value
                                              updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                            }}
                                            placeholder="Enter quantity"
                                            className={`${inputClass} dark:text-gray-400`}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                                          onClick={() => {
                                            const newBPC = md.bulkPricingCombinations.filter((_, i) => i !== index)
                                            updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Price and Stock Configuration for Variants */}
                      {variant.moreDetails.length > 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={`${inputClass} dark:text-white`}>Same price for all sizes?</label>
                            <select
                              value={variant.isPriceSame}
                              onChange={(e) => updateVariantField(variantIndex, "isPriceSame", e.target.value)}
                              className={selectClass}
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className={`${inputClass} dark:text-white`}>Same stock for all sizes?</label>
                            <select
                              value={variant.isStockSame}
                              onChange={(e) => updateVariantField(variantIndex, "isStockSame", e.target.value)}
                              className={selectClass}
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Common Price and Stock */}
                      {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={`${inputClass} dark:text-white`}>Price ($)</label>
                            <input
                              type="number"
                              value={variant.commonPrice}
                              onChange={(e) => updateVariantField(variantIndex, "commonPrice", e.target.value)}
                              placeholder="Variant price"
                              className={`${inputClass} dark:text-gray-400`}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className={`${inputClass} dark:text-white`}>Stock</label>
                            <input
                              type="number"
                              value={variant.commonStock}
                              onChange={(e) => updateVariantField(variantIndex, "commonStock", e.target.value)}
                              placeholder="Stock quantity"
                              className={`${inputClass} dark:text-gray-400`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Common Bulk Pricing */}
                      {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Common Bulk Pricing Combinations</h4>
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              onClick={() => {
                                updateVariantField(variantIndex, "commonBulkPricingCombinations", [
                                  ...variant.commonBulkPricingCombinations,
                                  { wholesalePrice: "", quantity: "" },
                                ])
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Add Bulk Pricing
                            </button>
                          </div>
                          {variant.commonBulkPricingCombinations.map((bpc, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                              <div className="space-y-2">
                                <label className={`${inputClass} dark:text-white`}>Wholesale Price ($)</label>
                                <input
                                  type="number"
                                  value={bpc.wholesalePrice}
                                  onChange={(e) => {
                                    const newBPC = [...variant.commonBulkPricingCombinations]
                                    newBPC[index].wholesalePrice = e.target.value
                                    updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                  }}
                                  placeholder="Enter wholesale price"
                                  className={`${inputClass} dark:text-gray-400`}
                                />
                                {variant.commonPrice &&
                                  bpc.wholesalePrice &&
                                  Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(variant.commonPrice) && (
                                    <p className="text-red-500 text-sm">
                                      Wholesale price must be less than common price.
                                    </p>
                                  )}
                              </div>
                              <div className="space-y-2 flex gap-4 items-end">
                                <div className="flex-1">
                                  <label className={`${inputClass} dark:text-white`}>Quantity</label>
                                  <input
                                    type="number"
                                    value={bpc.quantity}
                                    onChange={(e) => {
                                      const newBPC = [...variant.commonBulkPricingCombinations]
                                      newBPC[index].quantity = e.target.value
                                      updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                    }}
                                    placeholder="Enter quantity"
                                    className={`${inputClass} dark:text-gray-400`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors dark:text-white"
                                  onClick={() => {
                                    const newBPC = variant.commonBulkPricingCombinations.filter((_, i) => i !== index)
                                    updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-center">
                    <button type="button" className={primaryButtonClass} onClick={addVariant}>
                      <Plus className="w-5 h-5" />
                      Add New Variant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button 
              type="submit" 
              disabled={isLoading}
              className={`${primaryButtonClass} text-lg px-12 py-4 shadow-2xl ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Adding Product...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Add Product
                </>
              )}
            </button>
           {!hasVariants && hasDimensionPricing === "no" && (
              <button
                type="button"
                className={`${secondaryButtonClass} text-lg px-8 py-4`}
                onClick={() => setHasVariants(true)}
              >
                <Layers className="w-5 h-5" />
                Add Variants
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}