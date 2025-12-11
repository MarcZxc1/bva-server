import { Request } from "express";
import prisma from "../lib/prisma";
import { shopAccessService } from "../service/shopAccess.service";

/**
 * Helper function to get shopId from request (token or user's shops)
 * Checks both owned shops and linked shops (via ShopAccess)
 */
export async function getShopIdFromRequest(req: Request): Promise<string | null> {
  const user = (req as any).user;
  if (!user || !user.userId) {
    return null;
  }

  // Try to get shopId from token first
  if (user.shopId) {
    return user.shopId;
  }

  // Get all accessible shops (owned + linked)
  const accessibleShopIds = await shopAccessService.getAccessibleShops(user.userId);
  
  if (accessibleShopIds.length > 0 && accessibleShopIds[0]) {
    return accessibleShopIds[0];
  }

  return null;
}

/**
 * Verify if user has access to a specific shop (owned or linked)
 */
export async function verifyShopAccess(req: Request, shopId: string): Promise<boolean> {
  const user = (req as any).user;
  if (!user || !user.userId) {
    return false;
  }

  return shopAccessService.hasAccess(user.userId, shopId);
}

