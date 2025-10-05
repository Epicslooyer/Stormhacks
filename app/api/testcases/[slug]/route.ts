import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug?: string }> };

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface TestCasesData {
  _id: string;
  problemSlug: string;
  testCases: TestCase[];
  createdAt: number;
  updatedAt: number;
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const TEST_CASES_FILE = path.join(process.cwd(), "data", "testcases.json");

async function getTestCases(problemSlug: string): Promise<TestCasesData | null> {
  try {
    // First try to get from Convex
    const result = await convex.query(api.problems.getTestCases, {
      problemSlug,
    });
    
    if (result) {
      return result;
    }
    
    // If not found in Convex, check JSON file and migrate
    try {
      const data = await fs.readFile(TEST_CASES_FILE, "utf-8");
      const testCasesMap = JSON.parse(data);
      const jsonData = testCasesMap[problemSlug];
      
      if (jsonData) {
        console.log(`Migrating test cases for ${problemSlug} from JSON to Convex`);
        // Migrate to Convex
        await convex.mutation(api.problems.createOrUpdateTestCases, {
          problemSlug,
          testCases: jsonData.testCases,
        });
        
        // Return the migrated data
        return await convex.query(api.problems.getTestCases, {
          problemSlug,
        });
      }
    } catch (jsonError) {
      // JSON file doesn't exist or is invalid, that's fine
      console.log("No JSON test cases file found, skipping migration");
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching test cases from Convex:", error);
    return null;
  }
}

async function saveTestCases(problemSlug: string, testCases: TestCase[]): Promise<TestCasesData> {
  try {
    const testCaseId = await convex.mutation(api.problems.createOrUpdateTestCases, {
      problemSlug,
      testCases,
    });
    
    // Fetch the saved data to return the complete object
    const savedData = await convex.query(api.problems.getTestCases, {
      problemSlug,
    });
    
    return savedData!;
  } catch (error) {
    console.error("Error saving test cases to Convex:", error);
    throw error;
  }
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "Problem slug is required" }, { status: 400 });
  }

  try {
    // First, check if test cases already exist
    const existingTestCases = await getTestCases(slug);

    if (existingTestCases) {
      return NextResponse.json(existingTestCases, {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
        },
      });
    }

    // If no test cases exist, generate them
    return NextResponse.json({ error: "No test cases found. Use POST to generate them." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "Problem slug is required" }, { status: 400 });
  }

  try {
    // Check if test cases already exist
    const existingTestCases = await getTestCases(slug);

    if (existingTestCases) {
      return NextResponse.json(existingTestCases, {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
        },
      });
    }

    // Fetch problem details from LeetCode
    const leetCodeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/leetcode/problem/${encodeURIComponent(slug)}`,
    );

    if (!leetCodeResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch problem details" }, { status: 502 });
    }

    const problem = await leetCodeResponse.json();

    // Generate test cases using OpenRouter
    const testCases = await generateTestCases(problem);

    // Store test cases in file
    const testCasesData = await saveTestCases(slug, testCases);

    return NextResponse.json(testCasesData, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateTestCases(problem: any) {
  // First try to extract test cases from the problem examples
  const extractedTestCases = extractTestCasesFromProblem(problem);
  if (extractedTestCases.length > 0) {
    console.log("Using extracted test cases from problem examples");
    return extractedTestCases;
  }
  console.log("No extracted test cases found, falling back to AI generation");

  const prompt = `You are an expert at creating test cases for coding problems. Given the following LeetCode problem, generate 5-7 comprehensive test cases that cover edge cases, normal cases, and boundary conditions.

Problem Title: ${problem.title}
Problem Description: ${problem.content}
Difficulty: ${problem.difficulty}
Example Test Cases: ${problem.exampleTestcases || 'None provided'}

CRITICAL INSTRUCTIONS:
1. Analyze the problem description to understand the exact input/output format
2. Look at the provided examples to understand the expected format
3. The expectedOutput must be EXACTLY what the function should return (same format as examples)
4. Pay attention to data types: arrays, strings, booleans, numbers, etc.
5. For boolean outputs, use "true"/"false" (lowercase)
6. For arrays, use the exact format shown in examples
7. For strings, include quotes if neededs

Please generate test cases in the following JSON format:
[
  {
    "input": "exact input format as shown in examples",
    "expectedOutput": "exact output format as shown in examples",
    "description": "brief description of what this test case covers"
  }
]

Requirements:
1. Include edge cases (empty inputs, single elements, maximum values)
2. Include normal cases that test the main logic
3. Include boundary conditions
4. Use proper JSON formatting with double quotes
5. Make input/output format EXACTLY match the problem examples
6. Keep descriptions concise but informative
7. CRITICAL: Copy the exact format from the problem examples

Return only the JSON array, no additional text or explanation.`;

  const response = await generateText({
    model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
    prompt,
    temperature: 0.1, // Lower temperature for more consistent output
  });

  try {
    console.log("AI response:", response.text);
    const testCases = JSON.parse(response.text);
    
    // Validate the structure
    if (!Array.isArray(testCases)) {
      throw new Error("Response is not an array");
    }
    
    if (testCases.length === 0) {
      throw new Error("AI generated empty test cases array");
    }
    
    // Ensure each test case has required fields
    const validatedTestCases = testCases.map((testCase: any) => ({
      input: String(testCase.input || ""),
      expectedOutput: String(testCase.expectedOutput || ""),
      description: String(testCase.description || ""),
    }));
    
    console.log("Successfully generated test cases:", validatedTestCases.length);
    return validatedTestCases;
  } catch (parseError) {
    console.error("Failed to parse test cases:", parseError);
    console.error("Raw response:", response.text);
    
    // Fallback: return empty array to let the system handle it
    console.log("Returning empty array due to AI generation failure");
    return [];
  }
}

function extractTestCasesFromProblem(problem: any) {
  const testCases = [];
  
  // Try to extract from exampleTestcases field first
  if (problem.exampleTestcases) {
    const examples = problem.exampleTestcases.split('\n');
    console.log("Found exampleTestcases:", examples);
    
    // For now, let the AI handle the examples since they're in raw format
    // The AI prompt will include these examples
  }
  
  // Look for examples in the problem content with multiple regex patterns
  const content = problem.content || '';
  
  // Pattern 1: Standard LeetCode format with example-io spans
  const pattern1 = /<strong class="example">Example \d+:<\/strong>[\s\S]*?<div class="example-block">[\s\S]*?<p><strong>Input:<\/strong>[\s\S]*?<span class="example-io">(.*?)<\/span><\/p>[\s\S]*?<p><strong>Output:<\/strong>[\s\S]*?<span class="example-io">(.*?)<\/span><\/p>/g;
  
  // Pattern 2: Alternative format with pre tags (more specific for word ladder type problems)
  const pattern2 = /<strong class="example">Example \d+:<\/strong>[\s\S]*?<pre>[\s\S]*?<strong>Input:<\/strong>[\s\S]*?([^\n<]+)[\s\S]*?<strong>Output:<\/strong>[\s\S]*?([^\n<]+)/g;
  
  // Pattern 3: Simple format without spans
  const pattern3 = /<strong class="example">Example \d+:<\/strong>[\s\S]*?<pre>[\s\S]*?<strong>Input:<\/strong>[\s\S]*?([^\n<]+)[\s\S]*?<strong>Output:<\/strong>[\s\S]*?([^\n<]+)/g;
  
  // Pattern 4: More specific pattern for word ladder type problems
  const pattern4 = /<strong class="example">Example \d+:<\/strong>[\s\S]*?<pre>[\s\S]*?<strong>Input:<\/strong>[\s\S]*?([^<]+?)[\s\S]*?<strong>Output:<\/strong>[\s\S]*?([^<]+?)(?=<|$)/g;
  
  let match;
  let exampleCount = 0;
  
  // Helper function to decode HTML entities
  function decodeHtmlEntities(str: string): string {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  
  // Try pattern 1
  while ((match = pattern1.exec(content)) !== null) {
    testCases.push({
      input: decodeHtmlEntities(match[1]),
      expectedOutput: decodeHtmlEntities(match[2]),
      description: `Example ${++exampleCount} from problem description`
    });
  }
  
  // Try pattern 2 if pattern 1 didn't work
  if (testCases.length === 0) {
    while ((match = pattern2.exec(content)) !== null) {
      testCases.push({
        input: decodeHtmlEntities(match[1]),
        expectedOutput: decodeHtmlEntities(match[2]),
        description: `Example ${++exampleCount} from problem description`
      });
    }
  }
  
  // Try pattern 3 if others didn't work
  if (testCases.length === 0) {
    while ((match = pattern3.exec(content)) !== null) {
      testCases.push({
        input: decodeHtmlEntities(match[1]),
        expectedOutput: decodeHtmlEntities(match[2]),
        description: `Example ${++exampleCount} from problem description`
      });
    }
  }
  
  // Try pattern 4 if others didn't work
  if (testCases.length === 0) {
    while ((match = pattern4.exec(content)) !== null) {
      testCases.push({
        input: decodeHtmlEntities(match[1]),
        expectedOutput: decodeHtmlEntities(match[2]),
        description: `Example ${++exampleCount} from problem description`
      });
    }
  }
  
  if (testCases.length > 0) {
    console.log("Extracted test cases from problem examples:", testCases.length);
    return testCases;
  }
  
  console.log("No examples could be extracted, will rely on AI generation");
  return [];
}

function getFallbackTestCases(problem: any) {
  // Generic fallback - let AI handle everything
  console.log("Using generic fallback - AI will generate appropriate test cases");
  return [];
}
