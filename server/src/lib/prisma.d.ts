/**
 * Prisma Client Configuration
 *
 * This file initializes the Prisma Client with the appropriate database adapter
 * for runtime database connections.
 *
 * Prisma 7 approach:
 * - Schema defines structure (no connection URL)
 * - prisma.config.ts configures CLI tools
 * - This file configures runtime connections
 */
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
declare const prisma: PrismaClient<{
    adapter: PrismaPg;
    log: ("query" | "warn" | "error")[];
}, "query" | "warn" | "error", import("../generated/prisma/runtime/library").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map