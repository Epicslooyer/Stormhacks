"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { HomeHeader } from "@/components/home/HomeHeader";
import { useGameConnection } from "@/components/useGameConnection";
import { useTestCases } from "@/components/useTestCases";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MAX_PLAYERS = 100;
const MIN_PLAYERS_TO_START = 2;

export default function LobbySession({ slug }: { slug: string }) {
	const router = useRouter();
	const {
		game,
		presenceCount,
		readyCount,
		clientId,
		slug: resolvedSlug,
		participants,
		countdownMs,
		viewerId,
	} = useGameConnection(slug, "/lobby");
	const beginCountdown = useMutation(api.games.beginCountdown);
	const toggleReadiness = useMutation(api.games.toggleReadiness);
	const [pending, setPending] = useState(false);
	const [copied, setCopied] = useState(false);
	const [readyPending, setReadyPending] = useState(false);

	// Test cases integration
	const problemSlug = game?.problemSlug ?? null;
	const {
		testCases,
		isLoading: testCasesLoading,
		generateTestCases,
		isGenerating: testCasesGenerating,
	} = useTestCases(
		problemSlug,
		game?.problemTitle ?? undefined,
		game?.problemDifficulty ?? undefined,
	);

	const status = game?.status ?? "lobby";
	const countdownSeconds =
		countdownMs === null ? null : Math.ceil(countdownMs / 1000);
	const isOwner =
		game?.createdBy !== undefined &&
		viewerId !== null &&
		game.createdBy === viewerId;
	const canStart =
		status === "lobby" &&
		isOwner &&
		presenceCount >= MIN_PLAYERS_TO_START &&
		readyCount >= MIN_PLAYERS_TO_START;
	const countdownActive = status === "countdown" && countdownSeconds !== null;
	const problemTitle = game?.problemTitle ?? game?.name ?? resolvedSlug;
	const problemDifficulty = game?.problemDifficulty ?? null;

	const visibleParticipants = useMemo(() => {
		return participants.map((presence) => {
			const isGuest = presence.userId === null;
			const baseLabel = isGuest
				? `Player ${presence.clientId.slice(0, 6)}`
				: `User ${String(presence.userId).slice(0, 6)}`;
			return {
				key: isGuest ? `anon-${presence.clientId}` : String(presence.userId),
				label: baseLabel,
				isGuest,
				clientId: presence.clientId,
				isReady: presence.isReady ?? false,
			};
		});
	}, [participants]);

	const currentPlayer = visibleParticipants.find(
		(p) => p.clientId === clientId,
	);
	const isCurrentPlayerReady = currentPlayer?.isReady ?? false;
	const emptySlots = Math.max(MAX_PLAYERS - visibleParticipants.length, 0);

	useEffect(() => {
		if (status === "active") {
			router.push(`/game/${resolvedSlug}`);
		}
	}, [resolvedSlug, router, status]);

	const shellStyle = {
		backgroundImage: "var(--home-page-background)",
		backgroundColor: "var(--home-page-background-color)",
	} as const;
	const glassCardClassName =
		"relative overflow-hidden rounded-3xl border border-white/55 bg-white/85 px-0 py-0 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_28px_70px_-28px_rgba(24,84,189,0.45)]";
	const softPanelClassName =
		"rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-slate-600 shadow-[0_18px_45px_-30px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-300";
	const tertiarySurfaceClassName =
		"rounded-xl border border-white/35 bg-white/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_14px_35px_-32px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-300";

	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden" style={shellStyle}>
			<HomeBackdrop />
			<HomeHeader />
			<main className="flex flex-1 flex-col py-10 md:py-16">
				<div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
					<div className="space-y-8 md:space-y-12">
						<header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)]">
							<div
								className="pointer-events-none absolute inset-0 opacity-55"
								style={{
									backgroundImage:
										"radial-gradient(720px at 12% 25%, rgba(247, 211, 84, 0.35), transparent 65%)",
								}}
							/>
							<div className="relative space-y-6">
								<div className="space-y-4">
									<h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
										{game?.name ?? `Lobby ${resolvedSlug}`}
									</h1>
									<div className="flex flex-wrap items-center justify-center gap-3">
										<Badge
											variant={
												status === "lobby"
													? "secondary"
													: status === "countdown"
														? "default"
														: "outline"
												}
											className="rounded-full border border-white/50 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm dark:border-white/20 dark:bg-white/15 dark:text-slate-200"
										>
											{status === "lobby"
												? "Waiting for players"
												: status === "countdown"
													? "Starting soon"
													: status === "active"
														? "Game in progress"
														: "Completed"}
										</Badge>
										{problemDifficulty && (
											<Badge variant="outline" className="rounded-full border-white/45 bg-white/60 capitalize text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-slate-200">
												{problemDifficulty}
											</Badge>
										)}
									</div>
								</div>
								<p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-300">
									{problemTitle}
								</p>
							</div>
						</header>

						{countdownActive && countdownSeconds !== null && (
							<Card className={`${glassCardClassName} border-amber-200/50 bg-amber-50/80 dark:border-amber-400/30 dark:bg-amber-400/10`}>
								<CardContent className="relative flex flex-col items-center gap-3 px-6 py-8">
									<span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-amber-200">
										Countdown
									</span>
									<div className="text-6xl font-bold text-slate-900 dark:text-white">
										{countdownSeconds}
									</div>
									<p className="text-sm text-slate-600 dark:text-slate-300">
										Game starting in...
									</p>
								</CardContent>
							</Card>
						)}

						<div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
							<Card className={`${glassCardClassName} h-fit`}>
								<CardHeader className="px-6 pb-0 pt-6">
									<CardTitle className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
										<span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.65)]" />
										Players ({Math.min(presenceCount, MAX_PLAYERS)}/{MAX_PLAYERS}) · Ready ({Math.min(readyCount, MAX_PLAYERS)}/{MAX_PLAYERS})
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 px-6 pb-6">
									{visibleParticipants.length === 0 ? (
										<div className={`${softPanelClassName} text-center`}>Waiting for players to join...</div>
									) : (
										<div className="space-y-3">
											{visibleParticipants.map((player, index) => (
												<div
													key={player.key}
													className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/75 p-4 shadow-[0_18px_45px_-28px_rgba(10,24,64,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-32px_rgba(10,24,64,0.55)] dark:border-white/15 dark:bg-slate-950/70"
												>
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/70 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
															{index + 1}
														</div>
														<div className="space-y-1">
															<p className="text-sm font-semibold text-slate-800 dark:text-white">
																{player.label}
															</p>
															{player.isGuest && (
																<span className={tertiarySurfaceClassName}>Guest</span>
															)}
														</div>
													</div>
													<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
														{player.isReady ? (
															<>
																<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.65)]" />
																<span className="text-emerald-600 dark:text-emerald-300">Ready</span>
															</>
														) : (
															<>
																<span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.65)]" />
																<span className="text-orange-500 dark:text-orange-300">Not ready</span>
															</>
														)}
													</div>
											</div>
										))}
											{emptySlots > 0 && (
												<div className="flex items-center justify-between rounded-2xl border border-dashed border-white/50 bg-white/40 p-4 text-xs uppercase tracking-[0.18em] text-slate-500 shadow-[0_18px_45px_-28px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/50 dark:text-slate-400">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/70 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
															+{emptySlots}
														</div>
														<span>
															{emptySlots === 1
																? "1 more player can join"
																: `${emptySlots} more players can join`}
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="h-2 w-2 rounded-full bg-slate-400/50" />
														<span>Awaiting players</span>
													</div>
												</div>
											)}
										</div>
									)}
								</CardContent>
							</Card>

							<Card className={`${glassCardClassName} h-fit`}>
								<CardHeader className="px-6 pb-0 pt-6">
									<CardTitle className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
										Game settings
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-5 px-6 pb-6">
									<div className="space-y-2">
										<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
											Lobby code
										</h3>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
											<code className="flex-1 rounded-2xl border border-white/45 bg-white/70 px-4 py-3 font-mono text-sm text-slate-700 shadow-inner shadow-white/30 dark:border-white/15 dark:bg-slate-950/70 dark:text-slate-200">
												{resolvedSlug}
											</code>
											<Button
												variant="outline"
												size="sm"
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
												className="rounded-full border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-white/80 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15"
											>
												{copied ? "Copied!" : "Copy lobby link"}
											</Button>
										</div>
									</div>

									<div className="space-y-2">
										<h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
											Your connection
										</h3>
										<div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
											<span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.65)]" />
											{clientId
												? `Connected as ${clientId.slice(0, 8)}`
												: "Connecting..."}
										</div>
									</div>

									<div className="space-y-3">
										<Button
											className="w-full rounded-full bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] text-slate-900 shadow-[0_18px_35px_-15px_rgba(175,116,0,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_45px_-18px_rgba(175,116,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70"
											variant={isCurrentPlayerReady ? "secondary" : "default"}
											disabled={readyPending || status !== "lobby"}
											onClick={async () => {
											if (readyPending || status !== "lobby") return;
											setReadyPending(true);
											try {
												await toggleReadiness({ slug: resolvedSlug, clientId });
											} finally {
												setReadyPending(false);
											}
										}}
										>
											{readyPending
												? "Updating..."
												: isCurrentPlayerReady
													? "Unready"
													: "Ready up"}
										</Button>
										{isOwner ? (
											<Button
												className="w-full rounded-full border border-white/45 bg-white/75 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-white/80 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15"
												disabled={!canStart || pending}
												onClick={async () => {
												if (!canStart || pending) return;
												setPending(true);
												try {
													await beginCountdown({
														slug: resolvedSlug,
														durationMs: 5000,
													});
												} finally {
													setPending(false);
												}
											}}
											>
												{pending
													? "Starting..."
													: presenceCount < MIN_PLAYERS_TO_START
														? "Waiting for players..."
														: readyCount < MIN_PLAYERS_TO_START
															? "Waiting for ready..."
															: "Start game"}
											</Button>
										) : (
											<div className={`${softPanelClassName} text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300`}>
												Waiting for host to start...
											</div>
										)}
										<Link href={`/game/${resolvedSlug}`} className="block">
											<Button variant="ghost" className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
												Play solo mode
											</Button>
										</Link>
									</div>
								</CardContent>
							</Card>
						</div>

						{problemSlug && (
							<Card className={glassCardClassName}>
								<CardHeader className="flex flex-col gap-4 px-6 pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
									<CardTitle className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
										Test cases
									</CardTitle>
									{!testCases && !testCasesLoading && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => generateTestCases()}
											disabled={testCasesGenerating}
											className="rounded-full border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-white/80 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15"
										>
											{testCasesGenerating ? "Generating..." : "Generate test cases"}
										</Button>
									)}
								</CardHeader>
								<CardContent className="space-y-4 px-6 pb-6">
									{testCasesLoading ? (
										<div className={`${softPanelClassName} text-center`}>Loading test cases...</div>
									) : testCasesGenerating ? (
										<div className={`${softPanelClassName} text-center`}>Generating test cases...</div>
									) : testCases && testCases.testCases.length > 0 ? (
										<div className="space-y-4">
											<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
												{testCases.testCases.length} test case{testCases.testCases.length !== 1 ? "s" : ""} available
											</div>
											<div className="grid gap-3 md:grid-cols-2">
												{testCases.testCases.slice(0, 3).map((testCase, index) => (
													<div
														key={index}
														className="space-y-3 rounded-2xl border border-white/45 bg-white/75 p-4 text-sm shadow-[0_18px_45px_-28px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/70"
													>
														<div className="flex items-center justify-between">
															<span className="text-sm font-semibold text-slate-800 dark:text-white">
																Test Case {index + 1}
															</span>
															{testCase.description && (
																<span className="text-xs text-slate-500 dark:text-slate-300">
																	- {testCase.description}
																</span>
															)}
														</div>
														<div className="grid gap-3">
															<div className="space-y-1">
																<span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
																	Input
																</span>
																<div className="rounded-xl border border-white/40 bg-white/70 p-2 font-mono text-xs text-slate-700 shadow-inner shadow-white/30 dark:border-white/15 dark:bg-slate-900/65 dark:text-slate-200">
																	{testCase.input}
																</div>
															</div>
															<div className="space-y-1">
																<span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
																	Expected
																</span>
																<div className="rounded-xl border border-white/40 bg-white/70 p-2 font-mono text-xs text-slate-700 shadow-inner shadow-white/30 dark:border-white/15 dark:bg-slate-900/65 dark:text-slate-200">
																	{testCase.expectedOutput}
																</div>
															</div>
														</div>
													</div>
												))}
												{testCases.testCases.length > 3 && (
													<div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
														... and {testCases.testCases.length - 3} more test cases
													</div>
												)}
									</div>
								</div>
									) : (
																<div className={`${softPanelClassName} text-center`}>
																	No test cases available. Click &quot;Generate Test Cases&quot; to create them.
																</div>
									)}
								</CardContent>
							</Card>
						)}

						<footer className="pb-10 text-center text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
							Share the lobby link with your friend to start playing together!
						</footer>
					</div>
				</div>
			</main>
		</div>
	);
}
