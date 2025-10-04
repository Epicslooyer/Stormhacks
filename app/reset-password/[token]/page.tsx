"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ResetPasswordForm() {
	const router = useRouter();
	const params = useParams();
	const [token, setToken] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const validateToken = useMutation(api.authHelpers.validatePasswordResetToken);

	useEffect(() => {
		if (params.token) {
			setToken(params.token as string);
		}
	}, [params.token]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!token) {
			setError("Invalid reset token");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await validateToken({ token });
			setSuccess(true);
			setTimeout(() => {
				router.push("/signin");
			}, 3000);
		} catch (error: any) {
			setError(error.message || "Failed to validate reset token");
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
						Reset Token Validated!
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Your reset token has been validated. Please use the sign-in page to reset your password through the standard flow. Redirecting...
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
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
					</svg>
				</div>
				<h1 className="text-2xl font-bold mb-2">Validate Reset Token</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Click the button below to validate your password reset token.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
				<button
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md p-3 font-medium transition-colors"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? "Validating..." : "Validate Token"}
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
