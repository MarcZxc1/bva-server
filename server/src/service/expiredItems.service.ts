/**
 * Expired Items Service
 * 
 * Checks for expired products and creates notifications for users
 */

import prisma from "../lib/prisma";

/**
 * Check for expired items and create notifications
 * This should be called periodically (e.g., daily via cron job or scheduler)
 */
export async function checkAndNotifyExpiredItems() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all products with expiry dates that have passed
    const expiredProducts = await prisma.product.findMany({
      where: {
        expiryDate: {
          lt: today, // Less than today = expired
        },
        stock: {
          gt: 0, // Only products with stock
        },
      },
      include: {
        Shop: {
          include: {
            User: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (expiredProducts.length === 0) {
      console.log("✅ No expired items found");
      return { count: 0, notificationsCreated: 0 };
    }

    console.log(`🔍 Found ${expiredProducts.length} expired product(s)`);

    // Group expired products by user
    const userExpiredProducts = new Map<string, Array<{ name: string; expiryDate: Date | null; stock: number }>>();

    for (const product of expiredProducts) {
      const userId = product.Shop.ownerId;
      if (!userExpiredProducts.has(userId)) {
        userExpiredProducts.set(userId, []);
      }
      userExpiredProducts.get(userId)!.push({
        name: product.name,
        expiryDate: product.expiryDate,
        stock: product.stock,
      });
    }

    // Create notifications for each user
    let notificationsCreated = 0;
    for (const [userId, products] of userExpiredProducts.entries()) {
      const productCount = products.length;
      const productNames = products.slice(0, 3).map(p => p.name).join(", ");
      const moreText = productCount > 3 ? ` and ${productCount - 3} more` : "";

      // Check if notification already exists for this user today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: "expired_items",
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Only create notification if one doesn't exist for today
      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: `🚨 ${productCount} Expired Item${productCount > 1 ? "s" : ""} Detected`,
            message: `${productNames}${moreText} ${productCount > 1 ? "have" : "has"} expired. Please review in SmartShelf.`,
            type: "expired_items",
            isRead: false,
          },
        });
        notificationsCreated++;
        console.log(`📬 Created expired items notification for user ${userId}`);
      } else {
        console.log(`ℹ️  Notification already exists for user ${userId} today`);
      }
    }

    return {
      count: expiredProducts.length,
      notificationsCreated,
    };
  } catch (error) {
    console.error("❌ Error checking expired items:", error);
    throw error;
  }
}

/**
 * Get expired items for a specific user
 */
export async function getUserExpiredItems(userId: string) {
  try {
    // Get all shops owned or accessible by the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Shop: {
          select: { id: true },
        },
        ShopAccess: {
          select: {
            shopId: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const shopIds = [
      ...user.Shop.map(s => s.id),
      ...user.ShopAccess.map(sa => sa.shopId),
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredProducts = await prisma.product.findMany({
      where: {
        shopId: { in: shopIds },
        expiryDate: {
          lt: today,
        },
        stock: {
          gt: 0,
        },
      },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    return expiredProducts;
  } catch (error) {
    console.error("❌ Error getting expired items for user:", error);
    throw error;
  }
}

