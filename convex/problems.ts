import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { openrouter } from "../lib/openrouter";
import { generateText } from "ai";

export const getTestCases = query({
  args: { problemSlug: v.string() },
  handler: async (ctx, args) => {
    const testCases = await ctx.db
      .query("testCases")
      .withIndex("by_problem_slug", (q) => q.eq("problemSlug", args.problemSlug))
      .first();
    
    return testCases;
  },
});

export const createOrUpdateTestCases = mutation({
  args: {
    problemSlug: v.string(),
    testCases: v.array(v.object({
      input: v.string(),
      expectedOutput: v.string(),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("testCases")
      .withIndex("by_problem_slug", (q) => q.eq("problemSlug", args.problemSlug))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        testCases: args.testCases,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("testCases", {
        problemSlug: args.problemSlug,
        testCases: args.testCases,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const deleteTestCases = mutation({
  args: { problemSlug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("testCases")
      .withIndex("by_problem_slug", (q) => q.eq("problemSlug", args.problemSlug))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

export const generateTestCases = action({
  args: { 
    problemSlug: v.string(),
    problemTitle: v.optional(v.string()),
    problemDifficulty: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    // Check if test cases already exist
    const existing = await ctx.runQuery(api.problems.getTestCases, { problemSlug: args.problemSlug });

    if (existing) {
      return existing._id; // Return existing test cases
    }

    // Generate test cases using OpenRouter
    const testCases = await generateTestCasesWithAI(args.problemSlug, args.problemTitle, args.problemDifficulty);

    // Save to Convex
    return await ctx.runMutation(api.problems.createOrUpdateTestCases, {
      problemSlug: args.problemSlug,
      testCases: testCases,
    });
  },
});

async function generateTestCasesWithAI(problemSlug: string, problemTitle?: string, problemDifficulty?: string) {
  const prompt = `You are an expert at creating test cases for coding problems. Given the following LeetCode problem, generate 5-7 comprehensive test cases that cover edge cases, normal cases, and boundary conditions.

Problem Title: ${problemTitle || problemSlug}
Problem Slug: ${problemSlug}
Difficulty: ${problemDifficulty || 'Unknown'}

CRITICAL INSTRUCTIONS:
1. Based on the problem slug, generate appropriate test cases for this LeetCode problem
2. The expectedOutput must be EXACTLY what the function should return
3. Pay attention to data types: arrays, strings, booleans, numbers, etc.
4. For boolean outputs, use "true"/"false" (lowercase)
5. For arrays, use the exact format shown in examples
6. For strings, include quotes if needed

Please generate test cases in the following JSON format:
[
  {
    "input": "exact input format",
    "expectedOutput": "exact output format",
    "description": "brief description of what this test case covers"
  }
]

Requirements:
1. Include edge cases (empty inputs, single elements, maximum values)
2. Include normal cases that test the main logic
3. Include boundary conditions
4. Use proper JSON formatting with double quotes
5. Keep descriptions concise but informative

Return only the JSON array, no additional text or explanation.`;

  const response = await generateText({
    model: openrouter("google/gemini-2.5-flash-preview-09-2025"),
    prompt,
    temperature: 0.1,
  });

  try {
    const testCases = JSON.parse(response.text);
    
    // Validate the structure
    if (!Array.isArray(testCases)) {
      throw new Error("Response is not an array");
    }
    
    if (testCases.length === 0) {
      throw new Error("AI generated empty test cases array");
    }
    
    // Ensure each test case has required fields
    return testCases.map((testCase: any) => ({
      input: String(testCase.input || ""),
      expectedOutput: String(testCase.expectedOutput || ""),
      description: String(testCase.description || ""),
    }));
  } catch (parseError) {
    console.error("Failed to parse test cases:", parseError);
    console.error("Raw response:", response.text);
    
    // Fallback: return empty array
    return [];
  }
}
