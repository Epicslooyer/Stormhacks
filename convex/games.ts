export const getScoresForGame = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) throw new Error("Game not found");
		const scores = await ctx.db
			.query("gameScores")
			.withIndex("by_game", (q) => q.eq("gameId", game._id))
			.collect();
		// Sort by score ascending (fastest first)
		return scores
			.map((s) => ({
				playerName: s.playerName,
				score: s.score,
				clientId: s.clientId,
				userId: s.userId ?? null,
				submittedAt: s.submittedAt,
			}))
			.sort((a, b) => a.score - b.score);
	},
});
export const submitScore = mutation({
	args: {
		slug: v.string(),
		clientId: v.string(),
		playerName: v.string(),
		score: v.number(), // seconds
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) throw new Error("Game not found");
		const userId = await getAuthUserId(ctx);
		const now = Date.now();
		// Only allow one score per clientId per game
		const existing = await ctx.db
			.query("gameScores")
			.withIndex("by_game_client", (q) => q.eq("gameId", game._id).eq("clientId", args.clientId))
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				score: args.score,
				playerName: args.playerName,
				submittedAt: now,
				userId: userId ?? undefined,
			});
			return { updated: true };
		}
		await ctx.db.insert("gameScores", {
			gameId: game._id,
			userId: userId ?? undefined,
			clientId: args.clientId,
			playerName: args.playerName,
			score: args.score,
			submittedAt: now,
		});
		return { updated: false };
	},
});
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const PRESENCE_TTL = 1000 * 15;
const CURSOR_TTL = 1000 * 10;

const gameStatusValidator = v.union(
	v.literal("lobby"),
	v.literal("active"),
	v.literal("completed"),
	v.literal("countdown"),
);

async function getGameBySlug(
	db: DatabaseReader,
	slug: string,
): Promise<Doc<"games"> | null> {
	return db
		.query("games")
		.withIndex("by_slug", (q) => q.eq("slug", slug))
		.unique();
}

export const getOrCreateGame = mutation({
       args: {
	       slug: v.string(),
	       name: v.optional(v.string()),
	       problemSlug: v.optional(v.string()),
	       problemTitle: v.optional(v.string()),
	       problemDifficulty: v.optional(v.string()),
	       mode: v.optional(v.union(v.literal("solo"), v.literal("multiplayer"))),
       },
	handler: async (ctx, args) => {
		const existing = await getGameBySlug(ctx.db, args.slug);
		if (existing) {
			return { gameId: existing._id, slug: existing.slug, created: false };
		}

		const userId = await getAuthUserId(ctx);
		const now = Date.now();
	       const gameId = await ctx.db.insert("games", {
		       slug: args.slug,
		       name: args.name ?? `Game ${args.slug}`,
		       createdBy: userId ?? undefined,
		       createdAt: now,
		       status: "lobby",
		       problemSlug: args.problemSlug ?? undefined,
		       problemTitle: args.problemTitle ?? undefined,
		       problemDifficulty: args.problemDifficulty ?? undefined,
		       mode: args.mode ?? "multiplayer",
	       });

		return { gameId, slug: args.slug, created: true };
	},
});

export const getGame = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const [game, viewerId] = await Promise.all([
			getGameBySlug(ctx.db, args.slug),
			getAuthUserId(ctx),
		]);
		if (!game) return null;
		return {
			_id: game._id,
			slug: game.slug,
			name: game.name,
			status: game.status,
			createdAt: game.createdAt,
			createdBy: game.createdBy,
			countdownEndsAt: game.countdownEndsAt ?? null,
			problemSlug: game.problemSlug ?? null,
			problemTitle: game.problemTitle ?? null,
			problemDifficulty: game.problemDifficulty ?? null,
			viewerId,
		};
	},
});

export const beginCountdown = mutation({
	args: {
		slug: v.string(),
		durationMs: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Authentication required");
		}
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			throw new Error("Game not found");
		}
		const ownerId = game.createdBy ?? userId;
		if (ownerId !== userId) {
			throw new Error("Only the game owner can start the game");
		}
		
		// Check if all players are ready
		const cutoff = Date.now() - PRESENCE_TTL;
		const presences = await ctx.db
			.query("gamePresences")
			.withIndex("by_game", (q) => q.eq("gameId", game._id))
			.collect();
		const activePresences = presences.filter((presence) => presence.updatedAt >= cutoff);
		
		if (activePresences.length < 1) {
			throw new Error("Need at least 1 player to start the game");
		}
		
		const readyCount = activePresences.filter((presence) => presence.isReady === true).length;
		if (readyCount < activePresences.length) {
			throw new Error("All players must be ready to start the game");
		}
		
		const countdownDuration = args.durationMs ?? 5000;
		const countdownEndsAt = Date.now() + countdownDuration;
		await ctx.db.patch(game._id, {
			status: "countdown",
			createdBy: ownerId,
			countdownEndsAt,
		});
		return { status: "countdown", countdownEndsAt };
	},
});

export const completeGameStart = mutation({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			throw new Error("Game not found");
		}
		if (game.status !== "countdown" || game.countdownEndsAt === undefined) {
			return {
				status: game.status,
				countdownEndsAt: game.countdownEndsAt ?? null,
			};
		}
		if (Date.now() < game.countdownEndsAt) {
			return {
				status: "countdown",
				countdownEndsAt: game.countdownEndsAt,
			};
		}
		await ctx.db.patch(game._id, {
			status: "active",
			countdownEndsAt: undefined,
		});
		return { status: "active", countdownEndsAt: null };
	},
});

export const heartbeatPresence = mutation({
	args: {
		slug: v.string(),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			throw new Error("Game not found");
		}
		const userId = await getAuthUserId(ctx);
		const now = Date.now();
		const existing = await ctx.db
			.query("gamePresences")
			.withIndex("by_game_client", (q) =>
				q.eq("gameId", game._id).eq("clientId", args.clientId),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				updatedAt: now,
				userId: userId ?? undefined,
			});
			return { updated: true };
		}

		await ctx.db.insert("gamePresences", {
			gameId: game._id,
			clientId: args.clientId,
			userId: userId ?? undefined,
			updatedAt: now,
			isReady: false,
		});

		return { updated: false };
	},
});

export const toggleReadiness = mutation({
	args: {
		slug: v.string(),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			throw new Error("Game not found");
		}
		if (game.status !== "lobby") {
			throw new Error("Can only toggle readiness in lobby");
		}
		const userId = await getAuthUserId(ctx);
		const existing = await ctx.db
			.query("gamePresences")
			.withIndex("by_game_client", (q) =>
				q.eq("gameId", game._id).eq("clientId", args.clientId),
			)
			.unique();
		if (!existing) {
			throw new Error("Player not found in game");
		}
		const newReadyState = !existing.isReady;
		await ctx.db.patch(existing._id, {
			isReady: newReadyState,
			userId: userId ?? undefined,
		});
		return { isReady: newReadyState };
	},
});

export const updateCursorPosition = mutation({
	args: {
		slug: v.string(),
		clientId: v.string(),
		lineNumber: v.number(),
		column: v.number(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			throw new Error("Game not found");
		}
		const userId = await getAuthUserId(ctx);
		const now = Date.now();
		const lineNumber = Math.max(1, Math.floor(args.lineNumber));
		const column = Math.max(1, Math.floor(args.column));
		const existing = await ctx.db
			.query("cursorPositions")
			.withIndex("by_game_client", (q) =>
				q.eq("gameId", game._id).eq("clientId", args.clientId),
			)
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				lineNumber,
				column,
				updatedAt: now,
				userId: userId ?? undefined,
			});
			return { updated: true };
		}

		await ctx.db.insert("cursorPositions", {
			gameId: game._id,
			clientId: args.clientId,
			userId: userId ?? undefined,
			lineNumber,
			column,
			updatedAt: now,
		});

		return { updated: false };
	},
});

export const leaveGame = mutation({
	args: {
		slug: v.string(),
		clientId: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			return { removed: false };
		}
		const existing = await ctx.db
			.query("gamePresences")
			.withIndex("by_game_client", (q) =>
				q.eq("gameId", game._id).eq("clientId", args.clientId),
			)
			.unique();
		if (!existing) {
			return { removed: false };
		}
		await ctx.db.delete(existing._id);
		const cursor = await ctx.db
			.query("cursorPositions")
			.withIndex("by_game_client", (q) =>
				q.eq("gameId", game._id).eq("clientId", args.clientId),
			)
			.unique();
		if (cursor) {
			await ctx.db.delete(cursor._id);
		}
		return { removed: true };
	},
});

export const activePresence = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			return { count: 0, participants: [], readyCount: 0 };
		}
		const cutoff = Date.now() - PRESENCE_TTL;
		const presences = await ctx.db
			.query("gamePresences")
			.withIndex("by_game", (q) => q.eq("gameId", game._id))
			.collect();
		const active = presences.filter((presence) => presence.updatedAt >= cutoff);
		const readyCount = active.filter((presence) => presence.isReady === true).length;
		return {
			count: active.length,
			readyCount,
			participants: active.map((presence) => ({
				clientId: presence.clientId,
				userId: presence.userId ?? null,
				lastSeen: presence.updatedAt,
				isReady: presence.isReady ?? false,
			})),
		};
	},
});

export const activeCursorPositions = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await getGameBySlug(ctx.db, args.slug);
		if (!game) {
			return [];
		}
		const cutoff = Date.now() - CURSOR_TTL;
		const cursors = await ctx.db
			.query("cursorPositions")
			.withIndex("by_game", (q) => q.eq("gameId", game._id))
			.collect();
		return cursors
			.filter((cursor) => cursor.updatedAt >= cutoff)
			.map((cursor) => ({
				clientId: cursor.clientId,
				userId: cursor.userId ?? null,
				lineNumber: cursor.lineNumber,
				column: cursor.column,
				lastUpdated: cursor.updatedAt,
			}));
	},
});

export const listGamesByStatus = query({
	args: {
		statuses: v.array(gameStatusValidator),
	},
	handler: async (ctx, args) => {
		if (args.statuses.length === 0) {
			return [];
		}
		const now = Date.now();
		const cutoff = now - PRESENCE_TTL;
		const games = (
			await Promise.all(
				args.statuses.map((status) =>
					ctx.db
						.query("games")
						.withIndex("by_status", (q) => q.eq("status", status))
						.collect(),
				),
			)
		)
			.flat()
			.sort((a, b) => b.createdAt - a.createdAt);

		const enriched = await Promise.all(
			games.map(async (game) => {
				const presences = await ctx.db
					.query("gamePresences")
					.withIndex("by_game", (q) => q.eq("gameId", game._id))
					.collect();
				const activePresences = presences.filter(
					(presence) => presence.updatedAt >= cutoff,
				);
				const readyCount = activePresences.filter(
					(presence) => presence.isReady === true,
				).length;
				return {
					_id: game._id,
					slug: game.slug,
					name: game.name,
					status: game.status,
					createdAt: game.createdAt,
					createdBy: game.createdBy ?? null,
					countdownEndsAt: game.countdownEndsAt ?? null,
					problemSlug: game.problemSlug ?? null,
					problemTitle: game.problemTitle ?? null,
					problemDifficulty: game.problemDifficulty ?? null,
					presenceCount: activePresences.length,
					readyCount,
				};
			}),
		);

		return enriched;
	},
});
