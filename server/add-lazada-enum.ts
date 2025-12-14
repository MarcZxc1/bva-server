// Add LAZADA_CLONE to UserPlatform enum
import prisma from './src/lib/prisma';

async function addLazadaEnum() {
  try {
    // Execute raw SQL to add enum value
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'LAZADA_CLONE' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserPlatform')
        ) THEN
          ALTER TYPE "UserPlatform" ADD VALUE 'LAZADA_CLONE';
        END IF;
      END$$;
    `);
    
    console.log('✅ LAZADA_CLONE added to UserPlatform enum');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLazadaEnum();
