import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateObject } from "ai";
import { z } from "zod";
import { detectONotation, calculateScore } from "@/lib/scoring";

export const runtime = "nodejs";

// Zod schema for test evaluation
const TestEvaluationSchema = z.object({
  passed: z.boolean().describe("Whether the test case passed"),
  reason: z.string().describe("Brief explanation of why it passed or failed"),
  actual_output: z.string().describe("The actual output from the code execution"),
});

interface EvaluateRequest {
  code: string;
  language: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;
  problemTitle?: string;
  problemDescription?: string;
}

interface EvaluationResult {
  success: boolean;
  results: Array<{
    testCase: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
    description?: string;
  }>;
  summary: {
    totalTests: number;
    passedTests: number;
    totalTime: number;
  };
  scoring: {
    oNotation: string | null;
    calculatedScore: number;
    scoreBreakdown: {
      timeScore: number;
      efficiencyScore: number;
      correctnessScore: number;
    };
  };
  feedback?: string;
  cleanedCode?: string;
}

export async function POST(request: Request) {
  try {
    const { code, language, testCases, problemTitle, problemDescription }: EvaluateRequest = await request.json();

    if (!code || !language || !testCases || testCases.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Starting AI evaluation for:", problemTitle || "Unknown problem");
    console.log("Language:", language);
    console.log("Test cases:", testCases.length);

    // Step 2: AI-based evaluation for each test case
    const results: Array<{
      testCase: number;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      executionTime: number;
      description?: string;
    }> = [];
    let totalTime = 0;
    let passedTests = 0;

    // Evaluate each test case with AI
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();

      // AI Evaluation of the code logic against test case
      const evaluationResult = await generateObject({
        model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
        schema: TestEvaluationSchema,
        prompt: `You are an expert code evaluator. Analyze the user's code and determine if it would produce the correct output for this specific test case.

Problem: ${problemTitle || "Coding Problem"}
Language: ${language}

User's Code:
\`\`\`${language}
${code}
\`\`\`

Test Case ${i + 1}:
- Input: ${testCase.input}
- Expected Output: ${testCase.expectedOutput}
- Description: ${testCase.description || "No description provided"}

Instructions:
1. Analyze the code logic step by step
2. Trace through what the code would do with the given input
3. Determine if the code would produce the expected output
4. Be generous - if the code has reasonable logic that could work, mark it as passed
5. Only mark as failed if the code is clearly wrong or incomplete

Consider:
- Does the code handle the input format correctly?
- Is the algorithm logic sound?
- Would it produce the expected output?
- Are there any obvious errors that would prevent it from working?

Be fair but not overly strict. If the code shows understanding of the problem and has reasonable logic, it should pass.`,
        temperature: 0.1,
      });

      const executionTime = Date.now() - startTime;
      totalTime += executionTime;

      const passed = evaluationResult.object.passed;
      if (passed) passedTests++;

      results.push({
        testCase: i + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: evaluationResult.object.actual_output || "AI Analysis",
        passed,
        executionTime,
        description: testCase.description,
      });
    }

    // Calculate O notation and score
    const oNotation = detectONotation(code);
    const scoreCalculation = calculateScore({
      completionTime: totalTime, // Use total execution time as completion time
      oNotation,
      testCasesPassed: passedTests,
      totalTestCases: testCases.length,
    });

    const evaluationResult: EvaluationResult = {
      success: true,
      results,
      summary: {
        totalTests: testCases.length,
        passedTests,
        totalTime,
      },
      scoring: {
        oNotation,
        calculatedScore: scoreCalculation.finalScore,
        scoreBreakdown: scoreCalculation.breakdown,
      },
      feedback: undefined, // No feedback requested
      cleanedCode: undefined, // Don't show cleaned code since we're not modifying user code
    };

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

