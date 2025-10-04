"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useGameConnection } from "@/components/useGameConnection";

export default function LobbySession({ slug }: { slug: string }) {
	const router = useRouter();
	const {
		game,
		presenceCount,
		clientId,
		slug: resolvedSlug,
		participants,
		countdownMs,
		viewerId,
	} = useGameConnection(slug, "/lobby");
	const beginCountdown = useMutation(api.games.beginCountdown);
	const [pending, setPending] = useState(false);
	const [copied, setCopied] = useState(false);

	const status = game?.status ?? "lobby";
	const countdownSeconds = countdownMs === null ? null : Math.ceil(countdownMs / 1000);
	const isOwner =
		game?.createdBy !== undefined && viewerId !== null && game.createdBy === viewerId;
	const canStart = status === "lobby" && isOwner;
	const countdownActive = status === "countdown" && countdownSeconds !== null;
	const visibleParticipants = useMemo(() => {
		return participants.map((presence) => {
			const isGuest = presence.userId === null;
			const baseLabel = isGuest
				? presence.clientId.slice(0, 8)
				: String(presence.userId).slice(0, 8);
			return {
				key: isGuest ? `anon-${presence.clientId}` : String(presence.userId),
				label: baseLabel,
				isGuest,
			};
		});
	}, [participants]);

	useEffect(() => {
		if (status === "active") {
			router.push(`/game/${resolvedSlug}`);
		}
	}, [resolvedSlug, router, status]);

	return (
		<main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="text-3xl font-bold">
					Lobby {game?.name ?? resolvedSlug}
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Status: {status}
				</p>
			</header>
			<section className="flex flex-col items-center gap-2">
				<span className="text-lg font-semibold">
					Connected users: {presenceCount}
				</span>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					You are connected as {clientId.slice(0, 8)}
				</p>
		{countdownActive && countdownSeconds !== null && (
			<p className="text-sm font-semibold text-foreground">
				Game starting in {countdownSeconds}s
			</p>
		)}
			</section>
			<section className="flex flex-col items-center gap-3">
				<div className="w-full max-w-md border border-slate-200 dark:border-slate-800 rounded-md p-3">
					<h2 className="text-sm font-semibold mb-2">Currently connected</h2>
					{visibleParticipants.length === 0 ? (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Waiting for players to join…
						</p>
					) : (
						<ul className="flex flex-col gap-1 text-sm">
							{visibleParticipants.map((player) => (
								<li
									key={player.key}
									className="flex items-center justify-between rounded bg-slate-200/60 dark:bg-slate-800/60 px-2 py-1"
								>
									<span>{player.label}</span>
									{player.isGuest && (
										<span className="text-[10px] uppercase tracking-wide text-slate-500">
											Guest
										</span>
									)}
								</li>
							))}
						</ul>
					)}
			</div>
			<button
					type="button"
					className="bg-slate-200 dark:bg-slate-800 text-foreground px-3 py-1 rounded-md"
					onClick={async () => {
						if (typeof window === "undefined") return;
						const shareUrl = `${window.location.origin}/lobby/${resolvedSlug}`;
						try {
							await navigator.clipboard.writeText(shareUrl);
							setCopied(true);
							setTimeout(() => setCopied(false), 2000);
						} catch (error) {
							console.error("Failed to copy lobby link", error);
						}
					}}
				>
					{copied ? "Copied!" : "Share lobby link"}
			</button>
			{isOwner && (
				<button
					type="button"
					className="bg-foreground text-background px-4 py-2 rounded-md disabled:opacity-50"
					disabled={!canStart || pending}
					onClick={async () => {
						if (!canStart || pending) return;
						setPending(true);
						try {
							await beginCountdown({ slug: resolvedSlug, durationMs: 5000 });
						} finally {
							setPending(false);
						}
					}}
				>
					{pending ? "Starting..." : "Start game"}
				</button>
			)}
			{!isOwner && status === "lobby" && (
				<p className="text-xs text-slate-500 dark:text-slate-400">
					Waiting for the host to start the game…
				</p>
			)}
				<Link
					href={`/game/${resolvedSlug}`}
					className="text-sm underline hover:no-underline text-foreground"
				>
					Open game page
				</Link>
			</section>
		</main>
	);
}
