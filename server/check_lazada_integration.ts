import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function checkLazadaIntegration() {
  try {
    console.log('\n🔍 Checking Lazada Integrations...\n');
    
    const integrations = await prisma.integration.findMany({
      where: { platform: 'LAZADA' },
      select: {
        id: true,
        platform: true,
        shopId: true,
        settings: true,
        createdAt: true,
      }
    });

    console.log(`Found ${integrations.length} Lazada integration(s):\n`);
    integrations.forEach((integration, index) => {
      console.log(`Integration #${index + 1}:`);
      console.log(`  ID: ${integration.id}`);
      console.log(`  Platform: ${integration.platform}`);
      console.log(`  Shop ID: ${integration.shopId}`);
      console.log(`  Settings:`, JSON.stringify(integration.settings, null, 2));
      console.log(`  Created At: ${integration.createdAt}`);
      console.log('');
    });

    // Check products for these shops
    console.log('\n📦 Checking Products for Lazada shops...\n');
    for (const integration of integrations) {
      const products = await prisma.product.findMany({
        where: { shopId: integration.shopId },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
        },
        take: 5,
      });
      
      console.log(`Shop ${integration.shopId} has ${products.length} products (showing first 5):`);
      products.forEach(p => {
        console.log(`  - ${p.name} (SKU: ${p.sku}, Stock: ${p.stock}, Platform: ${p.platform})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLazadaIntegration();
