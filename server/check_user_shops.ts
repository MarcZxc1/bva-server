import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { 
      email_platform: {
        email: 'kagureyasuo@gmail.com',
        platform: 'SHOPEE_CLONE'
      }
    },
    include: {
      Shop: true
    }
  });
  
  console.log('User:', JSON.stringify(user, null, 2));
  
  if (user) {
    const shops = await prisma.shop.findMany({
      where: {
        ownerId: user.id,
        platform: 'SHOPEE'
      }
    });
    console.log('\nShops for user (platform SHOPEE):', JSON.stringify(shops, null, 2));
    
    const allShops = await prisma.shop.findMany({
      where: {
        ownerId: user.id
      }
    });
    console.log('\nAll shops for user:', JSON.stringify(allShops, null, 2));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
