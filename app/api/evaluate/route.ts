import { NextResponse } from "next/server";
import { openrouter } from "@/lib/openrouter";
import { generateText, generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

// Zod schemas for structured AI responses
const CodeAnalysisSchema = z.object({
  cleaned_code: z.string().describe("The cleaned, executable version of the code"),
  analysis: z.string().describe("Brief analysis of what the code does and any issues found"),
  execution_plan: z.string().describe("How to execute this code with the test cases"),
  problem_type: z.enum(["single_parameter", "multi_parameter", "class_based", "function_based"]).describe("Type of problem structure"),
  method_name: z.string().optional().describe("The main method/function name to call"),
  parameters: z.array(z.string()).optional().describe("Parameter names for the method"),
});

const TestEvaluationSchema = z.object({
  passed: z.boolean().describe("Whether the test case passed"),
  reason: z.string().describe("Brief explanation of why it passed or failed"),
  actual_output: z.string().describe("The actual output from the code execution"),
});

const FeedbackSchema = z.object({
  overall_assessment: z.string().describe("Overall assessment of the code"),
  strengths: z.array(z.string()).describe("What's working well"),
  improvements: z.array(z.string()).describe("Areas for improvement"),
  suggestions: z.array(z.string()).describe("Specific suggestions for improvement"),
  encouragement: z.string().describe("Encouraging message for the user"),
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

    // Step 1: AI Code Analysis - Only analyze, don't modify
    const analysisResult = await generateObject({
      model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
      schema: CodeAnalysisSchema,
      prompt: `You are an expert code reviewer. Analyze the provided code WITHOUT modifying it.

Problem: ${problemTitle || "LeetCode Problem"}
Description: ${problemDescription || "No description provided"}
Language: ${language}

User's Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases:
${testCases.map((tc, i) => `Test ${i + 1}: Input: ${tc.input}, Expected: ${tc.expectedOutput}`).join('\n')}

IMPORTANT: Do NOT modify, complete, or fix the code. Only analyze what the user has written.
- Return the EXACT same code in cleaned_code field
- Analyze what the code does (even if incomplete or incorrect)
- Identify the problem type and method name if detectable
- Do NOT provide a working implementation`,
      temperature: 0.1,
    });

    const { cleaned_code, analysis, execution_plan, problem_type, method_name, parameters } = analysisResult.object;

    console.log("AI Analysis:", analysis);
    console.log("Problem Type:", problem_type);
    console.log("Method Name:", method_name);

    // Step 2: AI-based evaluation without code execution
    const results = [];
    let totalTime = 0;
    let passedTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = Date.now();

      // AI Evaluation of the code logic against test case
      const evaluationResult = await generateObject({
        model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
        schema: TestEvaluationSchema,
        prompt: `Analyze the user's code and determine if it would pass this test case.

Problem: ${problemTitle || "LeetCode Problem"}
Language: ${language}

User's Code:
\`\`\`${language}
${code}
\`\`\`

Test Case:
- Input: ${testCase.input}
- Expected Output: ${testCase.expectedOutput}
- Description: ${testCase.description || "No description"}

Analyze the code logic and determine if it would produce the expected output for this test case. Consider:
1. Does the code implement the correct algorithm?
2. Would it handle this specific input correctly?
3. Are there any logical errors or missing implementations?
4. Does the code structure support the expected functionality?

Provide your assessment of whether this test case would PASS or FAIL based on code analysis.`,
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

    // Step 4: Generate Overall Feedback with structured response
    const feedbackResult = await generateObject({
      model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
      schema: FeedbackSchema,
      prompt: `Provide constructive feedback based on the test results.

Analysis: ${analysis}
Test Results: ${passedTests}/${testCases.length} tests passed

Detailed Results:
${results.map(r => `Test ${r.testCase}: ${r.passed ? 'PASSED' : 'FAILED'} - Expected: ${r.expectedOutput}, Got: ${r.actualOutput}`).join('\n')}

Provide encouraging, constructive feedback that helps the user improve.`,
      temperature: 0.3,
    });

    const feedback = `${feedbackResult.object.overall_assessment}

Strengths:
${feedbackResult.object.strengths.map(s => `• ${s}`).join('\n')}

Areas for Improvement:
${feedbackResult.object.improvements.map(i => `• ${i}`).join('\n')}

Suggestions:
${feedbackResult.object.suggestions.map(s => `• ${s}`).join('\n')}

${feedbackResult.object.encouragement}`;

    const evaluationResult: EvaluationResult = {
      success: true,
      results,
      summary: {
        totalTests: testCases.length,
        passedTests,
        totalTime,
      },
      feedback,
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

