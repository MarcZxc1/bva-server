import prisma from "../lib/prisma";
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getSellerDashboard(shopId: string) {
  // Check if shop has active integration with terms accepted
  const hasIntegration = await hasActiveIntegration(shopId);
  
  if (!hasIntegration) {
    // Return empty/default data if no active integration
    return {
      shop: {
        id: shopId,
        name: "Your Shop",
      },
      metrics: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        totalProfit: 0,
        monthlyProfit: 0,
        profitMargin: 0,
      },
      recentOrders: [],
      lowStockProducts: [],
    };
  }
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get shop info (only products from integrations)
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      products: {
        where: {
          externalId: { not: null }, // Only products synced from integrations
        },
      },
    },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  // Get sales statistics
  const allSales = await prisma.sale.findMany({
    where: { shopId },
  });

  const recentSales = await prisma.sale.findMany({
    where: {
      shopId,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const monthlySales = await prisma.sale.findMany({
    where: {
      shopId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Calculate metrics
  const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.revenue || sale.total), 0);
  const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + (sale.revenue || sale.total), 0);
  const weeklyRevenue = recentSales.reduce((sum, sale) => sum + (sale.revenue || sale.total), 0);
  const totalProfit = allSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  const monthlyProfit = monthlySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  // Get pending orders
  const pendingOrders = await prisma.sale.findMany({
    where: {
      shopId,
      status: "pending",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Get low stock products (only from integrations)
  const lowStockProducts = await prisma.product.findMany({
    where: {
      shopId,
      externalId: { not: null }, // Only products synced from integrations
      OR: [
        { stock: { lte: 10 } },
        {
          inventories: {
            some: {
              quantity: { lte: 10 },
            },
          },
        },
      ],
    },
    take: 5,
  });

  return {
    shop: {
      id: shop.id,
      name: shop.name,
    },
    metrics: {
      totalProducts: shop.products.length,
      totalOrders: allSales.length,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      totalProfit,
      monthlyProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
    recentOrders: pendingOrders.map(order => ({
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    })),
    lowStockProducts: lowStockProducts.map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
    })),
  };
}

export async function getSellerIncome(
  shopId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: "pending" | "released";
  }
) {
  // First, get ALL sales for the shop to calculate accurate totals
  // This ensures totals reflect all sold products, not just filtered ones
  const allSalesWhere: any = { shopId };
  const allSales = await prisma.sale.findMany({
    where: allSalesWhere,
    select: {
      id: true,
      status: true,
      revenue: true,
      total: true,
      createdAt: true,
      platformOrderId: true,
      externalId: true,
      items: true,
    },
  });

  // Now get filtered sales for the orders list
  const where: any = { shopId };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  // Status filter: "pending" = orders not yet completed, "released" = completed orders
  // Also include orders with status "to-receive" as they're essentially completed from seller's perspective
  if (filters?.status === "pending") {
    where.status = { 
      notIn: ["completed", "to-receive"] 
    };
  } else if (filters?.status === "released") {
    where.status = { 
      in: ["completed", "to-receive"] 
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate totals from ALL sales (not just filtered ones)
  // This ensures the income overview shows the complete picture
  const pendingTotal = allSales
    .filter(sale => sale.status !== "completed" && sale.status !== "to-receive")
    .reduce((sum, sale) => {
      const amount = sale.revenue || sale.total || 0;
      return sum + amount;
    }, 0);

  const releasedTotal = allSales
    .filter(sale => sale.status === "completed" || sale.status === "to-receive")
    .reduce((sum, sale) => {
      const amount = sale.revenue || sale.total || 0;
      return sum + amount;
    }, 0);

  // Get this week and this month totals from ALL sales
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekSales = allSales.filter(
    sale => (sale.status === "completed" || sale.status === "to-receive") && new Date(sale.createdAt) >= weekStart
  );
  const thisMonthSales = allSales.filter(
    sale => (sale.status === "completed" || sale.status === "to-receive") && new Date(sale.createdAt) >= monthStart
  );

  const thisWeekTotal = thisWeekSales.reduce(
    (sum, sale) => {
      const amount = sale.revenue || sale.total || 0;
      return sum + amount;
    },
    0
  );
  const thisMonthTotal = thisMonthSales.reduce(
    (sum, sale) => {
      const amount = sale.revenue || sale.total || 0;
      return sum + amount;
    },
    0
  );

  return {
    pending: {
      total: pendingTotal,
      orders: allSales.filter(sale => sale.status !== "completed" && sale.status !== "to-receive").length,
    },
    released: {
      total: releasedTotal,
      thisWeek: thisWeekTotal,
      thisMonth: thisMonthTotal,
      orders: allSales.filter(sale => sale.status === "completed" || sale.status === "to-receive").length,
    },
    orders: sales.map(sale => {
      const isReleased = sale.status === "completed" || sale.status === "to-receive";
      return {
        id: sale.id,
        orderId: sale.platformOrderId || sale.externalId || sale.id,
        payoutReleasedOn: isReleased ? sale.createdAt : null,
        status: sale.status,
        paymentMethod: "Bank Transfer", // Default
        releasedAmount: isReleased ? (sale.revenue || sale.total) : 0,
        createdAt: sale.createdAt,
      };
    }),
  };
}

