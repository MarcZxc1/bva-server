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
        auth: true,
        queryParams: ["start", "end", "interval"]
      },
      profitAnalysis: {
        path: "/api/reports/profit-analysis",
        method: "GET",
        description: "Get profit analysis (revenue, COGS, profit, profit margin)",
        auth: true,
        queryParams: ["start", "end"]
      },
      platformComparison: {
        path: "/api/reports/platform-comparison",
        method: "GET",
        description: "Get platform comparison statistics",
        auth: true,
        queryParams: ["start", "end"]
      }
    }
  });
});

router.get("/metrics", authMiddleware, reportsController.getDashboardMetrics);
router.get("/sales-summary", authMiddleware, reportsController.getSalesSummary);
router.get("/profit-analysis", authMiddleware, reportsController.getProfitAnalysis);
router.get("/platform-comparison", authMiddleware, reportsController.getPlatformComparison);

export default router;
