"use client"

import { useState } from "react"
import { Trash2, Plus, Save, X } from "lucide-react"

const AddCategory = () => {
  const [categoryData, setCategoryData] = useState({ name: "" })

  const [subCategories, setSubCategories] = useState([])
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false)

  const handleCategoryChange = (field, value) => {
    setCategoryData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addSubCategory = () => {
    setSubCategories([...subCategories, { name: "" }])
    setShowSubCategoryForm(true)
  }

  const handleSubCategoryChange = (index, field, value) => {
    const updatedSubCategories = [...subCategories]
    updatedSubCategories[index][field] = value
    setSubCategories(updatedSubCategories)
  }

  const removeSubCategory = (index) => {
    const updatedSubCategories = subCategories.filter((_, i) => i !== index)
    setSubCategories(updatedSubCategories)

    // Hide the form if no subcategories left
    if (updatedSubCategories.length === 0) {
      setShowSubCategoryForm(false)
    }
  }

  const handleSubmit = () => {
    // Validate required fields
    if (!categoryData.name.trim()) {
      alert("Please enter a category name")
      return
    }

    // Filter out empty subcategories
    const validSubCategories = subCategories.filter((sub) => sub.name.trim() !== "")

    const formData = {
      category: categoryData,
      subCategories: validSubCategories,
    }

    console.log("Category Data:", formData)
    // Handle form submission here
    alert("Category added successfully!")

    // Reset form
    setCategoryData({ name: "" })
    setSubCategories([])
    setShowSubCategoryForm(false)
  }

  const handleCancel = () => {
    setCategoryData({ name: "" })
    setSubCategories([])
    setShowSubCategoryForm(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto p-8 bg-gradient-to-b from-gray-50 to-white shadow-2xl hover:shadow-3xl transition-shadow duration-300 rounded-2xl border border-gray-200">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Add New Category</h1>
          <p className="text-gray-500 text-lg">Create a new category and organize your products better</p>
        </div>

        <div className="space-y-8">
          {/* Category Information */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Category Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) => handleCategoryChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter category name (e.g., Electronics, Clothing, Home & Garden)"
                  required
                />
              </div>

              {/* Add Sub Category Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={addSubCategory}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200 font-bold border-2 border-indigo-800 hover:border-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Plus size={18} className="text-yellow-300" />
                  <span className="text-yellow-300 font-bold text-lg">Add Sub Category</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Categories Section */}
          {showSubCategoryForm && (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Sub Categories</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {subCategories.length} sub {subCategories.length === 1 ? "category" : "categories"}
                </span>
              </div>

              <div className="space-y-6">
                {subCategories.map((subCategory, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800">Sub Category {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeSubCategory(index)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Remove sub category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category Name *</label>
                        <input
                          type="text"
                          value={subCategory.name}
                          onChange={(e) => handleSubCategoryChange(index, "name", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                          placeholder="Enter sub category name (e.g., Smartphones, T-Shirts, Furniture)"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Another Sub Category Button */}
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={addSubCategory}
                    className="inline-flex items-center gap-2 px-6 py-3 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200 border-2 border-indigo-200 hover:border-indigo-300 font-medium"
                  >
                    <Plus size={16} />
                    <span>Add Another Sub Category</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {(categoryData.name || subCategories.some((sub) => sub.name)) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Preview</h2>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{categoryData.name || "Category Name"}</h3>
                </div>

                {subCategories.filter((sub) => sub.name.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Sub Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {subCategories
                        .filter((sub) => sub.name.trim())
                        .map((sub, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                          >
                            {sub.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Save size={16} />
              <span>Save Category</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCategory
