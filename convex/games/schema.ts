import { defineTable } from "convex/server";
import { v } from "convex/values";

export const gameTables = {
	games: defineTable({
		slug: v.string(),
		name: v.string(),
		createdBy: v.optional(v.id("users")),
		createdAt: v.number(),
		status: v.union(
			v.literal("lobby"),
			v.literal("active"),
			v.literal("completed"),
			v.literal("countdown"),
		),
		mode: v.optional(v.union(v.literal("solo"), v.literal("multiplayer"))),
		countdownEndsAt: v.optional(v.number()),
		problemSlug: v.optional(v.string()),
		problemTitle: v.optional(v.string()),
		problemDifficulty: v.optional(v.string()),
	})
		.index("by_status", ["status"])
		.index("by_slug", ["slug"])
		.index("by_creator", ["createdBy", "createdAt"]),
	participants: defineTable({
		gameId: v.id("games"),
		identityId: v.id("users"),
		role: v.union(
			v.literal("player"),
			v.literal("spectator"),
			v.literal("administrator"),
		),
		joinedAt: v.number(),
	})
		.index("by_game", ["gameId", "role"])
		.index("by_identity", ["identityId", "gameId"]),
	gamePresences: defineTable({
		gameId: v.id("games"),
		clientId: v.string(),
		userId: v.optional(v.id("users")),
		updatedAt: v.number(),
		isReady: v.optional(v.boolean()),
	})
		.index("by_game", ["gameId", "updatedAt"])
		.index("by_game_client", ["gameId", "clientId"]),
	cursorPositions: defineTable({
		gameId: v.id("games"),
		clientId: v.string(),
		userId: v.optional(v.id("users")),
		lineNumber: v.number(),
		column: v.number(),
		updatedAt: v.number(),
	})
		.index("by_game", ["gameId", "updatedAt"])
		.index("by_game_client", ["gameId", "clientId"]),
	codeSnapshots: defineTable({
		gameId: v.id("games"),
		clientId: v.string(),
		userId: v.optional(v.id("users")),
		code: v.string(),
		language: v.optional(v.string()),
		updatedAt: v.number(),
	})
		.index("by_game", ["gameId", "updatedAt"])
		.index("by_game_client", ["gameId", "clientId"]),
	gameScores: defineTable({
		gameId: v.id("games"),
		userId: v.optional(v.id("users")),
		clientId: v.string(),
		playerName: v.string(),
		// Scoring components (optional for backward compatibility)
		completionTime: v.optional(v.number()), // milliseconds to complete
		oNotation: v.optional(v.string()), // detected O notation (e.g., "O(n)", "O(n^2)")
		testCasesPassed: v.optional(v.number()), // number of test cases passed
		totalTestCases: v.optional(v.number()), // total number of test cases
		calculatedScore: v.optional(v.number()), // final calculated score
		// Legacy field for backward compatibility
		score: v.number(), // seconds (deprecated, use completionTime)
		submittedAt: v.number(),
		// Game state
		isEliminated: v.optional(v.boolean()),
		eliminatedAt: v.optional(v.number()),
	})
		.index("by_game", ["gameId"])
		.index("by_game_user", ["gameId", "userId"])
		.index("by_game_client", ["gameId", "clientId"])
		.index("by_game_score", ["gameId", "calculatedScore"])
		.index("by_game_eliminated", ["gameId", "isEliminated"]),
};
