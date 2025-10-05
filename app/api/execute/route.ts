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

export async function POST(request: Request) {
  try {
    const { code, language = "python", testCases }: ExecuteRequest = await request.json();

    if (!code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!testCases || testCases.length === 0) {
      return NextResponse.json({ error: "Test cases are required" }, { status: 400 });
    }

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
          result = await client.execute(language, code, {
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
                content: code,
              },
            ],
            stdin: testCase.input,
            args: [],
            compileTimeout: 10000,
            runTimeout: 5000,
          });
        }

        const endTime = Date.now();
        
        // Log the result for debugging (can be removed in production)
        // console.log("Piston execution result:", JSON.stringify(result, null, 2));
        
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
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput;

        executionResults.push({
          testCase,
          passed,
          actualOutput,
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
