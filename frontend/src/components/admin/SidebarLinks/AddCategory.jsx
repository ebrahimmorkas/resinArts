"use client"

import { useState } from "react"
import { Trash2, Plus, Save, X, ChevronRight } from "lucide-react"
import { produce } from "immer" // Named import for produce
import axios from  'axios';

const AddCategory = () => {
  const [categoryData, setCategoryData] = useState({ name: "", image: null })
  const [subCategories, setSubCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)

  const handleCategoryChange = (field, value) => {
    setCategoryData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageUrl = reader.result // Simulate cloud storage URL
        setCategoryData((prev) => ({
          ...prev,
          image: imageUrl,
        }))
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add subcategory at any level
  const addSubCategory = (path = []) => {
    setSubCategories(
      produce((draft) => {
        if (path.length === 0) {
          draft.push({ name: "", subCategories: [] })
        } else {
          let current = draft
          for (let i = 0; i < path.length; i++) {
            if (i === path.length - 1) {
              if (!current[path[i]].subCategories) {
                current[path[i]].subCategories = []
              }
              current[path[i]].subCategories.push({ name: "", subCategories: [] })
            } else {
              current = current[path[i]].subCategories
            }
          }
        }
      })
    )
  }

  // Remove subcategory at any level
  const removeSubCategory = (path) => {
    setSubCategories(
      produce((draft) => {
        if (path.length === 1) {
          draft.splice(path[0], 1)
        } else {
          let current = draft
          for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]].subCategories
          }
          current.splice(path[path.length - 1], 1)
        }
      })
    )
  }

  // Update subcategory name at any level
  const handleSubCategoryChange = (path, field, value) => {
    setSubCategories(
      produce((draft) => {
        let current = draft
        for (let i = 0; i < path.length; i++) {
          if (i === path.length - 1) {
            current[path[i]][field] = value
          } else {
            current = current[path[i]].subCategories
          }
        }
      })
    )
  }

  // Generate name attribute for subcategory input based on path
  const getSubCategoryNameAttribute = (path) => {
    if (path.length === 0) return "subCategories"
    let name = "subCategories"
    for (let i = 0; i < path.length; i++) {
      name += `[${path[i]}]`
      if (i < path.length - 1 || path.length === 1) {
        name += ".subCategories"
      }
    }
    name += ".name"
    return name
  }

  // Recursive component for rendering subcategories
  const SubCategoryItem = ({ subCategory, path, level = 0 }) => {
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium text-gray-800">
              {level === 0 ? "Sub Category" : `Level ${level + 1} Category`} {path[path.length - 1] + 1}
            </h3>
            <button
              type="button"
              onClick={() => removeSubCategory(path)}
              className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Remove sub category"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category Name *</label>
              <input
                type="text"
                name={getSubCategoryNameAttribute(path)}
                value={subCategory.name}
                onChange={(e) => handleSubCategoryChange(path, "name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 text-sm"
                placeholder={`Enter ${level === 0 ? "sub category" : `level ${level + 1} category`} name`}
                required
              />
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => addSubCategory(path)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md text-sm"
              >
                <Plus size={14} />
                <span>Add Sub Category</span>
              </button>
            </div>
          </div>
        </div>

        {subCategory.subCategories && subCategory.subCategories.length > 0 && (
          <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
            {subCategory.subCategories.map((nestedSub, index) => (
              <SubCategoryItem key={index} subCategory={nestedSub} path={[...path, index]} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Recursive function to render preview
  const renderPreviewCategories = (categories, level = 0) => {
    return categories.map((category, index) => (
      <div key={`preview-${level}-${index}`} style={{ marginLeft: `${level * 20}px` }} className="mb-2">
        <div className="flex items-center gap-2">
          {level > 0 && <ChevronRight size={12} className="text-gray-400" />}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              level === 0
                ? "bg-indigo-100 text-indigo-800"
                : level === 1
                  ? "bg-green-100 text-green-800"
                  : level === 2
                    ? "bg-purple-100 text-purple-800"
                    : "bg-orange-100 text-orange-800"
            }`}
          >
            {category.name}
          </span>
        </div>
        {category.subCategories && category.subCategories.length > 0 && (
          <div className="mt-1">{renderPreviewCategories(category.subCategories, level + 1)}</div>
        )}
      </div>
    ))
  }

  // Convert category tree to flat array for backend - FIXED VERSION
  const flattenCategories = (mainCategory, subCategories) => {
    const categories = [
      {
        categoryName: mainCategory.name,
        parent_category_id: null,
        image: mainCategory.image || null,
        current_path: null, // Main category doesn't need a path
      },
    ]

    const addSubCategories = (subs, parentPath = null) => {
      subs.forEach((sub, index) => {
        if (sub.name.trim()) {
          const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
          
          categories.push({
            categoryName: sub.name,
            parent_category_id: parentPath === null ? "main" : parentPath,
            image: null,
            current_path: currentPath, // This is the path other categories will use to reference this one
          })
          
          if (sub.subCategories && sub.subCategories.length > 0) {
            addSubCategories(sub.subCategories, currentPath)
          }
        }
      })
    }

    addSubCategories(subCategories)
    return categories
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!categoryData.name.trim()) {
      alert("Please enter a category name")
      return
    }

    const validSubCategories = subCategories.filter((sub) => sub.name.trim())
    const categories = flattenCategories(categoryData, validSubCategories)

    console.log('Sending categories to backend:', categories);

    try {
      const response = await fetch("http://localhost:3000/api/category/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save category")
      }

      const result = await response.json()
      console.log("Category Data:", result)
      alert("Category added successfully!")

      setCategoryData({ name: "", image: null })
      setSubCategories([])
      setImagePreview(null)
    } catch (error) {
      console.error("Error saving category:", error)
      alert(`Failed to save category: ${error.message}`)
    }
  }

  const handleCancel = () => {
    setCategoryData({ name: "", image: null })
    setSubCategories([])
    setImagePreview(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl border border-gray-200">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Add New Category</h1>
          <p className="text-gray-500 text-base">Create a new category and organize your products better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  name="category.name"
                  value={categoryData.name}
                  onChange={(e) => handleCategoryChange("name", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter category name (e.g., Electronics, Clothing, Home & Garden)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                <input
                  type="file"
                  name="category.image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Category Preview" className="h-32 w-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => addSubCategory()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 font-bold border-2 border-indigo-800 hover:border-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Plus size={16} className="text-yellow-300" />
                  <span className="text-yellow-300 font-bold">Add Sub Category</span>
                </button>
              </div>
            </div>
          </div>

          {subCategories.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Sub Categories</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {subCategories.length} sub {subCategories.length === 1 ? "category" : "categories"}
                </span>
              </div>

              <div className="space-y-4">
                {subCategories.map((subCategory, index) => (
                  <SubCategoryItem key={index} subCategory={subCategory} path={[index]} level={0} />
                ))}
              </div>
            </div>
          )}

          {(categoryData.name || subCategories.length > 0 || imagePreview) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Structure Preview</h2>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="mb-3 flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">{categoryData.name || "Category Name"}</h3>
                  {imagePreview && (
                    <img src={imagePreview} alt="Category Preview" className="h-16 w-16 object-cover rounded-lg" />
                  )}
                </div>

                {subCategories.filter((sub) => sub.name.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sub Categories:</h4>
                    <div className="space-y-1">
                      {renderPreviewCategories(subCategories.filter((sub) => sub.name.trim()))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            >
              <Save size={16} />
              <span>Save Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCategory