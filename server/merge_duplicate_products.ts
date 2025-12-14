import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function mergeDuplicateProducts() {
  try {
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true },
    });

    console.log(`\n🔧 Merging duplicate products for ${shops.length} shops...\n`);

    for (const shop of shops) {
      console.log(`\nShop: ${shop.name} (${shop.id})`);
      
      const products = await prisma.product.findMany({
        where: { shopId: shop.id },
        include: { Inventory: true },
        orderBy: { createdAt: 'asc' }, // Keep oldest
      });

      // Group by name (case-insensitive)
      const productsByName = new Map<string, typeof products>();
      products.forEach(p => {
        const name = p.name.toLowerCase().trim();
        if (!productsByName.has(name)) {
          productsByName.set(name, []);
        }
        productsByName.get(name)!.push(p);
      });

      // Process duplicates
      for (const [name, prods] of productsByName.entries()) {
        if (prods.length > 1) {
          console.log(`\n  Merging ${prods.length} "${name}" products...`);
          
          // Keep the first product (oldest), merge data from duplicates
          const keepProduct = prods[0];
          const duplicates = prods.slice(1);
          
          // Sum up stock from all duplicates
          const totalStock = prods.reduce((sum, p) => sum + (p.stock || 0), 0);
          
          // Keep the externalId from the kept product (don't change it to avoid conflicts)
          const keepExternalId = keepProduct.externalId;
          
          console.log(`    Keeping product ID: ${keepProduct.id.substring(0, 8)}...`);
          console.log(`    Total stock from all duplicates: ${totalStock}`);
          console.log(`    External ID: ${keepExternalId || 'null'}`);
          
          // Delete duplicates first (this will free up their externalIds)
          for (const dup of duplicates) {
            console.log(`    Deleting duplicate ID: ${dup.id.substring(0, 8)}... (externalId: ${dup.externalId || 'null'})`);
            
            // Delete inventory first
            await prisma.inventory.deleteMany({
              where: { productId: dup.id },
            });
            
            // Delete product
            await prisma.product.delete({
              where: { id: dup.id },
            });
          }
          
          // Now update the kept product with merged stock
          await prisma.product.update({
            where: { id: keepProduct.id },
            data: {
              stock: totalStock,
              updatedAt: new Date(),
            },
          });
          
          // Update inventory for kept product
          if (keepProduct.Inventory.length > 0) {
            await prisma.inventory.update({
              where: { id: keepProduct.Inventory[0].id },
              data: {
                quantity: totalStock,
                updatedAt: new Date(),
              },
            });
          }
          
          console.log(`    ✅ Merged ${prods.length} products into 1`);
        }
      }
    }

    console.log('\n✅ All duplicate products merged successfully!\n');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

mergeDuplicateProducts();
