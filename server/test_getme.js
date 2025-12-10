const fetch = require('node-fetch');

async function test() {
  // First, login to get a valid token
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'kagureyasuo@gmail.com',
      password: 'test123' // You may need to adjust this
    })
  });
  
  console.log('Login status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData, null, 2));
  
  if (loginData.success && loginData.data.token) {
    const token = loginData.data.token;
    
    // Now call /api/auth/me
    const meRes = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\ngetMe status:', meRes.status);
    const meData = await meRes.json();
    console.log('getMe response:', JSON.stringify(meData, null, 2));
    console.log('\nShops array:', meData.data?.shops);
    console.log('Shops count:', meData.data?.shops?.length);
  }
}

test().catch(console.error);
