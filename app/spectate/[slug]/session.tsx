"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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
	const gameCreatedAt = game?.createdAt ? new Date(game.createdAt) : null;

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

	const countdownActive = status === "countdown" && countdownSeconds !== null;
	const statusLabelMap: Record<string, string> = {
		active: "Game in progress",
		countdown: "Starting soon",
		lobby: "Waiting in lobby",
		completed: "Game completed",
	};
	const badgeVariantMap: Record<string, "default" | "secondary" | "outline"> = {
		active: "default",
		countdown: "secondary",
		lobby: "outline",
		completed: "outline",
	};
	const statusLabel = status ? statusLabelMap[status] ?? status : "Unknown";
	const statusBadgeVariant = status
		? badgeVariantMap[status] ?? "outline"
		: "outline";
	const createdAtLabel = gameCreatedAt
		? gameCreatedAt.toLocaleString()
		: "Unknown";

	if (game === undefined) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
					<Link
						href="/spectate"
						className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
					>
						<span aria-hidden>←</span>
						Back to live games
					</Link>
					<Card className="border-dashed border-muted-foreground/40 bg-card/40">
						<CardContent className="py-12 text-center text-sm text-muted-foreground">
							Loading game information…
						</CardContent>
					</Card>
				</div>
			</main>
		);
	}

	if (game === null) {
		return (
			<main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
					<Link
						href="/spectate"
						className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
					>
						<span aria-hidden>←</span>
						Back to live games
					</Link>
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="text-3xl font-semibold">Game not found</CardTitle>
							<CardDescription>
								We couldn&apos;t locate a game with ID{" "}
								<code className="font-mono text-foreground">{slug}</code>.
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/25 px-4 py-12">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
				<Link
					href="/spectate"
					className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
				>
					<span aria-hidden>←</span>
					Back to live games
				</Link>
				<header className="space-y-3 text-center">
					<span className="inline-flex flex-wrap items-center justify-center gap-2">
						<Badge variant={statusBadgeVariant} className="uppercase">
							{statusLabel}
						</Badge>
						{problemDifficulty && (
							<Badge variant="outline" className="capitalize">
								{problemDifficulty}
							</Badge>
						)}
					</span>
					<h1 className="text-4xl font-bold tracking-tight">
						Spectating {game.name ?? slug}
					</h1>
					<p className="text-base text-muted-foreground">
						Problem: <span className="text-foreground">{problemTitle}</span>
					</p>
				</header>
				{countdownActive && (
					<Card className="border-primary/30 bg-primary/5">
						<CardContent className="py-6">
							<div className="space-y-3 text-center">
								<p className="text-sm font-medium text-primary">
									Countdown in progress
								</p>
								<p className="text-5xl font-bold text-primary">
									{countdownSeconds}s
								</p>
								<p className="text-sm text-muted-foreground">
									Game starting soon
								</p>
							</div>
						</CardContent>
					</Card>
				)}
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
					<Card className="self-start">
						<CardHeader>
							<CardTitle className="text-xl font-semibold">
								Live participants ({presenceCount})
							</CardTitle>
							<CardDescription>
								Players currently connected to this match.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{visibleParticipants.length === 0 ? (
								<div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
									No active players detected right now.
								</div>
							) : (
								<div className="space-y-3">
									{visibleParticipants.map((player, index) => (
										<div
											key={player.key}
											className="flex items-center justify-between rounded-lg border border-border bg-card/80 p-3"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
													{index + 1}
												</div>
												<div className="space-y-1">
													<p className="font-medium text-foreground">
														{player.label}
													</p>
													{player.isGuest ? (
														<span className="text-xs uppercase tracking-wide text-muted-foreground">
															Guest player
														</span>
													) : (
														<span className="text-xs text-muted-foreground">
															Registered player
														</span>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Match overview</CardTitle>
								<CardDescription>Key details from the live lobby.</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
									<span className="text-muted-foreground">Status</span>
									<Badge variant={statusBadgeVariant} className="uppercase">
										{statusLabel}
									</Badge>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
									<span className="text-muted-foreground">Live players</span>
									<span className="font-semibold text-foreground">{presenceCount}</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
									<span className="text-muted-foreground">Problem</span>
									<span className="truncate pl-2 text-right font-medium text-foreground">
										{problemTitle}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
									<span className="text-muted-foreground">Created</span>
									<span className="font-medium text-foreground">{createdAtLabel}</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Jump into the action</CardTitle>
								<CardDescription>
									Move from spectator to player at any time.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								{status === "lobby" && (
									<p className="text-muted-foreground">
										Players are gathering in the lobby. You can join to participate.
									</p>
								)}
								{status === "active" && (
									<p className="text-muted-foreground">
										The match is underway. Join the game view to follow every move.
									</p>
								)}
								{status === "countdown" && (
									<p className="text-muted-foreground">
										Countdown is live—join now to be ready when it begins.
									</p>
								)}
								<Link href={`/game/${game.slug}`} className="block">
									<Button className="w-full">Open game view</Button>
								</Link>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</main>
	);
}
