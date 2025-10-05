"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery as useConvexQuery, useMutation as useConvexMutation, useAction } from "convex/react";
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

export function useTestCases(slug: string | null | undefined, problemTitle?: string, problemDifficulty?: string) {
  // Use Convex directly for better performance and real-time updates
  const testCases = useConvexQuery(api.problems.getTestCases, 
    slug ? { problemSlug: slug } : "skip"
  );
  
  const generateTestCases = useAction(api.problems.generateTestCases);

  return {
    testCases: testCases || null,
    isLoading: testCases === undefined,
    isError: false, // Convex handles errors internally
    error: null,
    refetch: () => {}, // Convex automatically refetches
    generateTestCases: () => {
      if (slug) {
        return generateTestCases({ 
          problemSlug: slug,
          problemTitle,
          problemDifficulty,
        });
      }
    },
    isGenerating: false, // Convex actions don't expose pending state directly
    generateError: null,
  };
}
