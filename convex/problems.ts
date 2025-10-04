import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
