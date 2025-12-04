"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    async register(email, password, name) {
        return await prisma_1.default.user.create({
            data: {
                email: email,
                password: password,
                name: name ?? null,
            },
        });
    }
    async findByEmail(email) {
        return await prisma_1.default.user.findUnique({
            where: {
                email: email,
            },
        });
    }
    async list() {
        return await prisma_1.default.user.findMany({
            include: {
                shops: true,
            },
        });
    }
    async login(email, password) {
        const user = await prisma_1.default.user.findUnique({
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
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        return user;
    }
    async updateProfile(userId, data) {
        // If email is being updated, check if it's already taken by another user
        if (data.email) {
            const existingUser = await prisma_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (existingUser && existingUser.id !== userId) {
                throw new Error("Email is already in use");
            }
        }
        // Update name based on first and last name if provided
        let nameUpdate = {};
        if (data.firstName || data.lastName) {
            const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
            const currentName = user?.name || "";
            const firstName = data.firstName || (user?.firstName ?? currentName.split(" ")[0]);
            const lastName = data.lastName || (user?.lastName ?? currentName.split(" ").slice(1).join(" "));
            nameUpdate = {
                name: `${firstName} ${lastName}`.trim(),
            };
        }
        return await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                ...data,
                ...nameUpdate,
            },
        });
    }
    async updatePassword(userId, passwordHash) {
        return await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                password: passwordHash,
            },
        });
    }
    async findById(userId) {
        return await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map