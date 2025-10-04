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
		),
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
	})
		.index("by_game", ["gameId", "updatedAt"])
		.index("by_game_client", ["gameId", "clientId"]),
};
