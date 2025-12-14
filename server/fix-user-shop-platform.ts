// Fix existing user's shop platform from SHOPEE to LAZADA
import prisma from './src/lib/prisma';

async function fixUserShopPlatform() {
  const email = 'dagodemarcgerald@gmail.com'; // Current logged in user
  
  console.log(`\n🔧 Fixing shop platform for user: ${email}\n`);
  
  // Find user with SHOPEE shop who should have LAZADA shop
  const user = await prisma.user.findFirst({
    where: { 
      email,
      platform: 'LAZADA_CLONE' // User registered on LAZADA_CLONE
    },
    include: {
      Shop: true
    }
  });
  
  if (!user) {
    console.log('❌ User not found with LAZADA_CLONE platform');
    return;
  }
  
  console.log(`✅ Found user: ${user.email}`);
  console.log(`   Platform: ${user.platform}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Shops: ${user.Shop.length}`);
  
  // Find SHOPEE shop
  const shopeeShop = user.Shop.find(s => s.platform === 'SHOPEE');
  
  if (!shopeeShop) {
    console.log('❌ No SHOPEE shop found to convert');
    return;
  }
  
  console.log(`\n🔄 Converting shop:`);
  console.log(`   Shop ID: ${shopeeShop.id}`);
  console.log(`   Name: ${shopeeShop.name}`);
  console.log(`   Platform: ${shopeeShop.platform} → LAZADA`);
  
  // Update shop platform
  const updatedShop = await prisma.shop.update({
    where: { id: shopeeShop.id },
    data: { 
      platform: 'LAZADA',
      name: shopeeShop.name.replace('SHOPEE', 'LAZADA')
    }
  });
  
  console.log(`\n✅ Shop updated successfully!`);
  console.log(`   New name: ${updatedShop.name}`);
  console.log(`   New platform: ${updatedShop.platform}`);
  
  // Check if there are orders associated with this shop
  const orderCount = await prisma.sale.count({
    where: { shopId: shopeeShop.id }
  });
  
  console.log(`\n📦 Orders associated with this shop: ${orderCount}`);
  
  console.log(`\n✨ Done! User can now access their shop on Lazada Clone.`);
}

fixUserShopPlatform()
  .catch(console.error)
  .finally(() => process.exit());
