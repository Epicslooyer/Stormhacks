import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const PRESENCE_TTL = 1000 * 15;

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
			return { count: 0, participants: [] };
		}
		const cutoff = Date.now() - PRESENCE_TTL;
		const presences = await ctx.db
			.query("gamePresences")
			.withIndex("by_game", (q) => q.eq("gameId", game._id))
			.collect();
		const active = presences.filter((presence) => presence.updatedAt >= cutoff);
		return {
			count: active.length,
			participants: active.map((presence) => ({
				clientId: presence.clientId,
				userId: presence.userId ?? null,
				lastSeen: presence.updatedAt,
			})),
		};
	},
});
