const express = require("express")
const router = express.Router()
const { addProduct, fetchProducts, restock } = require("../controllers/productController")
const authenticate = require("../middlewares/authenticate") // Assuming these exist
const authorize = require("../middlewares/authorize") // Assuming these exist
const productController = require("../controllers/productController")

// Route to add a new product
// This route will be protected by authentication and authorization middleware
router.post("/add", authenticate, authorize(["admin"]), addProduct)
router.get("/all", authenticate, authorize(['admin', 'user']), fetchProducts);
router.post("/restock", authenticate, authorize(['admin']), restock)

module.exports = router
