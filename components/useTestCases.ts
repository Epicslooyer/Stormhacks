"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const query = useQuery<TestCasesResponse>({
    queryKey: ["testCases", slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Problem slug is required");
      }
      
      const response = await fetch(
        `/api/testcases/${encodeURIComponent(slug)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No test cases found
        }
        let message = `Failed to load test cases (${response.status})`;
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
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

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
    onSuccess: (data) => {
      // Update the cache with the new test cases
      queryClient.setQueryData(["testCases", slug], data);
    },
  });

  return {
    testCases: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    generateTestCases: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
  };
}
