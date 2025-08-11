const { default: mongoose } = require("mongoose")
const Product = require("../models/Product")
const { cloudinary } = require("../utils/cloudinary")
const multer = require("multer")
const e = require("express")

// Configure multer for in-memory storage to handle file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Helper function to upload a single image to Cloudinary
const uploadImageToCloudinary = async (fileBuffer, folder) => {
  if (!fileBuffer) return null

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: folder }, (error, result) => {
      if (error) reject(error)
      else resolve(result.secure_url)
    })
    uploadStream.end(fileBuffer)
  })
}

const addProduct = async (req, res) => {
  try {
    // Parse JSON fields from FormData
    const productData = JSON.parse(req.body.productData)
    const {
      name,
      mainCategory,
      subCategory,
      categoryPath,
      productDetails,
      stock,
      price,
      bulkPricing,
      hasVariants,
      variants,
    } = productData

    // Map uploaded files by their fieldname for easier access
    const uploadedFiles = {}
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (!uploadedFiles[file.fieldname]) {
          uploadedFiles[file.fieldname] = []
        }
        uploadedFiles[file.fieldname].push(file)
      })
    }

    // Handle main product image upload
    let imageUrl = null
    const mainImageFile = uploadedFiles["image"]?.[0]
    if (mainImageFile) {
      imageUrl = await uploadImageToCloudinary(mainImageFile.buffer, "products")
    }

    // Handle additional images for basic product
    const additionalImagesUrls = []
    const basicAdditionalImages = uploadedFiles["additionalImages"]
    if (basicAdditionalImages && basicAdditionalImages.length > 0) {
      for (const file of basicAdditionalImages) {
        const url = await uploadImageToCloudinary(file.buffer, "products/additional")
        if (url) additionalImagesUrls.push(url)
      }
    }

    // Prepare basic product data
    const newProductData = {
      name,
      mainCategory,
      subCategory,
      categoryPath,
      productDetails: productDetails || [],
      stock: hasVariants ? undefined : stock, // Only include if no variants
      price: hasVariants ? undefined : price, // Only include if no variants
      image: hasVariants ? undefined : imageUrl, // Only include if no variants
      additionalImages: hasVariants ? [] : additionalImagesUrls, // Only include if no variants
      bulkPricing: hasVariants ? [] : bulkPricing, // Only include if no variants
      hasVariants,
    }

    // Process variants if they exist
    if (hasVariants && variants && variants.length > 0) {
      let defaultVariantFound = false
      newProductData.variants = await Promise.all(
        variants.map(async (variant, variantIndex) => {
          // Handle variant image
          let variantImageUrl = null
          const variantImageFile = uploadedFiles[`variants[${variantIndex}].variantImage`]?.[0]
          if (variantImageFile) {
            variantImageUrl = await uploadImageToCloudinary(variantImageFile.buffer, "products/variants")
          }

          // Process 'moreDetails' sections (now 'size' instances) within each variant
          const processedMoreDetails = await Promise.all(
            variant.moreDetails.map(async (md, mdIndex) => {
              const mdAdditionalImagesUrls = []
              // Always check for files, regardless of reuse flag.
              // If reuse was selected on frontend, the file object was copied.
              const mdAdditionalImagesFiles =
                uploadedFiles[`variants[${variantIndex}].moreDetails[${mdIndex}].additionalImages`]
              if (mdAdditionalImagesFiles && mdAdditionalImagesFiles.length > 0) {
                for (const file of mdAdditionalImagesFiles) {
                  const url = await uploadImageToCloudinary(file.buffer, "products/variants/more-details")
                  if (url) mdAdditionalImagesUrls.push(url)
                }
              }

              // Explicitly process size fields: convert to Number or null if empty string
              const processedSize = {
                length: md.size.length !== "" ? Number(md.size.length) : null,
                breadth: md.size.breadth !== "" ? Number(md.size.breadth) : null,
                height: md.size.height !== "" ? Number(md.size.height) : null,
                unit: md.size.unit !== "" ? md.size.unit : null, // Also handle unit as null if empty
              }

              // Process optional details: if reusing, use the array directly from productData
              const processedOptionalDetails =
                md.reuseOptionalDetails === "yes" && md.optionalDetails
                  ? md.optionalDetails
                  : md.optionalDetails.filter((od) => od.key && od.value)

              return {
                ...md,
                additionalImages: mdAdditionalImagesUrls, // Use the URLs from uploaded files
                optionalDetails: processedOptionalDetails, // Use processed optional details
                size: processedSize, // Use the processed size object
              }
            }),
          )

          // Validate and set default variant
          if (variant.isDefault) {
            if (defaultVariantFound) {
              // If another default was already found, this is an error or needs to be unset
              return res.status(400).json({ error: "Only one product variant can be set as default." })
            }
            defaultVariantFound = true
          }

          return {
            ...variant,
            variantImage: variantImageUrl,
            moreDetails: processedMoreDetails,
          }
        }),
      )
    }

    const newProduct = new Product(newProductData)
    const savedProduct = await newProduct.save()

    res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

const fetchProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({
      products
    });
  } catch (err) {
    console.log("Error in fetching the products");
    return res.status(500).json({message: 'Internal server error'});
  }
}

// Function that will restock products that are single. (Both condition that is variants and non-variant product will be handled over here)
const restock = async (req, res) => {
  console.log("Request received")
  try {
    const { productId, updatedStock, productData } = req.body;

    if(Object.keys(productData).length === 0) {
      console.log("Request received for product without variants")
// The product does not have any variants
    // Validate input
    if (!productId || typeof updatedStock !== "number") {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Calculate new stock
    const newStock = product.stock + updatedStock;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { stock: newStock } },
      { new: true }
    );

    return res.status(200).json({
      message: "Stock updated successfully",
      product: updatedProduct
    });
  } else {
    // The product have variants
    console.log("Request received for product with variants")
    const product = await Product.findById(productId)
    if(!product) {
      return res.status(400).json({message: "Product not found"});
    }

    console.log(productData)
    Object.entries(productData).forEach(([variantID, variantData]) => {
      console.log(variantID)
      console.log(variantData)

      Object.entries(variantData).forEach(([detailsID, detailsData]) => {
        console.log(detailsID)
        console.log(detailsData)

        Object.entries(detailsData).forEach(([sizeID, stockData]) => {
          console.log(sizeID)
          console.log(stockData)
          const s_id = new mongoose.Types.ObjectId(sizeID);
          if(stockData === "") {
              // console.log("Empty data")

              // Nothing has been filled in stock field
            } else {
              // console.log("Heres some data");

              // Theere some data in stock field
              // Implement update logic
              product.variants.forEach((variant) => {
                variant.moreDetails.forEach(async (details) => {
                  if(details.size._id.toString() === s_id.toString()) {
                    console.log("IDs matched")
                    console.log(details.stock)
                    const oldStock = parseInt(details.stock);
                    const newStock = parseInt(stockData);
                    const updatedStock = oldStock + newStock;
                    try {
                    const updatedProduct = await Product.updateOne(
                      {_id: product._id},
                      { $set: {
                        "variants.$[v].moreDetails.$[md].stock": updatedStock,
                        "variants.$[v].moreDetails.$[md].lastRestockedAt": new Date()
                      } },
                      {
                        arrayFilters: [
                          {"v._id": variantID},
                          {"md._id": detailsID}
                        ]
                      }
                    )
                    return res.status(200).json({message: "Product Updated successfully"});
                  } catch(error) {
                    return res.status(500).json({message: "There was problem while updating data"})
                  }
                  } else {
                    console.log('IDs mismatch');
                    console.log(details.size._id)
                    console.log(typeof(details.size._id))
                    console.log(s_id)
                    console.log(typeof(s_id))
                  }
                })
                // console.log(variant)
              })
            }
        });
      })
    })
  }

  } catch (error) {
    console.error("Restock error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Start of function to mass restock
const massRestock = (req, res) => {
  // console.log(req.body);
  const data = req.body;
  // console.log(typeof(data));
  try{
    Object.entries(data).forEach(async ([productID, productData]) => {
      console.log(productID);
      console.log("Product data starts here")
      console.log(productData);
      console.log("Product data ends here")
      console.log(typeof(productData))

      const product = await Product.findById(productID);
      if(product) {
      if(product.hasVariants) {
        const p_id = new mongoose.Types.ObjectId(productID);
        Object.entries(productData).forEach(([variantID, variantData]) => {
          const v_id = new mongoose.Types.ObjectId(variantID);
          console.log("Variant data starts here")
          console.log(variantData);
          console.log("Variant data ends here")

          Object.entries(variantData).forEach(([detailsID, detailsData]) => {
            const details_id = new mongoose.Types.ObjectId(detailsID);
            console.log("details data starts here")
            console.log(detailsData)
            console.log(typeof(detailsData))
            console.log("details data ends here")

            Object.entries(detailsData).forEach(([sizeID, stockData]) => {
              const s_id = new mongoose.Types.ObjectId(sizeID);
              console.log("Stock data starts here")
              console.log(stockData);
              console.log(typeof(stockData));
              console.log("Stock data ends here")
               if(stockData === "") {
              // console.log("Empty data")

              // Nothing has been filled in stock field
            } else {
              // console.log("Heres some data");

              // Theere some data in stock field
              // Implement update logic
              product.variants.forEach((variant) => {
                variant.moreDetails.forEach(async (details) => {
                  if(details.size._id.toString() === s_id.toString()) {
                    console.log("IDs matched")
                    console.log(details.stock)
                    const oldStock = parseInt(details.stock);
                    const newStock = parseInt(stockData);
                    const updatedStock = oldStock + newStock;
                    try {
                    const updatedProduct = await Product.updateOne(
                      {_id: product._id},
                      { $set: {
                        "variants.$[v].moreDetails.$[md].stock": updatedStock,
                        "variants.$[v].moreDetails.$[md].lastRestockedAt": new Date()
                      } },
                      {
                        arrayFilters: [
                          {"v._id": variantID},
                          {"md._id": detailsID}
                        ]
                      }
                    )

                    // return res.status(200).json({message: "Product updated successfully"})
                  } catch(error) {
                    return res.status(500).json({message: "There was problem while updating data"})
                  }
                  } else {
                    console.log('IDs mismatch');
                    console.log(details.size._id)
                    console.log(typeof(details.size._id))
                    console.log(s_id)
                    console.log(typeof(s_id))
                  }
                })
                // console.log(variant)
              })
            }
            })
            

           
          })
        })
      } else {
        // Product does not have any variants
          console.log(productData)
          console.log(typeof(productData))
          Object.values(productData).forEach(async (stock) => {
            console.log(stock);
            try {
            const updatedStock = parseInt(product.stock) + parseInt(stock);
            const updatedProduct = await Product.findByIdAndUpdate(
      productID,
      { $set: { stock: updatedStock,
        lastRestockedAt: new Date()
       } },
      { new: true }
    );
  } catch(error) {
    return res.status(500).json({message: "Could not update product"})
  }
          })
      }
      }else {
        console.log(`Product not found for ID: ${productID}`);
      }
    })
  } catch(error) {
    console.log(error);
  }
}
// End of function to mass restock

// Start of function for revising rate for multiple products
const massRevisedRate = (req, res) => {
  // console.log(req.body);
  const data = req.body;
  // console.log(typeof(data));
  try{
    Object.entries(data).forEach(async ([productID, productData]) => {
      console.log(productID);
      console.log("Product data starts here")
      console.log(productData);
      console.log("Product data ends here")
      console.log(typeof(productData))

      const product = await Product.findById(productID);
      if(product) {
      if(product.hasVariants) {
        const p_id = new mongoose.Types.ObjectId(productID);
        Object.entries(productData).forEach(([variantID, variantData]) => {
          const v_id = new mongoose.Types.ObjectId(variantID);
          console.log("Variant data starts here")
          console.log(variantData);
          console.log("Variant data ends here")

          Object.entries(variantData).forEach(([detailsID, detailsData]) => {
            const details_id = new mongoose.Types.ObjectId(detailsID);
            console.log("details data starts here")
            console.log(detailsData)
            console.log(typeof(detailsData))
            console.log("details data ends here")

            Object.entries(detailsData).forEach(([sizeID, priceData]) => {
              const s_id = new mongoose.Types.ObjectId(sizeID);
              console.log("Price data starts here")
              console.log(priceData);
              console.log(typeof(priceData));
              console.log("Price data ends here")
               if(priceData === "") {
              // console.log("Empty data")

              // Nothing has been filled in stock field
            } else {
              // console.log("Heres some data");

              // Theere some data in stock field
              // Implement update logic
              product.variants.forEach((variant) => {
                variant.moreDetails.forEach(async (details) => {
                  if(details.size._id.toString() === s_id.toString()) {
                    console.log("IDs matched")
                    console.log(details.price)
                    const oldPrice = parseInt(details.price);
                    const newPrice = parseInt(priceData);
                    const updatedPrice = oldPrice + newPrice;
                    try {
                    const updatedProduct = await Product.updateOne(
                      {_id: product._id},
                      { $set: {
                        "variants.$[v].moreDetails.$[md].price": updatedPrice,
                        "variants.$[v].moreDetails.$[md].discountStartDate": new Date(),
                        "variants.$[v].moreDetails.$[md].discountEndDate": new Date(),
                        "variants.$[v].moreDetails.$[md].discountPrice": updatedPrice
                      } },
                      {
                        arrayFilters: [
                          {"v._id": variantID},
                          {"md._id": detailsID}
                        ]
                      }
                    )

                    // return res.status(200).json({message: "Product updated successfully"})
                  } catch(error) {
                    return res.status(500).json({message: "There was problem while updating data"})
                  }
                  } else {
                    console.log('IDs mismatch');
                    console.log(details.size._id)
                    console.log(typeof(details.size._id))
                    console.log(s_id)
                    console.log(typeof(s_id))
                  }
                })
                // console.log(variant)
              })
            }
            })
            

           
          })
        })
      } else {
        // Product does not have any variants
          console.log(productData)
          console.log(typeof(productData))
          Object.values(productData).forEach(async (price) => {
            console.log(price);
            try {
            const updatedPrice = parseInt(product.price) + parseInt(price);
            const updatedProduct = await Product.findByIdAndUpdate(
      productID,
      { $set: { stock: updatedPrice,
        discountStartDate: new Date(),
        discountEndDate: new Date(),
        discountPrice: updatedPrice
       } },
      { new: true }
    );
  } catch(error) {
    return res.status(500).json({message: "Could not update product"})
  }
          })
      }
      }else {
        console.log(`Product not found for ID: ${productID}`);
      }
    })
  } catch(error) {
    console.log(error);
  }
}
// End of function for revising rate for multiple products


// Export addProduct with upload.any() middleware directly
module.exports = {
  addProduct: [upload.any(), addProduct],
  fetchProducts,
  restock,
  massRestock,
  massRevisedRate
}
