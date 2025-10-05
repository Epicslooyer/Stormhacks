"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";

export default function SpectateSession({ slug }: { slug: string }) {
	const game = useQuery(api.games.getGame, { slug });
	const presence = useQuery(api.games.activePresence, { slug });
	const [countdownMs, setCountdownMs] = useState<number | null>(null);

	const status = game?.status ?? null;
	const presenceCount = presence?.count ?? 0;
	const participants = presence?.participants ?? [];
	const problemTitle = game?.problemTitle ?? game?.name ?? slug;
	const problemDifficulty = game?.problemDifficulty ?? null;
	const countdownEndsAt = game?.countdownEndsAt ?? null;

	useEffect(() => {
		if (countdownEndsAt === null) {
			setCountdownMs(null);
			return;
		}
		const tick = () => {
			setCountdownMs(Math.max(0, countdownEndsAt - Date.now()));
		};
		tick();
		const interval = setInterval(tick, 200);
		return () => clearInterval(interval);
	}, [countdownEndsAt]);

	const countdownSeconds =
		countdownMs === null ? null : Math.ceil(countdownMs / 1000);

	const visibleParticipants = useMemo(() => {
		return participants.map((presence) => {
			const isGuest = presence.userId === null;
			const baseLabel = isGuest
				? presence.clientId.slice(0, 8)
				: String(presence.userId).slice(0, 8);
			return {
				key: isGuest ? `anon-${presence.clientId}` : String(presence.userId),
				label: baseLabel,
				lastSeen: presence.lastSeen,
				isGuest,
			};
		});
	}, [participants]);

	if (game === undefined) {
		return (
			<main className="p-8 flex flex-col gap-4 max-w-3xl mx-auto text-center">
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Loading game information…
				</p>
			</main>
		);
	}

	if (game === null) {
		return (
			<main className="p-8 flex flex-col gap-4 max-w-3xl mx-auto text-center">
				<h1 className="text-2xl font-semibold">Game not found</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					We couldn&apos;t locate a game with ID{" "}
					<span className="font-mono">{slug}</span>.
				</p>
			</main>
		);
	}

	return (
		<main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="text-3xl font-bold">Spectating {game.name}</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Status: {status ?? "unknown"}
				</p>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Problem: {problemTitle}
					{problemDifficulty ? ` · ${problemDifficulty}` : ""}
				</p>
			</header>
			<section className="flex flex-col items-center gap-2">
				<span className="text-lg font-semibold">
					Active players: {presenceCount}
				</span>
				{status === "countdown" && countdownSeconds !== null && (
					<p className="text-sm font-semibold text-foreground">
						Game starting in {countdownSeconds}s
					</p>
				)}
				{status === "lobby" && (
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Players are gathering in the lobby.
					</p>
				)}
			</section>
			<section className="flex flex-col items-center gap-3">
				<div className="w-full max-w-md border border-slate-200 dark:border-slate-800 rounded-md p-3">
					<h2 className="text-sm font-semibold mb-2">Currently connected</h2>
					{visibleParticipants.length === 0 ? (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							No active players detected right now.
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
				<Link
					href={`/game/${game.slug}`}
					className="text-sm underline hover:no-underline text-foreground"
				>
					Join the game
				</Link>
			</section>
		</main>
	);
}
