import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText } from "ai";
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

const TEST_CASES_FILE = path.join(process.cwd(), "data", "testcases.json");

async function ensureTestCasesFile() {
  try {
    await fs.access(path.dirname(TEST_CASES_FILE));
  } catch {
    await fs.mkdir(path.dirname(TEST_CASES_FILE), { recursive: true });
  }
  
  try {
    await fs.access(TEST_CASES_FILE);
  } catch {
    await fs.writeFile(TEST_CASES_FILE, JSON.stringify({}));
  }
}

async function getTestCases(problemSlug: string): Promise<TestCasesData | null> {
  await ensureTestCasesFile();
  const data = await fs.readFile(TEST_CASES_FILE, "utf-8");
  const testCasesMap = JSON.parse(data);
  return testCasesMap[problemSlug] || null;
}

async function saveTestCases(problemSlug: string, testCases: TestCase[]): Promise<TestCasesData> {
  await ensureTestCasesFile();
  const data = await fs.readFile(TEST_CASES_FILE, "utf-8");
  const testCasesMap = JSON.parse(data);
  
  const now = Date.now();
  const testCasesData: TestCasesData = {
    _id: `testcases_${problemSlug}_${now}`,
    problemSlug,
    testCases,
    createdAt: now,
    updatedAt: now,
  };
  
  testCasesMap[problemSlug] = testCasesData;
  await fs.writeFile(TEST_CASES_FILE, JSON.stringify(testCasesMap, null, 2));
  
  return testCasesData;
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
  const prompt = `You are an expert at creating test cases for coding problems. Given the following LeetCode problem, generate 5-7 comprehensive test cases that cover edge cases, normal cases, and boundary conditions.

Problem Title: ${problem.title}
Problem Description: ${problem.content}
Difficulty: ${problem.difficulty}

Please generate test cases in the following JSON format:
[
  {
    "input": "string representation of input (e.g., for arrays: [1,2,3], for strings: \"hello\")",
    "expectedOutput": "string representation of expected output",
    "description": "brief description of what this test case covers"
  }
]

Make sure to:
1. Include edge cases (empty inputs, single elements, maximum values)
2. Include normal cases that test the main logic
3. Include boundary conditions
4. Use proper JSON formatting
5. Make input/output format consistent with the problem's expected format
6. Keep descriptions concise but informative

Return only the JSON array, no additional text.`;

  const response = await generateText({
    model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
    prompt,
    temperature: 0.3,
  });

  try {
    const testCases = JSON.parse(response.text);
    
    // Validate the structure
    if (!Array.isArray(testCases)) {
      throw new Error("Response is not an array");
    }

    // Ensure each test case has required fields
    const validatedTestCases = testCases.map((testCase: any) => ({
      input: String(testCase.input || ""),
      expectedOutput: String(testCase.expectedOutput || ""),
      description: String(testCase.description || ""),
    }));

    return validatedTestCases;
  } catch (parseError) {
    console.error("Failed to parse test cases:", parseError);
    console.error("Raw response:", response.text);
    
    // Fallback: return basic test cases
    return [
      {
        input: "[]",
        expectedOutput: "0",
        description: "Empty input case",
      },
      {
        input: "[1]",
        expectedOutput: "1",
        description: "Single element case",
      },
      {
        input: "[1,2,3]",
        expectedOutput: "6",
        description: "Normal case with multiple elements",
      },
    ];
  }
}
