import piston from "piston-client";

async function testPiston() {
  try {
    console.log("Testing Piston client...");
    
    const client = piston({ server: "https://emkc.org" });
    
    // Test 1: Get runtimes
    console.log("1. Getting runtimes...");
    const runtimes = await client.runtimes();
    console.log("Available runtimes:", runtimes.slice(0, 5)); // Show first 5
    
    // Test 2: Simple execution
    console.log("2. Testing simple execution...");
    const result = await client.execute('python', 'print("Hello World!")');
    console.log("Simple execution result:", result);
    
    // Test 3: Execution with stdin
    console.log("3. Testing execution with stdin...");
    const resultWithStdin = await client.execute('python', 'import sys\nprint(sys.stdin.read().strip())', {
      stdin: "Test input"
    });
    console.log("Execution with stdin result:", resultWithStdin);
    
    console.log("✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testPiston();
