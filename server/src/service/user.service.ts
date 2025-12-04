import prisma from "../lib/prisma";
import { User, Prisma } from "../generated/prisma";
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
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
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
}
