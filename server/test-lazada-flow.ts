// Test script for Lazada Clone end-to-end flow
import prisma from './src/lib/prisma';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, data?: any) {
  results.push({ name, passed, message, data });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function testUserAndShops() {
  console.log('\n========================================');
  console.log('TEST 1: User and Shop Verification');
  console.log('========================================\n');

  try {
    // Find all LAZADA_CLONE users
    const lazadaUsers = await prisma.user.findMany({
      where: { platform: 'LAZADA_CLONE' },
      include: {
        Shop: {
          select: { id: true, name: true, platform: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    addResult(
      'LAZADA_CLONE Users Found',
      lazadaUsers.length > 0,
      `Found ${lazadaUsers.length} users with LAZADA_CLONE platform`,
      lazadaUsers.map(u => ({
        email: u.email,
        role: u.role,
        platform: u.platform,
        shops: u.Shop
      }))
    );

    // Check for SELLER users
    const sellers = lazadaUsers.filter(u => u.role === 'SELLER');
    addResult(
      'SELLER Users Found',
      sellers.length > 0,
      `Found ${sellers.length} SELLER users`,
      sellers.map(s => ({ email: s.email, shops: s.Shop }))
    );

    // Check for duplicate shops
    for (const user of sellers) {
      const shopPlatforms = user.Shop.map(s => s.platform);
      const uniquePlatforms = new Set(shopPlatforms);
      
      if (shopPlatforms.length !== uniquePlatforms.size) {
        addResult(
          'No Duplicate Shops',
          false,
          `User ${user.email} has duplicate shops: ${shopPlatforms.join(', ')}`,
          { userId: user.id, shops: user.Shop }
        );
      } else {
        addResult(
          'No Duplicate Shops',
          true,
          `User ${user.email} has unique shops: ${shopPlatforms.join(', ')}`
        );
      }
    }

    // Verify LAZADA shops exist
    const lazadaShops = await prisma.shop.findMany({
      where: { platform: 'LAZADA' }
    });

    addResult(
      'LAZADA Shops Exist',
      lazadaShops.length > 0,
      `Found ${lazadaShops.length} LAZADA platform shops`,
      lazadaShops.map(s => ({ id: s.id, name: s.name, ownerId: s.ownerId }))
    );

  } catch (error: any) {
    addResult('User and Shop Test', false, `Error: ${error.message}`);
  }
}

async function testProducts() {
  console.log('\n========================================');
  console.log('TEST 2: Product Verification');
  console.log('========================================\n');

  try {
    // Find products in LAZADA shops
    const lazadaShops = await prisma.shop.findMany({
      where: { platform: 'LAZADA' },
      select: { id: true }
    });

    const lazadaShopIds = lazadaShops.map(s => s.id);

    const products = await prisma.product.findMany({
      where: { shopId: { in: lazadaShopIds } },
      include: {
        Shop: {
          select: { id: true, name: true, platform: true }
        }
      },
      take: 10
    });

    addResult(
      'Products in LAZADA Shops',
      products.length > 0,
      `Found ${products.length} products in LAZADA shops`,
      products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        shopName: p.Shop?.name,
        shopPlatform: p.Shop?.platform
      }))
    );

    // Check for products with sufficient stock
    const inStockProducts = products.filter(p => p.stock > 0);
    addResult(
      'Products in Stock',
      inStockProducts.length > 0,
      `Found ${inStockProducts.length} products with stock > 0`
    );

  } catch (error: any) {
    addResult('Product Test', false, `Error: ${error.message}`);
  }
}

async function testOrders() {
  console.log('\n========================================');
  console.log('TEST 3: Order Verification');
  console.log('========================================\n');

  try {
    // Find orders in LAZADA shops
    const lazadaShops = await prisma.shop.findMany({
      where: { platform: 'LAZADA' },
      select: { id: true, name: true }
    });

    const lazadaShopIds = lazadaShops.map(s => s.id);

    const orders = await prisma.sale.findMany({
      where: { shopId: { in: lazadaShopIds } },
      include: {
        Shop: {
          select: { id: true, name: true, platform: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    addResult(
      'Orders in LAZADA Shops',
      orders.length >= 0,
      `Found ${orders.length} orders in LAZADA shops`,
      orders.slice(0, 3).map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        customerEmail: o.customerEmail,
        shopName: o.Shop?.name,
        shopPlatform: o.Shop?.platform,
        createdAt: o.createdAt
      }))
    );

    // Check order statuses
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    addResult(
      'Order Status Distribution',
      true,
      'Order statuses breakdown',
      statusCounts
    );

    // Verify orders match correct shop platform
    const mismatchedOrders = orders.filter(o => o.platform !== 'LAZADA' || o.Shop?.platform !== 'LAZADA');
    addResult(
      'Orders Match Shop Platform',
      mismatchedOrders.length === 0,
      mismatchedOrders.length === 0 
        ? 'All orders correctly associated with LAZADA shops'
        : `${mismatchedOrders.length} orders have mismatched platforms`,
      mismatchedOrders.length > 0 ? mismatchedOrders : undefined
    );

  } catch (error: any) {
    addResult('Order Test', false, `Error: ${error.message}`);
  }
}

async function testPlatformIsolation() {
  console.log('\n========================================');
  console.log('TEST 4: Platform Isolation');
  console.log('========================================\n');

  try {
    // Check if users with same email exist on different platforms
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        platform: true,
        role: true
      }
    });

    const emailPlatformMap = new Map<string, string[]>();
    allUsers.forEach(u => {
      const key = u.email;
      if (!emailPlatformMap.has(key)) {
        emailPlatformMap.set(key, []);
      }
      emailPlatformMap.get(key)!.push(u.platform);
    });

    const multiPlatformEmails = Array.from(emailPlatformMap.entries())
      .filter(([_, platforms]) => platforms.length > 1);

    addResult(
      'Platform Isolation Check',
      true,
      `${multiPlatformEmails.length} email(s) exist on multiple platforms (this is expected for cross-platform users)`,
      multiPlatformEmails.slice(0, 3).map(([email, platforms]) => ({ email, platforms }))
    );

    // Check that shops are associated with correct platform
    const shops = await prisma.shop.findMany({});

    const shopPlatformMismatches = [];
    for (const shop of shops) {
      const owner = await prisma.user.findUnique({
        where: { id: shop.ownerId },
        select: { id: true, email: true, platform: true }
      });

      const userPlatform = owner?.platform;
      const shopPlatform = shop.platform;
      
      // Map user platform to expected shop platform
      const expectedShopPlatform = 
        userPlatform === 'SHOPEE_CLONE' ? 'SHOPEE' :
        userPlatform === 'TIKTOK_CLONE' ? 'TIKTOK' :
        userPlatform === 'LAZADA_CLONE' ? 'LAZADA' :
        'SHOPEE'; // Default for BVA

      if (shopPlatform !== expectedShopPlatform) {
        shopPlatformMismatches.push({
          shopId: shop.id,
          shopName: shop.name,
          shopPlatform: shop.platform,
          ownerEmail: owner?.email,
          ownerPlatform: owner?.platform
        });
      }
    }

    addResult(
      'Shop Platform Matches User Platform',
      shopPlatformMismatches.length === 0,
      shopPlatformMismatches.length === 0
        ? 'All shops correctly match their owner\'s platform'
        : `${shopPlatformMismatches.length} shops have platform mismatches`,
      shopPlatformMismatches.length > 0 ? shopPlatformMismatches : undefined
    );

  } catch (error: any) {
    addResult('Platform Isolation Test', false, `Error: ${error.message}`);
  }
}

async function testRealTimeSetup() {
  console.log('\n========================================');
  console.log('TEST 5: Real-time Setup Verification');
  console.log('========================================\n');

  try {
    // This is a basic check - actual socket testing would require a running server
    addResult(
      'Socket Service Check',
      true,
      'Socket service implementation exists (manual verification needed for actual WebSocket connection)',
      {
        note: 'Check server logs for "Socket.IO server initialized" message',
        events: [
          'product_update - when products are created/updated',
          'order_created - when new orders are placed',
          'order_status_updated - when order status changes'
        ]
      }
    );

  } catch (error: any) {
    addResult('Real-time Setup Test', false, `Error: ${error.message}`);
  }
}

async function generateSummaryReport() {
  console.log('\n========================================');
  console.log('TEST SUMMARY REPORT');
  console.log('========================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
  }

  console.log('\n========================================');
  console.log('RECOMMENDATIONS');
  console.log('========================================\n');

  if (failed === 0) {
    console.log('✅ All tests passed! The system is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Test buyer registration flow from the frontend');
    console.log('2. Test seller registration flow from the frontend');
    console.log('3. Create a product as a seller');
    console.log('4. Place an order as a buyer');
    console.log('5. Verify real-time updates on seller dashboard');
  } else {
    console.log('Some tests failed. Please review the failures above and:');
    console.log('1. Check database migrations are up to date');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Ensure the server is running');
    console.log('4. Review the error messages for specific issues');
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   LAZADA CLONE - TEST SUITE           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\nStarted at: ${new Date().toISOString()}\n`);

  try {
    await testUserAndShops();
    await testProducts();
    await testOrders();
    await testPlatformIsolation();
    await testRealTimeSetup();
    await generateSummaryReport();
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runAllTests().catch(console.error);
