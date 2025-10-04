import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { emailProvider } from "./emailProvider";

// Request email verification for a user
export const requestEmailVerification = mutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		// Check if user exists and is not already verified
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		if (user.emailVerificationTime) {
			throw new Error("Email is already verified");
		}

		// Generate verification token
		const token = await emailProvider.generateVerificationToken();

		// Store verification token with expiration (24 hours)
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
		await ctx.db.insert("emailVerificationTokens", {
			email: args.email,
			token,
			expiresAt,
		});

		// Send verification email
		await emailProvider.sendVerificationEmail(args.email, token);

		return { success: true };
	},
});

// Verify email with token
export const verifyEmail = mutation({
	args: {
		email: v.string(),
		token: v.string(),
	},
	handler: async (ctx, args) => {
		// Find the verification token
		const verificationToken = await ctx.db
			.query("emailVerificationTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!verificationToken) {
			throw new Error("Invalid verification token");
		}

		if (verificationToken.email !== args.email) {
			throw new Error("Token does not match email");
		}

		if (verificationToken.expiresAt < Date.now()) {
			throw new Error("Verification token has expired");
		}

		// Update user's email verification status
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		await ctx.db.patch(user._id, {
			emailVerificationTime: Date.now(),
		});

		// Delete the used token
		await ctx.db.delete(verificationToken._id);

		return { success: true };
	},
});

// Request password reset
export const requestPasswordReset = mutation({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		// Check if user exists
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			// Don't reveal if user exists or not for security
			return { success: true };
		}

		// Generate reset token
		const token = await emailProvider.generatePasswordResetToken();

		// Store reset token with expiration (1 hour)
		const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
		await ctx.db.insert("passwordResetTokens", {
			email: args.email,
			token,
			expiresAt,
		});

		// Send reset email
		await emailProvider.sendPasswordResetEmail(args.email, token);

		return { success: true };
	},
});

// Get current user's verification status
export const getUserVerificationStatus = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}

		return {
			email: user.email,
			emailVerified: !!user.emailVerificationTime,
			emailVerifiedAt: user.emailVerificationTime || null,
		};
	},
});

// Resend verification email for current user
export const resendVerificationEmail = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			throw new Error("User not found");
		}

		if (user.emailVerificationTime) {
			throw new Error("Email is already verified");
		}

		if (!user.email) {
			throw new Error("User email not found");
		}

		// Generate new verification token
		const token = await emailProvider.generateVerificationToken();

		// Store verification token with expiration (24 hours)
		const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
		await ctx.db.insert("emailVerificationTokens", {
			email: user.email,
			token,
			expiresAt,
		});

		// Send verification email
		await emailProvider.sendVerificationEmail(user.email, token);

		return { success: true };
	},
});

// Validate password reset token
export const validatePasswordResetToken = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		// Find the reset token
		const resetToken = await ctx.db
			.query("passwordResetTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!resetToken) {
			throw new Error("Invalid reset token");
		}

		if (resetToken.expiresAt < Date.now()) {
			throw new Error("Reset token has expired");
		}

		// Delete the used token
		await ctx.db.delete(resetToken._id);

		return {
			success: true,
			email: resetToken.email,
			message:
				"Token is valid. Please contact support to reset your password, or use the sign-in page to reset it through the standard flow.",
		};
	},
});
