// Quick fix script to convert SHOPEE shop to LAZADA
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function fixShopPlatform() {
  const shopId = 'e342db56-4eae-4c7e-911d-2362f470ee3f';
  
  console.log(`🔧 Fixing shop ${shopId} to LAZADA platform...`);
  
  // Update the shop
  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: {
      platform: 'LAZADA',
      name: "Gerald Cram's LAZADA Shop"
    }
  });
  
  console.log(`✅ Shop updated:`, shop);
  
  // Also update the user's platform
  const user = await prisma.user.update({
    where: { id: shop.ownerId },
    data: {
      platform: 'LAZADA_CLONE'
    },
    select: { id: true, email: true, platform: true }
  });
  
  console.log(`✅ User updated:`, user);
  
  // Update any existing orders to LAZADA platform
  const orders = await prisma.sale.updateMany({
    where: { shopId: shopId },
    data: { platform: 'LAZADA' }
  });
  
  console.log(`✅ Updated ${orders.count} orders to LAZADA platform`);
  
  await prisma.$disconnect();
}

fixShopPlatform().catch(console.error);
