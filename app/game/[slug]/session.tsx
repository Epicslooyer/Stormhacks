"use client";

import { useState } from "react";
import { useGameConnection } from "@/components/useGameConnection";

export default function GameSession({ slug }: { slug: string }) {
	const { game, clientId, presenceCount, slug: resolvedSlug, countdownMs } =
		useGameConnection(slug, "/game");
	const [copied, setCopied] = useState(false);
	const countdownSeconds = countdownMs === null ? null : Math.ceil(countdownMs / 1000);

	return (
		<main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="text-3xl font-bold">
					{game?.name ?? `Game ${resolvedSlug}`}
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Status: {game?.status ?? "creating"}
				</p>
			</header>
			<section className="flex flex-col items-center gap-3">
				<span className="text-lg font-semibold">
					Live participants: {presenceCount}
				</span>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					You are connected as {clientId.slice(0, 8)}
				</p>
		{game?.status === "countdown" && countdownSeconds !== null && (
			<p className="text-sm font-semibold text-foreground">
				Game starting in {countdownSeconds}s
			</p>
		)}
		{game?.status === "lobby" && (
			<p className="text-xs text-slate-500 dark:text-slate-400">
				Waiting for the host to begin the game…
			</p>
		)}
				<button
					type="button"
					className="bg-slate-200 dark:bg-slate-800 text-foreground px-3 py-1 rounded-md"
					onClick={async () => {
						if (typeof window === "undefined") return;
						const shareUrl = `${window.location.origin}/game/${resolvedSlug}`;
						try {
							await navigator.clipboard.writeText(shareUrl);
							setCopied(true);
							setTimeout(() => setCopied(false), 2000);
						} catch (error) {
							console.error("Failed to copy game link", error);
						}
					}}
				>
					{copied ? "Copied!" : "Share game link"}
				</button>
			</section>
		</main>
	);
}
