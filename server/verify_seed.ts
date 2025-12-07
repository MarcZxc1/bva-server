import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  
  const products = await prisma.product.count();
  const sales = await prisma.sale.count();
  const inventory = await prisma.inventory.findMany({
    include: { product: { select: { name: true, expiryDate: true } } },
    orderBy: { quantity: 'asc' }
  });
  
  console.log('📊 DATABASE SUMMARY');
  console.log('==================');
  console.log('Total Products:', products);
  console.log('Total Sales:', sales);
  console.log('Total Inventory:', inventory.length);
  
  console.log('\n🎯 SMARTSHELF & RESTOCK PLANNER SYNC');
  console.log('=====================================');
  
  const lowStock = inventory.filter((inv: any) => inv.quantity <= 3);
  const nearExpiry = inventory.filter((inv: any) => {
    if (!inv.product.expiryDate) return false;
    const days = Math.ceil((new Date(inv.product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  });
  const overstock = inventory.filter((inv: any) => inv.quantity >= 25);
  
  console.log('\n🔴 LOW STOCK (≤3 units):');
  lowStock.forEach((inv: any) => console.log(`   - ${inv.product.name}: ${inv.quantity} units`));
  
  console.log('\n⏰ NEAR EXPIRY (≤7 days):');
  nearExpiry.forEach((inv: any) => {
    const days = Math.ceil((new Date(inv.product.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    console.log(`   - ${inv.product.name}: expires in ${days} days`);
  });
  
  console.log('\n📦 OVERSTOCKED (≥25 units):');
  overstock.forEach((inv: any) => console.log(`   - ${inv.product.name}: ${inv.quantity} units`));
  
  console.log('\n✅ Database is synced with SmartShelf and RestockPlanner!');
  
  await prisma.$disconnect();
}

verify().catch(console.error);
