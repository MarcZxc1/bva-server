// src/service/shopAccess.service.ts
import prisma from "../lib/prisma";

class ShopAccessService {
  /**
   * Link a shop to a user (for BVA users to access Shopee-Clone shops)
   */
  async linkShop(userId: string, shopId: string) {
    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, platform: true },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }

    // Check if user already owns this shop
    const ownedShop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: userId },
    });

    if (ownedShop) {
      // User already owns this shop, return it
      return { shop: { id: shop.id, name: shop.name, platform: shop.platform } };
    }

    // Check if access already exists
    const existingAccess = await prisma.shopAccess.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    if (existingAccess) {
      // Access already exists, return shop info
      return { shop: { id: shop.id, name: shop.name, platform: shop.platform } };
    }

    // Create new access
    await prisma.shopAccess.create({
      data: {
        userId,
        shopId,
      },
    });

    return { shop: { id: shop.id, name: shop.name, platform: shop.platform } };
  }

  /**
   * Unlink a shop from a user
   */
  async unlinkShop(userId: string, shopId: string) {
    const access = await prisma.shopAccess.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    if (!access) {
      throw new Error("Shop access not found");
    }

    await prisma.shopAccess.delete({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get all shops accessible to a user (owned + linked)
   */
  async getAccessibleShops(userId: string): Promise<string[]> {
    // Get owned shops
    const ownedShops = await prisma.shop.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    // Get linked shops
    const linkedShops = await prisma.shopAccess.findMany({
      where: { userId },
      select: { shopId: true },
    });

    // Combine and deduplicate
    const allShopIds = [
      ...ownedShops.map((s) => s.id),
      ...linkedShops.map((a) => a.shopId),
    ];

    return [...new Set(allShopIds)];
  }

  /**
   * Check if user has access to a shop
   */
  async hasAccess(userId: string, shopId: string): Promise<boolean> {
    // Check if user owns the shop
    const ownedShop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: userId },
    });

    if (ownedShop) {
      return true;
    }

    // Check if user has linked access
    const access = await prisma.shopAccess.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId,
        },
      },
    });

    return !!access;
  }

  /**
   * Get all linked shops for a user (with details)
   */
  async getLinkedShops(userId: string) {
    const linkedAccesses = await prisma.shopAccess.findMany({
      where: { userId },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
    });

    return linkedAccesses.map((access) => ({
      id: access.Shop.id,
      name: access.Shop.name,
      platform: access.Shop.platform,
    }));
  }
}

export const shopAccessService = new ShopAccessService();

