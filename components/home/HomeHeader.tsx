"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
	return (
		<header className="sticky top-0 z-10 border-b border-white/60 bg-white/90 backdrop-blur-xl shadow-sm dark:border-white/20 dark:bg-slate-950/80">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6 md:py-4">
				<Link
					className="text-lg font-semibold tracking-tight bg-gradient-to-r from-purple-500 to-pink-400 bg-clip-text text-transparent"
					href="/"
				>
					Leet Royale
				</Link>
				<nav
					aria-label="Primary"
					className="hidden items-center gap-6 text-sm font-medium sm:flex"
				>
					<Link
						className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
						href="/problems"
					>
						Problems
					</Link>
					<Link
						className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
						href="/lobby"
					>
						Lobbies
					</Link>
					<Link
						className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
						href="/spectate"
					>
						Spectate
					</Link>
				</nav>
				<SignOutButton />
			</div>
		</header>
	);
}

function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	const router = useRouter();

	if (!isAuthenticated) return null;

	return (
		<Button
			type="button"
			size="sm"
			className="bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow hover:from-purple-600 hover:to-pink-500"
			onClick={() =>
				void signOut().then(() => {
					router.push("/signin");
				})
			}
		>
			Sign out
		</Button>
	);
}
