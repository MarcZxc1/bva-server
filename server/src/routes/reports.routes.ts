import { Router } from "express";
import * as reportsController from "../controllers/reports.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/metrics", authMiddleware, reportsController.getDashboardMetrics);
router.get("/sales-summary", authMiddleware, reportsController.getSalesSummary);

export default router;
