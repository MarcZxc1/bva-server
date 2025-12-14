import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    // Get all shops
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true },
    });

    console.log(`\n📊 Checking products for ${shops.length} shops...\n`);

    for (const shop of shops) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Shop: ${shop.name} (${shop.id})`);
      console.log('='.repeat(60));

      const products = await prisma.product.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          name: true,
          sku: true,
          externalId: true,
          price: true,
          stock: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`\nTotal Products: ${products.length}\n`);

      // Group by name to detect duplicates
      const productsByName = new Map<string, typeof products>();
      products.forEach(p => {
        const name = p.name.toLowerCase().trim();
        if (!productsByName.has(name)) {
          productsByName.set(name, []);
        }
        productsByName.get(name)!.push(p);
      });

      // Show duplicates
      const duplicates = Array.from(productsByName.entries()).filter(([_, prods]) => prods.length > 1);
      if (duplicates.length > 0) {
        console.log(`⚠️  Found ${duplicates.length} product names with duplicates:\n`);
        duplicates.forEach(([name, prods]) => {
          console.log(`  "${name}" (${prods.length} entries):`);
          prods.forEach(p => {
            console.log(`    - ID: ${p.id.substring(0, 8)}... | SKU: ${p.sku} | ExternalID: ${p.externalId || 'null'} | Stock: ${p.stock} | Created: ${p.createdAt.toISOString().split('T')[0]}`);
          });
          console.log('');
        });
      } else {
        console.log(`✅ No duplicate product names found\n`);
      }

      // Show all products
      console.log(`All Products:`);
      products.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name}`);
        console.log(`     ID: ${p.id.substring(0, 8)}... | SKU: ${p.sku} | ExternalID: ${p.externalId || 'null'}`);
        console.log(`     Price: ₱${p.price} | Stock: ${p.stock}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkProducts();
