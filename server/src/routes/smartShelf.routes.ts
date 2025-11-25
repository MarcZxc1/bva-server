import { Router } from "express";
import * as smartShelfController from "../controllers/smartShelf.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/smart-shelf/:shopId/at-risk
router.get(
  "/:shopId/at-risk",
  authMiddleware,
  smartShelfController.getAtRiskInventory
);

export default router;
