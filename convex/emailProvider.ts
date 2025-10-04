// Temporarily disabled Resend to debug MessageChannel error
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// Simple token generation using crypto.randomUUID and Math.random
function generateSecureToken(length: number = 32): string {
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	let result = "";
	
	// Use crypto.randomUUID if available, otherwise fall back to Math.random
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		// Generate multiple UUIDs and combine them for longer tokens
		const numUuids = Math.ceil(length / 36); // UUID is 36 chars
		for (let i = 0; i < numUuids; i++) {
			result += crypto.randomUUID().replace(/-/g, "");
		}
	} else {
		// Fallback to Math.random
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
	}
	
	return result.substring(0, length);
}

export const emailProvider = {
	async generateVerificationToken(): Promise<string> {
		return generateSecureToken(32);
	},

	async generatePasswordResetToken(): Promise<string> {
		return generateSecureToken(48);
	},

	async sendVerificationEmail(email: string, token: string): Promise<void> {
		// Temporarily disabled to debug MessageChannel error
		console.log(`Verification email would be sent to ${email} with token: ${token}`);
		console.log(`Verification URL: ${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
		
		// TODO: Re-enable Resend email sending once MessageChannel issue is resolved
		/*
		const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
		
		const { error } = await resend.emails.send({
			from: "noreply@yourdomain.com", // Replace with your verified domain
			to: [email],
			subject: "Verify your email address",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Verify Your Email Address</h2>
					<p>Thank you for signing up! Please click the button below to verify your email address:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${verificationUrl}" 
						   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							Verify Email Address
						</a>
					</div>
					<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${verificationUrl}</p>
					<p>This link will expire in 24 hours.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
				</div>
			`,
		});

		if (error) {
			console.error("Failed to send verification email:", error);
			throw new Error("Failed to send verification email");
		}
		*/
	},

	async sendPasswordResetEmail(email: string, token: string): Promise<void> {
		// Temporarily disabled to debug MessageChannel error
		console.log(`Password reset email would be sent to ${email} with token: ${token}`);
		console.log(`Reset URL: ${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/${token}`);
		
		// TODO: Re-enable Resend email sending once MessageChannel issue is resolved
		/*
		const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/${token}`;
		
		const { error } = await resend.emails.send({
			from: "noreply@yourdomain.com", // Replace with your verified domain
			to: [email],
			subject: "Reset your password",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Reset Your Password</h2>
					<p>You requested to reset your password. Click the button below to set a new password:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${resetUrl}" 
						   style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							Reset Password
						</a>
					</div>
					<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${resetUrl}</p>
					<p>This link will expire in 1 hour.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
				</div>
			`,
		});

		if (error) {
			console.error("Failed to send password reset email:", error);
			throw new Error("Failed to send password reset email");
		}
		*/
	},
};
