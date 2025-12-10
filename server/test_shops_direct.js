const { PrismaClient } = require('./src/generated/prisma');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function test() {
  const userId = 'b70dc70d-01fa-42c4-8226-3395f82e8f6f';
  
  // Check database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Shop: true }
  });
  
  console.log('=== DATABASE CHECK ===');
  console.log('User:', { id: user.id, email: user.email, role: user.role });
  console.log('Shops from DB:', user.Shop);
  console.log('Shop count from DB:', user.Shop.length);
  
  // Create a valid JWT with the correct secret
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign({ userId }, JWT_SECRET);
  
  console.log('\n=== API TEST ===');
  console.log('JWT Token:', token.substring(0, 50) + '...');
  
  // Test API endpoint
  const res = await fetch('http://localhost:3000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log('API Response status:', res.status);
  console.log('API Response:', JSON.stringify(data, null, 2));
  
  if (data.data) {
    console.log('\n=== COMPARISON ===');
    console.log('DB shops count:', user.Shop.length);
    console.log('API shops count:', data.data.shops?.length || 0);
    console.log('API shops:', data.data.shops);
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
