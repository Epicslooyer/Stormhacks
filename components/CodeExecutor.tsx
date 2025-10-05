"use client";

import { useState } from "react";
import type { TestCase } from "./useTestCases";

interface CodeExecutorProps {
  testCases: TestCase[];
  problemSlug: string;
}

interface ExecutionResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
  executionTime: number;
}

export function CodeExecutor({ testCases, problemSlug }: CodeExecutorProps) {
  const [code, setCode] = useState(getDefaultCode(problemSlug));
  const [language, setLanguage] = useState("python");
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCode = async () => {
    if (!code.trim()) {
      setError("Please enter some code to execute");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          testCases,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute code");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute code");
    } finally {
      setIsExecuting(false);
    }
  };

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Code Executor</h3>
        {results.length > 0 && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            passedCount === totalCount 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {passedCount}/{totalCount} tests passed
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode(getDefaultCodeForLanguage(e.target.value, problemSlug));
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
          </select>
        </div>

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Code ({language.charAt(0).toUpperCase() + language.slice(1)})
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter your ${language} code here...`}
          />
        </div>

        {/* Execute Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={executeCode}
            disabled={isExecuting || testCases.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {isExecuting ? "Executing..." : "Run Tests"}
          </button>
          {isExecuting && (
            <div className="text-sm text-gray-600">
              Running {testCases.length} test case{testCases.length !== 1 ? 's' : ''}...
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-800">Test Results</h4>
            {results.map((result, index) => (
              <TestResult key={index} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TestResult({ result }: { result: ExecutionResult }) {
  return (
    <div className={`border rounded-lg p-4 ${
      result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
            result.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {result.passed ? '✓' : '✗'}
          </span>
          <span className="font-medium text-sm">
            {result.testCase.description || `Test ${result.testCase.input}`}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {result.executionTime}ms
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
          <div className="bg-gray-100 p-2 rounded font-mono text-xs">
            {result.testCase.input}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Expected</label>
          <div className="bg-gray-100 p-2 rounded font-mono text-xs">
            {result.expectedOutput}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Actual</label>
          <div className={`p-2 rounded font-mono text-xs ${
            result.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.actualOutput || (result.error ? `Error: ${result.error}` : 'No output')}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultCode(problemSlug: string): string {
  // Completely generic template that works for any problem
  return `# Generic solution template for any LeetCode problem
import sys
import json

def solve(input_data):
    """
    Your solution goes here.
    Analyze the problem and implement the required logic.
    
    Common patterns:
    - For array problems: iterate through elements
    - For string problems: use string manipulation
    - For tree problems: use recursion or BFS/DFS
    - For graph problems: use BFS/DFS or other algorithms
    - For DP problems: use memoization or tabulation
    
    Return the expected output format.
    """
    
    # TODO: Implement your solution here
    # This is a placeholder - replace with actual logic
    
    # Basic example: if input is a list, return its length
    if isinstance(input_data, list):
        return len(input_data)
    
    # Basic example: if input is a string, return its length
    if isinstance(input_data, str):
        return len(input_data)
    
    # Basic example: if input is a number, return it doubled
    if isinstance(input_data, (int, float)):
        return input_data * 2
    
    # Fallback: return the input as-is
    return input_data

# Read input from stdin
input_data = sys.stdin.read().strip()

# Smart input parsing
try:
    # Try to parse as JSON first
    if input_data.startswith('[') or input_data.startswith('{'):
        parsed_input = json.loads(input_data)
        result = solve(parsed_input)
    else:
        # Handle string inputs
        result = solve(input_data)
except json.JSONDecodeError:
    # If JSON parsing fails, treat as string
    result = solve(input_data)
except Exception as e:
    # Fallback for any other errors
    result = solve(input_data)

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
}

function getDefaultCodeForLanguage(language: string, problemSlug: string): string {
  // Completely generic templates for all languages
  switch (language) {
    case "javascript":
      return `// Generic solution template for any LeetCode problem
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function solve(input) {
    /**
     * Your solution goes here.
     * Analyze the problem and implement the required logic.
     * 
     * Common patterns:
     * - For array problems: use for loops, map, filter, reduce
     * - For string problems: use string methods, regex
     * - For tree problems: use recursion or iterative traversal
     * - For graph problems: use BFS/DFS algorithms
     * - For DP problems: use memoization or tabulation
     * 
     * Return the expected output format.
     */
    
    // TODO: Implement your solution here
    
    // Basic example: if input is an array, return its length
    if (Array.isArray(input)) {
        return input.length;
    }
    
    // Basic example: if input is a string, return its length
    if (typeof input === 'string') {
        return input.length;
    }
    
    // Basic example: if input is a number, return it doubled
    if (typeof input === 'number') {
        return input * 2;
    }
    
    // Fallback: return the input as-is
    return input;
}

rl.on('line', (input) => {
    try {
        // Smart input parsing
        let parsedInput = input.trim();
        
        // Try to parse as JSON if it looks like an array or object
        if (parsedInput.startsWith('[') || parsedInput.startsWith('{')) {
            parsedInput = JSON.parse(parsedInput);
        }
        
        const result = solve(parsedInput);
        
        // Smart output formatting
        if (Array.isArray(result) || typeof result === 'object') {
            console.log(JSON.stringify(result));
        } else if (typeof result === 'boolean') {
            console.log(result.toString());
        } else {
            console.log(result);
        }
    } catch (error) {
        // Fallback for any parsing errors
        const result = solve(input.trim());
        console.log(result);
    }
    rl.close();
});`;
    
    case "java":
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        
        // Smart input parsing
        Object parsedInput = input;
        try {
            if (input.startsWith("[") || input.startsWith("{")) {
                // For JSON-like inputs, you might need to parse manually
                // or use a JSON library if available
                parsedInput = input;
            }
        } catch (Exception e) {
            parsedInput = input;
        }
        
        Object result = solve(parsedInput);
        
        // Smart output formatting
        if (result instanceof List || result instanceof Map) {
            System.out.println(result.toString());
        } else {
            System.out.println(result);
        }
    }
    
    public static Object solve(Object input) {
        /**
         * Your solution goes here.
         * Analyze the problem and implement the required logic.
         * 
         * Common patterns:
         * - For array problems: use loops, ArrayList, arrays
         * - For string problems: use String methods, StringBuilder
         * - For tree problems: use recursion or iterative traversal
         * - For graph problems: use BFS/DFS algorithms
         * - For DP problems: use memoization or tabulation
         * 
         * Return the expected output format.
         */
        
        // TODO: Implement your solution here
        return input;
    }
}`;
    
    case "cpp":
      return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

string solve(string input) {
    /**
     * Your solution goes here.
     * Analyze the problem and implement the required logic.
     * 
     * Common patterns:
     * - For array problems: use vectors, loops
     * - For string problems: use string methods
     * - For tree problems: use recursion or iterative traversal
     * - For graph problems: use BFS/DFS algorithms
     * - For DP problems: use memoization or tabulation
     * 
     * Return the expected output format.
     */
    
    // TODO: Implement your solution here
    return input;
}

int main() {
    string input;
    getline(cin, input);
    
    string result = solve(input);
    cout << result << endl;
    return 0;
}`;
    
    case "c":
      return `#include <stdio.h>
#include <string.h>

void solve(char* input) {
    /**
     * Your solution goes here.
     * Analyze the problem and implement the required logic.
     * 
     * Common patterns:
     * - For array problems: use arrays, loops
     * - For string problems: use string functions
     * - For tree problems: use recursion or iterative traversal
     * - For graph problems: use BFS/DFS algorithms
     * - For DP problems: use memoization or tabulation
     * 
     * Return the expected output format.
     */
    
    // TODO: Implement your solution here
    printf("%s\\n", input);
}

int main() {
    char input[1000];
    fgets(input, sizeof(input), stdin);
    
    // Remove newline
    input[strcspn(input, "\\n")] = 0;
    
    solve(input);
    return 0;
}`;
    
    default:
      return getDefaultCode(problemSlug);
  }
}
