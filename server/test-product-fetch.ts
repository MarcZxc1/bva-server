// Test Lazada Clone product fetching
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testProductFetching() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   LAZADA PRODUCT FETCH TEST            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Test 1: Fetch all products (no filter)
    console.log('TEST 1: Fetch ALL products (no platform filter)');
    const allResponse = await axios.get(`${API_URL}/products`);
    const allProducts = (allResponse.data as any).data || allResponse.data;
    console.log(`✅ Found ${(allProducts as any[]).length} total products\n`);

    // Test 2: Fetch LAZADA products only
    console.log('TEST 2: Fetch LAZADA products only');
    const lazadaResponse = await axios.get(`${API_URL}/products`, {
      params: { platform: 'LAZADA' }
    });
    const lazadaProducts = (lazadaResponse.data as any).data || lazadaResponse.data;
    console.log(`✅ Found ${(lazadaProducts as any[]).length} LAZADA products`);
    
    if ((lazadaProducts as any[]).length > 0) {
      console.log('\nLAZADA Products:');
      (lazadaProducts as any[]).forEach((p: any, index: number) => {
        console.log(`  ${index + 1}. ${p.name}`);
        console.log(`     Price: ₱${p.price.toLocaleString()}`);
        console.log(`     Stock: ${p.stock}`);
        console.log(`     Shop: ${p.shopName}`);
        console.log(`     Platform: ${p.Shop?.platform || 'N/A'}`);
      });
    } else {
      console.log('❌ No LAZADA products found!');
      console.log('   This means buyers will see an empty product list.');
    }

    // Test 3: Fetch SHOPEE products only (should be 0 for comparison)
    console.log('\n\nTEST 3: Fetch SHOPEE products only (for comparison)');
    const shopeeResponse = await axios.get(`${API_URL}/products`, {
      params: { platform: 'SHOPEE' }
    });
    const shopeeProducts = (shopeeResponse.data as any).data || shopeeResponse.data;
    console.log(`Found ${(shopeeProducts as any[]).length} SHOPEE products`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total products: ${(allProducts as any[]).length}`);
    console.log(`LAZADA products: ${(lazadaProducts as any[]).length}`);
    console.log(`SHOPEE products: ${(shopeeProducts as any[]).length}`);
    
    if ((lazadaProducts as any[]).length > 0) {
      console.log('\n🎉 SUCCESS!');
      console.log('Lazada Clone should now be able to fetch products.');
      console.log('\nNext steps:');
      console.log('1. Start the server: cd server && npm run dev');
      console.log('2. Start Lazada Clone: cd lazada-clone && npm run dev');
      console.log('3. Open http://localhost:3001/products');
      console.log('4. You should see the LAZADA products listed above');
    } else {
      console.log('\n⚠️  WARNING: No LAZADA products found!');
      console.log('Please create products as a seller first.');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.log('\nIs the server running?');
    console.log('Run: cd server && npm run dev');
  }
}

testProductFetching();
