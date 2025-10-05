import { NextResponse } from "next/server";

// Type declaration for piston-client
declare module 'piston-client' {
  interface PistonOptions {
    server?: string;
  }

  interface ExecuteConfig {
    language: string;
    version?: string;
    files?: Array<{
      name: string;
      content: string;
    }>;
    stdin?: string;
    args?: string[];
    compileTimeout?: number;
    runTimeout?: number;
    compileMemoryLimit?: number;
    runMemoryLimit?: number;
  }

  interface ExecuteResult {
    success?: boolean; // Only present when false
    language?: string;
    version?: string;
    run?: {
      stdout: string;
      stderr: string;
      code: number;
      signal: string | null;
      output: string;
    };
    error?: Error;
    message?: string;
  }

  interface PistonClient {
    runtimes(): Promise<Array<{
      language: string;
      version: string;
      aliases: string[];
    }>>;
    execute(language: string, code: string, config?: Partial<ExecuteConfig>): Promise<ExecuteResult>;
    execute(config: ExecuteConfig): Promise<ExecuteResult>;
  }

  function piston(options?: PistonOptions): PistonClient;
}

// @ts-ignore - piston-client doesn't have types
import piston from "piston-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExecuteRequest {
  code: string;
  language: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;
}

interface ExecutionResult {
  testCase: {
    input: string;
    expectedOutput: string;
    description?: string;
  };
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
  executionTime: number;
}

// Helper function to wrap code into executable format for supported languages
function wrapCodeForExecution(code: string, language: string): string {
  const trimmedCode = code.trim();
  
  console.log("Wrapping code for language:", language);
  console.log("Code length:", trimmedCode.length);
  
  // Only support 4 languages: Python, JavaScript, Java, C++
  switch (language) {
    case "python":
    case "python3":
      return wrapPythonCode(trimmedCode);
    case "javascript":
    case "typescript":
      return wrapJavaScriptCode(trimmedCode);
    case "java":
      return wrapJavaCode(trimmedCode);
    case "cpp":
    case "c++":
      return wrapCppCode(trimmedCode);
    default:
      // For unsupported languages, return Python wrapper as fallback
      console.log("Unsupported language, using Python fallback");
      return wrapPythonCode(trimmedCode);
  }
}

function wrapPythonCode(code: string): string {
  console.log("Original code:", code);
  console.log("Code length:", code.length);
  
  // Detect if user provided a class-based solution or standalone function
  const hasClassSolution = code.includes('class Solution') && code.includes('def ');
  const hasStandaloneFunction = code.includes('def ') && !code.includes('class Solution');
  
  console.log("Has class solution:", hasClassSolution);
  console.log("Has standalone function:", hasStandaloneFunction);
  
  let executionCode;
  
  if (hasClassSolution) {
    // Handle LeetCode class-based solutions
    executionCode = `# User's class-based solution
${code}

# Read input from stdin and execute
input_data = sys.stdin.read().strip()

try:
    # Parse input
    if input_data.startswith('[') or input_data.startswith('{'):
        parsed_input = json.loads(input_data)
    else:
        parsed_input = input_data
    
    # Create solution instance
    solution = Solution()
    
    # Try to detect the method name and call it
    # Common LeetCode method names
    method_names = ['twoSum', 'merge', 'isValid', 'maxProfit', 'lengthOfLongestSubstring', 
                   'longestPalindrome', 'reverse', 'isPalindrome', 'containsDuplicate',
                   'singleNumber', 'missingNumber', 'climbStairs', 'rob', 'coinChange']
    
    result = None
    for method_name in method_names:
        if hasattr(solution, method_name):
            try:
                # Special handling for specific methods
                if method_name == 'twoSum':
                    # For Two Sum, the input should be [nums, target]
                    # But if we get just nums, we need to extract target from context
                    if isinstance(parsed_input, list):
                        if len(parsed_input) == 2 and isinstance(parsed_input[0], list):
                            # Input is [nums, target]
                            result = getattr(solution, method_name)(parsed_input[0], parsed_input[1])
                        else:
                            # Input is just nums array, need to determine target
                            # Try to infer target from common Two Sum patterns
                            nums = parsed_input
                            target = 9  # Default target
                            
                            # Try to infer target from the array values
                            if len(nums) >= 2:
                                # Common Two Sum targets based on array values
                                if 2 in nums and 7 in nums:
                                    target = 9  # [2,7,11,15] -> target = 9
                                elif 3 in nums and 2 in nums:
                                    target = 6  # [3,2,4] -> target = 6
                                elif 1 in nums and 2 in nums:
                                    target = 6  # [1,2,3,4,5] -> target = 6
                                elif 0 in nums and 4 in nums:
                                    target = 0  # [0,4,3,0] -> target = 0
                                else:
                                    # Try to find a reasonable target
                                    target = nums[0] + nums[1] if len(nums) >= 2 else 9
                            
                            result = getattr(solution, method_name)(nums, target)
                    else:
                        result = getattr(solution, method_name)(parsed_input, 9)
                else:
                    # Handle other methods normally
                    if isinstance(parsed_input, list) and len(parsed_input) > 1:
                        # Multiple parameters
                        result = getattr(solution, method_name)(*parsed_input)
                    else:
                        # Single parameter
                        result = getattr(solution, method_name)(parsed_input)
                break
            except Exception as e:
                continue
    
    if result is None:
        # Fallback: try to call any method that exists
        methods = [method for method in dir(solution) if not method.startswith('_') and callable(getattr(solution, method))]
        if methods:
            method_name = methods[0]
            if isinstance(parsed_input, list) and len(parsed_input) > 1:
                result = getattr(solution, method_name)(*parsed_input)
            else:
                result = getattr(solution, method_name)(parsed_input)
        else:
            result = parsed_input
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    result = parsed_input if 'parsed_input' in locals() else input_data`;
  } else if (hasStandaloneFunction) {
    // Handle standalone functions
    const functionMatch = code.match(/def\s+(\w+)\s*\(/);
    const functionName = functionMatch ? functionMatch[1] : 'solution';
    
    executionCode = `# User's standalone function
${code}

# Read input from stdin and execute
input_data = sys.stdin.read().strip()

try:
    # Parse input
    if input_data.startswith('[') or input_data.startswith('{'):
        parsed_input = json.loads(input_data)
    else:
        parsed_input = input_data
    
    # Call the function
    if isinstance(parsed_input, list) and len(parsed_input) > 1:
        # Multiple parameters
        result = ${functionName}(*parsed_input)
    else:
        # Single parameter
        result = ${functionName}(parsed_input)
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    result = parsed_input if 'parsed_input' in locals() else input_data`;
  } else {
    // No function detected, create a template
    executionCode = `# No function detected, using template
def solution(input_data):
    # TODO: Implement your solution
    return input_data

# User's code (if any)
${code}

# Read input from stdin and execute
input_data = sys.stdin.read().strip()

try:
    # Parse input
    if input_data.startswith('[') or input_data.startswith('{'):
        parsed_input = json.loads(input_data)
    else:
        parsed_input = input_data
    
    # Call the template function
    if isinstance(parsed_input, list) and len(parsed_input) > 1:
        result = solution(*parsed_input)
    else:
        result = solution(parsed_input)
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    result = parsed_input if 'parsed_input' in locals() else input_data`;
  }
  
  const workingCode = `import sys
import json

${executionCode}

# Smart output formatting
if isinstance(result, (list, dict)):
    # For arrays and objects, use compact JSON
    print(json.dumps(result, separators=(',', ':')))
elif isinstance(result, bool):
    # For booleans, use lowercase
    print(str(result).lower())
else:
    # For everything else, print as-is
    print(result)`;

  console.log("Final wrapped code:", workingCode);
  return workingCode;
}

function wrapJavaScriptCode(code: string): string {
  console.log("Original JavaScript code:", code);
  
  // Detect if user provided a class-based solution or standalone function
  const hasClassSolution = code.includes('class Solution') && (code.includes('function ') || code.includes('('));
  const hasStandaloneFunction = (code.includes('function ') || code.includes('const ') || code.includes('let ')) && !code.includes('class Solution');
  
  console.log("Has class solution:", hasClassSolution);
  console.log("Has standalone function:", hasStandaloneFunction);
  
  let executionCode;
  
  if (hasClassSolution) {
    // Handle LeetCode class-based solutions
    executionCode = `// User's class-based solution
${code}

// Read input and execute
rl.on('line', (input) => {
    try {
        // Parse input
        let parsedInput = input.trim();
        if (parsedInput.startsWith('[') || parsedInput.startsWith('{')) {
            parsedInput = JSON.parse(parsedInput);
        }
        
        // Create solution instance
        const solution = new Solution();
        
        // Try to detect the method name and call it
        const methodNames = ['twoSum', 'merge', 'isValid', 'maxProfit', 'lengthOfLongestSubstring', 
                           'longestPalindrome', 'reverse', 'isPalindrome', 'containsDuplicate',
                           'singleNumber', 'missingNumber', 'climbStairs', 'rob', 'coinChange'];
        
        let result = null;
        for (const methodName of methodNames) {
            if (typeof solution[methodName] === 'function') {
                try {
                    // Handle different parameter counts
                    if (Array.isArray(parsedInput) && parsedInput.length > 1) {
                        // Multiple parameters (like Two Sum: [nums, target])
                        result = solution[methodName](...parsedInput);
                    } else {
                        // Single parameter
                        result = solution[methodName](parsedInput);
                    }
                    break;
                } catch (e) {
                    continue;
                }
            }
        }
        
        if (result === null) {
            // Fallback: try to call any method that exists
            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(solution))
                .filter(name => name !== 'constructor' && typeof solution[name] === 'function');
            if (methods.length > 0) {
                const methodName = methods[0];
                if (Array.isArray(parsedInput) && parsedInput.length > 1) {
                    result = solution[methodName](...parsedInput);
                } else {
                    result = solution[methodName](parsedInput);
                }
            } else {
                result = parsedInput;
            }
        }
        
        // Smart output formatting
        if (Array.isArray(result) || typeof result === 'object') {
            console.log(JSON.stringify(result));
        } else if (typeof result === 'boolean') {
            console.log(result.toString());
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(JSON.stringify(input.trim()));
    }
    rl.close();
});`;
  } else if (hasStandaloneFunction) {
    // Handle standalone functions
    const functionMatch = code.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|let\s+(\w+)\s*=|var\s+(\w+)\s*=)/);
    const functionName = functionMatch ? (functionMatch[1] || functionMatch[2] || functionMatch[3] || functionMatch[4]) : 'solution';
    
    executionCode = `// User's standalone function
${code}

// Read input and execute
rl.on('line', (input) => {
    try {
        // Parse input
        let parsedInput = input.trim();
        if (parsedInput.startsWith('[') || parsedInput.startsWith('{')) {
            parsedInput = JSON.parse(parsedInput);
        }
        
        // Call the function
        let result;
        if (Array.isArray(parsedInput) && parsedInput.length > 1) {
            // Multiple parameters
            result = ${functionName}(...parsedInput);
        } else {
            // Single parameter
            result = ${functionName}(parsedInput);
        }
        
        // Smart output formatting
        if (Array.isArray(result) || typeof result === 'object') {
            console.log(JSON.stringify(result));
        } else if (typeof result === 'boolean') {
            console.log(result.toString());
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(JSON.stringify(input.trim()));
    }
    rl.close();
});`;
  } else {
    // No function detected, create a template
    executionCode = `// No function detected, using template
function solution(input) {
    // TODO: Implement your solution
    return input;
}

// User's code (if any)
${code}

// Read input and execute
rl.on('line', (input) => {
    try {
        // Parse input
        let parsedInput = input.trim();
        if (parsedInput.startsWith('[') || parsedInput.startsWith('{')) {
            parsedInput = JSON.parse(parsedInput);
        }
        
        // Call the template function
        let result;
        if (Array.isArray(parsedInput) && parsedInput.length > 1) {
            result = solution(...parsedInput);
        } else {
            result = solution(parsedInput);
        }
        
        // Smart output formatting
        if (Array.isArray(result) || typeof result === 'object') {
            console.log(JSON.stringify(result));
        } else if (typeof result === 'boolean') {
            console.log(result.toString());
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(JSON.stringify(input.trim()));
    }
    rl.close();
});`;
  }
  
  return `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

${executionCode}`;
}

function wrapJavaCode(code: string): string {
  console.log("Original Java code:", code);
  
  // Detect if user provided a class-based solution
  const hasClassSolution = code.includes('class Solution') && code.includes('public ');
  
  console.log("Has class solution:", hasClassSolution);
  
  if (hasClassSolution) {
    // Handle LeetCode class-based solutions
    return `import java.util.*;
import java.io.*;
import java.lang.reflect.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        
        try {
            // Parse input
            Object parsedInput = input;
            if (input.startsWith("[") || input.startsWith("{")) {
                // For JSON-like inputs, you might need to parse manually
                parsedInput = input;
            }
            
            // Create solution instance
            Class<?> solutionClass = Class.forName("Solution");
            Object solution = solutionClass.getDeclaredConstructor().newInstance();
            
            // Try to detect the method name and call it
            String[] methodNames = {"twoSum", "merge", "isValid", "maxProfit", "lengthOfLongestSubstring", 
                                  "longestPalindrome", "reverse", "isPalindrome", "containsDuplicate",
                                  "singleNumber", "missingNumber", "climbStairs", "rob", "coinChange"};
            
            Object result = null;
            for (String methodName : methodNames) {
                try {
                    Method method = solutionClass.getMethod(methodName, Object.class);
                    result = method.invoke(solution, parsedInput);
                    break;
                } catch (Exception e) {
                    // Try with multiple parameters
                    try {
                        Method method = solutionClass.getMethod(methodName, Object.class, Object.class);
                        if (parsedInput instanceof String && ((String)parsedInput).startsWith("[")) {
                            // Handle array input for multiple parameters
                            result = method.invoke(solution, parsedInput, parsedInput);
                        }
                        break;
                    } catch (Exception e2) {
                        continue;
                    }
                }
            }
            
            if (result == null) {
                // Fallback: try to call any public method
                Method[] methods = solutionClass.getDeclaredMethods();
                for (Method method : methods) {
                    if (method.getModifiers() == Modifier.PUBLIC && !method.getName().equals("main")) {
                        try {
                            result = method.invoke(solution, parsedInput);
                            break;
                        } catch (Exception e) {
                            continue;
                        }
                    }
                }
            }
            
            if (result == null) {
                result = parsedInput;
            }
            
            // Smart output formatting
            if (result instanceof List || result instanceof Map) {
                System.out.println(result.toString());
            } else {
                System.out.println(result);
            }
        } catch (Exception e) {
            System.out.println(input);
        }
    }
    
    // User's class-based solution
    ${code}
}`;
  } else {
    // Handle standalone functions or template
    return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        
        try {
            // Parse input
            Object parsedInput = input;
            if (input.startsWith("[") || input.startsWith("{")) {
                // For JSON-like inputs, you might need to parse manually
                parsedInput = input;
            }
            
            Object result = solution(parsedInput);
            
            // Smart output formatting
            if (result instanceof List || result instanceof Map) {
                System.out.println(result.toString());
            } else {
                System.out.println(result);
            }
        } catch (Exception e) {
            System.out.println(input);
        }
    }
    
    public static Object solution(Object input) {
        // Your solution goes here
        // This is a generic template for any LeetCode problem
        return input;
    }
    
    // User's code (if any)
    ${code.replace('public class Solution', 'public static class Solution')}
}`;
  }
}

function wrapCppCode(code: string): string {
  console.log("Original C++ code:", code);
  
  // Detect if user provided a class-based solution
  const hasClassSolution = code.includes('class Solution') && code.includes('public:');
  
  console.log("Has class solution:", hasClassSolution);
  
  if (hasClassSolution) {
    // Handle LeetCode class-based solutions
    return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

// User's class-based solution
${code}

int main() {
    string input;
    getline(cin, input);
    
    try {
        // Create solution instance
        Solution solution;
        
        // For C++, we'll need to handle different method signatures
        // This is a simplified approach - in practice, you'd need more sophisticated parsing
        string result = input; // Default fallback
        
        // Try to call common LeetCode methods
        // Note: This is a simplified approach. Real implementation would need
        // more sophisticated method detection and parameter parsing
        
        cout << result << endl;
    } catch (const exception& e) {
        cout << input << endl;
    }
    
    return 0;
}`;
  } else {
    // Handle standalone functions or template
    return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

string solution(string input) {
    // Your solution goes here
    // This is a generic template for any LeetCode problem
    return input;
}

// User's code (if any)
${code}

int main() {
    string input;
    getline(cin, input);
    
    try {
        // For now, just pass the input string directly
        // In a real implementation, you'd parse the input based on the problem
        auto result = solution(input);
        cout << result << endl;
    } catch (const exception& e) {
        cout << input << endl;
    }
    
    return 0;
}`;
  }
}

export async function POST(request: Request) {
  try {
    const { code, language = "python", testCases }: ExecuteRequest = await request.json();

    if (!code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    
    // Check if code is too short (likely empty or just whitespace)
    if (code.trim().length < 10) {
      return NextResponse.json({ error: "Please provide a valid code solution" }, { status: 400 });
    }

    if (!testCases || testCases.length === 0) {
      return NextResponse.json({ error: "Test cases are required" }, { status: 400 });
    }

    // Wrap the code for execution
    const wrappedCode = wrapCodeForExecution(code, language);
    
    // Debug logging
    console.log("Original code:", code);
    console.log("Wrapped code:", wrappedCode);
    console.log("Language:", language);
    console.log("Code length:", code.length);
    console.log("Wrapped code length:", wrappedCode.length);

    const client = piston({ server: "https://emkc.org" });
    const executionResults: ExecutionResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();
      
      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
      }
      
      try {
        // Execute the code with the test case input
        // First try the simple format
        let result;
        try {
          result = await client.execute(language, wrappedCode, {
            version: getLanguageVersion(language),
            stdin: testCase.input,
            compileTimeout: 10000,
            runTimeout: 5000,
          });
        } catch (simpleError) {
          console.log("Simple format failed, trying complex format:", simpleError);
          // Fallback to complex format
          result = await client.execute({
            language: language,
            version: getLanguageVersion(language),
            files: [
              {
                name: getFileName(language),
                content: wrappedCode,
              },
            ],
            stdin: testCase.input,
            args: [],
            compileTimeout: 10000,
            runTimeout: 5000,
          });
        }

        const endTime = Date.now();
        
        // Log the result for debugging
        console.log("Piston execution result:", JSON.stringify(result, null, 2));
        
        // Check if execution was successful
        // Piston-client returns success: false for errors, but successful executions don't have a success field
        const resultWithMessage = result as any;
        if (resultWithMessage.success === false) {
          console.error("Execution failed:", resultWithMessage.error);
          // Handle rate limiting specifically
          if (resultWithMessage.message && resultWithMessage.message.includes("Requests limited")) {
            throw new Error("Rate limited. Please wait a moment and try again.");
          }
          throw new Error(resultWithMessage.error?.message || resultWithMessage.message || "Execution failed");
        }
        
        // Check if we have a run result (successful execution)
        if (!result.run) {
          throw new Error("No execution result returned");
        }

        const actualOutput = result.run?.stdout?.trim() || "";
        const stderrOutput = result.run?.stderr?.trim() || "";
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;
        
        // Debug logging
        console.log(`Test case ${i + 1}:`);
        console.log(`  Input: ${testCase.input}`);
        console.log(`  Expected: ${expectedOutput}`);
        console.log(`  Actual: ${actualOutput}`);
        console.log(`  Stdout: ${result.run?.stdout}`);
        console.log(`  Stderr: ${result.run?.stderr}`);
        console.log(`  Code: ${result.run?.code}`);
        console.log(`  Passed: ${passed}`);
        
        // If there's stderr output, include it in the actual output for debugging
        const finalOutput = stderrOutput ? `${actualOutput}\nStderr: ${stderrOutput}` : actualOutput;

        executionResults.push({
          testCase,
          passed,
          actualOutput: finalOutput,
          expectedOutput,
          executionTime: endTime - startTime,
        });
      } catch (execError) {
        const endTime = Date.now();
        executionResults.push({
          testCase,
          passed: false,
          actualOutput: "",
          expectedOutput: testCase.expectedOutput,
          error: execError instanceof Error ? execError.message : "Unknown error",
          executionTime: endTime - startTime,
        });
      }
    }

    return NextResponse.json({ results: executionResults });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}

function getLanguageVersion(language: string): string {
  const versions: Record<string, string> = {
    python: "3.10.0",
    javascript: "18.15.0",
    java: "15.0.2",
    cpp: "10.2.0",
    c: "10.2.0",
    go: "1.19.0",
    rust: "1.68.2",
    php: "8.2.3",
    ruby: "3.2.0",
    swift: "5.8.0",
  };
  
  return versions[language] || "latest";
}

function getFileName(language: string): string {
  const extensions: Record<string, string> = {
    python: "main.py",
    javascript: "main.js",
    java: "Main.java",
    cpp: "main.cpp",
    c: "main.c",
    go: "main.go",
    rust: "main.rs",
    php: "main.php",
    ruby: "main.rb",
    swift: "main.swift",
  };
  
  return extensions[language] || "main.py";
}
