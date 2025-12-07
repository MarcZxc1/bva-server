import { Request } from "express";
import prisma from "../lib/prisma";

/**
 * Helper function to get shopId from request (token or user's shops)
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

  // Fallback: fetch user's first shop
  const shops = await prisma.shop.findMany({
    where: { ownerId: user.userId },
    take: 1,
    select: { id: true },
  });

  return shops[0]?.id || null;
}

