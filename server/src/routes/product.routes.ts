import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Get all products (public - for buyer landing page)
router.get("/", productController.getAllProducts);

// Get all products for the authenticated user (from all accessible shops)
router.get("/user/all", authMiddleware, productController.getUserProducts);

// Get product by ID (public)
router.get("/:id", productController.getProductById);

// Public integration endpoint for BVA (no auth required)
// GET /api/products/shop/:shopId -> Returns list of products for a shop
router.get("/shop/:shopId", productController.getProductsByShopPublic);

// Get all products for a shop (protected - for authenticated users)
router.get(
  "/shop/:shopId/private",
  authMiddleware,
  productController.getProductsByShop
);

// Create product (protected - seller only)
router.post("/", authMiddleware, productController.createProduct);

// Update product (protected - seller only)
router.put("/:id", authMiddleware, productController.updateProduct);

// Delete product (protected - seller only)
router.delete("/:id", authMiddleware, productController.deleteProduct);

export default router;
