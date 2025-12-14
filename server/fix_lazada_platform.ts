// Fix Lazada platform for existing users
// Run with: ts-node fix_lazada_platform.ts

import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function fixLazadaPlatform() {
  console.log('🔧 Starting Lazada platform fix...\n');

  try {
    // Find all users with SHOPEE_CLONE platform who might be Lazada users
    const shopeeUsers = await prisma.user.findMany({
      where: {
        platform: 'SHOPEE_CLONE'
      },
      include: {
        Shop: {
          where: {
            platform: 'SHOPEE'
          }
        }
      }
    });

    console.log(`Found ${shopeeUsers.length} users with SHOPEE_CLONE platform`);

    // For now, let's just display them and ask for confirmation
    // In a real scenario, you'd identify which ones should be Lazada
    
    if (shopeeUsers.length === 0) {
      console.log('✅ No users found that need migration');
      return;
    }

    console.log('\n📋 Users that might need platform change:');
    for (const user of shopeeUsers) {
      console.log(`  - ${user.email} (${user.id})`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Shops: ${user.Shop.length}`);
      if (user.Shop.length > 0) {
        user.Shop.forEach(shop => {
          console.log(`      └─ ${shop.name} (${shop.platform})`);
        });
      }
    }

    console.log('\n⚠️  Manual action required:');
    console.log('If you want to convert a specific user to LAZADA platform, use:');
    console.log('\n  UPDATE "User" SET platform = \'LAZADA_CLONE\' WHERE email = \'user@example.com\';');
    console.log('  UPDATE "Shop" SET platform = \'LAZADA\' WHERE "ownerId" = \'user-id\';');
    
    console.log('\n✅ Analysis complete');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixLazadaPlatform()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { fixLazadaPlatform };
