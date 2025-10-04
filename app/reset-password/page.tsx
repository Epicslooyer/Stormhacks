"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export default function ResetPasswordRequest() {
	const _router = useRouter();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const requestPasswordReset = useMutation(
		api.authHelpers.requestPasswordReset,
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			setError("Email is required");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await requestPasswordReset({ email });
			setSuccess(true);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to send reset email";
			setError(message || "Failed to send reset email");
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Reset email sent icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
						Check Your Email
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						We've sent a password reset link to <strong>{email}</strong>
					</p>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						The link will expire in 1 hour. If you don't see the email, check
						your spam folder.
					</p>
				</div>

				<div className="text-center">
					<Link
						href="/signin"
						className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
					>
						Back to sign in
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
			<div className="text-center">
				<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg
						className="w-8 h-8 text-blue-600 dark:text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Password reset illustration</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Enter your email address and we'll send you a link to reset your
					password.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
				<input
					className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
					type="email"
					placeholder="Email address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isLoading}
				/>

				<button
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md p-3 font-medium transition-colors"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? "Sending..." : "Send Reset Link"}
				</button>

				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
						<p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
					</div>
				)}
			</form>

			<div className="text-center">
				<Link
					href="/signin"
					className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
				>
					Back to sign in
				</Link>
			</div>
		</div>
	);
}
