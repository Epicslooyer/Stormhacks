import { defineTable } from "convex/server";
import { v } from "convex/values";

export const problemTables = {
  testCases: defineTable({
    problemSlug: v.string(),
    testCases: v.array(v.object({
      input: v.string(),
      expectedOutput: v.string(),
      description: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_problem_slug", ["problemSlug"]),
};
