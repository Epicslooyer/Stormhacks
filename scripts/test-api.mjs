// Test the test case generation API directly
async function testTestCaseAPI() {
  try {
    console.log("Testing test case generation API...");
    
    // Test Two Sum
    console.log("\n1. Testing Two Sum test case generation...");
    const twoSumResponse = await fetch("http://localhost:3000/api/testcases/two-sum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (twoSumResponse.ok) {
      const twoSumData = await twoSumResponse.json();
      console.log("Two Sum test cases:", JSON.stringify(twoSumData, null, 2));
    } else {
      console.error("Two Sum failed:", twoSumResponse.status, await twoSumResponse.text());
    }
    
    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Valid Parentheses
    console.log("\n2. Testing Valid Parentheses test case generation...");
    const validParensResponse = await fetch("http://localhost:3000/api/testcases/valid-parentheses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (validParensResponse.ok) {
      const validParensData = await validParensResponse.json();
      console.log("Valid Parentheses test cases:", JSON.stringify(validParensData, null, 2));
    } else {
      console.error("Valid Parentheses failed:", validParensResponse.status, await validParensResponse.text());
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testTestCaseAPI();
