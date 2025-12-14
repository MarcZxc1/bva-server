import { CacheService } from './src/lib/redis';

async function clearCache() {
  try {
    // Get all shops
    const { PrismaClient } = await import('./src/generated/prisma');
    const prisma = new PrismaClient();
    
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true },
    });

    console.log(`\n🔄 Clearing cache for ${shops.length} shops...\n`);

    for (const shop of shops) {
      console.log(`Clearing cache for shop: ${shop.name} (${shop.id})`);
      await CacheService.invalidateShop(shop.id);
    }

    console.log('\n✅ All shop caches cleared successfully!\n');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
