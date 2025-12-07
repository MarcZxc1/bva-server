import prisma from "../lib/prisma";
import { User, Prisma, Role } from "../generated/prisma";
import bcrypt from "bcrypt";

export class UserService {
  async register(email: string, password: string, name?: string) {
    return await prisma.user.create({
      data: {
        email: email,
        password: password,
        name: name ?? null,
      },
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async list() {
    return await prisma.user.findMany({
      include: {
        shops: true,
      },
    });
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      throw new Error("This account uses Google OAuth. Please sign in with Google.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }) {
    // If email is being updated, check if it's already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email is already in use");
      }
    }

    // Update name based on first and last name if provided
    let nameUpdate = {};
    if (data.firstName || data.lastName) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const currentName = user?.name || "";
      const firstName = data.firstName || (user?.firstName ?? currentName.split(" ")[0]);
      const lastName = data.lastName || (user?.lastName ?? currentName.split(" ").slice(1).join(" "));
      
      nameUpdate = {
        name: `${firstName} ${lastName}`.trim(),
      };
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...nameUpdate,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
      },
    });
  }

  async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Sync user from Shopee-Clone system
   * Handles both existing and new users, with role-based shop creation
   */
  async syncShopeeUser(payload: {
    email: string;
    name?: string;
    role: "SELLER" | "BUYER";
    shopeeId: string;
    password?: string;
  }) {
    const { email, name, role, shopeeId, password } = payload;

    // Check if user already exists by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists - update shopeeId if missing
      if (!user.shopeeId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { shopeeId },
        });
      }
      return user;
    }

    // Check if user exists by shopeeId (in case email changed)
    user = await prisma.user.findFirst({
      where: { shopeeId },
    });

    if (user) {
      // Update email if it changed
      if (user.email !== email) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      }
      return user;
    }

    // New user - create account
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create user with appropriate role
    // Handle race condition where email might be created between check and create
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          shopeeId,
          name: name || null,
          role: role === "SELLER" ? Role.SELLER : Role.BUYER,
        },
      });
    } catch (error: any) {
      // If email already exists (race condition), fetch the existing user
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          throw new Error("Failed to create user: email conflict");
        }
        // Update shopeeId if missing
        if (!user.shopeeId && shopeeId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { shopeeId },
          });
        }
        return user;
      }
      throw error;
    }

    // If role is SELLER, create shop (no automatic data seeding)
    // Data will come from Shopee-Clone webhooks when user connects their account
    if (role === "SELLER") {
      await prisma.shop.create({
        data: {
          name: `${name || "My"}'s Shop`,
          ownerId: user.id,
        },
      });
    }

    // If role is BUYER, no shop or seeding needed
    // They just get a user account for future features

    return user;
  }
}
