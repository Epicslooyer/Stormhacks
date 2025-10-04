import { defineTable } from "convex/server";
import { v } from "convex/values";

export const playerTables = {
	players: defineTable({
		userId: v.id("users"),
		nickname: v.string(),
		elo: v.number(),
		wins: v.number(),
		gamesPlayed: v.number(),
		losses: v.number(),
		currentStreak: v.number(),
		lastMatchAt: v.optional(v.number()),
		avatarUrl: v.optional(v.string()),
		bio: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_elo", ["elo", "wins"]),
};
