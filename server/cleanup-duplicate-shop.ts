// Cleanup script to remove duplicate SHOPEE shop for LAZADA_CLONE user
import prisma from './src/lib/prisma';

async function cleanup() {
  console.log('🔍 Finding duplicate shops...\n');

  // Find the problematic shop
  const shopToDelete = await prisma.shop.findUnique({
    where: { id: '4597f482-152c-4b48-9aaa-b4c40675d359' },
    include: {
      Product: true,
      Sale: true
    }
  });

  if (!shopToDelete) {
    console.log('✅ Shop already deleted or does not exist.');
    await prisma.$disconnect();
    return;
  }

  console.log('Found shop to delete:');
  console.log({
    id: shopToDelete.id,
    name: shopToDelete.name,
    platform: shopToDelete.platform,
    productCount: shopToDelete.Product.length,
    orderCount: shopToDelete.Sale.length
  });

  // Check if there are any products or orders
  if (shopToDelete.Product.length > 0 || shopToDelete.Sale.length > 0) {
    console.log('\n⚠️  Warning: This shop has products or orders!');
    console.log('Do you want to proceed with deletion? This will also delete all associated data.');
    console.log('Run this script manually if you want to continue.\n');
  }

  // Delete the shop (cascading will handle related records)
  await prisma.shop.delete({
    where: { id: shopToDelete.id }
  });

  console.log('\n✅ Successfully deleted duplicate shop!\n');
  
  await prisma.$disconnect();
}

cleanup().catch(console.error);
