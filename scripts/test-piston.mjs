import { PistonClient } from "piston-client";

async function testPistonClient() {
  try {
    console.log("Testing Piston Client integration...");
    
    const piston = new PistonClient();
    
    // Test basic Python execution
    console.log("1. Testing basic Python execution...");
    const result = await piston.execute({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "main.py",
          content: `
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

# Test with input
import sys
input_data = sys.stdin.read().strip()
if input_data.startswith('[') and input_data.endswith(']'):
    nums = eval(input_data)
    target = 9
    result = two_sum(nums, target)
    print(result)
else:
    print("Invalid input")
`,
        },
      ],
      stdin: "[2, 7, 11, 15]",
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
    });
    
    console.log("✅ Python execution result:", result.run.stdout?.trim());
    console.log("   Compile time:", result.compile.time, "ms");
    console.log("   Run time:", result.run.time, "ms");
    
    // Test with different input
    console.log("\n2. Testing with different input...");
    const result2 = await piston.execute({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "main.py",
          content: `
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

import sys
input_data = sys.stdin.read().strip()
if input_data.startswith('[') and input_data.endswith(']'):
    nums = eval(input_data)
    target = 6
    result = two_sum(nums, target)
    print(result)
else:
    print("Invalid input")
`,
        },
      ],
      stdin: "[3, 2, 4]",
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
    });
    
    console.log("✅ Second execution result:", result2.run.stdout?.trim());
    
    // Test error handling
    console.log("\n3. Testing error handling...");
    const errorResult = await piston.execute({
      language: "python",
      version: "3.10.0",
      files: [
        {
          name: "main.py",
          content: `
# This will cause a syntax error
def invalid_syntax(
    print("This won't work")
`,
        },
      ],
      stdin: "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 5000,
    });
    
    console.log("✅ Error handling test:");
    console.log("   Compile error:", errorResult.compile.stderr || "None");
    console.log("   Run error:", errorResult.run.stderr || "None");
    
    console.log("\n🎉 All Piston Client tests passed!");
    
  } catch (error) {
    console.error("❌ Piston Client test failed:", error);
    process.exit(1);
  }
}

// Run the test
testPistonClient();
