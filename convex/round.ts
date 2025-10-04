import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { DatabaseReader } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";


export const updateRound = mutation({
    args: {

        slug: v.string(),
        newCode : v.string()
    },
      handler: async (ctx, { slug, newCode }) => {

    await ctx.db.patch(userId, { code: newCode });
  }
});