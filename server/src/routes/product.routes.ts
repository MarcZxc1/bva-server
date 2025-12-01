import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Get all products for a shop
router.get("/shop/:shopId", authenticate, productController.getProductsByShop);

export default router;
