import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get chat messages for a specific game
export const getChatMessages = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("chats")
			.withIndex("by_game", (q) => q.eq("gameId", args.gameId))
			.order("asc")
			.collect();

		// Get user information for each message
		const messagesWithUsers = await Promise.all(
			messages.map(async (message) => {
				const user = message.authorId ? await ctx.db.get(message.authorId) : null;
				return {
					...message,
					author: user ? {
						name: user.name || user.email || "Anonymous",
						image: user.image,
					} : {
						name: "Anonymous",
						image: null,
					},
				};
			})
		);

		return messagesWithUsers;
	},
});

// Mutation to send a chat message
export const sendMessage = mutation({
	args: {
		gameId: v.id("games"),
		message: v.string(),
		authorId: v.optional(v.id("users")),
		isSystem: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Validate message length
		if (args.message.trim().length === 0) {
			throw new Error("Message cannot be empty");
		}

		if (args.message.length > 500) {
			throw new Error("Message too long (max 500 characters)");
		}

		const messageId = await ctx.db.insert("chats", {
			gameId: args.gameId,
			authorId: args.authorId,
			message: args.message.trim(),
			sentAt: Date.now(),
			isSystem: args.isSystem || false,
		});

		return messageId;
	},
});

// Query to get recent messages for a game (for performance)
export const getRecentMessages = query({
	args: { 
		gameId: v.id("games"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;
		
		const messages = await ctx.db
			.query("chats")
			.withIndex("by_game", (q) => q.eq("gameId", args.gameId))
			.order("desc")
			.take(limit);

		// Reverse to get chronological order
		const reversedMessages = messages.reverse();

		// Get user information for each message
		const messagesWithUsers = await Promise.all(
			reversedMessages.map(async (message) => {
				const user = message.authorId ? await ctx.db.get(message.authorId) : null;
				return {
					...message,
					author: user ? {
						name: user.name || user.email || "Anonymous",
						image: user.image,
					} : {
						name: "Anonymous",
						image: null,
					},
				};
			})
		);

		return messagesWithUsers;
	},
});

// Mutation to send a system message (for game events)
export const sendSystemMessage = mutation({
	args: {
		gameId: v.id("games"),
		message: v.string(),
	},
	handler: async (ctx, args) => {
		const messageId = await ctx.db.insert("chats", {
			gameId: args.gameId,
			authorId: undefined,
			message: args.message,
			sentAt: Date.now(),
			isSystem: true,
		});

		return messageId;
	},
});
