export declare class UserService {
    register(email: string, password: string, name?: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    } | null>;
    list(): Promise<({
        shops: {
            id: string;
            name: string;
            createdAt: Date;
            ownerId: string;
        }[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    })[]>;
    login(email: string, password: string): Promise<{
        shops: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
    }): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    }>;
    updatePassword(userId: string, passwordHash: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    }>;
    findById(userId: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        role: import("../generated/prisma").$Enums.Role;
    } | null>;
}
//# sourceMappingURL=user.service.d.ts.map