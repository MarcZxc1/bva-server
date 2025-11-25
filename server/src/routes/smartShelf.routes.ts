import { Router } from "express";
import * as smartShelfController from "../controllers/smartShelf.controller";
import { authenticate } from "../middlewares/auth.middleware"; // Assuming you have auth middleware

const router = Router();

// GET /api/smart-shelf/:shopId/at-risk
router.get(
  "/:shopId/at-risk",
  authenticate,
  smartShelfController.getAtRiskInventory
);

export default router;
