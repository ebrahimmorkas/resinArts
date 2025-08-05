const express = require("express")
const router = express.Router()
const { addProduct } = require("../controllers/productController")
const authenticate = require("../middlewares/authenticate") // Assuming these exist
const authorize = require("../middlewares/authorize") // Assuming these exist

// Route to add a new product
// This route will be protected by authentication and authorization middleware
router.post("/add", authenticate, authorize(["admin"]), addProduct)

module.exports = router
