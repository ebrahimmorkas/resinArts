"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchCategories } from "../../../../../utils/api"
import { X, Plus, AlertCircle, Upload, Image as ImageIcon, Package, Tag, DollarSign, Layers, Check, ArrowLeft, Save, Edit } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, message = "Updating Product..." }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
        <h4 className="font-semibold text-gray-900 mb-2">{message}</h4>
        <p className="text-gray-600 text-sm">Please wait while we process your request...</p>
      </div>
    </div>
  )
}

// Helper to flatten category tree
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

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProduct, setIsFetchingProduct] = useState(true)
  const [productName, setProductName] = useState("")
  const [allCategoriesTree, setAllCategoriesTree] = useState([])
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([])

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [categoryPath, setCategoryPath] = useState("")
  const [isCategoryEditable, setIsCategoryEditable] = useState(false)

  const [productDetails, setProductDetails] = useState([{ key: "", value: "" }])
  const [stock, setStock] = useState("")
  const [price, setPrice] = useState("")
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([{ file: null, preview: null }])
  const [bulkPricing, setBulkPricing] = useState([{ wholesalePrice: "", quantity: "" }])

  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState([])

  // Refs for direct file input clicks
  const mainAdditionalImageInputRef = useRef([])
  const variantImageInputRefs = useRef([])
  const mdAdditionalImageInputRefs = useRef([])

  // Fetch categories
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

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsFetchingProduct(true)
        const response = await axios.get(`https://api.simplyrks.cloud/api/product/${id}`)
        const product = response.data

        setProductName(product.name || "")
        setProductDetails(product.productDetails?.length > 0 ? product.productDetails : [{ key: "", value: "" }])
        
        // Set categories
        if (product.subCategory) {
          const categoryIds = []
          let currentCat = allCategoriesFlat.find(cat => cat._id === product.subCategory)
          
          if (currentCat) {
            categoryIds.unshift(currentCat._id)
            while (currentCat.parentId) {
              currentCat = allCategoriesFlat.find(cat => cat._id === currentCat.parentId)
              if (currentCat) categoryIds.unshift(currentCat._id)
            }
          }
          setSelectedCategoryIds(categoryIds)
        }

        // Set images
        if (product.image) {
          setMainImagePreview(product.image)
        }
        if (product.additionalImages?.length > 0) {
          setAdditionalImages(product.additionalImages.map(url => ({ file: null, preview: url })))
        }

        // Set variants or basic fields
        if (product.hasVariants && product.variants?.length > 0) {
          setHasVariants(true)
          setVariants(product.variants.map(variant => ({
            colorName: variant.colorName || "",
            variantImage: { file: null, preview: variant.variantImage || null },
            optionalDetails: variant.optionalDetails?.length > 0 ? variant.optionalDetails : [{ key: "", value: "" }],
            moreDetails: variant.moreDetails?.map(md => ({
  size: md.size || { length: "", breadth: "", height: "", unit: "cm" },
  additionalImages: md.additionalImages?.map(url => ({ file: null, preview: url })) || [{ file: null, preview: null }],
  optionalDetails: md.optionalDetails?.length > 0 ? md.optionalDetails : [{ key: "", value: "" }],
  price: md.price?.toString() || "",
  stock: md.stock?.toString() || "",
  bulkPricingCombinations: md.bulkPricingCombinations?.length > 0 ? md.bulkPricingCombinations : [{ wholesalePrice: "", quantity: "" }],
  reuseAdditionalImages: "no",
  reuseOptionalDetails: "no",
  reusedImageSource: "",
  reusedOptionalDetailSource: "",
})) || [{
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
}],
isPriceSame: variant.isPriceSame || (variant.commonPrice ? "yes" : (variant.moreDetails?.some(md => md.price) ? "no" : "yes")),
isStockSame: variant.isStockSame || (variant.commonStock ? "yes" : (variant.moreDetails?.some(md => md.stock !== undefined) ? "no" : "yes")),
commonPrice: variant.commonPrice?.toString() || "",
commonStock: variant.commonStock?.toString() || "",
            commonBulkPricingCombinations: variant.commonBulkPricingCombinations?.length > 0 ? variant.commonBulkPricingCombinations : [{ wholesalePrice: "", quantity: "" }],
            isDefault: variant.isDefault || false,
          })))
        } else {
          setHasVariants(false)
          setStock(product.stock?.toString() || "")
          setPrice(product.price?.toString() || "")
          setBulkPricing(product.bulkPricing?.length > 0 ? product.bulkPricing : [{ wholesalePrice: "", quantity: "" }])
        }

      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to fetch product details")
      } finally {
        setIsFetchingProduct(false)
      }
    }

    if (id && allCategoriesFlat.length > 0) {
      fetchProduct()
    }
  }, [id, allCategoriesFlat])

  // Update category path
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
    }
  }, [mainImage])

  // Dynamic field handlers
  const addKeyValuePair = (setter, currentArray) => setter([...currentArray, { key: "", value: "" }])
  const updateKeyValuePair = (setter, currentArray, index, field, value) => {
    const newArray = [...currentArray]
    newArray[index][field] = value
    setter(newArray)
  }
  const removeKeyValuePair = (setter, currentArray, index) => setter(currentArray.filter((_, i) => i !== index))

  const addImageField = (setter, currentArray) => setter([...currentArray, { file: null, preview: null }])
  const updateImageField = (setter, currentArray, index, file) => {
    const newArray = [...currentArray]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      newArray[index] = { file, preview: objectUrl }
    } else {
      if (newArray[index]?.preview && !newArray[index].preview.startsWith('http')) {
        URL.revokeObjectURL(newArray[index].preview)
      }
      newArray[index] = { file: null, preview: null }
    }
    setter(newArray)
  }
  const removeImageField = (setter, currentArray, index) => {
    const newArray = currentArray.filter((_, i) => {
      if (i === index && currentArray[i]?.preview && !currentArray[i].preview.startsWith('http')) {
        URL.revokeObjectURL(currentArray[i].preview)
      }
      return i !== index
    })
    setter(newArray)
  }

  const addBulkPricingField = (setter, currentArray) => setter([...currentArray, { wholesalePrice: "", quantity: "" }])
  const updateBulkPricingField = (setter, currentArray, index, field, value) => {
    const newArray = [...currentArray]
    newArray[index][field] = value
    setter(newArray)
  }
  const removeBulkPricingField = (setter, currentArray, index) => setter(currentArray.filter((_, i) => i !== index))

  // Variant handlers
  const addVariant = () => {
    setHasVariants(true)
    const newVariant = {
      colorName: "",
      variantImage: { file: null, preview: null },
      optionalDetails: [{ key: "", value: "" }],
      moreDetails: [{
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
      }],
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
        if (i !== index) v.isDefault = false
      })
    }
    newVariants[index][field] = value
    setVariants(newVariants)
  }

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
          if (img?.preview && !img.preview.startsWith('http')) URL.revokeObjectURL(img.preview)
        })
        newVariants[variantIndex].moreDetails[mdIndex].additionalImages = selectedOption.data.map((item) => ({
          file: item.file,
          preview: item.file ? URL.createObjectURL(item.file) : item.preview,
        }))
        newVariants[variantIndex].moreDetails[mdIndex].reusedImageSource = selectedId
      } else {
        newVariants[variantIndex].moreDetails[mdIndex].optionalDetails = selectedOption.data.map((item) => ({...item}))
        newVariants[variantIndex].moreDetails[mdIndex].reusedOptionalDetailSource = selectedId
      }
    }
    setVariants(newVariants)
  }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    const formData = new FormData()
    const finalCategoryId = selectedCategoryIds[selectedCategoryIds.length - 1] || ""

    const productData = {
      name: productName,
      mainCategory: selectedCategoryIds[0] || "",
      subCategory: finalCategoryId,
      categoryPath: categoryPath,
      productDetails: productDetails.filter((pd) => pd.key && pd.value),
      hasVariants: hasVariants,
    }

    if (!hasVariants) {
      productData.stock = stock
      productData.price = price
      productData.bulkPricing = bulkPricing.filter((bp) => bp.wholesalePrice && bp.quantity)
    }

    // Handle main image
    if (mainImage) {
      formData.append("image", mainImage)
    }

    // Handle additional images - track which existing ones to keep
    const existingAdditionalImagesToKeep = []
    const newAdditionalImages = []

    additionalImages.forEach((img) => {
      if (img.file) {
        // This is a new file to upload
        newAdditionalImages.push(img.file)
      } else if (img.preview && img.preview.startsWith('http')) {
        // This is an existing image URL to keep
        existingAdditionalImagesToKeep.push(img.preview)
      }
    })

    // Add the URLs of existing images we want to keep
    productData.existingAdditionalImages = existingAdditionalImagesToKeep

    // Append new image files
    newAdditionalImages.forEach((file) => {
      formData.append('additionalImages', file)
    })

    if (hasVariants) {
      productData.variants = variants.map((variant, variantIndex) => {
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
          moreDetails: variant.moreDetails.map((md, mdIndex) => {
            // Track existing images to keep for this moreDetail
            const existingMdImagesToKeep = []
            
            md.additionalImages.forEach((img) => {
              if (img.preview && img.preview.startsWith('http')) {
                existingMdImagesToKeep.push(img.preview)
              }
            })

            const mdObj = {
              size: md.size,
              optionalDetails:
                md.reuseOptionalDetails === "yes"
                  ? md.optionalDetails
                  : md.optionalDetails.filter((od) => od.key && od.value),
              additionalImages: [],
              existingAdditionalImages: existingMdImagesToKeep, // Track existing images to keep
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

        // Track existing variant image
        if (variant.variantImage.preview && variant.variantImage.preview.startsWith('http')) {
          variantObj.existingVariantImage = variant.variantImage.preview
        }

        return variantObj
      })

      // Append variant images and moreDetails images
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

    const response = await axios.put(`https://api.simplyrks.cloud/api/product/edit-product/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success("Product updated successfully!", {
      position: "top-right",
      autoClose: 3000,
    })
    
    setTimeout(() => {
      navigate('/admin/panel/products')
    }, 2000)

  } catch (error) {
    console.error("Error updating product:", error.message)
    toast.error(`Error updating product: ${error.response?.data?.message || error.message}`, {
      position: "top-right",
      autoClose: 5000,
    })
  } finally {
    setIsLoading(false)
  }
}

  const cardClass = "bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
  const sectionClass = "p-8"
  const headerClass = "border-b border-gray-100 px-8 py-6 bg-gradient-to-r from-gray-50 to-white"
  const titleClass = "text-2xl font-bold text-gray-900 flex items-center gap-3"
  const subtitleClass = "text-gray-600 mt-1"
  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2"
  const buttonClass = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  const primaryButtonClass = `${buttonClass} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500`
  const secondaryButtonClass = `${buttonClass} bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-200 focus:ring-gray-500`
  const dangerButtonClass = `${buttonClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500`
  const selectClass = `${inputClass} cursor-pointer appearance-none bg-white`

  const handleCategorySelect = (level, categoryId) => {
    let newSelectedCategoryIds = [...selectedCategoryIds.slice(0, level), categoryId].filter(Boolean)
    if (!categoryId) {
      newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level)
    }
    setSelectedCategoryIds(newSelectedCategoryIds)
  }

  const renderCategoryDropdowns = () => {
    if (!isCategoryEditable) return null

    const dropdowns = []

    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
    dropdowns.push(
      <div key={`category-dropdown-0`} className="space-y-2">
        <label htmlFor={`category-level-0`} className={labelClass}>
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
          <label htmlFor={`category-level-sub`} className={labelClass}>
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

  if (isFetchingProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <LoadingOverlay isLoading={isLoading} />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <button
            onClick={() => navigate('/admin/panel/products')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Products</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Edit Product
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Update your product information with precision and ease. Make changes to keep your catalog current and accurate.
            </p>
          </div>
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
                    <label htmlFor="productName" className={labelClass}>
                      Product Name *
                    </label>
                    <input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter your product name"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-6">
                    {renderCategoryDropdowns()}
                  </div>
                </div>

                {categoryPath && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800 font-medium">
                        <Check className="w-5 h-5" />
                        Category Path: {categoryPath}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCategoryEditable(!isCategoryEditable)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {isCategoryEditable ? 'Done' : 'Edit Category'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Product Details */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Product Specifications</h3>
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
                        <label className={labelClass}>Specification</label>
                        <input
                          type="text"
                          value={detail.key}
                          onChange={(e) =>
                            updateKeyValuePair(setProductDetails, productDetails, index, "key", e.target.value)
                          }
                          placeholder="e.g., Material, Weight, Color"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2 flex gap-4 items-end">
                        <div className="flex-1">
                          <label className={labelClass}>Value</label>
                          <input
                            type="text"
                            value={detail.value}
                            onChange={(e) =>
                              updateKeyValuePair(setProductDetails, productDetails, index, "value", e.target.value)
                            }
                            placeholder="e.g., Cotton, 500g, Blue"
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="button"
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          onClick={() => removeKeyValuePair(setProductDetails, productDetails, index)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

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
                        <label htmlFor="stock" className={labelClass}>
                          <Package className="inline w-4 h-4 mr-2" />
                          Stock Quantity
                        </label>
                        <input
                          id="stock"
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Available quantity"
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="price" className={labelClass}>
                          <DollarSign className="inline w-4 h-4 mr-2" />
                          Price ($)
                        </label>
                        <input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Product price"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Main Image Upload */}
                    <div className="space-y-4">
                      <label htmlFor="mainImage" className={labelClass}>
                        <ImageIcon className="inline w-4 h-4 mr-2" />
                        Product Main Image
                      </label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
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
                              <p className="text-sm text-gray-600">Click to change image</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                              <div>
                                <p className="text-lg font-medium text-gray-900">Upload Product Image</p>
                                <p className="text-sm text-gray-600">PNG, JPG up to 10MB</p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Additional Images */}
                    <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900">Additional Images</h3>
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
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
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
                                    <p className="text-sm text-gray-600">Image {index + 1}</p>
                                  </div>
                                )}
                              </label>
                            </div>
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              onClick={() => removeImageField(setAdditionalImages, additionalImages, index)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk Pricing */}
                    <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-900">Bulk Pricing Options</h3>
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
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                          <div className="space-y-2">
                            <label className={labelClass}>Wholesale Price ($)</label>
                            <input
                              type="number"
                              value={bp.wholesalePrice}
                              onChange={(e) =>
                                updateBulkPricingField(setBulkPricing, bulkPricing, index, "wholesalePrice", e.target.value)
                              }
                              placeholder="Bulk price"
                              className={inputClass}
                            />
                            {price &&
                              bp.wholesalePrice &&
                              Number.parseFloat(bp.wholesalePrice) >= Number.parseFloat(price) && (
                                <p className="text-red-500 text-sm">Must be less than regular price</p>
                              )}
                          </div>
                          <div className="space-y-2 flex gap-4 items-end">
                            <div className="flex-1">
                              <label className={labelClass}>Minimum Quantity</label>
                              <input
                                type="number"
                                value={bp.quantity}
                                onChange={(e) =>
                                  updateBulkPricingField(setBulkPricing, bulkPricing, index, "quantity", e.target.value)
                                }
                                placeholder="Min qty"
                                className={inputClass}
                              />
                            </div>
                            <button
                              type="button"
                              className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              onClick={() => removeBulkPricingField(setBulkPricing, bulkPricing, index)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Button to add variants when no variants */}
                    <div className="flex justify-center pt-6">
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={addVariant}
                      >
                        <Plus className="w-4 h-4" />
                        Add Product Variants
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Product Variants Section - Complete copy from AddProduct */}
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
                      className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 p-8 space-y-8"
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
                          className={dangerButtonClass}
                          onClick={() => removeVariant(variantIndex)}
                        >
                          <X className="w-4 h-4" />
                          Remove Variant
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className={labelClass}>Color/Variant Name</label>
                          <input
                            type="text"
                            value={variant.colorName}
                            onChange={(e) => updateVariantField(variantIndex, "colorName", e.target.value)}
                            placeholder="e.g., Red, Blue, Large"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className={labelClass}>Variant Image</label>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
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
                                  <p className="text-sm text-gray-600">Upload variant image</p>
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
                      <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-gray-900">Variant Specifications</h4>
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
                              <label className={labelClass}>Specification</label>
                              <input
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
                            <div className="space-y-2 flex gap-4 items-end">
                              <div className="flex-1">
                                <label className={labelClass}>Value</label>
                                <input
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
                                className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                          <button type="button" className={secondaryButtonClass} onClick={() => addSizeSection(variantIndex)}>
                            <Plus className="w-4 h-4" />
                            Add Size
                          </button>
                        </div>
                        {variant.moreDetails.map((md, mdIndex) => (
                          <div key={mdIndex} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                            <div className="flex justify-between items-center">
                              <h4 className="text-lg font-semibold text-gray-800">Size Configuration {mdIndex + 1}</h4>
                              <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => removeSizeSection(variantIndex, mdIndex)}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                              <h5 className="font-semibold text-gray-800">Dimensions</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <label className={labelClass}>Length</label>
                                  <input type="number" value={md.size.length} onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "length", e.target.value)} placeholder="0" className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                  <label className={labelClass}>Width</label>
                                  <input type="number" value={md.size.breadth} onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "breadth", e.target.value)} placeholder="0" className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                  <label className={labelClass}>Height</label>
                                  <input type="number" value={md.size.height} onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "height", e.target.value)} placeholder="0" className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                  <label className={labelClass}>Unit</label>
                                  <select value={md.size.unit} onChange={(e) => updateSingleSizeField(variantIndex, mdIndex, "unit", e.target.value)} className={selectClass}>
                                    <option value="cm">cm</option>
                                    <option value="m">m</option>
                                    <option value="inch">inch</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                              <div className="flex justify-between items-center">
                                <h5 className="text-md font-semibold text-gray-800">Additional Images for this Size (Optional)</h5>
                                <button type="button" className={secondaryButtonClass} onClick={() => {
                                  const setter = (arr) => updateSizeSectionField(variantIndex, mdIndex, "additionalImages", arr);
                                  addImageField(setter, md.additionalImages)
                                  setTimeout(() => {
                                    if (mdAdditionalImageInputRefs.current[`${variantIndex}-${mdIndex}-${md.additionalImages.length}`]) {
                                      mdAdditionalImageInputRefs.current[`${variantIndex}-${mdIndex}-${md.additionalImages.length}`].click()
                                    }
                                  }, 0)
                                }}>
                                  <Plus className="w-4 h-4" />
                                  Add Image
                                </button>
                              </div>
                              {getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                                <div className="space-y-2">
                                  <label className={labelClass}>Do you want to reuse additional images?</label>
                                  <select value={md.reuseAdditionalImages} onChange={(e) => {
                                    updateSizeSectionField(variantIndex, mdIndex, "reuseAdditionalImages", e.target.value)
                                    if (e.target.value === "no") {
                                      updateSizeSectionField(variantIndex, mdIndex, "additionalImages", [{ file: null, preview: null }])
                                      updateSizeSectionField(variantIndex, mdIndex, "reusedImageSource", "")
                                    }
                                  }} className={selectClass}>
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                  </select>
                                </div>
                              )}
                              {md.reuseAdditionalImages === "yes" && getReuseOptions(variantIndex, mdIndex, "images").length > 0 && (
                                <div className="space-y-2">
                                  <label className={labelClass}>Select source</label>
                                  <select value={md.reusedImageSource} onChange={(e) => handleReuseSelection(variantIndex, mdIndex, "images", e.target.value)} className={selectClass}>
                                    <option value="">Select source</option>
                                    {getReuseOptions(variantIndex, mdIndex, "images").map((option) => (
                                      <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {md.reuseAdditionalImages === "no" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {md.additionalImages.map((image, index) => (
                                    <div key={index} className="relative">
                                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                                        <input id={`md-additional-image-${variantIndex}-${mdIndex}-${index}`} type="file" accept="image/*" ref={(el) => (mdAdditionalImageInputRefs.current[`${variantIndex}-${mdIndex}-${index}`] = el)} onChange={(e) => {
                                          const newImages = [...md.additionalImages]
                                          if (newImages[index]?.preview && !newImages[index].preview.startsWith('http')) URL.revokeObjectURL(newImages[index].preview)
                                          newImages[index] = { file: e.target.files[0], preview: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null }
                                          updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                        }} className="hidden" />
                                        <label htmlFor={`md-additional-image-${variantIndex}-${mdIndex}-${index}`} className="cursor-pointer block">
                                          {image.preview ? (
                                            <img src={image.preview} alt={`Additional ${index + 1}`} className="h-24 w-24 object-cover rounded-lg mx-auto shadow-md" />
                                          ) : (
                                            <div className="space-y-2">
                                              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                                              <p className="text-sm text-gray-600">Image {index + 1}</p>
                                            </div>
                                          )}
                                        </label>
                                      </div>
                                      <button type="button" className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" onClick={() => {
                                        const newImages = md.additionalImages.filter((_, i) => i !== index)
                                        if (md.additionalImages[index]?.preview && !md.additionalImages[index].preview.startsWith('http')) URL.revokeObjectURL(md.additionalImages[index].preview)
                                        updateSizeSectionField(variantIndex, mdIndex, "additionalImages", newImages)
                                      }}>
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                              <div className="flex justify-between items-center">
                                <h5 className="text-md font-semibold text-gray-800">Optional Details for this Size (Optional)</h5>
                                <button type="button" className={secondaryButtonClass} onClick={() => {
                                  updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", [...md.optionalDetails, { key: "", value: "" }])
                                }}>
                                  <Plus className="w-4 h-4" />
                                  Add Detail
                                </button>
                              </div>
                              {getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                <div className="space-y-2">
                                  <label className={labelClass}>Do you want to reuse optional details?</label>
                                  <select value={md.reuseOptionalDetails} onChange={(e) => {
                                    updateSizeSectionField(variantIndex, mdIndex, "reuseOptionalDetails", e.target.value)
                                    if (e.target.value === "no") {
                                      updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", [{ key: "", value: "" }])
                                      updateSizeSectionField(variantIndex, mdIndex, "reusedOptionalDetailSource", "")
                                    }
                                  }} className={selectClass}>
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                  </select>
                                </div>
                              )}
                              {md.reuseOptionalDetails === "yes" && getReuseOptions(variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                <div className="space-y-2">
                                  <label className={labelClass}>Select source</label>
                                  <select value={md.reusedOptionalDetailSource} onChange={(e) => handleReuseSelection(variantIndex, mdIndex, "optionalDetails", e.target.value)} className={selectClass}>
                                    <option value="">Select source</option>
                                    {getReuseOptions(variantIndex, mdIndex, "optionalDetails").map((option) => (
                                      <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {md.reuseOptionalDetails === "no" && (
                                <div className="space-y-4">
                                  {md.optionalDetails.map((detail, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className={labelClass}>Key</label>
                                        <input type="text" value={detail.key} onChange={(e) => {
                                          const newDetails = [...md.optionalDetails]
                                          newDetails[index].key = e.target.value
                                          updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                        }} placeholder="e.g., Feature" className={inputClass} />
                                      </div>
                                      <div className="space-y-2 flex gap-4 items-end">
                                        <div className="flex-1">
                                          <label className={labelClass}>Value</label>
                                          <input type="text" value={detail.value} onChange={(e) => {
                                            const newDetails = [...md.optionalDetails]
                                            newDetails[index].value = e.target.value
                                            updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                          }} placeholder="e.g., Waterproof" className={inputClass} />
                                        </div>
                                        <button type="button" className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => {
                                          const newDetails = md.optionalDetails.filter((_, i) => i !== index)
                                          updateSizeSectionField(variantIndex, mdIndex, "optionalDetails", newDetails)
                                        }}>
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                              <div className="space-y-2">
                                <label className={labelClass}>Price ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})</label>
                                <input type="number" value={md.price} onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "price", e.target.value)} placeholder="Enter price" className={inputClass} />
                              </div>
                            )}
                            {variant.moreDetails.length > 1 && variant.isStockSame === "no" && (
                              <div className="space-y-2">
                                <label className={labelClass}>Stock ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})</label>
                                <input type="number" value={md.stock} onChange={(e) => updateSizeSectionField(variantIndex, mdIndex, "stock", e.target.value)} placeholder="Enter stock" className={inputClass} />
                              </div>
                            )}
                            {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-md font-semibold text-gray-800">Bulk Pricing Combinations ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})</h5>
                                  <button type="button" className={secondaryButtonClass} onClick={() => {
                                    updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", [...md.bulkPricingCombinations, { wholesalePrice: "", quantity: "" }])
                                  }}>
                                    <Plus className="w-4 h-4" />
                                    Add Bulk Pricing
                                  </button>
                                </div>
                                {md.bulkPricingCombinations.map((bpc, index) => (
                                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                                    <div className="space-y-2">
                                      <label className={labelClass}>Wholesale Price ($)</label>
                                      <input type="number" value={bpc.wholesalePrice} onChange={(e) => {
                                        const newBPC = [...md.bulkPricingCombinations]
                                        newBPC[index].wholesalePrice = e.target.value
                                        updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                      }} placeholder="Enter wholesale price" className={inputClass} />
                                      {md.price && bpc.wholesalePrice && Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(md.price) && (
                                        <p className="text-red-500 text-sm">Wholesale price must be less than this price.</p>
                                      )}
                                    </div>
                                    <div className="space-y-2 flex gap-4 items-end">
                                      <div className="flex-1">
                                        <label className={labelClass}>Quantity</label>
                                        <input type="number" value={bpc.quantity} onChange={(e) => {
                                          const newBPC = [...md.bulkPricingCombinations]
                                          newBPC[index].quantity = e.target.value
                                          updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                        }} placeholder="Enter quantity" className={inputClass} />
                                      </div>
                                      <button type="button" className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => {
                                        const newBPC = md.bulkPricingCombinations.filter((_, i) => i !== index)
                                        updateSizeSectionField(variantIndex, mdIndex, "bulkPricingCombinations", newBPC)
                                      }}>
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

                      {variant.moreDetails.length > 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={labelClass}>Same price for all sizes?</label>
                            <select value={variant.isPriceSame} onChange={(e) => updateVariantField(variantIndex, "isPriceSame", e.target.value)} className={selectClass}>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Same stock for all sizes?</label>
                            <select value={variant.isStockSame} onChange={(e) => updateVariantField(variantIndex, "isStockSame", e.target.value)} className={selectClass}>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={labelClass}>Price ($)</label>
                            <input type="number" value={variant.commonPrice} onChange={(e) => updateVariantField(variantIndex, "commonPrice", e.target.value)} placeholder="Variant price" className={inputClass} />
                          </div>
                          <div className="space-y-2">
                            <label className={labelClass}>Stock</label>
                            <input type="number" value={variant.commonStock} onChange={(e) => updateVariantField(variantIndex, "commonStock", e.target.value)} placeholder="Stock quantity" className={inputClass} />
                          </div>
                        </div>
                      )}

                      {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xl font-semibold text-gray-900">Common Bulk Pricing Combinations</h4>
                            <button type="button" className={secondaryButtonClass} onClick={() => {
                              updateVariantField(variantIndex, "commonBulkPricingCombinations", [...variant.commonBulkPricingCombinations, { wholesalePrice: "", quantity: "" }])
                            }}>
                              <Plus className="w-4 h-4" />
                              Add Bulk Pricing
                            </button>
                          </div>
                          {variant.commonBulkPricingCombinations.map((bpc, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                              <div className="space-y-2">
                                <label className={labelClass}>Wholesale Price ($)</label>
                                <input type="number" value={bpc.wholesalePrice} onChange={(e) => {
                                  const newBPC = [...variant.commonBulkPricingCombinations]
                                  newBPC[index].wholesalePrice = e.target.value
                                  updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                }} placeholder="Enter wholesale price" className={inputClass} />
                                {variant.commonPrice && bpc.wholesalePrice && Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(variant.commonPrice) && (
                                  <p className="text-red-500 text-sm">Wholesale price must be less than common price.</p>
                                )}
                              </div>
                              <div className="space-y-2 flex gap-4 items-end">
                                <div className="flex-1">
                                  <label className={labelClass}>Quantity</label>
                                  <input type="number" value={bpc.quantity} onChange={(e) => {
                                    const newBPC = [...variant.commonBulkPricingCombinations]
                                    newBPC[index].quantity = e.target.value
                                    updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                  }} placeholder="Enter quantity" className={inputClass} />
                                </div>
                                <button type="button" className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => {
                                  const newBPC = variant.commonBulkPricingCombinations.filter((_, i) => i !== index)
                                  updateVariantField(variantIndex, "commonBulkPricingCombinations", newBPC)
                                }}>
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={addVariant}
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Variant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className={cardClass}>
            <div className={headerClass}>
              <h2 className={titleClass}>
                <Save className="w-8 h-8 text-green-600" />
                Save Changes
              </h2>
            </div>
            <div className={sectionClass}>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => navigate('/admin/panel/products')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={primaryButtonClass}
                >
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}