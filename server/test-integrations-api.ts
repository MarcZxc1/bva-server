import prisma from './src/lib/prisma';

async function testIntegrationsAPI() {
  // Get the user
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'dagodemarcgeraldarante' } },
    include: {
      Shop: { select: { id: true, name: true, platform: true } },
      ShopAccess: {
        include: { Shop: { select: { id: true, name: true, platform: true } } }
      }
    }
  });
  
  if (!user) {
    console.log('User not found');
    await prisma.$disconnect();
    return;
  }
  
  // Get all shop IDs accessible by this user
  const shopIds = [
    ...user.Shop.map(s => s.id),
    ...user.ShopAccess.map(a => a.Shop.id)
  ];
  
  console.log('👤 User:', user.email);
  console.log('📦 Accessible Shop IDs:', shopIds);
  console.log('\n🏪 Shops:');
  user.Shop.forEach(s => console.log(`   Owned: ${s.name} (${s.platform}) - ${s.id}`));
  user.ShopAccess.forEach(a => console.log(`   Linked: ${a.Shop.name} (${a.Shop.platform}) - ${a.Shop.id}`));
  
  // Get integrations for these shops
  const integrations = await prisma.integration.findMany({
    where: {
      shopId: { in: shopIds }
    },
    include: {
      Shop: {
        select: { id: true, name: true, platform: true }
      }
    }
  });
  
  console.log('\n🔗 Integrations returned by API:');
  if (integrations.length === 0) {
    console.log('   No integrations found');
  } else {
    integrations.forEach(i => {
      const settings = i.settings as any;
      const match = i.platform === i.Shop.platform ? '✅' : '❌';
      console.log(`\n${match} Integration:`);
      console.log(`   ID: ${i.id}`);
      console.log(`   Platform: ${i.platform}`);
      console.log(`   Shop: ${i.Shop.name} (${i.Shop.platform})`);
      console.log(`   Shop ID: ${i.shopId}`);
      console.log(`   Active: ${settings?.isActive !== false}`);
      console.log(`   Terms: ${settings?.termsAccepted === true}`);
    });
  }
  
  await prisma.$disconnect();
}

testIntegrationsAPI().catch(console.error);
