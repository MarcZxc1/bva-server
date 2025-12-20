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
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Export pool for graceful shutdown
export { pool };

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  await pool.end();
});

export default prisma;
