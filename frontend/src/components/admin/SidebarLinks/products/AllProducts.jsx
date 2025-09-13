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
  const [multipleProductsToRestock, setMultipleProductsToRestock] = useState({});
  // Starting of state variables for revised rate functionality
  const [showRevisedRateModal, setShowRevisedRateModal] = useState(false);
  const [multipleProductsForRevisedRate, setMultipleProductsForRevisedRate] = useState({});
  const [RevisedRateProduct, setRevisedRateProduct] = useState(null);
  // Ending of state variables for revised rate functionality
  
  // Start of useEffect that will handle the selection and deselection of products selected through checkbox and also update state variable mutipleProductsToRestock
  useEffect(() => {
    console.log(selectedProducts)

    // Updating state variable for Restock
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

    // Updating the state variable for Revised Rate
    const newMultipleProductsForRevisedRate = {}
    selectedProducts.forEach(product => {
      newMultipleProductsForRevisedRate[product._id] = {};
      if(product.hasVariants)  {
        // It has variants

        // Now creating the variant ID's
        product.variants.forEach(variant => {
          newMultipleProductsForRevisedRate[product._id][variant._id] = {}
          // Now creating the size ID's
          variant.moreDetails.forEach(details => {
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id] = {};
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id][details.size._id] = "";
            newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountStartDate"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountEndDate"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountPrice"] = "";
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["comeBackToOriginalPrice"] = null;
              newMultipleProductsForRevisedRate[product._id][variant._id][details._id]["discountBulkPricing"] = [];

          });
        }) 
      } else {
        // It does not have variants

        // Take the id and assign the stock
        newMultipleProductsForRevisedRate[product._id] = {};
        newMultipleProductsForRevisedRate[product._id]['price'] = "";
         newMultipleProductsForRevisedRate[product._id]["discountStartDate"] = null;
              newMultipleProductsForRevisedRate[product._id]["discountEndDate"] = null;
              newMultipleProductsForRevisedRate[product._id]["discountPrice"] = "";
              newMultipleProductsForRevisedRate[product._id]["comeBackToOriginalPrice"] = null; 
              newMultipleProductsForRevisedRate[product._id]["discountBulkPricing"] = [];
      }
    });
    setMultipleProductsForRevisedRate(newMultipleProductsForRevisedRate)


  }, [selectedProducts]);
// End of useEffect that will handle the selection and deselection of products selected through checkbox and also update state variable mutipleProductsToRestock

// Start of useEffect that will only pront state variable 'multipleProductsToRestock'
  useEffect(() => {
    console.log("Multiple products to restock")
    console.log(multipleProductsToRestock)
  }, [multipleProductsToRestock])
// End of useEffect that will only pront state variable 'multipleProductsToRestock'

// Start of useEffect that will only pront state variable 'multipleProductsForRevisedRate'
  useEffect(() => {
    console.log("Multiple products for revised rate")
    console.log(multipleProductsForRevisedRate)
  }, [multipleProductsForRevisedRate])
// End of useEffect that will only pront state variable 'multipleProductsForRevisedRate'

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


  // This function is not currenly in use
const setDataForSingleProductWithVariants = (product) => {
  // Check if state is already initialized
  const isStateEmpty = Object.keys(stateVariableForDataForSingleProductWithVariants).length === 0;
  
  if (!isStateEmpty) {
    console.log("State already initialized, not resetting values");
    return; // Don't reinitialize if state already has data
  }
  
  console.log("🔵 Initializing empty state for product:", product);
  const dataForSingleProductWithVariants = {};
  product.variants.forEach(variant => {
    dataForSingleProductWithVariants[variant._id] = {}
    variant.moreDetails.forEach(details => {
      dataForSingleProductWithVariants[variant._id][details._id] = {}
      dataForSingleProductWithVariants[variant._id][details._id][details.size._id] = "";
    });
  });
  console.log("🟢 Setting state to:", dataForSingleProductWithVariants);
  setStateVariableForDataForSingleProductWithVariants(dataForSingleProductWithVariants);
}

  

  if (loading) return <div>Loading the products</div>;
  if (error) return <div>Error</div>;

  // Restock Modal Component
  const RestockModal = ({ product={}, onClose, selectedProducts=[], multipleToRestockInitial={} }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [stockTextfield, setStockTextfield] = useState("");
    const [stateVariableForDataForSingleProductWithVariants, setStateVariableForDataForSingleProductWithVariants] = useState({});
    // Validate stock input
    const isValidStock = stockTextfield !== "" && parseInt(stockTextfield) >= 0;


    // Start of function that will update only stock of only one product with and without variants
    const handleUpdateStock = async () => {
  // if (!isValidStock) return; // Stop if the number isn’t good

  // Show the kid we’re working (like a spinning toy)
  setIsLoading(true);

  try {
    // Send only the toy ID and the new number to the toy store
    let dataToSend = {}
    if(product.hasVariants) {
      dataToSend = {
        productId: product._id,
        updatedStock: "",
        productData: stateVariableForDataForSingleProductWithVariants
      }
    } else {
    dataToSend = {
      productId: product._id, // Just the toy’s ID
      updatedStock: parseInt(stockTextfield), // Make sure it’s a number
      productData: {}
    };
  }
    // Talk to the toy store
    const res = await axios.post(
      'https://resinarts.onrender.com/api/product/restock',
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
      // setError("Oops, couldn’t save the toys! Try again.");
      console.log("Not happening")
    }
  } catch (error) {
    // If something broke, tell the kid what happened
    // setError("Something went wrong with the toy store: " + error.message);
    console.log(error.message);
  } finally {
    // Stop the spinning toy
    setIsLoading(false);
  }
};
// End of function that will update only stock of only one product with and without variants

// Start of function for updating multiple stocks with both type of preoducts that is with and without variants.
const handleUpdateMultipleStock = async (localMultipleToRestock) => {
  setIsLoading(true);

  try{
    const res = await axios.post('https://resinarts.onrender.com/api/product/mass-restock', localMultipleToRestock, {
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
  } finally {
    setIsLoading(false);
  }
};
// End of function for updating multiple stocks with both type of preoducts that is with and without variants.

// Start of jsx for showing modal to restock multiple products with and without variants
    if (selectedProducts.length>0) {
      console.log("For multiple products")
      const [localMultipleToRestock, setLocalMultipleToRestock] = useState(multipleToRestockInitial);
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
  value={localMultipleToRestock[product._id][variant._id][details._id][details.size._id]} 
  onChange={(e) => {
    setLocalMultipleToRestock(prev => ({
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
  value={localMultipleToRestock[product._id]['stock']} 
  onChange={(e) => {
    setLocalMultipleToRestock(prev => ({
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
      <button onClick={() => handleUpdateMultipleStock(localMultipleToRestock)}>Update</button>
  </div>
            </div>
          </div>
        </div>
      );
    }
// End of jsx for showing modal to restock multiple products with and without variants

// Start of iff products are not selected through checkbox check whether the actual product was passed or not. And if no product show Not found
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
// End of iff products are not selected through checkbox check whether the actual product was passed or not. And if no product show Not found


// Start of jsx for showing the modal where user can restock single product with and without stock
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
                    <img src={getImageUrl(product)} alt="" />
                    <p>Product Name: {product.name}</p>
                    <p>Update quntity for</p>
                    Variant Color: {variant.colorName}
                    {variant.moreDetails.map((details) => {
                      // return console.log(details.size.length)
                      return (<div key={details._id}><p>{details.size.length} X {details.size.breadth} X {details.size.height}</p>
                      <p>Current stock{details.stock}</p>
                      <p>
                        Enter stock to update
                      </p>
                       <input 
  key={details.size._id} 
  type="text" 
  name={details.size._id} 
  id="" 
  value={stateVariableForDataForSingleProductWithVariants[variant._id]?.[details._id]?.[details.size._id] || ""}
  onChange={(e) => {
    setStateVariableForDataForSingleProductWithVariants(prevState => ({
      ...prevState,
      [variant._id]: {
        ...prevState[variant._id],
        [details._id]: {
          ...(prevState[variant._id]?.[details._id] || {}), // Safe spreading with fallback
          [details.size._id]: e.target.value
        }
      }
    }));
  }}
/>
                        </div>
                      )
                    })}
                    </div>
                })
                }
                {/* <button onClick={() => {setDataForSingleProductWithVariants(product)}}>stock</button> */}
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
                // disabled={!isValidStock}
                // className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                //   isValidStock
                //     ? "bg-blue-600 text-white hover:bg-blue-700"
                //     : "bg-gray-300 text-gray-500 cursor-not-allowed"
                // }`}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    // End of jsx for showing the modal where user can restock single product with and without stock
  };
  // End of restock modal

  // Staart of Revised Rate Modal component
  const RevisedRateModal = ({ product={}, onClose, selectedProducts=[], multipleForRevisedRateInitial={} }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [revisedRateTextfield, setRevisedRateTextfield] = useState("");
    const [discountStartDate, setDiscountStartDate] = useState(null);
    const [discountEndDate, setDiscountEndDate] = useState(null);
    const [comeBackToOriginalPrice, setComeBackToOriginalPrice] = useState(null);
    const [singleProductDiscountBulkPricing, setSingleProductDiscountBulkPricing] = useState([]);
    const [stateVariableToReviseRateForSingleProductWithVariants, setStateVariableToReviseRateForSingleProductWithVariants] = useState({});
    // Validate stock input
    const isValidPrice = revisedRateTextfield !== "" && parseInt(revisedRateTextfield) >= 0;


    // Start of function that will update only price of only one product with and without variants
    const handleUpdateRevisedRate = async () => {
  // if (!isValidStock) return; // Stop if the number isn’t good

  // Show the kid we’re working (like a spinning toy)
  setIsLoading(true);

  try {
    // Send only the toy ID and the new number to the toy store
    let dataToSend = {}
    if(product.hasVariants) {
      dataToSend = {
        productId: product._id,
        productData: stateVariableToReviseRateForSingleProductWithVariants
      }
    } else {
    dataToSend = {
      productId: product._id, // Just the toy’s ID
      updatedPrice: parseInt(revisedRateTextfield),
      discountStartDate,
      discountEndDate,
      discountPrice: parseInt(revisedRateTextfield),
      comeBackToOriginalPrice,
      discountBulkPricing: singleProductDiscountBulkPricing,
      productData: {}
    };
  }
    // Talk to the toy store
    const res = await axios.post(
      'https://resinarts.onrender.com/api/product/revised-rate',
      dataToSend,
      { withCredentials: true }
    );

    // Check if the toy store said “Okay!”
    if (res.status === 200 || res.status === 201) {
      console.log(`Saved ${revisedRateTextfield} toys for ${product.name}`);
      setRevisedRateTextfield(""); // Clear the number box
      onClose(); // Close the toy box
    } else {
      // If the toy store said “No,” show a warning
      // setError("Oops, couldn’t save the toys! Try again.");
      console.log("Not happening")
    }
  } catch (error) {
    // If something broke, tell the kid what happened
    // setError("Something went wrong with the toy store: " + error.message);
    console.log(error.message);
  } finally {
    // Stop the spinning toy
    setIsLoading(false);
  }
};
// End of function that will update only price of only one product with and without variants

// Start of function for updating multiple price with both type of preoducts that is with and without variants.
const handleUpdateMultipleStock = async (localMultipleForRevisedRate) => {
  setIsLoading(true);

  try{
    const res = await axios.post('https://resinarts.onrender.com/api/product/mass-revised-rate', localMultipleForRevisedRate, {
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
  } finally {
    setIsLoading(false);
  }
};
// End of function for updating multiple price with both type of preoducts that is with and without variants.

// Start of functions for managing the discountBulkPricing (Currenlty for multiple products)
// ADD DISCOUNT BULK PRICING SECTION
// UPDATED FUNCTIONS - Change thresholdQuantity to quantity

// ADD DISCOUNT BULK PRICING SECTION
const addDiscountBulkPricingSection = (setLocal, productId, variantId = null, detailsId = null) => {
  setLocal(prev => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      ...(variantId && detailsId ? {
        [variantId]: {
          ...prev[productId][variantId],
          [detailsId]: {
            ...prev[productId][variantId][detailsId],
            discountBulkPricing: [
              ...(prev[productId][variantId][detailsId].discountBulkPricing || []),
              { wholesalePrice: '', quantity: '' } // CHANGED: thresholdQuantity -> quantity
            ]
          }
        }
      } : {
        discountBulkPricing: [
          ...(prev[productId].discountBulkPricing || []),
          { wholesalePrice: '', quantity: '' } // CHANGED: thresholdQuantity -> quantity
        ]
      })
    }
  }));
};

// REMOVE DISCOUNT BULK PRICING SECTION
const removeDiscountBulkPricingSection = (setLocal, productId, index, variantId = null, detailsId = null) => {
  setLocal(prev => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      ...(variantId && detailsId ? {
        [variantId]: {
          ...prev[productId][variantId],
          [detailsId]: {
            ...prev[productId][variantId][detailsId],
            discountBulkPricing: prev[productId][variantId][detailsId].discountBulkPricing.filter((_, i) => i !== index)
          }
        }
      } : {
        discountBulkPricing: prev[productId].discountBulkPricing.filter((_, i) => i !== index)
      })
    }
  }));
};

// UPDATE DISCOUNT BULK PRICING VALUES
const updateDiscountBulkPricing = (setLocal, productId, index, field, value, variantId = null, detailsId = null) => {
  setLocal(prev => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      ...(variantId && detailsId ? {
        [variantId]: {
          ...prev[productId][variantId],
          [detailsId]: {
            ...prev[productId][variantId][detailsId],
            discountBulkPricing: prev[productId][variantId][detailsId].discountBulkPricing.map((item, i) => 
              i === index ? { ...item, [field]: value } : item
            )
          }
        }
      } : {
        discountBulkPricing: prev[productId].discountBulkPricing.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      })
    }
  }));
};

// GET COUNT OF DISCOUNT BULK PRICING SECTIONS
const getDiscountBulkPricingCount = (local, productId, variantId = null, detailsId = null) => {
  if (variantId && detailsId) {
    return local[productId]?.[variantId]?.[detailsId]?.discountBulkPricing?.length || 0;
  } else {
    return local[productId]?.discountBulkPricing?.length || 0;
  }
};
// End of functions for managing the discountBulkPricing (Currenlty for multiple products)

// Start of jsx for showing modal to restock multiple products with and without variants
   if (selectedProducts.length>0) {
      console.log("For multiple products")
      const [localMultipleForRevisedRate, setLocalMultipleForRevisedRate] = useState(multipleForRevisedRateInitial);
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Revised Rate</h2>
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
                              <p>Enter the discounted price for size : {details.size.length} X {details.size.breadth} X {details.size.height}</p>
                              <p>Current price {details.price}</p>
                              
                              <input 
                                type="text" 
                                value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.[details.size._id] || ''} 
                                onChange={(e) => {
                                  setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          [details.size._id]: e.target.value,
                                          "discountPrice": e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                              />

                              <p>Discount start date</p>
                              <input 
                                type="datetime-local" 
                                value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["discountStartDate"] || ""}
                                onChange={(e) => {
                                  setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          "discountStartDate": e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                              />              

                              <p>Discount end date</p>
                              <input 
                                type="datetime-local" 
                                value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["discountEndDate"] || ""}
                                onChange={(e) => {
                                  setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          "discountEndDate": e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                              /> 

                              <select 
                                value={localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.["comeBackToOriginalPrice"] || ""}
                                onChange={(e) => {
                                  setLocalMultipleForRevisedRate(prev => ({
                                    ...prev,
                                    [product._id]: {
                                      ...prev[product._id],
                                      [variant._id]: {
                                        ...prev[product._id][variant._id],
                                        [details._id]: {
                                          ...prev[product._id][variant._id][details._id],
                                          "comeBackToOriginalPrice": e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                              >
                                <option value="">Select option</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>

                              {/* start of BULK PRICING SECTION FOR VARIANTS */}
                              // ADD THIS AFTER THE SELECT DROPDOWN FOR VARIANTS
{/* DISCOUNT BULK PRICING SECTION FOR VARIANTS */}
<div className="mt-4 p-3 bg-gray-100 rounded">
  <h4 className="font-bold mb-2">
    Discount Bulk Pricing ({getDiscountBulkPricingCount(localMultipleForRevisedRate, product._id, variant._id, details._id)} sections)
  </h4>
  
  {(localMultipleForRevisedRate[product._id]?.[variant._id]?.[details._id]?.discountBulkPricing || []).map((pricing, index) => (
    <div key={index} className="flex gap-2 mb-2 p-2 bg-white rounded border">
      <div className="flex-1">
        <label className="text-xs text-gray-600">Wholesale Price</label>
        <input 
          type="number"
          placeholder="e.g., 100"
          value={pricing.wholesalePrice}
          onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'wholesalePrice', e.target.value, variant._id, details._id)}
          className="w-full p-1 border rounded"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-600">Quantity</label>
        <input 
          type="number"
          placeholder="e.g., 12"
          value={pricing.quantity} // CHANGED: thresholdQuantity -> quantity
          onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'quantity', e.target.value, variant._id, details._id)} // CHANGED: thresholdQuantity -> quantity
          className="w-full p-1 border rounded"
        />
      </div>
      <button 
        onClick={() => removeDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, index, variant._id, details._id)}
        className="px-2 py-1 bg-red-500 text-white rounded text-xs self-end"
      >
        Remove
      </button>
    </div>
  ))}
  
  <button 
    onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, variant._id, details._id)}
    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
  >
    Add Discount Bulk Pricing
  </button>
</div>
                              {/* End of Bulk pricing section for variant */}
                            </div>
                          )
                        })}
                      </div>)
                    })}
                  </div>) : 
                  (<div className="border-2" key={product._id}>
                    <img src={getImageUrl(product)} alt="" />
                    <p>{product.name}</p>
                    <p>Current Price: {product.price}</p>
                    <p>Enter the discounted price</p>
                    
                    <input 
                      type="text" 
                      value={localMultipleForRevisedRate[product._id]?.['price'] || ''} 
                      onChange={(e) => {
                        setLocalMultipleForRevisedRate(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            price: e.target.value,
                            discountPrice: e.target.value
                          }
                        }));
                      }}
                    />

                    <p>Discount start date</p>
                    <input 
                      type="datetime-local" 
                      value={localMultipleForRevisedRate[product._id]?.["discountStartDate"] || ""}
                      onChange={(e) => {
                        setLocalMultipleForRevisedRate(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            "discountStartDate": e.target.value
                          }
                        }));
                      }}
                    />              

                    <p>Discount end date</p>
                    <input 
                      type="datetime-local" 
                      value={localMultipleForRevisedRate[product._id]?.["discountEndDate"] || ""}
                      onChange={(e) => {
                        setLocalMultipleForRevisedRate(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            "discountEndDate": e.target.value
                          }
                        }));
                      }}
                    /> 

                    <select 
                      value={localMultipleForRevisedRate[product._id]?.["comeBackToOriginalPrice"] || ""}
                      onChange={(e) => {
                        setLocalMultipleForRevisedRate(prev => ({
                          ...prev,
                          [product._id]: {
                            ...prev[product._id],
                            "comeBackToOriginalPrice": e.target.value
                          }
                        }));
                      }}
                    >
                      <option value="">Select option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>

                    {/* BULK PRICING SECTION FOR NON-VARIANTS */}
{/* DISCOUNT BULK PRICING SECTION FOR NON-VARIANTS */}
<div className="mt-4 p-3 bg-gray-100 rounded">
  <h4 className="font-bold mb-2">
    Discount Bulk Pricing ({getDiscountBulkPricingCount(localMultipleForRevisedRate, product._id)} sections)
  </h4>
  
  {(localMultipleForRevisedRate[product._id]?.discountBulkPricing || []).map((pricing, index) => (
    <div key={index} className="flex gap-2 mb-2 p-2 bg-white rounded border">
      <div className="flex-1">
        <label className="text-xs text-gray-600">Wholesale Price</label>
        <input 
          type="number"
          placeholder="e.g., 150"
          value={pricing.wholesalePrice}
          onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'wholesalePrice', e.target.value)}
          className="w-full p-1 border rounded"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-600">Quantity</label>
        <input 
          type="number"
          placeholder="e.g., 10"
          value={pricing.quantity} // CHANGED: thresholdQuantity -> quantity
          onChange={(e) => updateDiscountBulkPricing(setLocalMultipleForRevisedRate, product._id, index, 'quantity', e.target.value)} // CHANGED: thresholdQuantity -> quantity
          className="w-full p-1 border rounded"
        />
      </div>
      <button 
        onClick={() => removeDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id, index)}
        className="px-2 py-1 bg-red-500 text-white rounded text-xs self-end"
      >
        Remove
      </button>
    </div>
  ))}
  
  <button 
    onClick={() => addDiscountBulkPricingSection(setLocalMultipleForRevisedRate, product._id)}
    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
  >
    Add Discount Bulk Pricing
  </button>
</div>
                    {/* End of bulk pricig section for witout variants */}
                  </div>)
                })}
                <button onClick={() => handleUpdateMultipleStock(localMultipleForRevisedRate)}>Update</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
// End of jsx for showing modal to restock multiple products with and without variants

// Start of iff products are not selected through checkbox check whether the actual product was passed or not. And if no product show Not found
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
// End of iff products are not selected through checkbox check whether the actual product was passed or not. And if no product show Not found

// Start of jsx for showing the modal where user can restock single product with and without stock
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
    <img src={getImageUrl(product)} alt="" />
    <p>Product Name: {product.name}</p>
    <p>Revise rate for</p>
    Variant Color: {variant.colorName}
    {variant.moreDetails.map((details) => {
      return (<div key={details._id}>
        <p>{details.size.length} X {details.size.breadth} X {details.size.height}</p>
        <p>Current price: {details.price}</p>
        
        <p>Enter discounted price</p>
        <input 
          name="discountPrice"
          type="text" 
          value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountPrice'] || ""} 
          onChange={(e) => {
            setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
              ...prev,
              [variant._id]: {
                ...prev[variant._id],
                [details._id]: {
                  ...(prev[variant._id]?.[details._id] || {}),
                  [e.target.name]: e.target.value
                }
              }
            }))
          }}
        />
        
        <p>Discount start date</p>
        <input 
          type="datetime-local" 
          name="discountStartDate" 
          value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountStartDate'] || ""} 
          onChange={(e) => {
            setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
              ...prev,
              [variant._id]: {
                ...prev[variant._id],
                [details._id]: {
                  ...(prev[variant._id]?.[details._id] || {}),
                  [e.target.name]: e.target.value
                }
              }
            }))
          }}
        />              

        <p>Discount end date</p>
        <input 
          type="datetime-local" 
          name="discountEndDate" 
          value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['discountEndDate'] || ""} 
          onChange={(e) => {
            setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
              ...prev,
              [variant._id]: {
                ...prev[variant._id],
                [details._id]: {
                  ...(prev[variant._id]?.[details._id] || {}),
                  [e.target.name]: e.target.value
                }
              }
            }))
          }}
        /> 

        <p>Update to original price after end date?</p>
        <select 
          name="comeBackToOriginalPrice" 
          value={stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.['comeBackToOriginalPrice'] || ""} 
          onChange={(e) => {
            setStateVariableToReviseRateForSingleProductWithVariants(prev => ({
              ...prev,
              [variant._id]: {
                ...prev[variant._id],
                [details._id]: {
                  ...(prev[variant._id]?.[details._id] || {}),
                  [e.target.name]: e.target.value
                }
              }
            }))
          }}
        >
          <option value="">Select option</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select> 

        {/* FIXED BULK PRICING SECTION - Now specific to each variant/size combination */}
        <div>
          <button onClick={() => {
            setStateVariableToReviseRateForSingleProductWithVariants(prev => {
              // Get current bulk pricing for this specific variant/size, or empty array
              const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
              
              return {
                ...prev,
                [variant._id]: {
                  ...prev[variant._id],
                  [details._id]: {
                    ...(prev[variant._id]?.[details._id] || {}),
                    bulkPricing: [
                      ...currentBulkPricing,
                      {
                        id: Date.now() + Math.random(), // Unique ID
                        wholesalePrice: "", 
                        quantity: ""
                      }
                    ]
                  }
                }
              };
            });
          }}>
            Add tier
          </button>
          
          {/* Display bulk pricing specific to this variant/size combination */}
          {(() => {
            const currentBulkPricing = stateVariableToReviseRateForSingleProductWithVariants?.[variant._id]?.[details._id]?.bulkPricing || [];
            
            return currentBulkPricing.length === 0 ? (
              <span>No pricing section added</span>
            ) : (
              currentBulkPricing.map((tier, index) => {
                return (
                  <div key={tier.id}>
                    <label>Wholesale Price</label>
                    <input 
                      type="text" 
                      value={tier.wholesalePrice} 
                      onChange={(e) => {
                        setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                          const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                          
                          return {
                            ...prev,
                            [variant._id]: {
                              ...prev[variant._id],
                              [details._id]: {
                                ...(prev[variant._id]?.[details._id] || {}),
                                bulkPricing: currentBulkPricing.map(t => 
                                  t.id === tier.id ? { ...t, wholesalePrice: e.target.value } : t
                                )
                              }
                            }
                          };
                        });
                      }} 
                    />

                    <label>Quantity</label>
                    <input 
                      type="text" 
                      value={tier.quantity} 
                      onChange={(e) => {
                        setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                          const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                          
                          return {
                            ...prev,
                            [variant._id]: {
                              ...prev[variant._id],
                              [details._id]: {
                                ...(prev[variant._id]?.[details._id] || {}),
                                bulkPricing: currentBulkPricing.map(t => 
                                  t.id === tier.id ? { ...t, quantity: e.target.value } : t
                                )
                              }
                            }
                          };
                        });
                      }} 
                    />

                    <button onClick={() => {
                      setStateVariableToReviseRateForSingleProductWithVariants(prev => {
                        const currentBulkPricing = prev?.[variant._id]?.[details._id]?.bulkPricing || [];
                        
                        return {
                          ...prev,
                          [variant._id]: {
                            ...prev[variant._id],
                            [details._id]: {
                              ...(prev[variant._id]?.[details._id] || {}),
                              bulkPricing: currentBulkPricing.filter(t => t.id !== tier.id)
                            }
                          }
                        };
                      });
                    }}>
                      Delete
                    </button>
                  </div>
                );
              })
            );
          })()}
        </div>
      </div>)
    })}
  </div>
})}
                {/* <button onClick={() => {setDataForSingleProductWithVariants(product)}}>stock</button> */}
              </div>) 
              : 
              ( <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">Current Price: {product.price}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter discounted price
                  </label>
                  <p>
                        Enter discounted price
                      </p>
                       <input 
  type="text" 
  value={revisedRateTextfield} 
  onChange={(e) => {
    // setMultipleProductsForRevisedRate(prev => ({
    //   ...prev,
    //   [product._id]: {
    //     ...prev[product._id],
    //     price: e.target.value
    //   }
    // }));


    // setMultipleProductsForRevisedRate(prev => ({
    //   ...prev,
    //   [product._id]: {
    //     ...prev[product._id],
    //     discountPrice: e.target.value
    //   }
    // }));

    setRevisedRateTextfield(e.target.value)
  }}
/>
<p>Discount start date</p>
<input 
  type="datetime-local" 
  name="" 
  id="" 
  value={discountStartDate || ""}
  onChange={(e) => {
  setDiscountStartDate(e.target.value);
    // setMultipleProductsForRevisedRate(prev => ({
    //   ...prev,
    //   [product._id]: {
    //     ...prev[product._id],
    //     "discountStartDate": e.target.value
    //   }
    // }));
  }}
/>              

<p>Discount end date</p>
<input 
  type="datetime-local" 
  name="" 
  id="" 
  value={discountEndDate || ""}
  onChange={(e) => {
    // setMultipleProductsForRevisedRate(prev => ({
    //   ...prev,
    //   [product._id]: {
    //     ...prev[product._id],
    //     "discountEndDate": e.target.value
    //   }
    // }));
    setDiscountEndDate(e.target.value);
  }}
/> 

<p>Update to original price after end date?</p>
<select 
  name="" 
  id=""
  value={comeBackToOriginalPrice || ""}
  onChange={(e) => {
    // setMultipleProductsForRevisedRate(prev => ({
    //   ...prev,
    //   [product._id]: {
    //     ...prev[product._id],
    //     "comeBackToOriginalPrice": e.target.value
    //   }
    // }));
    setComeBackToOriginalPrice(e.target.value)
  }}
>
  <option value="">Select option</option>
  <option value="yes">Yes</option>
  <option value="no">No</option>
</select> 
{/* DISCOUNT BULK PRICING SECTION FOR NON-VARIANTS */}
<button onClick={() => {
  setSingleProductDiscountBulkPricing(prev => [
    ...prev,
    {id: Date.now(), wholesalePrice: "", quantity: ""}
  ]);
}}>
  Add Tier
</button>

{singleProductDiscountBulkPricing.length === 0 ? (<p>Nothing</p>) : (
  singleProductDiscountBulkPricing.map((tier, index) => {
    return (<div key={index}>
    Whole sale price<input type="text" name="" id="" value={tier.wholesalePrice} onChange={
(e) => {
  setSingleProductDiscountBulkPricing(prev => 
    prev.map(t => 
      t.id === tier.id ? {...t, wholesalePrice: e.target.value} : t
    )
  )
}
    }/>
    Quantity<input type="text" name="" id="" value={tier.quantity} onChange={
      (e) => {
        setSingleProductDiscountBulkPricing(prev => 
          prev.map(t => 
            t.id === tier.id ? {...t,quantity: e.target.value} : t
          )
        )
      }
    }/>
    <button onClick={
      () => {
        setSingleProductDiscountBulkPricing(prev => 
        prev.filter(t =>
          t.id !== tier.id
        )
      )
      }
    }>
      Delete
    </button>
  </div>);
  })
  
)}
                    {/* End of bulk pricig section for witout variants */}
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
                onClick={handleUpdateRevisedRate}
                // disabled={!isValidStock}
                // className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                //   isValidStock
                //     ? "bg-blue-600 text-white hover:bg-blue-700"
                //     : "bg-gray-300 text-gray-500 cursor-not-allowed"
                // }`}
              >
                Revise rate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    // End of jsx for showing the modal where user can restock single product with and without stock
  };
  // End of revised rate component

  // Start of table
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
              <button className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm font-medium transition-colors" onClick={() => {
                console.log("Hello bulk actions for revised rates")
                setShowRevisedRateModal(true)
              }}>
                Add Revised Rate
              </button>
              <button
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                onClick={() => {
                  console.log("Helo bulk actions for restock")
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
                        <button className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-xs font-medium transition-colors" onClick={() => {
                        setRevisedRateProduct(product);
                        setShowRevisedRateModal(true)
                        }}>
                          Add Revised Rate
                        </button>
                        <button
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1" 
                          onClick={() => {
                            setRestockProduct(product);
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

      {showRestockModal && (selectedProducts.length > 0 ? <RestockModal selectedProducts={selectedProducts} multipleToRestockInitial={multipleProductsToRestock} onClose={() => setShowRestockModal(false)} /> : <RestockModal
          product={restockProduct}
          onClose={() => setShowRestockModal(false)}
        />)}
    {showRevisedRateModal && (selectedProducts.length > 0 ? <RevisedRateModal selectedProducts={selectedProducts} multipleForRevisedRateInitial={multipleProductsForRevisedRate} onClose={() => setShowRevisedRateModal(false)} /> : <RevisedRateModal
          product={RevisedRateProduct}
          onClose={() => setShowRevisedRateModal(false)}
        />)}
    </div>

  );
  // End of table
}