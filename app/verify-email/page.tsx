"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function VerifyEmail() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [token, setToken] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const verifyEmail = useMutation(api.authHelpers.verifyEmail);
	const resendVerification = useMutation(api.authHelpers.resendVerificationEmail);
	const userStatus = useQuery(api.authHelpers.getUserVerificationStatus);

	useEffect(() => {
		const emailParam = searchParams.get("email");
		const tokenParam = searchParams.get("token");
		
		if (emailParam) setEmail(decodeURIComponent(emailParam));
		if (tokenParam) setToken(tokenParam);
	}, [searchParams]);

	const handleVerifyEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !token) {
			setError("Email and token are required");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await verifyEmail({ email, token });
			setSuccess(true);
			setTimeout(() => {
				router.push("/");
			}, 2000);
		} catch (error: any) {
			setError(error.message || "Failed to verify email");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendVerification = async () => {
		if (!email) {
			setError("Email is required");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await resendVerification({ email });
			setError(null);
			alert("Verification email sent! Please check your inbox.");
		} catch (error: any) {
			setError(error.message || "Failed to resend verification email");
		} finally {
			setIsLoading(false);
		}
	};

	if (success) {
		return (
			<div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
						Email Verified!
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Your email has been successfully verified. Redirecting you to the dashboard...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
			<div className="text-center">
				<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Please verify your email address to complete your account setup.
				</p>
			</div>

			<form onSubmit={handleVerifyEmail} className="flex flex-col gap-4 w-full">
				<div className="flex flex-col gap-2">
					<input
						className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
						type="email"
						placeholder="Email address"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
					<input
						className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
						type="text"
						placeholder="Verification token"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>

				<button
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md p-3 font-medium transition-colors"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? "Verifying..." : "Verify Email"}
				</button>

				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
						<p className="text-red-700 dark:text-red-300 text-sm">
							{error}
						</p>
					</div>
				)}
			</form>

			<div className="text-center">
				<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
					Didn't receive the email?
				</p>
				<button
					onClick={handleResendVerification}
					disabled={isLoading || !email}
					className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:text-gray-400"
				>
					Resend verification email
				</button>
			</div>

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
