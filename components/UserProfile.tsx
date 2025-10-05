"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export default function UserProfile() {
	const [isResending, setIsResending] = useState(false);
	const [resendMessage, setResendMessage] = useState<string | null>(null);

	const userStatus = useQuery(api.authHelpers.getUserVerificationStatus);
	const resendVerification = useMutation(
		api.authHelpers.resendVerificationEmail,
	);

	const handleResendVerification = async () => {
		if (!userStatus?.email) return;

		setIsResending(true);
		setResendMessage(null);

		try {
			await resendVerification({});
			setResendMessage("Verification email sent! Please check your inbox.");
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to resend verification email";
			setResendMessage(message || "Failed to resend verification email");
		} finally {
			setIsResending(false);
		}
	};

	if (!userStatus) {
		return (
			<div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
				<p className="text-gray-600 dark:text-gray-400">
					Loading user profile...
				</p>
			</div>
		);
	}

	return (
		<div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
			<h3 className="text-lg font-semibold mb-4">Account Information</h3>

			<div className="space-y-3">
				<div>
					<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
						Email Address
					</p>
					<p className="text-foreground">{userStatus.email}</p>
				</div>

				<div>
					<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
						Email Verification Status
					</p>
					<div className="flex items-center gap-2">
						{userStatus.emailVerified ? (
							<>
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span className="text-green-600 dark:text-green-400 font-medium">
									Verified
								</span>
								{userStatus.emailVerifiedAt && (
									<span className="text-xs text-gray-500 dark:text-gray-400">
										(Verified on{" "}
										{new Date(userStatus.emailVerifiedAt).toLocaleDateString()})
									</span>
								)}
							</>
						) : (
							<>
								<div className="w-2 h-2 bg-red-500 rounded-full"></div>
								<span className="text-red-600 dark:text-red-400 font-medium">
									Not Verified
								</span>
							</>
						)}
					</div>
				</div>

				{!userStatus.emailVerified && (
					<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
						<div className="flex items-start gap-2">
							<svg
								className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Email verification reminder icon</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<div className="flex-1">
								<p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
									Email verification required
								</p>
								<p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
									Please verify your email address to access all features.
								</p>
								<button
									type="button"
									onClick={handleResendVerification}
									disabled={isResending}
									className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 font-medium disabled:text-gray-400"
								>
									{isResending ? "Sending..." : "Resend verification email"}
								</button>
								{resendMessage && (
									<p className="text-xs mt-1 text-yellow-700 dark:text-yellow-300">
										{resendMessage}
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
