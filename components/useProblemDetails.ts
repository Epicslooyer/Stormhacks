"use client";

import { useQuery } from "@tanstack/react-query";
import type LeetCodeQuery from "leetcode-query";

type ProblemResult = Awaited<
	ReturnType<InstanceType<typeof LeetCodeQuery>["problem"]>
>;

export function useProblemDetails(slug: string | null | undefined) {
	return useQuery<ProblemResult>({
		queryKey: ["leetcodeProblem", slug],
		queryFn: async () => {
			if (!slug) {
				throw new Error("Problem slug is required");
			}
			const response = await fetch(
				`/api/leetcode/problem/${encodeURIComponent(slug)}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				let message = `Failed to load problem details (${response.status})`;
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

			return (await response.json()) as ProblemResult;
		},
		enabled: Boolean(slug),
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		retry: 1,
	});
}
