import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // In a real app, we would filter by shopId from the authenticated user
    // const shopId = req.user.shopId;

    // Calculate Total Revenue
    const sales = await prisma.sale.findMany();
    const totalRevenue = sales.reduce((acc: number, sale) => acc + sale.total, 0);

    // Calculate Profit Margin (Simplified: Revenue - Cost) / Revenue
    // We need to fetch products to get the cost.
    // This is an approximation. In a real system, we'd store cost at the time of sale.
    const products = await prisma.product.findMany();
    const productCostMap = new Map(products.map((p) => [p.id, p.cost || 0]));

    let totalCost = 0;
    for (const sale of sales) {
      const items = sale.items as any[]; // Assuming items is an array of { productId, quantity }
      if (Array.isArray(items)) {
        for (const item of items) {
          const cost = (productCostMap.get(item.productId) as number) || 0;
          totalCost += cost * (item.quantity || 1);
        }
      }
    }

    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    // Calculate Stock Turnover (COGS / Average Inventory)
    // Simplified: Total Cost / (Current Inventory Value)
    const inventory = await prisma.inventory.findMany({
      include: { product: true }
    });
    
    const currentInventoryValue = inventory.reduce((acc: number, inv) => {
      return acc + (inv.product.cost || 0) * inv.quantity;
    }, 0);

    const stockTurnover = currentInventoryValue > 0 ? totalCost / currentInventoryValue : 0;

    res.json({
      totalRevenue,
      profitMargin,
      stockTurnover,
      currency: "PHP"
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};

export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    // Mock data for the chart since we might not have enough historical data
    const summary = [
      { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
      { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
    ];
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
};
