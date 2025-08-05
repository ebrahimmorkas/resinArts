const Product = require("../models/Product")
const { cloudinary } = require("../utils/cloudinary")
const multer = require("multer")

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

// Export addProduct with upload.any() middleware directly
module.exports = {
  addProduct: [upload.any(), addProduct],
}
