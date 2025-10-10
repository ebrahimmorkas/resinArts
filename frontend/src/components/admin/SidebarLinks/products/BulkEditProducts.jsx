"use client"

import { useState, useEffect, useCallback, useRef, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchCategories } from "../../../../../utils/api"
import { X, Plus, AlertCircle, Upload, Image as ImageIcon, Package, Tag, DollarSign, Layers, ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { ProductContext } from "../../../../../Context/ProductContext";

// Loading Overlay Component
const LoadingOverlay = ({ isLoading, message = "Updating Products..." }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
        <h4 className="font-semibold text-gray-900 mb-2">{message}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Please wait while we process your request...</p>
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

export default function BulkEditProducts() {
  const { ids } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProducts, setIsFetchingProducts] = useState(true)
  const [allCategoriesTree, setAllCategoriesTree] = useState([])
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([])
  const { fetchProducts } = useContext(ProductContext);

  // Array of product objects, each containing all EditProduct state
  const [productsData, setProductsData] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})

  // Refs for direct file input clicks
  const mainAdditionalImageInputRefs = useRef({})
  const variantImageInputRefs = useRef({})
  const mdAdditionalImageInputRefs = useRef({})

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

  // Fetch all selected products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsFetchingProducts(true)
        const productIds = ids.split(',')
        
        const promises = productIds.map(id => 
          axios.get(`http://localhost:3000/api/product/${id}`)
        )
        
        const responses = await Promise.all(promises)
        
        const transformedProducts = responses.map(response => {
          const product = response.data

          const categoryIds = []
          if (product.subCategory) {
            let currentCat = allCategoriesFlat.find(cat => cat._id === product.subCategory)
            if (currentCat) {
              categoryIds.unshift(currentCat._id)
              while (currentCat.parentId) {
                currentCat = allCategoriesFlat.find(cat => cat._id === currentCat.parentId)
                if (currentCat) categoryIds.unshift(currentCat._id)
              }
            }
          }

          return {
            _id: product._id,
            productName: product.name || "",
            selectedCategoryIds: categoryIds,
            categoryPath: product.categoryPath || "",
            isCategoryEditable: false,
            productDetails: product.productDetails?.length > 0 ? product.productDetails : [{ key: "", value: "" }],
            stock: product.stock?.toString() || "",
            price: product.price?.toString() || "",
            mainImage: null,
            mainImagePreview: product.image || null,
            additionalImages: product.additionalImages?.length > 0 
              ? product.additionalImages.map(url => ({ file: null, preview: url }))
              : [{ file: null, preview: null }],
            bulkPricing: product.bulkPricing?.length > 0 ? product.bulkPricing : [{ wholesalePrice: "", quantity: "" }],
            hasVariants: product.hasVariants || false,
            variants: product.hasVariants && product.variants?.length > 0
              ? product.variants.map(variant => ({
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
                }))
              : []
          }
        })
        
        setProductsData(transformedProducts)
        
        if (transformedProducts.length > 0) {
          setExpandedProducts({ [transformedProducts[0]._id]: true })
        }

      } catch (error) {
        console.error("Error fetching products:", error)
        toast.error("Failed to fetch products")
      } finally {
        setIsFetchingProducts(false)
      }
    }

    if (ids && allCategoriesFlat.length > 0) {
      fetchProducts()
    }
  }, [ids, allCategoriesFlat])

  // Toggle accordion
  const toggleAccordion = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  // Update product field
  const updateProductField = (productId, field, value) => {
    setProductsData(prev => prev.map(product => 
      product._id === productId 
        ? { ...product, [field]: value }
        : product
    ))
  }

  // Dynamic field handlers for specific product
  const addKeyValuePairForProduct = (productId, field) => {
    setProductsData(prev => prev.map(product => 
      product._id === productId
        ? { ...product, [field]: [...product[field], { key: "", value: "" }] }
        : product
    ))
  }

  const updateKeyValuePairForProduct = (productId, field, index, subField, value) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newArray = [...product[field]]
      newArray[index][subField] = value
      return { ...product, [field]: newArray }
    }))
  }

  const removeKeyValuePairForProduct = (productId, field, index) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      return { ...product, [field]: product[field].filter((_, i) => i !== index) }
    }))
  }

  const addImageFieldForProduct = (productId, field) => {
    setProductsData(prev => prev.map(product => 
      product._id === productId
        ? { ...product, [field]: [...product[field], { file: null, preview: null }] }
        : product
    ))
  }

  const updateImageFieldForProduct = (productId, field, index, file) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newArray = [...product[field]]
      if (file) {
        const objectUrl = URL.createObjectURL(file)
        newArray[index] = { file, preview: objectUrl }
      } else {
        if (newArray[index]?.preview && !newArray[index].preview.startsWith('http')) {
          URL.revokeObjectURL(newArray[index].preview)
        }
        newArray[index] = { file: null, preview: null }
      }
      return { ...product, [field]: newArray }
    }))
  }

  const removeImageFieldForProduct = (productId, field, index) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newArray = product[field].filter((_, i) => {
        if (i === index && product[field][i]?.preview && !product[field][i].preview.startsWith('http')) {
          URL.revokeObjectURL(product[field][i].preview)
        }
        return i !== index
      })
      return { ...product, [field]: newArray }
    }))
  }

  const addBulkPricingFieldForProduct = (productId, field) => {
    setProductsData(prev => prev.map(product => 
      product._id === productId
        ? { ...product, [field]: [...product[field], { wholesalePrice: "", quantity: "" }] }
        : product
    ))
  }

  const updateBulkPricingFieldForProduct = (productId, field, index, subField, value) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newArray = [...product[field]]
      newArray[index][subField] = value
      return { ...product, [field]: newArray }
    }))
  }

  const removeBulkPricingFieldForProduct = (productId, field, index) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      return { ...product, [field]: product[field].filter((_, i) => i !== index) }
    }))
  }

  // Variant handlers for specific product
  const addVariantForProduct = (productId) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
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
        isDefault: product.variants.length === 0,
      }
      return { ...product, hasVariants: true, variants: [...product.variants, newVariant] }
    }))
  }

  const removeVariantForProduct = (productId, variantIndex) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = product.variants.filter((_, i) => i !== variantIndex)
      if (product.variants[variantIndex].isDefault && newVariants.length > 0) {
        newVariants[0].isDefault = true
      }
      return { 
        ...product, 
        variants: newVariants,
        hasVariants: newVariants.length > 0
      }
    }))
  }

  const updateVariantFieldForProduct = (productId, variantIndex, field, value) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
      if (field === "isDefault" && value === true) {
        newVariants.forEach((v, i) => {
          if (i !== variantIndex) v.isDefault = false
        })
      }
      newVariants[variantIndex][field] = value
      return { ...product, variants: newVariants }
    }))
  }

  const addSizeSectionForProduct = (productId, variantIndex) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
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
      return { ...product, variants: newVariants }
    }))
  }

  const removeSizeSectionForProduct = (productId, variantIndex, mdIndex) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
      newVariants[variantIndex].moreDetails = newVariants[variantIndex].moreDetails.filter((_, i) => i !== mdIndex)
      return { ...product, variants: newVariants }
    }))
  }

  const updateSizeSectionFieldForProduct = (productId, variantIndex, mdIndex, field, value) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
      newVariants[variantIndex].moreDetails[mdIndex][field] = value
      return { ...product, variants: newVariants }
    }))
  }

  const updateSingleSizeFieldForProduct = (productId, variantIndex, mdIndex, field, value) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
      newVariants[variantIndex].moreDetails[mdIndex].size[field] = value
      return { ...product, variants: newVariants }
    }))
  }

  const getReuseOptionsForProduct = useCallback(
    (productId, currentVariantIndex, currentMdIndex, type) => {
      const product = productsData.find(p => p._id === productId)
      if (!product) return []

      const options = []
      product.variants.forEach((variant, vIdx) => {
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
    [productsData],
  )

  const handleReuseSelectionForProduct = (productId, variantIndex, mdIndex, type, selectedId) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      const newVariants = [...product.variants]
      const selectedOption = getReuseOptionsForProduct(productId, variantIndex, mdIndex, type).find((opt) => opt.id === selectedId)

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
      return { ...product, variants: newVariants }
    }))
  }

  // Category handlers
  const handleCategorySelectForProduct = (productId, level, categoryId) => {
    setProductsData(prev => prev.map(product => {
      if (product._id !== productId) return product
      let newSelectedCategoryIds = [...product.selectedCategoryIds.slice(0, level), categoryId].filter(Boolean)
      if (!categoryId) {
        newSelectedCategoryIds = newSelectedCategoryIds.slice(0, level)
      }
      
      const pathNames = newSelectedCategoryIds
        .map((id) => allCategoriesFlat.find((cat) => cat._id === id)?.categoryName)
        .filter(Boolean)
      
      return { 
        ...product, 
        selectedCategoryIds: newSelectedCategoryIds,
        categoryPath: pathNames.join(" > ")
      }
    }))
  }

  const renderCategoryDropdownsForProduct = (product) => {
    if (!product.isCategoryEditable) return null

    const dropdowns = []

    const mainCategoryOptions = allCategoriesTree.filter((cat) => !cat.parentCategoryId && !cat.parent_category_id)
    dropdowns.push(
      <div key={`category-dropdown-0-${product._id}`} className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Tag className="inline w-4 h-4 mr-2" />
          Main Category
        </label>
        <select
          value={product.selectedCategoryIds[0] || ""}
          onChange={(e) => handleCategorySelectForProduct(product._id, 0, e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 placeholder-gray-400 cursor-pointer appearance-none"
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

    const lastSelectedCategoryId = product.selectedCategoryIds[product.selectedCategoryIds.length - 1]
    const lastSelectedCategoryInTree = findCategoryInTree(lastSelectedCategoryId, allCategoriesTree)
    const subCategoryOptions = lastSelectedCategoryInTree ? lastSelectedCategoryInTree.subcategories || [] : []

    if (product.selectedCategoryIds.length > 0 && subCategoryOptions.length > 0) {
      dropdowns.push(
        <div key={`category-dropdown-sub-${product._id}`} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Layers className="inline w-4 h-4 mr-2" />
            Sub Category
          </label>
          <select
            value={product.selectedCategoryIds[product.selectedCategoryIds.length] || ""}
            onChange={(e) => handleCategorySelectForProduct(product._id, product.selectedCategoryIds.length, e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 placeholder-gray-400 cursor-pointer appearance-none"
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

  // Handle bulk submit
  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      
      const bulkData = productsData.map((product) => {
        const finalCategoryId = product.selectedCategoryIds[product.selectedCategoryIds.length - 1] || ""

        const productPayload = {
          productId: product._id,
          name: product.productName,
          mainCategory: product.selectedCategoryIds[0] || "",
          subCategory: finalCategoryId,
          categoryPath: product.categoryPath,
          productDetails: product.productDetails.filter(pd => pd.key && pd.value),
          hasVariants: product.hasVariants,
        }

        if (!product.mainImage && product.mainImagePreview && product.mainImagePreview.startsWith('http')) {
          productPayload.existingImage = product.mainImagePreview
        }

        const existingAdditionalImagesToKeep = []
        product.additionalImages.forEach(img => {
          if (!img.file && img.preview && img.preview.startsWith('http')) {
            existingAdditionalImagesToKeep.push(img.preview)
          }
        })
        productPayload.existingAdditionalImages = existingAdditionalImagesToKeep

        if (!product.hasVariants) {
          productPayload.stock = product.stock
          productPayload.price = product.price
          productPayload.bulkPricing = product.bulkPricing.filter(bp => bp.wholesalePrice && bp.quantity)
        }

        if (product.hasVariants) {
          productPayload.variants = product.variants.map((variant) => {
            const variantObj = {
              colorName: variant.colorName,
              optionalDetails: variant.optionalDetails.filter(od => od.key && od.value),
              isDefault: variant.isDefault,
              isPriceSame: variant.isPriceSame,
              isStockSame: variant.isStockSame,
              commonPrice: variant.moreDetails.length === 1 || variant.isPriceSame === "yes" ? variant.commonPrice : undefined,
              commonStock: variant.moreDetails.length === 1 || variant.isStockSame === "yes" ? variant.commonStock : undefined,
              commonBulkPricingCombinations: variant.moreDetails.length === 1 || variant.isPriceSame === "yes"
                ? variant.commonBulkPricingCombinations.filter(bpc => bpc.wholesalePrice && bpc.quantity)
                : [],
              moreDetails: variant.moreDetails.map((md) => {
                const existingMdImagesToKeep = []
                md.additionalImages.forEach(img => {
                  if (img.preview && img.preview.startsWith('http')) {
                    existingMdImagesToKeep.push(img.preview)
                  }
                })

                const mdObj = {
                  size: md.size,
                  optionalDetails: md.reuseOptionalDetails === "yes"
                    ? md.optionalDetails
                    : md.optionalDetails.filter(od => od.key && od.value),
                  existingAdditionalImages: existingMdImagesToKeep,
                }

                if (variant.isPriceSame === "no" && variant.moreDetails.length > 1) {
                  mdObj.price = md.price
                  mdObj.bulkPricingCombinations = md.bulkPricingCombinations.filter(bpc => bpc.wholesalePrice && bpc.quantity)
                }
                if (variant.isStockSame === "no" && variant.moreDetails.length > 1) {
                  mdObj.stock = md.stock
                }
                return mdObj
              }),
            }

            if (variant.variantImage.preview && variant.variantImage.preview.startsWith('http')) {
              variantObj.existingVariantImage = variant.variantImage.preview
            }

            return variantObj
          })
        }

        return productPayload
      })

      formData.append('productsData', JSON.stringify(bulkData))

      productsData.forEach((product, index) => {
        if (product.mainImage) {
          formData.append(`products[${index}].image`, product.mainImage)
        }

        product.additionalImages.forEach(img => {
          if (img.file) {
            formData.append(`products[${index}].additionalImages`, img.file)
          }
        })

        if (product.hasVariants) {
          product.variants.forEach((variant, variantIndex) => {
            if (variant.variantImage.file) {
              formData.append(`products[${index}].variants[${variantIndex}].variantImage`, variant.variantImage.file)
            }

            variant.moreDetails.forEach((md, mdIndex) => {
              md.additionalImages.forEach(img => {
                if (img.file) {
                  formData.append(`products[${index}].variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`, img.file)
                }
              })
            })
          })
        }
      })

      const response = await axios.put(
        `http://localhost:3000/api/product/bulk-edit`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      toast.success(`${productsData.length} products updated successfully!`)
      await fetchProducts();
      setTimeout(() => navigate('/admin/panel/products'), 2000)

    } catch (error) {
      console.error("Error updating products:", error)
      toast.error(error.response?.data?.message || "Failed to update products")
    } finally {
      setIsLoading(false)
    }
  }

  // Styling classes
  const cardClass = "bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
  const sectionClass = "p-8"
  const headerClass = "border-b border-gray-100 px-8 py-6 bg-gradient-to-r from-gray-50 to-white"
  const titleClass = "text-2xl font-bold text-gray-900 flex items-center gap-3"
  const subtitleClass = "text-gray-600 dark:text-gray-400 mt-1"
  const inputClass = "w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 placeholder-gray-400"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2"
  const buttonClass = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  const primaryButtonClass = `${buttonClass} bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl focus:ring-purple-500`
  const secondaryButtonClass = `${buttonClass} bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-200 dark:border-gray-700 focus:ring-gray-500`
  const dangerButtonClass = `${buttonClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500`
  const selectClass = `${inputClass} cursor-pointer appearance-none bg-white dark:bg-gray-900`

  if (isFetchingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading products for bulk edit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <LoadingOverlay isLoading={isLoading} />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/admin/panel/products')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Products</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Bulk Edit Products
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Edit multiple products simultaneously. Expand each product to modify its details.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full">
              <Package className="w-5 h-5" />
              <span className="font-semibold">{productsData.length}</span>
              <span>products selected for editing</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleBulkSubmit} className="space-y-6">
          {/* Accordions for each product */}
          {productsData.map((product, productIndex) => (
            <div key={product._id} className={cardClass}>
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleAccordion(product._id)}
                className="w-full px-6 md:px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4 md:gap-6 flex-1">
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={product.mainImagePreview || (product.hasVariants && product.variants.length > 0 && product.variants.find(v => v.isDefault)?.variantImage?.preview) || '/placeholder.svg'}
                      alt={product.productName}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                    <div className="absolute -top-2 -left-2 w-7 h-7 md:w-8 md:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      {productIndex + 1}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                      {product.productName || 'Unnamed Product'}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 truncate">
                        <span className="font-medium">Category:</span>
                        {product.categoryPath || 'Not set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Type:</span>
                        {product.hasVariants ? 'With Variants' : 'Simple Product'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-4">
                  <span className="hidden md:block text-sm text-gray-500">
                    {expandedProducts[product._id] ? 'Click to collapse' : 'Click to expand'}
                  </span>
                  {expandedProducts[product._id] ? (
                    <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {expandedProducts[product._id] && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-8">
                  <div className="space-y-8">
                    {/* Basic Information Section */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-600" />
                        Basic Information
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={labelClass}>
                              Product Name *
                            </label>
                            <input
                              type="text"
                              value={product.productName}
                              onChange={(e) => updateProductField(product._id, 'productName', e.target.value)}
                              placeholder="Enter your product name"
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-6">
                            {renderCategoryDropdownsForProduct(product)}
                          </div>
                        </div>

                        {product.categoryPath && (
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-purple-800 font-medium">
                                <Tag className="w-5 h-5" />
                                Category Path: {product.categoryPath}
                              </div>
                              <button
                                type="button"
                                onClick={() => updateProductField(product._id, 'isCategoryEditable', !product.isCategoryEditable)}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              >
                                {product.isCategoryEditable ? 'Done' : 'Edit Category'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-gray-900">Product Specifications</h4>
                            <button
                              type="button"
                              className={secondaryButtonClass}
                              onClick={() => addKeyValuePairForProduct(product._id, 'productDetails')}
                            >
                              <Plus className="w-4 h-4" />
                              Add Detail
                            </button>
                          </div>
                          {product.productDetails.map((detail, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className={labelClass}>Specification</label>
                                <input
                                  type="text"
                                  value={detail.key}
                                  onChange={(e) =>
                                    updateKeyValuePairForProduct(product._id, 'productDetails', index, "key", e.target.value)
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
                                      updateKeyValuePairForProduct(product._id, 'productDetails', index, "value", e.target.value)
                                    }
                                    placeholder="e.g., Cotton, 500g, Blue"
                                    className={inputClass}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  onClick={() => removeKeyValuePairForProduct(product._id, 'productDetails', index)}
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
                        {!product.hasVariants && (
                          <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className={labelClass}>
                                  <Package className="inline w-4 h-4 mr-2" />
                                  Stock Quantity
                                </label>
                                <input
                                  type="number"
                                  value={product.stock}
                                  onChange={(e) => updateProductField(product._id, 'stock', e.target.value)}
                                  placeholder="Available quantity"
                                  className={inputClass}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className={labelClass}>
                                  <DollarSign className="inline w-4 h-4 mr-2" />
                                  Price ($)
                                </label>
                                <input
                                  type="number"
                                  value={product.price}
                                  onChange={(e) => updateProductField(product._id, 'price', e.target.value)}
                                  placeholder="Product price"
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            {/* Main Image Upload */}
                            <div className="space-y-4">
                              <label className={labelClass}>
                                <ImageIcon className="inline w-4 h-4 mr-2" />
                                Product Main Image
                              </label>
                              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                                <input
                                  id={`mainImage-${product._id}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                      setProductsData(prev => prev.map(p => 
                                        p._id === product._id 
                                          ? { ...p, mainImage: file, mainImagePreview: URL.createObjectURL(file) }
                                          : p
                                      ))
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor={`mainImage-${product._id}`} className="cursor-pointer">
                                  {product.mainImagePreview ? (
                                    <div className="space-y-4">
                                      <img
                                        src={product.mainImagePreview}
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
                                <h4 className="text-lg font-semibold text-gray-900">Additional Images</h4>
                                <button
                                  type="button"
                                  className={secondaryButtonClass}
                                  onClick={() => {
                                    addImageFieldForProduct(product._id, 'additionalImages')
                                    setTimeout(() => {
                                      const inputId = `additional-image-${product._id}-${product.additionalImages.length}`
                                      document.getElementById(inputId)?.click()
                                    }, 0)
                                  }}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Image
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {product.additionalImages.map((image, index) => (
                                  <div key={index} className="relative">
                                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
                                      <input
                                        id={`additional-image-${product._id}-${index}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          updateImageFieldForProduct(product._id, 'additionalImages', index, e.target.files[0])
                                        }
                                        className="hidden"
                                      />
                                      <label htmlFor={`additional-image-${product._id}-${index}`} className="cursor-pointer block">
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
                                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                      onClick={() => removeImageFieldForProduct(product._id, 'additionalImages', index)}
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
                                <h4 className="text-lg font-semibold text-gray-900">Bulk Pricing Options</h4>
                                <button
                                  type="button"
                                  className={secondaryButtonClass}
                                  onClick={() => addBulkPricingFieldForProduct(product._id, 'bulkPricing')}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Pricing Tier
                                </button>
                              </div>
                              {product.bulkPricing.map((bp, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                                  <div className="space-y-2">
                                    <label className={labelClass}>Wholesale Price ($)</label>
                                    <input
                                      type="number"
                                      value={bp.wholesalePrice}
                                      onChange={(e) =>
                                        updateBulkPricingFieldForProduct(product._id, 'bulkPricing', index, "wholesalePrice", e.target.value)
                                      }
                                      placeholder="Bulk price"
                                      className={inputClass}
                                    />
                                    {product.price &&
                                      bp.wholesalePrice &&
                                      Number.parseFloat(bp.wholesalePrice) >= Number.parseFloat(product.price) && (
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
                                          updateBulkPricingFieldForProduct(product._id, 'bulkPricing', index, "quantity", e.target.value)
                                        }
                                        placeholder="Min qty"
                                        className={inputClass}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                      onClick={() => removeBulkPricingFieldForProduct(product._id, 'bulkPricing', index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Button to add variants */}
                            <div className="flex justify-center pt-6">
                              <button
                                type="button"
                                className={primaryButtonClass}
                                onClick={() => addVariantForProduct(product._id)}
                              >
                                <Plus className="w-4 h-4" />
                                Add Product Variants
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Product Variants Section */}
                    {product.hasVariants && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <Layers className="w-6 h-6 text-purple-600" />
                          Product Variants
                        </h3>
                        
                        <div className="space-y-10">
                          {product.variants.map((variant, variantIndex) => (
                            <div
                              key={variantIndex}
                              className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 dark:border-gray-700 p-8 space-y-8"
                            >
                              <div className="flex justify-between items-center">
                                <h4 className="text-2xl font-bold text-gray-900">
                                  Variant {variantIndex + 1}
                                  {variant.isDefault && (
                                    <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                                      Default
                                    </span>
                                  )}
                                </h4>
                                <button
                                  type="button"
                                  className={dangerButtonClass}
                                  onClick={() => removeVariantForProduct(product._id, variantIndex)}
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
                                    onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "colorName", e.target.value)}
                                    placeholder="e.g., Red, Blue, Large"
                                    className={inputClass}
                                  />
                                </div>
                                <div className="space-y-4">
                                  <label className={labelClass}>Variant Image</label>
                                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                                    <input
                                      id={`variant-image-${product._id}-${variantIndex}`}
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          updateVariantFieldForProduct(product._id, variantIndex, "variantImage", {
                                            file: file,
                                            preview: URL.createObjectURL(file),
                                          })
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label htmlFor={`variant-image-${product._id}-${variantIndex}`} className="cursor-pointer block">
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
                              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                                <input
                                  id={`default-variant-${product._id}-${variantIndex}`}
                                  type="checkbox"
                                  checked={variant.isDefault}
                                  onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "isDefault", e.target.checked)}
                                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor={`default-variant-${product._id}-${variantIndex}`} className="font-medium text-purple-900 cursor-pointer">
                                  Set as default variant
                                </label>
                              </div>

                              {/* Variant Optional Details */}
                              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 space-y-6">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-lg font-semibold text-gray-900">Variant Specifications</h5>
                                  <button
                                    type="button"
                                    className={secondaryButtonClass}
                                    onClick={() => {
                                      const newVariants = [...product.variants]
                                      newVariants[variantIndex].optionalDetails.push({ key: "", value: "" })
                                      updateProductField(product._id, 'variants', newVariants)
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
                                          const newVariants = [...product.variants]
                                          newVariants[variantIndex].optionalDetails[index].key = e.target.value
                                          updateProductField(product._id, 'variants', newVariants)
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
                                            const newVariants = [...product.variants]
                                            newVariants[variantIndex].optionalDetails[index].value = e.target.value
                                            updateProductField(product._id, 'variants', newVariants)
                                          }}
                                          placeholder="e.g., Cotton"
                                          className={inputClass}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        onClick={() => {
                                          const newVariants = [...product.variants]
                                          newVariants[variantIndex].optionalDetails = newVariants[variantIndex].optionalDetails.filter((_, i) => i !== index)
                                          updateProductField(product._id, 'variants', newVariants)
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Size Sections - CONTINUE IN NEXT PART DUE TO LENGTH */}
                              <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xl font-semibold text-gray-900">Size Configurations</h4>
                                  <button 
                                    type="button" 
                                    className={secondaryButtonClass} 
                                    onClick={() => addSizeSectionForProduct(product._id, variantIndex)}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Size
                                  </button>
                                </div>
                                {variant.moreDetails.map((md, mdIndex) => (
                                  <div key={mdIndex} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                                    <div className="flex justify-between items-center">
                                      <h5 className="text-lg font-semibold -800 dark:text-gray-100">Size Configuration {mdIndex + 1}</h5>
                                      <button 
                                        type="button" 
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        onClick={() => removeSizeSectionForProduct(product._id, variantIndex, mdIndex)}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                                      <h6 className="font-semibold -800 dark:text-gray-100">Dimensions</h6>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                          <label className={labelClass}>Length</label>
                                          <input 
                                            type="number" 
                                            value={md.size.length} 
                                            onChange={(e) => updateSingleSizeFieldForProduct(product._id, variantIndex, mdIndex, "length", e.target.value)} 
                                            placeholder="0" 
                                            className={inputClass} 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className={labelClass}>Width</label>
                                          <input 
                                            type="number" 
                                            value={md.size.breadth} 
                                            onChange={(e) => updateSingleSizeFieldForProduct(product._id, variantIndex, mdIndex, "breadth", e.target.value)} 
                                            placeholder="0" 
                                            className={inputClass} 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className={labelClass}>Height</label>
                                          <input 
                                            type="number" 
                                            value={md.size.height} 
                                            onChange={(e) => updateSingleSizeFieldForProduct(product._id, variantIndex, mdIndex, "height", e.target.value)} 
                                            placeholder="0" 
                                            className={inputClass} 
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <label className={labelClass}>Unit</label>
                                          <select 
                                            value={md.size.unit} 
                                            onChange={(e) => updateSingleSizeFieldForProduct(product._id, variantIndex, mdIndex, "unit", e.target.value)} 
                                            className={selectClass}
                                          >
                                            <option value="cm">cm</option>
                                            <option value="m">m</option>
                                            <option value="inch">inch</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Additional Images for this Size */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                                      <div className="flex justify-between items-center">
                                        <h6 className="text-md font-semibold -800 dark:text-gray-100">Additional Images for this Size</h6>
                                        <button 
                                          type="button" 
                                          className={secondaryButtonClass} 
                                          onClick={() => {
                                            const newVariants = [...product.variants]
                                            newVariants[variantIndex].moreDetails[mdIndex].additionalImages.push({ file: null, preview: null })
                                            updateProductField(product._id, 'variants', newVariants)
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Add Image
                                        </button>
                                      </div>
                                      {getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "images").length > 0 && (
                                        <div className="space-y-2">
                                          <label className={labelClass}>Do you want to reuse additional images?</label>
                                          <select 
                                            value={md.reuseAdditionalImages} 
                                            onChange={(e) => {
                                              updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "reuseAdditionalImages", e.target.value)
                                              if (e.target.value === "no") {
                                                updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "additionalImages", [{ file: null, preview: null }])
                                                updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "reusedImageSource", "")
                                              }
                                            }} 
                                            className={selectClass}
                                          >
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                          </select>
                                        </div>
                                      )}
                                      {md.reuseAdditionalImages === "yes" && getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "images").length > 0 && (
                                        <div className="space-y-2">
                                          <label className={labelClass}>Select source</label>
                                          <select 
                                            value={md.reusedImageSource} 
                                            onChange={(e) => handleReuseSelectionForProduct(product._id, variantIndex, mdIndex, "images", e.target.value)} 
                                            className={selectClass}
                                          >
                                            <option value="">Select source</option>
                                            {getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "images").map((option) => (
                                              <option key={option.id} value={option.id}>{option.label}</option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      {md.reuseAdditionalImages === "no" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {md.additionalImages.map((image, imgIndex) => (
                                            <div key={imgIndex} className="relative">
                                              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
                                                <input 
                                                  id={`md-image-${product._id}-${variantIndex}-${mdIndex}-${imgIndex}`} 
                                                  type="file" 
                                                  accept="image/*" 
                                                  onChange={(e) => {
                                                    const file = e.target.files[0]
                                                    if (file) {
                                                      const newVariants = [...product.variants]
                                                      if (newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex]?.preview && 
                                                          !newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex].preview.startsWith('http')) {
                                                        URL.revokeObjectURL(newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex].preview)
                                                      }
                                                      newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex] = { 
                                                        file, 
                                                        preview: URL.createObjectURL(file) 
                                                      }
                                                      updateProductField(product._id, 'variants', newVariants)
                                                    }
                                                  }} 
                                                  className="hidden" 
                                                />
                                                <label 
                                                  htmlFor={`md-image-${product._id}-${variantIndex}-${mdIndex}-${imgIndex}`} 
                                                  className="cursor-pointer block"
                                                >
                                                  {image.preview ? (
                                                    <img 
                                                      src={image.preview} 
                                                      alt={`Size ${imgIndex + 1}`} 
                                                      className="h-24 w-24 object-cover rounded-lg mx-auto shadow-md" 
                                                    />
                                                  ) : (
                                                    <div className="space-y-2">
                                                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                                                      <p className="text-sm text-gray-600 dark:text-gray-400">Image {imgIndex + 1}</p>
                                                    </div>
                                                  )}
                                                </label>
                                              </div>
                                              <button 
                                                type="button" 
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" 
                                                onClick={() => {
                                                  const newVariants = [...product.variants]
                                                  if (newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex]?.preview && 
                                                      !newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex].preview.startsWith('http')) {
                                                    URL.revokeObjectURL(newVariants[variantIndex].moreDetails[mdIndex].additionalImages[imgIndex].preview)
                                                  }
                                                  newVariants[variantIndex].moreDetails[mdIndex].additionalImages = 
                                                    newVariants[variantIndex].moreDetails[mdIndex].additionalImages.filter((_, i) => i !== imgIndex)
                                                  updateProductField(product._id, 'variants', newVariants)
                                                }}
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Optional Details for this Size */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                                      <div className="flex justify-between items-center">
                                        <h6 className="text-md font-semibold -800 dark:text-gray-100">Optional Details for this Size</h6>
                                        <button 
                                          type="button" 
                                          className={secondaryButtonClass} 
                                          onClick={() => {
                                            const newVariants = [...product.variants]
                                            newVariants[variantIndex].moreDetails[mdIndex].optionalDetails.push({ key: "", value: "" })
                                            updateProductField(product._id, 'variants', newVariants)
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Add Detail
                                        </button>
                                      </div>
                                      {getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                        <div className="space-y-2">
                                          <label className={labelClass}>Do you want to reuse optional details?</label>
                                          <select 
                                            value={md.reuseOptionalDetails} 
                                            onChange={(e) => {
                                              updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "reuseOptionalDetails", e.target.value)
                                              if (e.target.value === "no") {
                                                updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "optionalDetails", [{ key: "", value: "" }])
                                                updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "reusedOptionalDetailSource", "")
                                              }
                                            }} 
                                            className={selectClass}
                                          >
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                          </select>
                                        </div>
                                      )}
                                      {md.reuseOptionalDetails === "yes" && getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "optionalDetails").length > 0 && (
                                        <div className="space-y-2">
                                          <label className={labelClass}>Select source</label>
                                          <select 
                                            value={md.reusedOptionalDetailSource} 
                                            onChange={(e) => handleReuseSelectionForProduct(product._id, variantIndex, mdIndex, "optionalDetails", e.target.value)} 
                                            className={selectClass}
                                          >
                                            <option value="">Select source</option>
                                            {getReuseOptionsForProduct(product._id, variantIndex, mdIndex, "optionalDetails").map((option) => (
                                              <option key={option.id} value={option.id}>{option.label}</option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      {md.reuseOptionalDetails === "no" && (
                                        <div className="space-y-4">
                                          {md.optionalDetails.map((detail, detailIndex) => (
                                            <div key={detailIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <label className={labelClass}>Key</label>
                                                <input 
                                                  type="text" 
                                                  value={detail.key} 
                                                  onChange={(e) => {
                                                    const newVariants = [...product.variants]
                                                    newVariants[variantIndex].moreDetails[mdIndex].optionalDetails[detailIndex].key = e.target.value
                                                    updateProductField(product._id, 'variants', newVariants)
                                                  }} 
                                                  placeholder="e.g., Feature" 
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
                                                      const newVariants = [...product.variants]
                                                      newVariants[variantIndex].moreDetails[mdIndex].optionalDetails[detailIndex].value = e.target.value
                                                      updateProductField(product._id, 'variants', newVariants)
                                                    }} 
                                                    placeholder="e.g., Waterproof" 
                                                    className={inputClass} 
                                                  />
                                                </div>
                                                <button 
                                                  type="button" 
                                                  className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" 
                                                  onClick={() => {
                                                    const newVariants = [...product.variants]
                                                    newVariants[variantIndex].moreDetails[mdIndex].optionalDetails = 
                                                      newVariants[variantIndex].moreDetails[mdIndex].optionalDetails.filter((_, i) => i !== detailIndex)
                                                    updateProductField(product._id, 'variants', newVariants)
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

                                    {/* Price and Stock for this size if applicable */}
                                    {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                                      <div className="space-y-2">
                                        <label className={labelClass}>
                                          Price ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})
                                        </label>
                                        <input 
                                          type="number" 
                                          value={md.price} 
                                          onChange={(e) => updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "price", e.target.value)} 
                                          placeholder="Enter price" 
                                          className={inputClass} 
                                        />
                                      </div>
                                    )}
                                    {variant.moreDetails.length > 1 && variant.isStockSame === "no" && (
                                      <div className="space-y-2">
                                        <label className={labelClass}>
                                          Stock ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})
                                        </label>
                                        <input 
                                          type="number" 
                                          value={md.stock} 
                                          onChange={(e) => updateSizeSectionFieldForProduct(product._id, variantIndex, mdIndex, "stock", e.target.value)} 
                                          placeholder="Enter stock" 
                                          className={inputClass} 
                                        />
                                      </div>
                                    )}

                                    {/* Bulk Pricing for this size if applicable */}
                                    {variant.moreDetails.length > 1 && variant.isPriceSame === "no" && (
                                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                                        <div className="flex justify-between items-center">
                                          <h6 className="text-md font-semibold -800 dark:text-gray-100">
                                            Bulk Pricing ({variant.colorName} - {md.size?.length || "?"}x{md.size?.breadth || "?"}x{md.size?.height || "?"})
                                          </h6>
                                          <button 
                                            type="button" 
                                            className={secondaryButtonClass} 
                                            onClick={() => {
                                              const newVariants = [...product.variants]
                                              newVariants[variantIndex].moreDetails[mdIndex].bulkPricingCombinations.push({ wholesalePrice: "", quantity: "" })
                                              updateProductField(product._id, 'variants', newVariants)
                                            }}
                                          >
                                            <Plus className="w-4 h-4" />
                                            Add Bulk Pricing
                                          </button>
                                        </div>
                                        {md.bulkPricingCombinations.map((bpc, bpcIndex) => (
                                          <div key={bpcIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                                            <div className="space-y-2">
                                              <label className={labelClass}>Wholesale Price ($)</label>
                                              <input 
                                                type="number" 
                                                value={bpc.wholesalePrice} 
                                                onChange={(e) => {
                                                  const newVariants = [...product.variants]
                                                  newVariants[variantIndex].moreDetails[mdIndex].bulkPricingCombinations[bpcIndex].wholesalePrice = e.target.value
                                                  updateProductField(product._id, 'variants', newVariants)
                                                }} 
                                                placeholder="Enter wholesale price" 
                                                className={inputClass} 
                                              />
                                              {md.price && bpc.wholesalePrice && Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(md.price) && (
                                                <p className="text-red-500 text-sm">Wholesale price must be less than this price.</p>
                                              )}
                                            </div>
                                            <div className="space-y-2 flex gap-4 items-end">
                                              <div className="flex-1">
                                                <label className={labelClass}>Quantity</label>
                                                <input 
                                                  type="number" 
                                                  value={bpc.quantity} 
                                                  onChange={(e) => {
                                                    const newVariants = [...product.variants]
                                                    newVariants[variantIndex].moreDetails[mdIndex].bulkPricingCombinations[bpcIndex].quantity = e.target.value
                                                    updateProductField(product._id, 'variants', newVariants)
                                                  }} 
                                                  placeholder="Enter quantity" 
                                                  className={inputClass} 
                                                />
                                              </div>
                                              <button 
                                                type="button" 
                                                className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" 
                                                onClick={() => {
                                                  const newVariants = [...product.variants]
                                                  newVariants[variantIndex].moreDetails[mdIndex].bulkPricingCombinations = 
                                                    newVariants[variantIndex].moreDetails[mdIndex].bulkPricingCombinations.filter((_, i) => i !== bpcIndex)
                                                  updateProductField(product._id, 'variants', newVariants)
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

                              {/* Same price/stock for all sizes options */}
                              {variant.moreDetails.length > 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className={labelClass}>Same price for all sizes?</label>
                                    <select 
                                      value={variant.isPriceSame} 
                                      onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "isPriceSame", e.target.value)} 
                                      className={selectClass}
                                    >
                                      <option value="yes">Yes</option>
                                      <option value="no">No</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className={labelClass}>Same stock for all sizes?</label>
                                    <select 
                                      value={variant.isStockSame} 
                                      onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "isStockSame", e.target.value)} 
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
                                    <label className={labelClass}>Price ($)</label>
                                    <input 
                                      type="number" 
                                      value={variant.commonPrice} 
                                      onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "commonPrice", e.target.value)} 
                                      placeholder="Variant price" 
                                      className={inputClass} 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className={labelClass}>Stock</label>
                                    <input 
                                      type="number" 
                                      value={variant.commonStock} 
                                      onChange={(e) => updateVariantFieldForProduct(product._id, variantIndex, "commonStock", e.target.value)} 
                                      placeholder="Stock quantity" 
                                      className={inputClass} 
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Common Bulk Pricing */}
                              {(variant.moreDetails.length === 1 || variant.isPriceSame === "yes") && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                                  <div className="flex justify-between items-center">
                                    <h5 className="text-xl font-semibold text-gray-900">Common Bulk Pricing Combinations</h5>
                                    <button 
                                      type="button" 
                                      className={secondaryButtonClass} 
                                      onClick={() => {
                                        const newVariants = [...product.variants]
                                        newVariants[variantIndex].commonBulkPricingCombinations.push({ wholesalePrice: "", quantity: "" })
                                        updateProductField(product._id, 'variants', newVariants)
                                      }}
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Bulk Pricing
                                    </button>
                                  </div>
                                  {variant.commonBulkPricingCombinations.map((bpc, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl">
                                      <div className="space-y-2">
                                        <label className={labelClass}>Wholesale Price ($)</label>
                                        <input 
                                          type="number" 
                                          value={bpc.wholesalePrice} 
                                          onChange={(e) => {
                                            const newVariants = [...product.variants]
                                            newVariants[variantIndex].commonBulkPricingCombinations[index].wholesalePrice = e.target.value
                                            updateProductField(product._id, 'variants', newVariants)
                                          }} 
                                          placeholder="Enter wholesale price" 
                                          className={inputClass} 
                                        />
                                        {variant.commonPrice && bpc.wholesalePrice && Number.parseFloat(bpc.wholesalePrice) >= Number.parseFloat(variant.commonPrice) && (
                                          <p className="text-red-500 text-sm">Wholesale price must be less than common price.</p>
                                        )}
                                      </div>
                                      <div className="space-y-2 flex gap-4 items-end">
                                        <div className="flex-1">
                                          <label className={labelClass}>Quantity</label>
                                          <input 
                                            type="number" 
                                            value={bpc.quantity} 
                                            onChange={(e) => {
                                              const newVariants = [...product.variants]
                                              newVariants[variantIndex].commonBulkPricingCombinations[index].quantity = e.target.value
                                              updateProductField(product._id, 'variants', newVariants)
                                            }} 
                                            placeholder="Enter quantity" 
                                            className={inputClass} 
                                          />
                                        </div>
                                        <button 
                                          type="button" 
                                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" 
                                          onClick={() => {
                                            const newVariants = [...product.variants]
                                            newVariants[variantIndex].commonBulkPricingCombinations = 
                                              newVariants[variantIndex].commonBulkPricingCombinations.filter((_, i) => i !== index)
                                            updateProductField(product._id, 'variants', newVariants)
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

                          {/* Add Another Variant Button */}
                          <div className="flex justify-end pt-6">
                            <button
                              type="button"
                              className={primaryButtonClass}
                              onClick={() => addVariantForProduct(product._id)}
                            >
                              <Plus className="w-4 h-4" />
                              Add Another Variant
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Submit Button - Sticky at bottom */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky bottom-0 z-10">
            <div className="px-6 md:px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  <p className="font-medium">Ready to update {productsData.length} products?</p>
                  <p className="text-xs mt-1">All changes will be saved simultaneously</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/panel/products')}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Updating...' : `Update ${productsData.length} Products`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}