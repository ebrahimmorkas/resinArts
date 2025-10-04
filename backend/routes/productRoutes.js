const express = require("express")
const router = express.Router()
const { addProduct, fetchProducts, restock, massRestock, massRevisedRate, revisedRate, upload, bulkUploadProducts, deleteProduct, editProduct, getProductById } = require("../controllers/productController")
const authenticate = require("../middlewares/authenticate")
const authorize = require("../middlewares/authorize")
const productController = require("../controllers/productController")

// PUBLIC ROUTES - No authentication required
router.get("/all", fetchProducts); // Now accessible to guest users

// ADMIN ONLY ROUTES - Authentication + Authorization required
router.post("/add", authenticate, authorize(["admin"]), addProduct)
router.post("/mass-restock", authenticate, authorize(['admin']), massRestock);
router.post("/restock", authenticate, authorize(['admin']), restock);
router.post("/mass-revised-rate", authenticate, authorize(['admin']), massRevisedRate);
router.post("/revised-rate", authenticate, authorize(['admin']), revisedRate);
router.post("/bulk-upload", authenticate, authorize(['admin']), upload.fields([
  { name: 'excelFile', maxCount: 1 },
  { name: 'imagesZip', maxCount: 1 }
]), bulkUploadProducts);
router.delete("/delete-product/:id", authenticate, authorize(['admin']), deleteProduct)
router.put('/edit-product/:id', authenticate, authorize(['admin']), upload.any(), editProduct);
router.get('/:id', authenticate, authorize(['admin']), getProductById);

module.exports = router