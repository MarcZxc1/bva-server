import prisma from "../lib/prisma";
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getSellerDashboard(shopId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get shop info with ALL products (both synced and locally created)
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      Product: true, // Include all products, not just those with externalId
    },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  // Get sales statistics
  const allSales = await prisma.sale.findMany({
    where: { shopId },
  });

  console.log(`📊 Dashboard - Shop ${shopId}: Found ${allSales.length} sales`);
  if (allSales.length > 0 && allSales[0]) {
    console.log('   First sale:', {
      id: allSales[0].id,
      total: allSales[0].total,
      revenue: allSales[0].revenue,
      status: allSales[0].status,
    });
  }

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

  console.log(`💰 Calculated metrics:`, {
    totalOrders: allSales.length,
    totalRevenue,
    monthlyRevenue,
    weeklyRevenue,
  });

  // Get pending orders
  const pendingOrders = await prisma.sale.findMany({
    where: {
      shopId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Get low stock products (all products, not just synced ones)
  const lowStockProducts = await prisma.product.findMany({
    where: {
      shopId,
      OR: [
        { stock: { lte: 10 } },
        {
          Inventory: {
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
    Shop: {
      id: shop.id,
      name: shop.name,
    },
    metrics: {
      totalProducts: shop.Product.length,
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
  // First, get ALL sales and orders for the shop to calculate accurate totals
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
      notIn: ["COMPLETED", "TO_RECEIVE"] 
    };
  } else if (filters?.status === "released") {
    where.status = { 
      in: ["COMPLETED", "TO_RECEIVE"] 
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
    .filter(sale => sale.status !== "COMPLETED" && sale.status !== "TO_RECEIVE")
    .reduce((sum, sale) => {
      const amount = sale.revenue || sale.total || 0;
      return sum + amount;
    }, 0);

  const releasedTotal = allSales
    .filter(sale => sale.status === "COMPLETED" || sale.status === "TO_RECEIVE")
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
    sale => (sale.status === "COMPLETED" || sale.status === "TO_RECEIVE") && new Date(sale.createdAt) >= weekStart
  );
  const thisMonthSales = allSales.filter(
    sale => (sale.status === "COMPLETED" || sale.status === "TO_RECEIVE") && new Date(sale.createdAt) >= monthStart
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
      orders: allSales.filter(sale => sale.status !== "COMPLETED" && sale.status !== "TO_RECEIVE").length,
    },
    released: {
      total: releasedTotal,
      thisWeek: thisWeekTotal,
      thisMonth: thisMonthTotal,
      orders: allSales.filter(sale => sale.status === "COMPLETED" || sale.status === "TO_RECEIVE").length,
    },
    orders: sales.map(sale => {
      const isReleased = sale.status === "COMPLETED" || sale.status === "TO_RECEIVE";
      return {
        id: sale.id,
        orderId: sale.platformOrderId || sale.externalId || sale.id,
        payoutReleasedOn: isReleased ? sale.createdAt : null,
        status: sale.status,
        paymentMethod: "Bank Transfer",
        releasedAmount: isReleased ? (sale.revenue || sale.total) : 0,
        createdAt: sale.createdAt,
      };
    }),
  };
}

