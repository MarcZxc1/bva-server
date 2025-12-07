const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function checkData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const shopId = '2aad5d00-d302-4c57-86ad-99826e19e610';
  
  const products = await prisma.product.findMany({
    where: { shopId },
    include: { inventories: true }
  });
  
  const sales = await prisma.sale.findMany({
    where: { shopId }
  });
  
  console.log('🔍 CHECKING SHOP DATA');
  console.log('=====================');
  console.log('Shop ID:', shopId);
  console.log('Products found:', products.length);
  console.log('Sales found:', sales.length);
  console.log('Products with inventory:', products.filter(p => p.inventories.length > 0).length);
  
  if (products.length > 0) {
    console.log('\n📦 Sample Product:');
    const sample = products[0];
    console.log('ID:', sample.id);
    console.log('Name:', sample.name);
    console.log('SKU:', sample.sku);
    console.log('Price:', sample.price);
    console.log('Cost:', sample.cost);
    console.log('Inventory:', sample.inventories[0]?.quantity || 'No inventory');
  } else {
    console.log('\n❌ NO PRODUCTS FOUND for shopId:', shopId);
  }
  
  if (sales.length > 0) {
    console.log('\n💰 Sample Sale:');
    console.log(sales[0]);
  }
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
