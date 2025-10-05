import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateRound = mutation({
	args: {
		gameId: v.id("round"),
		newCode: v.string(),
	},
	handler: async (ctx, { gameId, newCode }) => {
		await ctx.db.patch(gameId, { code: newCode });
	},
});