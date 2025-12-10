// src/service/shopSeed.service.ts
import prisma from "../lib/prisma";

type Platform = "SHOPEE" | "TIKTOK" | "LAZADA" | "OTHER";
type UserPlatform = "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA";

/**
 * Maps UserPlatform to Shop Platform
 * SHOPEE_CLONE -> SHOPEE
 * TIKTOK_CLONE -> TIKTOK
 * BVA -> SHOPEE (default)
 */
function mapUserPlatformToShopPlatform(userPlatform: UserPlatform): Platform {
  switch (userPlatform) {
    case "SHOPEE_CLONE":
      return "SHOPEE";
    case "TIKTOK_CLONE":
      return "TIKTOK";
    case "BVA":
    default:
      return "SHOPEE";
  }
}

export class ShopSeedService {
  /**
   * Create a platform-specific shop for a user
   * @param userId - The user ID
   * @param platform - The platform (SHOPEE, TIKTOK, LAZADA, or derived from UserPlatform)
   * @param shopName - Optional shop name (will be generated if not provided)
   * @returns The created shop
   */
  async createShopForUser(
    userId: string,
    platform: Platform | UserPlatform,
    shopName?: string
  ) {
    // Convert UserPlatform to Shop Platform if needed
    const shopPlatform: Platform =
      platform === "SHOPEE_CLONE" || platform === "TIKTOK_CLONE" || platform === "BVA"
        ? mapUserPlatformToShopPlatform(platform as UserPlatform)
        : (platform as Platform);

    // Get user info for shop name generation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (user.role !== "SELLER") {
      throw new Error(`User ${userId} is not a SELLER, cannot create shop`);
    }

    // Check if shop already exists for this user and platform
    try {
      const existingShop = await prisma.shop.findUnique({
        where: {
          ownerId_platform: {
            ownerId: userId,
            platform: shopPlatform,
          },
        },
      });

      if (existingShop) {
        console.log(
          `✅ Shop already exists for user ${userId} on platform ${shopPlatform}: ${existingShop.id}`
        );
        return existingShop;
      }
    } catch (findError: any) {
      // If unique constraint doesn't exist yet, try alternative query
      console.warn(`⚠️ Could not use unique constraint, trying alternative query:`, findError.message);
      const existingShops = await prisma.shop.findMany({
        where: {
          ownerId: userId,
          platform: shopPlatform,
        },
        take: 1,
      });
      if (existingShops.length > 0) {
        console.log(
          `✅ Shop found via alternative query for user ${userId} on platform ${shopPlatform}: ${existingShops[0].id}`
        );
        return existingShops[0];
      }
    }

    // Generate shop name if not provided
    const finalShopName =
      shopName ||
      `${user.name || user.firstName || user.email.split("@")[0] || "My"}'s ${shopPlatform} Shop`;

    // Create the shop
    try {
      const newShop = await prisma.shop.create({
        data: {
          name: finalShopName,
          ownerId: userId,
          platform: shopPlatform,
        },
        select: {
          id: true,
          name: true,
          platform: true,
          ownerId: true,
          createdAt: true,
        },
      });

      console.log(
        `✅ Created ${shopPlatform} shop for user ${userId}: ${newShop.id} (${newShop.name})`
      );

      return newShop;
    } catch (createError: any) {
      console.error(`❌ Failed to create shop for user ${userId} on platform ${shopPlatform}:`, createError);
      console.error(`   Error code: ${createError.code}`);
      console.error(`   Error message: ${createError.message}`);
      console.error(`   Error meta:`, createError.meta);
      
      // If it's a unique constraint error, try to find the shop that was created
      if (createError.code === 'P2002') {
        console.log(`⚠️ Unique constraint violation, attempting to find existing shop...`);
        const existingShops = await prisma.shop.findMany({
          where: {
            ownerId: userId,
            platform: shopPlatform,
          },
          take: 1,
        });
        if (existingShops.length > 0) {
          console.log(`✅ Found existing shop after constraint error: ${existingShops[0].id}`);
          return existingShops[0];
        }
      }
      
      throw createError;
    }
  }

  /**
   * Get or create a platform-specific shop for a user
   * @param userId - The user ID
   * @param platform - The platform (SHOPEE, TIKTOK, LAZADA, or UserPlatform)
   * @returns The shop (existing or newly created)
   */
  async getOrCreateShopForUser(
    userId: string,
    platform: Platform | UserPlatform
  ) {
    // Convert UserPlatform to Shop Platform if needed
    const shopPlatform: Platform =
      platform === "SHOPEE_CLONE" || platform === "TIKTOK_CLONE" || platform === "BVA"
        ? mapUserPlatformToShopPlatform(platform as UserPlatform)
        : (platform as Platform);

    // Try to find existing shop
    const existingShop = await prisma.shop.findUnique({
      where: {
        ownerId_platform: {
          ownerId: userId,
          platform: shopPlatform,
        },
      },
    });

    if (existingShop) {
      return existingShop;
    }

    // Create new shop if not found
    return await this.createShopForUser(userId, shopPlatform);
  }
}

export const shopSeedService = new ShopSeedService();

