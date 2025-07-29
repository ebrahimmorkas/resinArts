const Product = require("../models/Product")
const fs = require("fs")
const path = require("path")

const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      category,
      categoryPath,
      details,
      colorVariants,
      sizeVariants,
      pricingSections,
      basePriceRanges,
    } = req.body

    // Parse JSON fields
    const parsedDetails = details ? JSON.parse(details) : []
    const parsedColorVariants = colorVariants ? JSON.parse(colorVariants) : []
    const parsedSizeVariants = sizeVariants ? JSON.parse(sizeVariants) : []
    const parsedPricingSections = pricingSections ? JSON.parse(pricingSections) : []
    const parsedBasePriceRanges = basePriceRanges ? JSON.parse(basePriceRanges) : []

    // Validate required fields
    if (!name || !stock || !category) {
      return res.status(400).json({ error: "Product name, stock, and category are required" })
    }
    if (isNaN(stock) || Number.parseFloat(stock) < 0) {
      return res.status(400).json({ error: "Stock must be a valid non-negative number" })
    }

    // Validate price inputs
    const hasBasePrice = price && price !== "" && !isNaN(price) && Number.parseFloat(price) >= 0
    const hasColorPrices = parsedColorVariants.some(
      (v) => v.price && v.price !== "" && !isNaN(v.price) && Number.parseFloat(v.price) >= 0,
    )
    const hasSizePrices = parsedSizeVariants.some(
      (v) => v.price && v.price !== "" && !isNaN(v.price) && Number.parseFloat(v.price) >= 0,
    )
    const hasPricingSections = parsedPricingSections.some(
      (s) =>
        s.priceRanges &&
        s.priceRanges.some(
          (r) =>
            r.retailPrice && r.retailPrice !== "" && !isNaN(r.retailPrice) && Number.parseFloat(r.retailPrice) >= 0,
        ),
    )

    const activePriceMethods = [hasBasePrice, hasColorPrices, hasSizePrices, hasPricingSections].filter(Boolean).length

    if (activePriceMethods === 0) {
      return res
        .status(400)
        .json({ error: "At least one price (base, color variant, size variant, or pricing combination) is required" })
    }
    if (activePriceMethods > 1) {
      return res
        .status(400)
        .json({ error: "Only one pricing method (base, color variant, size variant, or combination) can be set." })
    }

    // Validate price ranges
    const validatePriceRanges = (ranges, context) => {
      if (!ranges || ranges.length === 0) return

      ranges.forEach((range, index) => {
        const retailPrice = Number.parseFloat(range.retailPrice)
        const wholesalePrice = Number.parseFloat(range.wholesalePrice)
        const thresholdQuantity = Number.parseInt(range.thresholdQuantity)

        if (range.retailPrice || range.wholesalePrice || range.thresholdQuantity) {
          if (isNaN(retailPrice) || retailPrice < 0) {
            throw new Error(`Invalid Retail Price in price range ${index + 1} in ${context}`)
          }
          if (isNaN(wholesalePrice) || wholesalePrice < 0) {
            throw new Error(`Invalid Wholesale Price in price range ${index + 1} in ${context}`)
          }
          if (isNaN(thresholdQuantity) || thresholdQuantity < 1) {
            throw new Error(`Invalid Threshold Quantity in price range ${index + 1} in ${context}`)
          }

          if (wholesalePrice > retailPrice) {
            throw new Error(
              `Wholesale price cannot be greater than retail price in price range ${index + 1} in ${context}`,
            )
          }

          if (index > 0) {
            const prevThreshold = Number.parseInt(ranges[index - 1].thresholdQuantity)
            if (thresholdQuantity <= prevThreshold) {
              throw new Error(
                `Threshold quantity must be greater than the previous range's threshold in price range ${index + 1} in ${context}`,
              )
            }
          }
        }
      })
    }

    if (hasBasePrice && parsedBasePriceRanges.length > 0) {
      if (Number.parseFloat(parsedBasePriceRanges[0].retailPrice) !== Number.parseFloat(price)) {
        return res.status(400).json({ error: "Base price must equal the retail price in the first base price range" })
      }
    }
    validatePriceRanges(parsedBasePriceRanges, "base price ranges")

    parsedColorVariants.forEach((variant, index) => {
      if (variant.price && variant.priceRanges && variant.priceRanges.length > 0) {
        if (Number.parseFloat(variant.priceRanges[0].retailPrice) !== Number.parseFloat(variant.price)) {
          throw new Error(`Color variant ${index + 1} price must equal the retail price in its first price range`)
        }
      }
      validatePriceRanges(variant.priceRanges, `color variant ${index + 1}`)
    })

    parsedSizeVariants.forEach((variant, index) => {
      if (variant.price && variant.priceRanges && variant.priceRanges.length > 0) {
        if (Number.parseFloat(variant.priceRanges[0].retailPrice) !== Number.parseFloat(variant.price)) {
          throw new Error(`Size variant ${index + 1} price must equal the retail price in its first price range`)
        }
      }
      validatePriceRanges(variant.priceRanges, `size variant ${index + 1}`)
    })

    parsedPricingSections.forEach((section, index) => {
      validatePriceRanges(section.priceRanges, `pricing combination ${index + 1}`)
    })

    // Handle file uploads for color variants
    const imageUrls = []
    if (req.files && req.files.colorImages) {
      const files = Array.isArray(req.files.colorImages) ? req.files.colorImages : [req.files.colorImages]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadDir = path.join(__dirname, "../uploads/ProductImages")
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const fileExtension = path.extname(file.name)
        const fileName = `product-${uniqueSuffix}${fileExtension}`
        const filePath = path.join(uploadDir, fileName)
        await file.mv(filePath)
        imageUrls.push(`/Uploads/ProductImages/${fileName}`)
      }
    }

    // Assign image URLs to color variants
    parsedColorVariants.forEach((variant, index) => {
      if (imageUrls[index]) {
        variant.imageUrl = imageUrls[index]
      }
    })

    // Validate size variants
    const useDimensions = parsedSizeVariants.some((v) => v.useDimensions)
    const useDropdown = parsedSizeVariants.some((v) => !v.useDimensions && v.size)
    if (useDimensions && useDropdown) {
      return res.status(400).json({ error: "All size variants must use either dimensions or dropdown sizes, not both" })
    }
    parsedSizeVariants.forEach((variant, index) => {
      if (useDimensions) {
        if (!variant.length || !variant.breadth || !variant.height) {
          throw new Error(`Length, Breadth, and Height are required for size variant ${index + 1}`)
        }
      } else if (!variant.size) {
        throw new Error(`Size is required for size variant ${index + 1}`)
      }
      if (variant.forAllColors === "no" && (!variant.availableColors || variant.availableColors.length === 0)) {
        throw new Error(
          `At least one color must be selected for size variant ${index + 1} if not available for all colors`,
        )
      }
    })
    parsedColorVariants.forEach((variant, index) => {
      if (!variant.color) {
        throw new Error(`Color is required for color variant ${index + 1}`)
      }
      if (variant.forAllSizes === "no" && (!variant.availableSizes || variant.availableSizes.length === 0)) {
        throw new Error(
          `At least one size must be selected for color variant ${index + 1} if not available for all sizes`,
        )
      }
    })

    // Prepare product data
    const productData = {
      name,
      price: hasBasePrice ? Number.parseFloat(price) : undefined,
      stock: Number.parseInt(stock),
      category,
      categoryPath: categoryPath ? JSON.parse(categoryPath) : [],
      details: parsedDetails,
      colorVariants: parsedColorVariants,
      sizeVariants: parsedSizeVariants,
      pricingSections: parsedPricingSections,
      basePriceRanges: parsedBasePriceRanges,
    }

    // Save product to database
    const newProduct = new Product(productData)
    await newProduct.save()
    res.status(201).json({ message: "Product added successfully", product: newProduct })
  } catch (error) {
    console.error("Error adding product:", error)
    res.status(500).json({ error: error.message || "Internal server error" })
  }
}

module.exports = { addProduct }