import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chatTables = {
	chats: defineTable({
		gameId: v.id("games"),
		authorId: v.optional(v.id("users")),
		message: v.string(),
		sentAt: v.number(),
		editedAt: v.optional(v.number()),
		isSystem: v.optional(v.boolean()),
	})
		.index("by_game", ["gameId", "sentAt"])
		.index("by_author", ["authorId", "sentAt"]),
};
