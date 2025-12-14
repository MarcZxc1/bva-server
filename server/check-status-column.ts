import { PrismaClient } from "./src/generated/prisma";

const prisma = new PrismaClient();

async function fixStatusColumn() {
  try {
    console.log("🔍 Checking database status column...");
    
    // Check what type the status column actually is
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Sale' AND column_name = 'status'
    `;
    
    console.log("📊 Status column info:", columnInfo);
    
    // Check if OrderStatus enum exists and what values it has
    const enumCheck = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'OrderStatus'
      ORDER BY e.enumsortorder
    `;
    
    console.log("📋 OrderStatus enum values:", enumCheck);
    
    if ((enumCheck as any[]).length === 0) {
      console.log("ℹ️  OrderStatus enum does not exist in database");
      
      // Check if status column uses the enum
      const statusType = await prisma.$queryRaw`
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'Sale' AND column_name = 'status'
      `;
      console.log("Status column type:", statusType);
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixStatusColumn();
