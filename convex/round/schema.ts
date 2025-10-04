import { defineTable } from "convex/server";
import { v } from "convex/values";

export const gamePlayers = defineTable({
	gameId: v.id("games"),
	userId: v.id("users"), // or null if AI/bot
	role: v.optional(v.string()), // e.g. "host", "player", "spectator"
	joinedAt: v.number(),
	slug: v.string(),
	// Player-specific data (customize as needed)
	code: v.optional(v.string()),
})
	.index("by_game", ["gameId"])
	.index("by_user", ["userId"])
	.index("by_game_user", ["gameId", "userId"]);
