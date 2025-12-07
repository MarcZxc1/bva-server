import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

console.log("📦 [PRODUCT ROUTES FILE] Loading product.routes.ts...");

const router = Router();

console.log("[PRODUCT ROUTES] Router created, type:", typeof router, "stack length:", (router as any).stack?.length);

// Get all products (public - for buyer landing page)
router.get("/", (req, res) => {
  console.log("[PRODUCT ROUTE] GET / hit - calling getAllProducts");
  try {
    productController.getAllProducts(req, res);
  } catch (error) {
    console.error("[PRODUCT ROUTE] Error calling getAllProducts:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

console.log("[PRODUCT ROUTES] After GET /, stack length:", (router as any).stack?.length);

// Get product by ID (public)
router.get("/:id", productController.getProductById);

// Get all products for a shop (protected)
router.get(
  "/shop/:shopId",
  authMiddleware,
  productController.getProductsByShop
);

// Create product (protected - seller only)
router.post("/", (req, res, next) => {
  console.log("[PRODUCT ROUTE] POST /api/products hit");
  console.log("[PRODUCT ROUTE] Headers:", req.headers);
  authMiddleware(req, res, next);
}, productController.createProduct);

// Update product (protected - seller only)
router.put("/:id", authMiddleware, productController.updateProduct);

// Delete product (protected - seller only)
router.delete("/:id", authMiddleware, productController.deleteProduct);

export default router;
