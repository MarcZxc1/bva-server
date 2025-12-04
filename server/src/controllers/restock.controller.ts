import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { MLRestockRequest, MLRestockResponse, MLProductInput } from "../types/ml.types";

/**
 * POST /api/ai/restock-strategy
 * Calculate optimal restocking strategy based on budget and goal
 */
export async function getRestockStrategy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { shopId, budget, goal, restockDays } = req.body;

    // 1. Validation
    if (!shopId || !budget || !goal) {
      res.status(400).json({
        error: "Validation Error",
        message: "shopId, budget, and goal are required",
      });
      return;
    }

    // 2. Fetch Products & Inventory from Prisma
    const products = await prisma.product.findMany({
      where: { shopId },
      include: {
        inventories: { take: 1 },
      },
    });

    if (products.length === 0) {
      res.status(404).json({
        error: "Not Found",
        message: "No products found for this shop",
      });
      return;
    }

    // 3. Fetch Sales History from Prisma (Last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let sales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        items: true,
        createdAt: true,
        total: true,
      },
    });

    // Mock sales data if DB is empty (for demo purposes)
    if (sales.length === 0) {
      console.log("No sales found, using mock data for demo");
      sales = Array.from({ length: 10 }).map((_, i) => ({
        createdAt: new Date(Date.now() - i * 86400000), // Last 10 days
        total: 100,
        items: JSON.stringify(products.map(p => ({
          productId: p.id,
          quantity: Math.floor(Math.random() * 5) + 1, // Random qty 1-5
          price: p.price
        })))
      }));
    }

    // 4. Format Data for ML Service
    // Map products to MLProductInput format
    const mlProducts: MLProductInput[] = products.map((p) => {
      // Calculate simple avg daily sales from local data
      let totalQty = 0;
      sales.forEach(sale => {
        const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (item.productId === p.id) {
              totalQty += (item.quantity || 0);
            }
          });
        }
      });
      
      // If using mock data (10 days), divide by 10. If real data (90 days), divide by 90.
      const daysPeriod = sales.length === 10 && sales[0]?.total === 100 ? 10 : 90;
      const avgDailySales = totalQty / daysPeriod;

      const cost = p.cost || 0;
      const price = p.price || 0;
      const profitMargin = price > 0 ? (price - cost) / price : 0;

      let stock = 0;
      if (p.inventories && p.inventories.length > 0 && p.inventories[0]) {
          stock = p.inventories[0].quantity;
      }

      return {
        product_id: p.id,
        name: p.name,
        price: price,
        cost: cost,
        stock: stock,
        category: p.description || "General",
        avg_daily_sales: avgDailySales || 1, // Ensure at least 1 for demo if 0
        profit_margin: profitMargin,
        min_order_qty: 1
      };
    });

    // Filter out invalid products (cost or price <= 0) as ML service requires positive values
    const validProducts = mlProducts.filter((p: any) => p.price > 0 && p.cost > 0);

    if (validProducts.length === 0) {
        res.status(400).json({
            error: "Validation Error",
            message: "No valid products found (must have price > 0 and cost > 0)"
        });
        return;
    }

    const mlPayload: MLRestockRequest = {
      shop_id: shopId,
      budget: Number(budget),
      goal: goal,
      products: validProducts,
      restock_days: restockDays || 14
    };

    // 5. Call ML Service
    console.log("Sending payload to ML Service:", JSON.stringify(mlPayload, null, 2));
    
    let mlResponse: MLRestockResponse;
    try {
      mlResponse = await mlClient.post<MLRestockResponse>(
        "/api/v1/restock/strategy",
        mlPayload
      );
      console.log("Received response from ML Service:", JSON.stringify(mlResponse, null, 2));
    } catch (mlError: any) {
      console.error("ML Service Call Failed:", mlError.message);
      if (mlError.response) {
        console.error("ML Service Response Data:", mlError.response.data);
        console.error("ML Service Status:", mlError.response.status);
      }
      throw new Error(`ML Service Error: ${mlError.message}`);
    }

    if (!mlResponse || !mlResponse.items || !mlResponse.totals) {
      console.error("Invalid ML Response Structure:", mlResponse);
      throw new Error("Received invalid response from ML Service");
    }

    // 6. Return Response
    res.status(200).json({
      success: true,
      data: {
        budget: Number(budget),
        recommendations: mlResponse.items.map(item => {
            // item.product_id might be string or int, ensure comparison works
            const product = products.find(p => String(p.id) === String(item.product_id));
            return {
                product_id: item.product_id,
                product_name: item.name,
                current_stock: product?.inventories[0]?.quantity || 0,
                recommended_qty: item.qty,
                cost: item.total_cost, 
                expected_revenue: item.expected_revenue,
                priority: item.priority_score,
                reason: item.reasoning || ""
            };
        }),
        summary: {
            total_cost: mlResponse.totals.total_cost || 0,
            total_items: mlResponse.totals.total_items || 0,
            projected_revenue: mlResponse.totals.expected_revenue || 0,
            roi: mlResponse.totals.expected_roi || 0,
        },
        insights: mlResponse.reasoning,
        warnings: mlResponse.warnings || []
      },
    });

  } catch (error: any) {
    console.error("Restock Error:", error.response?.data || error.message);
    console.error("Full Error Stack:", error.stack);
    
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Failed to calculate restocking strategy",
      details: error.response?.data || error.message,
    });
  }
}

export async function getMLServiceHealth(req: Request, res: Response) {
  try {
    const isHealthy = await mlClient.healthCheck();
    const info = await mlClient.getServiceInfo();
    
    res.json({
      success: true,
      healthy: isHealthy,
      info
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
}

export default {
  getRestockStrategy,
  getMLServiceHealth
};
