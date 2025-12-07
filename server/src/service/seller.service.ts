import prisma from "../lib/prisma";

export async function getSellerDashboard(shopId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get shop info
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      products: true,
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

  // Get low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: {
      shopId,
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
  if (filters?.status === "pending") {
    where.status = { not: "completed" };
  } else if (filters?.status === "released") {
    where.status = "completed";
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate totals
  const pendingTotal = sales
    .filter(sale => sale.status !== "completed")
    .reduce((sum, sale) => sum + (sale.revenue || sale.total), 0);

  const releasedTotal = sales
    .filter(sale => sale.status === "completed")
    .reduce((sum, sale) => sum + (sale.revenue || sale.total), 0);

  // Get this week and this month totals
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekSales = sales.filter(
    sale => sale.status === "completed" && new Date(sale.createdAt) >= weekStart
  );
  const thisMonthSales = sales.filter(
    sale => sale.status === "completed" && new Date(sale.createdAt) >= monthStart
  );

  const thisWeekTotal = thisWeekSales.reduce(
    (sum, sale) => sum + (sale.revenue || sale.total),
    0
  );
  const thisMonthTotal = thisMonthSales.reduce(
    (sum, sale) => sum + (sale.revenue || sale.total),
    0
  );

  return {
    pending: {
      total: pendingTotal,
      orders: sales.filter(sale => sale.status !== "completed").length,
    },
    released: {
      total: releasedTotal,
      thisWeek: thisWeekTotal,
      thisMonth: thisMonthTotal,
      orders: sales.filter(sale => sale.status === "completed").length,
    },
    orders: sales.map(sale => ({
      id: sale.id,
      orderId: sale.platformOrderId || sale.id,
      payoutReleasedOn: sale.status === "completed" ? sale.createdAt : null,
      status: sale.status,
      paymentMethod: "Bank Transfer", // Default
      releasedAmount: sale.status === "completed" ? (sale.revenue || sale.total) : 0,
      createdAt: sale.createdAt,
    })),
  };
}

