import React, { useContext, useState, useEffect } from "react";
import { Edit, Trash2, X, Calendar, Clock, DollarSign, Check, Package } from "lucide-react";
import { ProductContext } from '../../../../../Context/ProductContext';
import axios from 'axios';

export default function AdminProductsPage() {
  const { products, loading, error } = useContext(ProductContext);

  // This will hold all the products which will be selected using checkbox
  const [selectedProducts, setSelectedProducts] = useState([]);
  // This will hold the product when user clicks the restock button
  const [restockProduct, setRestockProduct] = useState(null); // Changed to null
  // This will control the opening and closing of restock modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [stockTextfield, setStockTextfield] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [multipleProductsToRestock, setMultipleProductsToRestock] = useState({});

  useEffect(() => {
    console.log(selectedProducts)
    const newMultipleProductsToRestock = {}
    selectedProducts.forEach(product => {
      newMultipleProductsToRestock[product._id] = {};
      if(product.hasVariants)  {
        // It has variants

        // Now creating the variant ID's
        product.variants.forEach(variant => {
          newMultipleProductsToRestock[product._id][variant._id] = {}
          // Now creating the size ID's
          variant.moreDetails.forEach(details => {
              newMultipleProductsToRestock[product._id][variant._id][details._id] = {};
              newMultipleProductsToRestock[product._id][variant._id][details._id][details.size._id] = "";
          });
        })  
      } else {
        // It does not have variants

        // Take the id and assign the stock
        newMultipleProductsToRestock[product._id] = {};
        newMultipleProductsToRestock[product._id]['stock'] = "";
      }
    });

    setMultipleProductsToRestock(newMultipleProductsToRestock);

  }, [selectedProducts]);

  useEffect(() => {
    console.log("Multiple products to restock")
    console.log(multipleProductsToRestock)
  }, [multipleProductsToRestock])

  // Function to check if product exists
  const doesProductExist = (product) => {
    return products.some((prod) => prod._id === product._id);
  };

  // Function to return the image URL
  const getImageUrl = (product) => {
    if (doesProductExist(product)) {
      if (product.image) {
        return product.image;
      } else {
        const defaultVariant = product.variants.find((variant) => variant.isDefault);
        return defaultVariant?.variantImage || "/placeholder.svg";
      }
    }
    return "/placeholder.svg";
  };

  // Function to count the number of size variants
  const getNumberOfSizeVariants = (product) => {
    const sizeLength = product.variants.map((variant) => variant.moreDetails.length);
    return sizeLength.reduce((sum, current) => sum + current, 0);
  };

  // Function to toggle checkbox selection
  const toggleCheckbox = (product) => {
    setSelectedProducts((prev) =>
      prev.some((prod) => prod._id === product._id)
        ? prev.filter((prod) => prod._id !== product._id)
        : [...prev, product]
    );
  };

  if (loading) return <div>Loading the products</div>;
  if (error) return <div>Error</div>;

  // Restock Modal Component (Single Product Only)
  const RestockModal = ({ product={}, onClose }) => {
    // Validate stock input
    const isValidStock = stockTextfield !== "" && parseInt(stockTextfield) >= 0;


    // Function that will update only single stock
    const handleUpdateStock = async () => {
  if (!isValidStock) return; // Stop if the number isn’t good

  // Show the kid we’re working (like a spinning toy)
  setIsLoading(true);

  try {
    // Send only the toy ID and the new number to the toy store
    const dataToSend = {
      productId: product._id, // Just the toy’s ID
      updatedStock: parseInt(stockTextfield), // Make sure it’s a number
    };

    // Talk to the toy store
    const res = await axios.post(
      'http://localhost:3000/api/product/restock',
      dataToSend,
      { withCredentials: true }
    );

    // Check if the toy store said “Okay!”
    if (res.status === 200 || res.status === 201) {
      console.log(`Saved ${stockTextfield} toys for ${product.name}`);
      setStockTextfield(""); // Clear the number box
      onClose(); // Close the toy box
    } else {
      // If the toy store said “No,” show a warning
      setError("Oops, couldn’t save the toys! Try again.");
    }
  } catch (error) {
    // If something broke, tell the kid what happened
    setError("Something went wrong with the toy store: " + error.message);
  } finally {
    // Stop the spinning toy
    setIsLoading(false);
  }
};

// Function for updating multiple stocks
const handleUpdateMultipleStock = async () => {
  setIsLoading(true);

  try{
    const res = await axios.post('http://localhost:3000/api/product/restock', multipleProductsToRestock, {
      withCredentials: true,
    });
    if(res.status === 200) {
      console.log("Updated");
    }
    else {
      console.log("Oops something went wrong")
    }
  } catch(err) {
    console.log("jfsdfgrfchwifcjwufhewruyfhqoidgwuydq;.ojdusi9qdwejhfyvctduqwgdsuqyedt6q" + err);
  }
};

    if (selectedProducts.length>0) {
      console.log("For multiple products")
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Restock Product</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 text-center text-gray-600">
              <div>
                      {Object.values(selectedProducts).map(product => {
     return product.hasVariants ? 
     (<div className="border-2" key={product._id}>
      <img src={getImageUrl(product)} alt={product.name} />
      <p>Product Name: {product.name}</p>
      {product.variants.map(variant => {
        return (<div key={variant._id}>
          Variant Name: {variant.colorName}
          {variant.moreDetails.map(details => {
            return (
              <div key={details._id}>
                <p>Current stock {details.size.stock}</p>
              <p>Enter the quantity to update for size : {details.size.length} X {details.size.breadth} X {details.size.height}</p>
              <input 
  type="text" 
  value={multipleProductsToRestock[product._id][variant._id][details._id][details.size._id]} 
  onChange={(e) => {
    setMultipleProductsToRestock(prev => ({
      ...prev,
      [product._id]: {
        ...prev[product._id],
        [variant._id]: {
          ...prev[product._id][variant._id],
          [details._id]: {
            ...prev[product._id][variant._id][details._id],
            [details.size._id]: e.target.value
          }
        }
      }
    }));
  }}
/>
              </div>

            )
          })}
        </div>)
      })}
          <p>Enter the quantity to update.</p>

     </div>) : 
     (<div className="border-2">
          <img src={getImageUrl(product)} alt="" />
          <p>{product.name}</p>
          <p>Enter the quantity to update.</p>
          <p>Current Quantity: {product.stock}</p>
          <input 
  type="text" 
  value={multipleProductsToRestock[product._id]['stock']} 
  onChange={(e) => {
    setMultipleProductsToRestock(prev => ({
      ...prev,
      [product._id]: {
        ...prev[product._id],
        stock: e.target.value
      }
    }));
  }}
/>
           </div>)
      })}
      <button onClick={handleUpdateMultipleStock}>Update</button>
  </div>
            </div>
          </div>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Restock Product</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 text-center text-gray-600">
              No Product Selected
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Restock Product</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              
              {product.hasVariants ? (<div>
              
                {product.variants.map((variant) => {
                  return <div key={variant._id}>
                    <p>Update quntity for</p>
                    Variant Color: {variant.colorName}
                    {variant.moreDetails.map((details) => {
                      // return console.log(details.size.length)
                      return (<div key={details._id}><p>{details.size.length} X {details.size.breadth} X {details.size.height}</p>
                      <p>Current stock{details.stock}</p>
                      <p>
                        Enter stock to update
                      </p>
                        <input key={details.size._id} type="text" name="" id="" /></div>
                      )
                    })}
                    </div>
                })}
              </div>) : (<div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">Current Stock: {product.stock}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Stock Quantity
                  </label>
                  <input
                    value={stockTextfield}
                    onChange={(e) => setStockTextfield(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Enter quantity to restock"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>)}
              
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={!isValidStock}
                className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                  isValidStock
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your product inventory and pricing</p>
        </div>

        {/* Bulk Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">{selectedProducts.length} products selected</span>
            <div className="flex items-center space-x-2">
              <button className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm font-medium transition-colors">
                Add Revised Rate
              </button>
              <button
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                onClick={() => {
                  console.log("Helo bulk actions")
                    setShowRestockModal(true);
                }}
              >
                Restock
              </button>
              <button className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
        {/* End of Bulk Actions */}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Color Variants</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Size Variants</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={() => toggleCheckbox(product)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <img
                          src={getImageUrl(product)}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {product.hasVariants ? <button>View Stock</button> : product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {product.hasVariants ? product.variants.length : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {getNumberOfSizeVariants(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {product.hasVariants ? <button>View Price</button> : product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                          Details
                        </button>
                        <button className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                          Add Revised Rate
                        </button>
                        <button
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1" 
                          onClick={() => {
                            setRestockProduct(product);
                            setStockTextfield(""); // Reset input when opening modal
                            setShowRestockModal(true);
                          }}
                        >
                          <Package className="w-3 h-3" />
                          Restock
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No products found</div>
            <p className="text-gray-400 mt-2">Add some products to get started</p>
          </div>
        )}

        {/* Details Modal */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 hidden">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <img src="/placeholder.svg" alt="Product" className="w-full h-48 object-cover rounded-lg mb-4" />
                <h3 className="font-semibold text-lg">Product Name</h3>
                <p className="text-2xl font-bold text-blue-600">$0</p>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">Product description</p>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Color: Select Color</h4>
                <div className="flex gap-3 flex-wrap">
                  <button
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all overflow-hidden"
                    title="color"
                  >
                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: "#000" }} />
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Size: Select Size</h4>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all">
                    Size
                  </button>
                </div>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Variant Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Detail:</span>
                    <span>Value</span>
                  </div>
                </div>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Bulk Pricing</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quantity</span>
                    <span className="font-semibold">$0 each</span>
                  </div>
                </div>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Product Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Detail:</span>
                    <span>Value</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Stock:</span>
                    <span>0 available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revised Rate Modal */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 hidden">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Revised Rate</h2>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6">
              <div className="mb-4 space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800">Product Name</h3>
                  <p className="text-sm text-gray-600">Current Price: $0</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Discount Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Discount Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Discount End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Discounted Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter discounted price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                  Start Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* {showRestockModal && (
        <RestockModal
          product={restockProduct}
          onClose={() => setShowRestockModal(false)}
        />
      )}  */}

      {showRestockModal && (selectedProducts.length > 0 ? <RestockModal onClose={() => setShowRestockModal(false)} /> : <RestockModal
          product={restockProduct}
          onClose={() => setShowRestockModal(false)}
        />)}
    </div>
  );
}