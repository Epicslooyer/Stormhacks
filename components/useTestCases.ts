"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface TestCasesResponse {
  _id: string;
  problemSlug: string;
  testCases: TestCase[];
  createdAt: number;
  updatedAt: number;
}

export function useTestCases(slug: string | null | undefined) {
  // Use Convex directly for better performance and real-time updates
  const testCases = useConvexQuery(api.problems.getTestCases, 
    slug ? { problemSlug: slug } : "skip"
  );
  
  const createOrUpdateTestCases = useConvexMutation(api.problems.createOrUpdateTestCases);
  
  // Fallback to API route for generation (since it handles OpenRouter)
  const generateMutation = useMutation<TestCasesResponse, Error, void>({
    mutationFn: async () => {
      if (!slug) {
        throw new Error("Problem slug is required");
      }
      
      const response = await fetch(
        `/api/testcases/${encodeURIComponent(slug)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        let message = `Failed to generate test cases (${response.status})`;
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.error === "string") {
            message = errorBody.error;
          }
        } catch (_error) {
          // Ignore JSON parse errors, use default message.
        }
        throw new Error(message);
      }

      return (await response.json()) as TestCasesResponse;
    },
  });

  return {
    testCases: testCases || null,
    isLoading: testCases === undefined,
    isError: false, // Convex handles errors internally
    error: null,
    refetch: () => {}, // Convex automatically refetches
    generateTestCases: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
  };
}
