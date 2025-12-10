// src/service/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";
import { LoginAttemptService } from "./loginAttempt.service";
import { shopSeedService } from "./shopSeed.service";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: "ADMIN" | "SELLER" | "BUYER" | "ANALYST";
  platform?: "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA";
}

export interface LoginInput {
  email: string;
  password: string;
  platform?: "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA";
}

export interface ShopeeSSOInput {
  shopeeUserId: string;
  email: string;
  name?: string | undefined;
  role?: "ADMIN" | "SELLER" | "BUYER" | "ANALYST" | undefined;
  apiKey: string;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private readonly JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
  private readonly SALT_ROUNDS = 10;

  /**
   * Register a new user
   * If role is SELLER, automatically create an empty Shop
   */
  async register(data: RegisterInput) {
    const platform = data.platform || "BVA";
    
    // Check if email already exists for this platform
    const existingEmail = await prisma.user.findUnique({
      where: { 
        email_platform: {
          email: data.email,
          platform: platform as any,
        }
      },
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Determine role (default to BUYER for shopee-clone compatibility)
    const role = data.role || "BUYER";

    // Create user with transaction to ensure shop creation for sellers
    const result = await prisma.$transaction(async (tx) => {
      // Double-check email doesn't exist for this platform (race condition protection)
      const existingUserInTx = await tx.user.findUnique({
        where: { 
          email_platform: {
            email: data.email,
            platform: platform as any,
          }
        }
      });

      if (existingUserInTx) {
        throw new Error("Email already exists");
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          role,
          platform: platform as any,
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }).catch((error: any) => {
        // Handle Prisma unique constraint error
        if (error.code === 'P2002' && (error.meta?.target?.includes('email') || error.meta?.target?.includes('email_platform'))) {
          throw new Error("Email already exists");
        }
        throw error;
      });

      return { user };
    });

    // Ensure platform-specific shop exists for SELLER users
    let shops: Array<{ id: string; name: string }> = [];
    let shopId: string | undefined;
    
    if (result.user.role === "SELLER") {
      try {
        // Use shopSeedService to get or create platform-specific shop
        const shop = await shopSeedService.getOrCreateShopForUser(result.user.id, platform as any);
        if (shop && shop.id && shop.name) {
          shops = [{ id: shop.id, name: shop.name }];
          shopId = shop.id;
          console.log(`✅ Platform-specific shop for user ${result.user.id} on ${platform}: shop ID ${shopId}`);
        } else {
          throw new Error("Shop creation returned invalid shop object");
        }
          } catch (shopError: any) {
        console.error(`❌ CRITICAL: Failed to create platform-specific shop:`, shopError);
            throw new Error(`Critical error: Failed to create shop for seller account. Please contact support.`);
      }
      
      // Final verification
      if (shops.length === 0 || !shopId) {
        console.error(`❌ CRITICAL ERROR: SELLER user ${result.user.id} has no shops after registration!`);
        throw new Error(`Critical error: Seller account has no shop. Please contact support.`);
      }
    }

    // Generate JWT token
    const token = this.generateToken(result.user.id, result.user.role, result.user.email, result.user.name || undefined, shops[0]?.id || undefined);

    return {
      user: result.user,
      shops, // Return as array for frontend compatibility
      token,
    };
  }

  /**
   * Login user
   * Includes login attempt limiting to prevent brute force attacks
   */
  async login(data: LoginInput) {
    const platform = data.platform || "BVA";
    const lockKey = `${data.email}:${platform}`;
    
    // Check if account is locked (per platform)
    const lockStatus = await LoginAttemptService.isLocked(lockKey);
    if (lockStatus.locked) {
      const minutes = Math.floor((lockStatus.remainingSeconds || 0) / 60);
      const seconds = (lockStatus.remainingSeconds || 0) % 60;
      throw new Error(
        `Account temporarily locked due to too many failed login attempts. Please try again in ${minutes}m ${seconds}s.`
      );
    }

    // Find user by email and platform
    const user = await prisma.user.findUnique({
      where: { 
        email_platform: {
          email: data.email,
          platform: platform as any,
        }
      },
    });

    // Record failed attempt if user doesn't exist (don't reveal if email exists)
    if (!user) {
      await LoginAttemptService.recordFailedAttempt(lockKey);
      throw new Error("Invalid credentials");
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      await LoginAttemptService.recordFailedAttempt(lockKey);
      throw new Error("This account uses Google OAuth. Please sign in with Google.");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt
      const attemptResult = await LoginAttemptService.recordFailedAttempt(lockKey);
      
      // If account is now locked, throw lockout error
      if (attemptResult.locked) {
        const minutes = Math.floor((attemptResult.remainingSeconds || 0) / 60);
        const seconds = (attemptResult.remainingSeconds || 0) % 60;
        throw new Error(
          `Too many failed login attempts. Account locked for ${minutes}m ${seconds}s. Please try again later.`
        );
      }

      // Get remaining attempts for error message
      const remainingAttempts = await LoginAttemptService.getRemainingAttempts(lockKey);
      throw new Error(
        remainingAttempts > 0
          ? `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
          : "Invalid credentials"
      );
    }

    // Successful login - clear all attempts
    await LoginAttemptService.clearAttempts(lockKey);

    // Ensure platform-specific shop exists for SELLER users
    let shops: Array<{ id: string; name: string }> = [];
    if (user.role === "SELLER") {
      try {
        // Use shopSeedService to get or create platform-specific shop
        const shop = await shopSeedService.getOrCreateShopForUser(user.id, platform as any);
        if (shop && shop.id && shop.name) {
          shops = [{ id: shop.id, name: shop.name }];
          console.log(`✅ Platform-specific shop for user ${user.id} on ${platform}: shop ID ${shop.id}`);
        } else {
          throw new Error("Shop creation returned invalid shop object");
        }
        } catch (shopError: any) {
        console.error(`❌ Failed to get/create platform-specific shop during login:`, shopError);
          throw new Error(`Critical error: Failed to create shop for seller account. Please contact support.`);
      }
    }

    // Generate JWT token
    const shopId = shops[0]?.id;
    const token = this.generateToken(user.id, user.role, user.email, user.name || undefined, shopId || undefined);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      shops, // Return shops array for frontend compatibility
      token,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as {
        userId: string;
        role: string;
        email?: string;
        name?: string;
        shopId?: string | null;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, role: string, email?: string, name?: string, shopId?: string): string {
    return jwt.sign({ 
      userId, 
      role,
      email: email || 'user@example.com',
      name: name || 'User',
      shopId: shopId || null
    }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRATION as string,
    } as jwt.SignOptions);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        shopeeId: true,
        googleId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Get user's shops filtered by platform
   * If user is SELLER and has no shop for the platform, create one
   * @param userId - The user ID
   * @param platform - Optional platform filter (UserPlatform or Shop Platform). If not provided, uses user's platform.
   */
  async getUserShops(userId: string, platform?: "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA" | "SHOPEE" | "TIKTOK" | "LAZADA" | "OTHER") {
    // First get user to check role and platform
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, firstName: true, email: true, platform: true },
    });

    if (!user) {
      console.log(`❌ getUserShops: User ${userId} not found`);
      return [];
    }

    // Determine which platform to use (use provided platform or user's platform)
    const targetPlatform = platform || user.platform;
    
    // Map UserPlatform to Shop Platform
    let shopPlatform: "SHOPEE" | "TIKTOK" | "LAZADA" | "OTHER" = "SHOPEE";
    if (targetPlatform === "SHOPEE_CLONE" || targetPlatform === "SHOPEE" || targetPlatform === "BVA") {
      shopPlatform = "SHOPEE";
    } else if (targetPlatform === "TIKTOK_CLONE" || targetPlatform === "TIKTOK") {
      shopPlatform = "TIKTOK";
    } else if (targetPlatform === "LAZADA") {
      shopPlatform = "LAZADA";
    }

    console.log(`🔍 getUserShops: Fetching ${shopPlatform} shops for user ${userId} (${user.email}, user platform: ${user.platform})`);

    // Query shops filtered by platform
    let shops: Array<{ id: string; name: string }> = await prisma.shop.findMany({
      where: { 
        ownerId: userId,
        platform: shopPlatform,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 getUserShops: Found ${shops.length} ${shopPlatform} shop(s) for user ${userId}`);
    if (shops.length > 0) {
      console.log(`   Shop IDs: ${shops.map(s => `${s.id} (${s.name})`).join(', ')}`);
    }

    // If SELLER has no shop for this platform, create one
    if (user.role === "SELLER" && shops.length === 0) {
      console.log(`⚠️ No ${shopPlatform} shop found for SELLER ${userId} (${user.email}), creating one...`);
      try {
        const shop = await shopSeedService.getOrCreateShopForUser(userId, shopPlatform);
        if (shop && shop.id && shop.name) {
          shops = [{ id: shop.id, name: shop.name }] as Array<{ id: string; name: string }>;
          console.log(`✅ ${shopPlatform} shop created/retrieved for user ${userId}: shop ID ${shop.id}, name: ${shop.name}`);
        } else {
          throw new Error("Shop creation returned invalid shop object");
        }
      } catch (shopError: any) {
        console.error(`❌ CRITICAL: Failed to create ${shopPlatform} shop in getUserShops for user ${userId}:`, shopError);
        console.error(`   Error code: ${shopError.code}, message: ${shopError.message}`);
        console.error(`   Error stack:`, shopError.stack);
        console.error(`   User exists: ${!!user}, User ID: ${userId}, Role: ${user.role}`);
        console.error(`   User email: ${user.email}, User platform: ${user.platform}, Shop platform: ${shopPlatform}`);
        // Throw the error so the frontend knows shop creation failed
        throw new Error(`Failed to create ${shopPlatform} shop for seller account: ${shopError.message || 'Unknown error'}`);
      }
    } else if (user.role === "SELLER" && shops.length > 0) {
      console.log(`✅ SELLER ${userId} has ${shops.length} ${shopPlatform} shop(s):`, shops.map(s => `${s.id} (${s.name})`).join(', '));
    } else if (user.role !== "SELLER") {
      console.log(`ℹ️ User ${userId} is not a SELLER (role: ${user.role}), no shop needed`);
    }

    // Final validation: ensure shops array is properly formatted
    const finalShops = Array.isArray(shops) ? shops.map(s => ({ id: s.id, name: s.name })) : [];
    console.log(`📤 getUserShops returning ${finalShops.length} ${shopPlatform} shop(s) for user ${userId}`);
    if (finalShops.length > 0) {
      console.log(`   Final shops: ${JSON.stringify(finalShops)}`);
    }
    return finalShops;
  }

  /**
   * Shopee-Clone SSO Login
   * Find or create user based on Shopee-Clone data, then sync their products/sales
   */
  async shopeeSSOLogin(data: ShopeeSSOInput) {
    const { shopeeUserId, email, name, role, apiKey } = data;

    // Find existing user by email or shopeeId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { shopeeId: shopeeUserId },
        ],
      },
    });

    let isNewUser = false;

    if (user) {
      // Update existing user with shopeeId if not set
      if (!user.shopeeId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { shopeeId: shopeeUserId },
        });
      }
    } else {
      // Create new user
      isNewUser = true;
      const userRole = role || "SELLER";

      user = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            password: null, // SSO users don't need password
            shopeeId: shopeeUserId,
            name: name || null,
            role: userRole,
          },
        });

        // If user is a SELLER, create a shop for them
        if (userRole === "SELLER") {
          await tx.shop.create({
            data: {
              name: `${name || email.split("@")[0]}'s Shop`,
              ownerId: newUser.id,
            },
          });
        }

        return newUser;
      });
    }

    // Note: Data sync from Shopee-Clone should be triggered manually via webhooks
    // or through the integration settings page, not automatically on login
    // Removed automatic sync to prevent unwanted data creation

    // Fetch user's shop if they're a seller
    const userShops = await prisma.shop.findMany({
      where: { ownerId: user.id },
      select: { id: true }
    });
    const shopId = userShops[0]?.id;

    // Generate JWT token
    const token = this.generateToken(user.id, user.role, user.email, user.name || undefined, shopId);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shopeeId: user.shopeeId,
        createdAt: user.createdAt,
      },
      token,
      isNewUser,
      syncStarted: true,
    };
  }

  /**
   * Manually trigger Shopee-Clone data sync
   */
  async triggerShopeeSync(userId: string, apiKey: string) {
    return shopeeIntegrationService.syncAllData(userId, apiKey);
  }
}

export const authService = new AuthService();
