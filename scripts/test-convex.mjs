import { ConvexHttpClient } from "convex/browser";

// Get the Convex URL from environment or use default
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://your-convex-deployment.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

async function testConvexIntegration() {
  try {
    console.log("Testing Convex integration...");
    
    // Test data
    const testProblemSlug = "test-problem";
    const testCases = [
      {
        input: "[1,2,3]",
        expectedOutput: "6",
        description: "Test case 1"
      },
      {
        input: "[]",
        expectedOutput: "0",
        description: "Empty array test"
      }
    ];
    
    console.log("1. Creating test cases...");
    const createResult = await convex.mutation("problems:createOrUpdateTestCases", {
      problemSlug: testProblemSlug,
      testCases,
    });
    console.log("✅ Created test cases with ID:", createResult);
    
    console.log("2. Fetching test cases...");
    const fetchResult = await convex.query("problems:getTestCases", {
      problemSlug: testProblemSlug,
    });
    console.log("✅ Fetched test cases:", fetchResult);
    
    console.log("3. Updating test cases...");
    const updatedTestCases = [
      ...testCases,
      {
        input: "[4,5,6]",
        expectedOutput: "15",
        description: "Additional test case"
      }
    ];
    
    const updateResult = await convex.mutation("problems:createOrUpdateTestCases", {
      problemSlug: testProblemSlug,
      testCases: updatedTestCases,
    });
    console.log("✅ Updated test cases with ID:", updateResult);
    
    console.log("4. Fetching updated test cases...");
    const finalResult = await convex.query("problems:getTestCases", {
      problemSlug: testProblemSlug,
    });
    console.log("✅ Final test cases:", finalResult);
    
    console.log("\n🎉 All Convex tests passed!");
    
  } catch (error) {
    console.error("❌ Convex test failed:", error);
    process.exit(1);
  }
}

// Run the test
testConvexIntegration();
