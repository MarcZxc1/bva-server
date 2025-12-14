import { PrismaClient } from "./src/generated/prisma";

const prisma = new PrismaClient();

async function checkEnum() {
  try {
    // Query the database directly to see what enum values exist
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'OrderStatus'
    `;
    
    console.log("✅ OrderStatus enum values:", result);
  } catch (error) {
    console.error("❌ Error checking enum:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnum();
