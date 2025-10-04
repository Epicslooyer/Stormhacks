"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignIn() {
	const { signIn } = useAuthActions();
	const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const formData = new FormData(e.target as HTMLFormElement);
			formData.set("flow", flow);
			
			await signIn("password", formData);
			router.push("/");
		} catch (error: any) {
			console.error("Sign in error:", error);
			
			// Handle specific error cases
			if (error.message?.includes("email not verified")) {
				setError("Please verify your email address before signing in. Check your inbox for a verification email.");
			} else if (error.message?.includes("invalid credentials")) {
				setError("Invalid email or password. Please try again.");
			} else if (error.message?.includes("user not found")) {
				setError("No account found with this email address.");
			} else {
				setError(error.message || "An error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};


	return (
		<div className="flex flex-col gap-8 w-96 mx-auto h-screen justify-center items-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-2">
					{flow === "signIn" ? "Welcome Back" : "Create Account"}
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					{flow === "signIn" 
						? "Sign in to access your account" 
						: "Sign up to get started"}
				</p>
			</div>
			
			
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
				<div className="flex flex-col gap-2">
					<input
						className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
						type="email"
						name="email"
						placeholder="Email address"
						required
						disabled={isLoading}
					/>
					<input
						className="bg-background text-foreground rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
						type="password"
						name="password"
						placeholder="Password"
						required
						disabled={isLoading}
						minLength={6}
					/>
				</div>

				{flow === "signIn" && (
					<div className="text-right">
						<Link 
							href="/reset-password"
							className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
						>
							Forgot your password?
						</Link>
					</div>
				)}

				<button
					className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md p-3 font-medium transition-colors"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? "Loading..." : (flow === "signIn" ? "Sign In" : "Sign Up")}
				</button>

				<div className="text-center">
					<span className="text-gray-600 dark:text-gray-400">
						{flow === "signIn"
							? "Don't have an account?"
							: "Already have an account?"}
					</span>
					<button
						type="button"
						className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
						onClick={() => {
							setFlow(flow === "signIn" ? "signUp" : "signIn");
							setError(null);
						}}
						disabled={isLoading}
					>
						{flow === "signIn" ? "Sign up" : "Sign in"}
					</button>
				</div>

				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
						<p className="text-red-700 dark:text-red-300 text-sm">
							{error}
						</p>
					</div>
				)}
			</form>

			{flow === "signUp" && (
				<div className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-sm">
					By signing up, you agree to receive a verification email to confirm your account.
				</div>
			)}
		</div>
	);
}
