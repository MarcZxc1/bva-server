import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function checkSalesStatus() {
  try {
    // Get all sales grouped by status
    const salesByStatus = await prisma.sale.groupBy({
      by: ['status'],
      _sum: {
        total: true,
        revenue: true,
      },
      _count: {
        _all: true,
      },
    });

    console.log('\n📊 Sales Summary by Status:');
    console.log('='.repeat(60));
    salesByStatus.forEach((group) => {
      console.log(`Status: ${group.status || 'NULL'}`);
      console.log(`  Count: ${group._count._all}`);
      console.log(`  Total: PHP ${group._sum.total?.toFixed(2) || 0}`);
      console.log(`  Revenue: PHP ${group._sum.revenue?.toFixed(2) || 0}`);
      console.log('-'.repeat(60));
    });

    // Get overall totals
    const allSales = await prisma.sale.aggregate({
      _sum: {
        total: true,
        revenue: true,
      },
      _count: {
        _all: true,
      },
    });

    console.log('\n💰 Overall Totals (All Statuses):');
    console.log('='.repeat(60));
    console.log(`Total Sales Count: ${allSales._count._all}`);
    console.log(`Total Amount: PHP ${allSales._sum.total?.toFixed(2) || 0}`);
    console.log(`Total Revenue: PHP ${allSales._sum.revenue?.toFixed(2) || 0}`);

    // Get completed sales only
    const completedSales = await prisma.sale.aggregate({
      where: {
        status: 'completed',
      },
      _sum: {
        total: true,
        revenue: true,
      },
      _count: {
        _all: true,
      },
    });

    console.log('\n✅ Completed Sales Only:');
    console.log('='.repeat(60));
    console.log(`Completed Sales Count: ${completedSales._count._all}`);
    console.log(`Completed Total: PHP ${completedSales._sum.total?.toFixed(2) || 0}`);
    console.log(`Completed Revenue: PHP ${completedSales._sum.revenue?.toFixed(2) || 0}`);

    // Show individual sales
    const sales = await prisma.sale.findMany({
      select: {
        id: true,
        status: true,
        total: true,
        revenue: true,
        platform: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📋 Individual Sales:');
    console.log('='.repeat(60));
    sales.forEach((sale) => {
      console.log(`ID: ${sale.id.substring(0, 8)}... | Status: ${sale.status} | Total: PHP ${sale.total} | Revenue: PHP ${sale.revenue || sale.total} | Platform: ${sale.platform}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalesStatus();
