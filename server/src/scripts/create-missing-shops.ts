/**
 * Script to create shops for existing SELLER users who don't have one
 * Run with: npx ts-node src/scripts/create-missing-shops.ts
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function createMissingShops() {
  console.log('🔍 Finding SELLER users without shops...');
  
  // Find all SELLER users
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' },
    select: { id: true, email: true, name: true, firstName: true },
  });

  console.log(`Found ${sellers.length} SELLER users`);

  // Find all existing shops
  const existingShops = await prisma.shop.findMany({
    select: { ownerId: true },
  });

  const shopOwnerIds = new Set(existingShops.map((s: { ownerId: string }) => s.ownerId));
  
  // Find sellers without shops
  const sellersWithoutShops = sellers.filter((s: { id: string }) => !shopOwnerIds.has(s.id));

  console.log(`\n📊 Found ${sellersWithoutShops.length} SELLER users without shops:\n`);

  if (sellersWithoutShops.length === 0) {
    console.log('✅ All SELLER users already have shops!');
    await prisma.$disconnect();
    return;
  }

  // Create shops for each seller
  let created = 0;
  let failed = 0;

  for (const seller of sellersWithoutShops) {
    try {
      const shopName = `${seller.name || seller.firstName || seller.email.split('@')[0] || 'My'}'s Shop`;
      
      const shop = await prisma.shop.create({
        data: {
          name: shopName,
          ownerId: seller.id,
        },
      });

      console.log(`✅ Created shop "${shopName}" for ${seller.email} (ID: ${shop.id})`);
      created++;
    } catch (error: any) {
      console.error(`❌ Failed to create shop for ${seller.email}:`, error.message);
      failed++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total: ${sellersWithoutShops.length}`);

  await prisma.$disconnect();
}

createMissingShops()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

