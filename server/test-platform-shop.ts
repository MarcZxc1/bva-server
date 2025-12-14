import prisma from './src/lib/prisma';
import { integrationService } from './src/service/integration.service';

async function testGetShopByPlatform() {
  // Get a user who has both Shopee and Lazada shops
  const user = await prisma.user.findFirst({
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
          platform: true
        }
      },
      ShopAccess: {
        include: {
          Shop: {
            select: {
              id: true,
              name: true,
              platform: true
            }
          }
        }
      }
    },
    where: {
      OR: [
        { Shop: { some: {} } },
        { ShopAccess: { some: {} } }
      ]
    }
  });
  
  if (!user) {
    console.log('❌ No user found with shops');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`👤 Testing with user: ${user.email}`);
  console.log(`   Owned shops: ${user.Shop.length}`);
  user.Shop.forEach(s => console.log(`     - ${s.name} (${s.platform})`));
  console.log(`   Linked shops: ${user.ShopAccess.length}`);
  user.ShopAccess.forEach(a => console.log(`     - ${a.Shop.name} (${a.Shop.platform})`));
  
  // Test getting shop by platform
  const shopeeShopId = await integrationService.getShopIdByPlatform(user.id, 'SHOPEE' as any);
  const lazadaShopId = await integrationService.getShopIdByPlatform(user.id, 'LAZADA' as any);
  
  console.log(`\n📊 Results:`);
  console.log(`   SHOPEE shop ID: ${shopeeShopId || 'NOT FOUND'}`);
  console.log(`   LAZADA shop ID: ${lazadaShopId || 'NOT FOUND'}`);
  
  // Verify the shops
  if (shopeeShopId) {
    const shop = await prisma.shop.findUnique({ where: { id: shopeeShopId } });
    console.log(`   ✓ SHOPEE → ${shop?.name} (platform: ${shop?.platform})`);
  }
  
  if (lazadaShopId) {
    const shop = await prisma.shop.findUnique({ where: { id: lazadaShopId } });
    console.log(`   ✓ LAZADA → ${shop?.name} (platform: ${shop?.platform})`);
  }
  
  await prisma.$disconnect();
}

testGetShopByPlatform().catch(console.error);
