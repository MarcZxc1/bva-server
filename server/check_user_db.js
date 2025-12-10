const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const userId = "b70dc70d-01fa-42c4-8226-3395f82e8f6f";
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, platform: true },
  });
  
  console.log("User:", JSON.stringify(user, null, 2));
  
  if (user) {
    const shops = await prisma.shop.findMany({
      where: { ownerId: userId },
    });
    
    console.log("Shops:", JSON.stringify(shops, null, 2));
    console.log("Shops count:", shops.length);
    
    if (shops.length === 0 && user.role === "SELLER") {
      console.log("\n❌ PROBLEM: SELLER has no shops! This is the root cause.");
      console.log("   Creating a shop now...");
      
      const newShop = await prisma.shop.create({
        data: {
          name: `${user.name || user.email.split("@")[0]}'s Shop`,
          ownerId: userId,
        },
      });
      
      console.log("✅ Shop created:", JSON.stringify(newShop, null, 2));
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
