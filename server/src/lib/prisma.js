"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new prisma_1.PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
});
// Handle graceful shutdown
process.on("beforeExit", async () => {
    await prisma.$disconnect();
    await pool.end();
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map