"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ColorModeButton } from "@/components/ui/color-mode";

export function HomeHeader() {
	return (
		<header className="sticky top-0 z-10 border-b border-white/60 bg-white/90 backdrop-blur-xl shadow-sm dark:border-white/20 dark:bg-slate-950/80">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6 md:py-4">
				<Link
					className="flex items-center gap-2 text-lg font-semibold tracking-tight"
					href="/"
				>
					<span className="relative inline-flex h-7 w-7 items-center justify-center">
						<Image
							src="/crown.png"
							alt="Clash Royale crown"
							width={28}
							height={28}
							priority
							className="h-full w-full object-contain"
						/>
					</span>
					<span className="bg-gradient-to-r from-[#fce28b] via-[#f4c94c] to-[#d6932d] bg-clip-text text-transparent">
						Code Royale
					</span>
				</Link>
				<nav
					aria-label="Primary"
					className="hidden items-center gap-6 text-sm font-medium sm:flex"
				>
			<Link
				className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
				href="/"
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
				<div className="flex items-center gap-2">
					<ColorModeButton className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" />
					<SignOutButton />
				</div>
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
			className="bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] text-slate-900 shadow hover:from-[#fbe08e] hover:via-[#f2c15a] hover:to-[#e0a040]"
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
