import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { chatTables } from "./chats/schema";
import { gameTables } from "./games/schema";
import { playerTables } from "./players/schema";
import { roundTables } from "./round/schema";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
	...authTables,
	...chatTables,
	...gameTables,
	...playerTables,
	...roundTables,
	numbers: defineTable({
		value: v.number(),
	}),
	emailVerificationTokens: defineTable({
		email: v.string(),
		token: v.string(),
		expiresAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_email", ["email"]),
	passwordResetTokens: defineTable({
		email: v.string(),
		token: v.string(),
		expiresAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_email", ["email"]),
});
