// File: server/test/restock-integration.test.ts
/**
 * Integration test for Restocking Strategy API
 *
 * Tests the full flow:
 * 1. Main server receives request
 * 2. Fetches data from database
 * 3. Calls ML service
 * 4. Returns formatted response
 *
 * Prerequisites:
 * - Database seeded with test data
 * - ML service running on port 8001
 * - Main server running on port 3000
 */

import axios from "axios";

const MAIN_SERVER_URL = "http://localhost:3000";
const TEST_SHOP_ID = process.env.TEST_SHOP_ID || "get-from-seed-output";

interface TestCase {
  name: string;
  payload: any;
  expectedStatus: number;
  validate: (response: any) => void;
}

const testCases: TestCase[] = [
  {
    name: "Profit Maximization Strategy",
    payload: {
      shopId: TEST_SHOP_ID,
      budget: 5000,
      goal: "profit",
      restockDays: 14,
    },
    expectedStatus: 200,
    validate: (response) => {
      console.assert(
        response.data.success === true,
        "Success flag should be true"
      );
      console.assert(
        response.data.data.strategy === "profit",
        "Strategy should be profit"
      );
      console.assert(
        response.data.data.recommendations.length > 0,
        "Should have recommendations"
      );
      console.assert(
        response.data.data.summary.totalCost <= 5000,
        "Total cost should not exceed budget"
      );
      console.assert(
        response.data.data.summary.expectedProfit > 0,
        "Expected profit should be positive"
      );
      console.log("✅ Profit strategy validation passed");
    },
  },
  {
    name: "Volume Maximization Strategy",
    payload: {
      shopId: TEST_SHOP_ID,
      budget: 3000,
      goal: "volume",
      restockDays: 7,
    },
    expectedStatus: 200,
    validate: (response) => {
      console.assert(
        response.data.success === true,
        "Success flag should be true"
      );
      console.assert(
        response.data.data.strategy === "volume",
        "Strategy should be volume"
      );
      console.assert(
        response.data.data.recommendations.length > 0,
        "Should have recommendations"
      );
      console.assert(
        response.data.data.summary.totalCost <= 3000,
        "Total cost should not exceed budget"
      );
      console.log("✅ Volume strategy validation passed");
    },
  },
  {
    name: "Balanced Strategy",
    payload: {
      shopId: TEST_SHOP_ID,
      budget: 10000,
      goal: "balanced",
      restockDays: 21,
    },
    expectedStatus: 200,
    validate: (response) => {
      console.assert(
        response.data.success === true,
        "Success flag should be true"
      );
      console.assert(
        response.data.data.strategy === "balanced",
        "Strategy should be balanced"
      );
      console.assert(
        response.data.data.recommendations.length > 0,
        "Should have recommendations"
      );
      console.assert(
        response.data.data.summary.expectedROI > 0,
        "Expected ROI should be positive"
      );
      console.log("✅ Balanced strategy validation passed");
    },
  },
  {
    name: "Invalid Goal",
    payload: {
      shopId: TEST_SHOP_ID,
      budget: 5000,
      goal: "invalid",
    },
    expectedStatus: 400,
    validate: (response) => {
      console.assert(response.data.error, "Should have error field");
      console.log("✅ Invalid goal validation passed");
    },
  },
  {
    name: "Missing Budget",
    payload: {
      shopId: TEST_SHOP_ID,
      goal: "profit",
    },
    expectedStatus: 400,
    validate: (response) => {
      console.assert(response.data.error, "Should have error field");
      console.log("✅ Missing budget validation passed");
    },
  },
  {
    name: "Negative Budget",
    payload: {
      shopId: TEST_SHOP_ID,
      budget: -1000,
      goal: "profit",
    },
    expectedStatus: 400,
    validate: (response) => {
      console.assert(response.data.error, "Should have error field");
      console.log("✅ Negative budget validation passed");
    },
  },
];

async function runTests() {
  console.log("🧪 Starting Restocking Strategy Integration Tests\n");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log("-".repeat(60));

    try {
      const response = await axios.post(
        `${MAIN_SERVER_URL}/api/ai/restock-strategy`,
        testCase.payload,
        { validateStatus: () => true } // Don't throw on non-2xx status
      );

      // Check status code
      if (response.status !== testCase.expectedStatus) {
        console.error(
          `❌ Expected status ${testCase.expectedStatus}, got ${response.status}`
        );
        failed++;
        continue;
      }

      console.log(`✓ Status: ${response.status}`);

      // Run custom validation
      testCase.validate(response);

      // Print summary for successful cases
      if (testCase.expectedStatus === 200) {
        const data = response.data.data;
        console.log(`\n📊 Results:`);
        console.log(`   Strategy: ${data.strategy}`);
        console.log(`   Products Selected: ${data.summary.totalProducts}`);
        console.log(`   Total Quantity: ${data.summary.totalQuantity}`);
        console.log(`   Total Cost: ₱${data.summary.totalCost.toFixed(2)}`);
        console.log(
          `   Budget Used: ${data.summary.budgetUtilization.toFixed(1)}%`
        );
        console.log(
          `   Expected Profit: ₱${data.summary.expectedProfit.toFixed(2)}`
        );
        console.log(`   Expected ROI: ${data.summary.expectedROI.toFixed(1)}%`);

        if (data.recommendations.length > 0) {
          console.log(`\n   Top Recommendation:`);
          const top = data.recommendations[0];
          console.log(`   - ${top.productName}`);
          console.log(`   - Qty: ${top.recommendedQty} units`);
          console.log(`   - Cost: ₱${top.totalCost.toFixed(2)}`);
          console.log(`   - Profit: ₱${top.expectedProfit.toFixed(2)}`);
        }
      }

      passed++;
      console.log(`\n✅ Test PASSED`);
    } catch (error: any) {
      console.error(`❌ Test FAILED: ${error.message}`);
      if (error.response) {
        console.error(
          `   Response: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
      failed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Integration is working correctly.");
  } else {
    console.log("\n⚠️ Some tests failed. Please review the errors above.");
    process.exit(1);
  }
}

// Health check before running tests
async function healthCheck() {
  console.log("🔍 Performing health checks...\n");

  try {
    // Check main server
    const serverHealth = await axios.get(`${MAIN_SERVER_URL}/health`);
    console.log("✅ Main server is healthy");

    // Check ML service via main server
    const mlHealth = await axios.get(
      `${MAIN_SERVER_URL}/api/ai/restock-strategy/health`
    );
    console.log(`✅ ML service is ${mlHealth.data.mlService.status}`);

    return true;
  } catch (error: any) {
    console.error("❌ Health check failed:", error.message);
    console.error("\nPlease ensure:");
    console.error("1. Main server is running on port 3000");
    console.error("2. ML service is running on port 8001");
    console.error("3. Database is seeded with test data");
    return false;
  }
}

// Main execution
(async () => {
  const healthy = await healthCheck();

  if (!healthy) {
    console.log("\n⚠️ Services are not ready. Skipping tests.");
    process.exit(1);
  }

  console.log("\n");
  await runTests();
})();
