// src/service/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: "ADMIN" | "SELLER" | "BUYER" | "ANALYST";
}

export interface LoginInput {
  email: string;
  password: string;
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
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Determine role (default to SELLER)
    const role = data.role || "SELLER";

    // Create user with transaction to ensure shop creation for sellers
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name || null,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          role,
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
      });

      // If user is a SELLER, create an empty shop for them
      if (role === "SELLER") {
        await tx.shop.create({
          data: {
            name: `${data.name || data.email.split("@")[0]}'s Shop`,
            ownerId: user.id,
          },
        });
      }

      return user;
    });

    // Fetch user's shop if they're a seller
    const userShops = await prisma.shop.findMany({
      where: { ownerId: result.id },
      select: { id: true }
    });
    const shopId = userShops[0]?.id;

    // Generate JWT token
    const token = this.generateToken(result.id, result.role, result.email, result.name || undefined, shopId);

    return {
      user: result,
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      throw new Error("This account uses Google OAuth. Please sign in with Google.");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

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
        createdAt: user.createdAt,
      },
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
   * Get user's shops
   */
  async getUserShops(userId: string) {
    const shops = await prisma.shop.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
      },
    });

    return shops;
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

    // Trigger data sync from Shopee-Clone (async, don't block login)
    shopeeIntegrationService.syncAllData(user.id, apiKey).catch((error) => {
      console.error(`❌ Error syncing Shopee-Clone data for user ${user!.id}:`, error);
    });

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
