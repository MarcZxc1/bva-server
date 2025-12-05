import { Router, Request, Response } from "express";
import * as reportsController from "../controllers/reports.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Base route - list available endpoints
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Reports API - Available endpoints",
    endpoints: {
      metrics: {
        path: "/api/reports/metrics",
        method: "GET",
        description: "Get dashboard metrics (total revenue, profit margin, stock turnover)",
        auth: true
      },
      salesSummary: {
        path: "/api/reports/sales-summary",
        method: "GET",
        description: "Get sales summary data for charts",
        auth: true
      }
    }
  });
});

router.get("/metrics", authMiddleware, reportsController.getDashboardMetrics);
router.get("/sales-summary", authMiddleware, reportsController.getSalesSummary);

export default router;
