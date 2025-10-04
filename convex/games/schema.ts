import { defineTable } from "convex/server";
import { v } from "convex/values";

export const gameTables = {
	games: defineTable({
		name: v.string(),
		createdBy: v.id("users"),
		createdAt: v.number(),
		status: v.union(
			v.literal("lobby"),
			v.literal("active"),
			v.literal("completed"),
		),
	})
		.index("by_status", ["status"])
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
};
