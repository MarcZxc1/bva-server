// Real-time order fetching test for a specific seller
import prisma from './src/lib/prisma';

async function testSellerOrderFetch(email: string) {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   SELLER ORDER FETCH TEST              ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  // Step 1: Find user
  const user = await prisma.user.findFirst({
    where: { 
      email: email,
      platform: 'LAZADA_CLONE'
    },
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
          platform: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc' // LAZADA shop should come first (created first)
        }
      }
    }
  });

  if (!user) {
    console.log('❌ User not found with email:', email);
    return;
  }

  console.log('✅ STEP 1: User Found');
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    platform: user.platform
  });

  // Step 2: List all shops
  console.log('\n📦 STEP 2: User\'s Shops');
  user.Shop.forEach((shop, index) => {
    console.log(`  ${index + 1}. ${shop.name}`);
    console.log(`     ID: ${shop.id}`);
    console.log(`     Platform: ${shop.platform}`);
    console.log(`     Created: ${shop.createdAt}`);
  });

  // Step 3: Apply shop selection logic (same as frontend)
  console.log('\n🎯 STEP 3: Shop Selection Logic');
  const allShops = user.Shop;
  const lazadaShop = allShops.find(s => s.platform === 'LAZADA');
  const selectedShop = lazadaShop || allShops[0];

  if (!selectedShop) {
    console.log('❌ No shop found for user!');
    return;
  }

  console.log('Selected Shop:', {
    id: selectedShop.id,
    name: selectedShop.name,
    platform: selectedShop.platform,
    reason: lazadaShop ? 'LAZADA shop found (priority)' : 'First shop (fallback)'
  });

  // Step 4: Fetch orders for selected shop
  console.log('\n📋 STEP 4: Fetching Orders');
  const orders = await prisma.sale.findMany({
    where: { shopId: selectedShop.id },
    orderBy: { createdAt: 'desc' },
    include: {
      Shop: {
        select: { name: true, platform: true }
      }
    }
  });

  console.log(`Found ${orders.length} orders in ${selectedShop.name}\n`);

  if (orders.length === 0) {
    console.log('❌ NO ORDERS FOUND');
    console.log('\nPossible reasons:');
    console.log('1. No buyers have placed orders yet');
    console.log('2. Orders are in a different shop (check other shops)');
    
    // Check all shops for orders
    console.log('\n🔍 Checking ALL shops for orders:');
    for (const shop of allShops) {
      const shopOrders = await prisma.sale.findMany({
        where: { shopId: shop.id }
      });
      console.log(`  ${shop.name} (${shop.platform}): ${shopOrders.length} orders`);
    }
  } else {
    console.log('✅ ORDERS FOUND:\n');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.id.slice(0, 8)}...`);
      console.log(`   Total: ₱${order.total.toLocaleString()}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Customer: ${order.customerEmail}`);
      console.log(`   Date: ${order.createdAt}`);
      console.log(`   Items: ${JSON.stringify(order.items)}`);
      console.log();
    });
  }

  // Step 5: Test what API would return
  console.log('═══════════════════════════════════════');
  console.log('📡 STEP 5: Simulated API Response');
  console.log('═══════════════════════════════════════\n');

  const apiResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      platform: user.platform,
      shops: user.Shop.map(s => ({
        id: s.id,
        name: s.name,
        platform: s.platform
      }))
    },
    selectedShopId: selectedShop.id,
    orders: orders.map(o => ({
      id: o.id,
      total: o.total,
      status: o.status,
      customerEmail: o.customerEmail,
      createdAt: o.createdAt,
      items: o.items
    }))
  };

  console.log(JSON.stringify(apiResponse, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ User has ${allShops.length} shop(s)`);
  console.log(`✅ Selected shop: ${selectedShop.name} (${selectedShop.platform})`);
  console.log(`${orders.length > 0 ? '✅' : '❌'} Found ${orders.length} order(s)`);
  
  if (orders.length > 0) {
    console.log('\n🎉 SUCCESS: Seller CAN fetch orders!');
  } else {
    console.log('\n⚠️  WARNING: No orders found in selected shop');
    console.log('Action needed: Place test orders as a buyer');
  }
}

// Run test
const sellerEmail = process.argv[2] || 'dagodemarcgerald@gmail.com';
testSellerOrderFetch(sellerEmail)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
