// Test OAuth state parameter decoding

const testStates = [
  {
    name: 'URL-encoded JSON (Lazada Clone format)',
    state: encodeURIComponent(JSON.stringify({ 
      redirectUrl: 'http://localhost:3001',
      role: 'SELLER',
      platform: 'LAZADA_CLONE',
    })),
  },
  {
    name: 'Base64 encoded (old format)',
    state: Buffer.from(JSON.stringify({ 
      redirectUrl: 'http://localhost:3001',
      role: 'SELLER',
      platform: 'LAZADA_CLONE',
    })).toString('base64'),
  },
];

console.log('Testing OAuth state parameter decoding:\n');

testStates.forEach(test => {
  console.log(`\n📝 Test: ${test.name}`);
  console.log(`State: ${test.state.substring(0, 50)}...`);
  
  let decodedState: any = null;
  let method = '';
  
  // Try URL-encoded first (new format)
  try {
    decodedState = JSON.parse(decodeURIComponent(test.state));
    method = 'URL-encoded';
  } catch {
    // Fall back to base64 (old format)
    try {
      decodedState = JSON.parse(Buffer.from(test.state, 'base64').toString('utf-8'));
      method = 'Base64';
    } catch (e) {
      console.log('❌ Failed to decode');
      return;
    }
  }
  
  console.log(`✅ Decoded using: ${method}`);
  console.log(`   redirectUrl: ${decodedState.redirectUrl}`);
  console.log(`   role: ${decodedState.role}`);
  console.log(`   platform: ${decodedState.platform}`);
});

console.log('\n\n🔍 Testing platform detection logic:\n');

const redirectUrl = 'http://localhost:3001';
let platform = 'BVA';

if (platform === 'BVA') {
  if (redirectUrl.includes('3001') || redirectUrl.includes('lazada')) {
    platform = 'LAZADA_CLONE';
    console.log(`✅ Platform detected from redirectUrl: LAZADA_CLONE`);
  } else if (redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller')) {
    platform = 'TIKTOK_CLONE';
    console.log(`✅ Platform detected from redirectUrl: TIKTOK_CLONE`);
  } else if (redirectUrl.includes('5173') || redirectUrl.includes('shopee')) {
    platform = 'SHOPEE_CLONE';
    console.log(`✅ Platform detected from redirectUrl: SHOPEE_CLONE`);
  }
}

console.log(`\nFinal platform: ${platform}`);

const shopPlatform = platform === 'SHOPEE_CLONE' ? 'SHOPEE' 
  : platform === 'TIKTOK_CLONE' ? 'TIKTOK'
  : platform === 'LAZADA_CLONE' ? 'LAZADA'
  : 'SHOPEE';

console.log(`Shop platform: ${shopPlatform}\n`);
