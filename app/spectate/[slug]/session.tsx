"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import SpectatorChat from "@/components/SpectatorChat";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { HomeHeader } from "@/components/home/HomeHeader";

type VisibleParticipant = {
	key: string;
	label: string;
	lastSeen: number;
	isGuest: boolean;
	clientId: string;
};

type SpectatorView = VisibleParticipant & {
	code: string;
	language: string | null;
	cursorLabel: string;
	cursorLine: number | null;
	cursorColumn: number | null;
	isEliminated: boolean;
	isWinner: boolean;
	lastCodeUpdated: number | null;
};

type GameScore = {
	clientId: string;
	playerName: string;
	userId: string | null;
	score: number;
	calculatedScore: number;
	completionTime: number;
	oNotation: string | null;
	testCasesPassed: number;
	totalTestCases: number;
	submittedAt: number;
	isEliminated: boolean;
	eliminatedAt: number | null;
};

type WinnerInfo =
	| {
		winner: {
			clientId: string;
			playerName: string;
		};
		isGameOver: true;
	}
	| {
		leader?: {
			clientId: string;
			playerName: string;
		};
		winner?: undefined;
		isGameOver: false;
	}
	| undefined;

export default function SpectateSession({ slug }: { slug: string }) {
	const game = useQuery(api.games.getGame, { slug });
	const presence = useQuery(api.games.activePresence, { slug });
	const cursorPositions = useQuery(api.games.activeCursorPositions, { slug });
	const codeSnapshots = useQuery(api.games.activeCodeSnapshots, { slug });
	const scores = useQuery(api.games.getScoresForGame, { slug });
	const winnerInfo = useQuery(api.games.getGameWinner, { slug }) as WinnerInfo;
	const [countdownMs, setCountdownMs] = useState<number | null>(null);
	const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [fullscreenOpen, setFullscreenOpen] = useState(false);
	const [participantOrder, setParticipantOrder] = useState<string[]>([]);
	const [shareCopied, setShareCopied] = useState(false);

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

	const visibleParticipants = useMemo<VisibleParticipant[]>(() => {
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
				clientId: presence.clientId,
			};
		});
	}, [participants]);

	useEffect(() => {
		setParticipantOrder((previous) => {
			const activeClientIds = new Set(
				visibleParticipants.map((participant) => participant.clientId),
			);
			const filtered = previous.filter((clientId) => activeClientIds.has(clientId));
			const additions = visibleParticipants
				.map((participant) => participant.clientId)
				.filter((clientId) => !filtered.includes(clientId));
			const nextOrder = [...filtered, ...additions];
			const hasChanges =
				nextOrder.length !== previous.length ||
				nextOrder.some((clientId, index) => clientId !== previous[index]);
			return hasChanges ? nextOrder : previous;
		});
	}, [visibleParticipants]);

	const orderedParticipants = useMemo(() => {
		const orderLookup = new Map(
			participantOrder.map((clientId, index) => [clientId, index] as const),
		);
		return [...visibleParticipants].sort((a, b) => {
			const orderA = orderLookup.get(a.clientId);
			const orderB = orderLookup.get(b.clientId);
			if (orderA === undefined && orderB === undefined) {
				return a.clientId.localeCompare(b.clientId);
			}
			if (orderA === undefined) return 1;
			if (orderB === undefined) return -1;
			return orderA - orderB;
		});
	}, [participantOrder, visibleParticipants]);

	const cursorMap = useMemo(() => {
		const map = new Map<string, {
			clientId: string;
			lineNumber: number;
			column: number;
			lastUpdated: number;
			userId: string | null;
		}>();
		if (!cursorPositions) {
			return map;
		}
		for (const cursor of cursorPositions) {
			map.set(cursor.clientId, {
				clientId: cursor.clientId,
				lineNumber: cursor.lineNumber,
				column: cursor.column,
				lastUpdated: cursor.lastUpdated,
				userId: cursor.userId ?? null,
			});
		}
		return map;
	}, [cursorPositions]);

	const codeSnapshotMap = useMemo(() => {
		const map = new Map<
			string,
			{
				code: string;
				language: string | null;
				lastUpdated: number;
			}
		>();
		if (!codeSnapshots) {
			return map;
		}
		for (const snapshot of codeSnapshots) {
			map.set(snapshot.clientId, {
				code: snapshot.code,
				language: snapshot.language ?? null,
				lastUpdated: snapshot.lastUpdated,
			});
		}
		return map;
	}, [codeSnapshots]);

	const normalizedScores = useMemo<GameScore[]>(() => {
		if (!scores) return [];
		return (scores as GameScore[]).map((score) => ({
			...score,
			score: score.score ?? 0,
			isEliminated: score.isEliminated ?? false,
			calculatedScore: score.calculatedScore ?? 0,
			completionTime: score.completionTime ?? 0,
			oNotation: score.oNotation ?? null,
			testCasesPassed: score.testCasesPassed ?? 0,
			totalTestCases: score.totalTestCases ?? 0,
		}));
	}, [scores]);

	const scoreByClientId = useMemo(() => {
		const map = new Map<string, GameScore>();
		for (const score of normalizedScores) {
			map.set(score.clientId, score);
		}
		return map;
	}, [normalizedScores]);

	const winningClientIds = useMemo(() => {
		const ids = new Set<string>();
		if (winnerInfo?.winner?.clientId) {
			ids.add(winnerInfo.winner.clientId);
		}
		return ids;
	}, [winnerInfo]);

	const spectatorViews = useMemo<SpectatorView[]>(() => {
		return orderedParticipants.map((participant) => {
			const snapshot = codeSnapshotMap.get(participant.clientId);
			const cursor = cursorMap.get(participant.clientId);
			const score = scoreByClientId.get(participant.clientId);
			const code = snapshot?.code ?? `// ${participant.label}\n// Waiting for live code…`;
			const language = snapshot?.language ?? null;
			const lastCodeUpdated = snapshot?.lastUpdated ?? null;
			const cursorLabel = cursor
				? `Cursor @ line ${cursor.lineNumber}, col ${cursor.column}`
				: "Cursor: unavailable";
			const cursorLine = cursor?.lineNumber ?? null;
			const cursorColumn = cursor?.column ?? null;
			return {
				...participant,
				code,
				language,
				cursorLabel,
				cursorLine,
				cursorColumn,
				isEliminated: score?.isEliminated ?? false,
				isWinner: winningClientIds.has(participant.clientId),
				lastCodeUpdated,
			};
		});
	}, [codeSnapshotMap, cursorMap, orderedParticipants, scoreByClientId, winningClientIds]);

	const selectedView = useMemo(() => {
		if (!selectedClientId) {
			return null;
		}
		return (
			spectatorViews.find((view) => view.clientId === selectedClientId) ?? null
		);
	}, [selectedClientId, spectatorViews]);

	const renderStatusOverlays = (view: SpectatorView) => (
		<>
			{view.isWinner && (
				<div className="pointer-events-none absolute right-3 top-3 z-30 h-14 w-14 sm:h-16 sm:w-16">
					<Image
						src="/crown.png"
						alt="Winner crown"
						width={64}
						height={64}
						className="h-full w-full"
					/>
				</div>
			)}
			{view.isEliminated && (
				<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-red-600/15">
					<svg
						viewBox="0 0 120 120"
						className="h-32 w-32 text-red-500 sm:h-40 sm:w-40"
						aria-hidden
					>
						<line x1={18} y1={18} x2={102} y2={102} stroke="currentColor" strokeWidth={16} strokeLinecap="round" />
						<line x1={102} y1={18} x2={18} y2={102} stroke="currentColor" strokeWidth={16} strokeLinecap="round" />
					</svg>
				</div>
			)}
		</>
	);

	const renderCodeContent = (
		view: SpectatorView,
		includeLanguageHeader = false,
	) => {
		const nodes: ReactNode[] = [];
		if (includeLanguageHeader && view.language) {
			nodes.push(
				<Fragment key="language-header">{`// ${view.language}\n`}</Fragment>,
			);
		}

		const lines = view.code.split("\n");
		const cursorLineIndex =
			view.cursorLine !== null
				? Math.max(
					0,
					Math.min(view.cursorLine - 1, Math.max(lines.length - 1, 0)),
				 )
				: null;
		const cursorColumnIndex =
			view.cursorColumn !== null ? Math.max(0, view.cursorColumn - 1) : null;
		const hasCursor =
			cursorLineIndex !== null && cursorColumnIndex !== null && lines.length > 0;

		lines.forEach((line, index) => {
			if (hasCursor && cursorLineIndex === index) {
				const column = Math.min(cursorColumnIndex, line.length);
				const before = line.slice(0, column);
				const after = line.slice(column);
				nodes.push(
					<Fragment key={`line-${index}`}>
						{before}
						<span className="text-red-500">▋</span>
						{after === "" ? " " : after}
						{index < lines.length - 1 ? "\n" : ""}
					</Fragment>,
				);
			} else {
				nodes.push(
					<Fragment key={`line-${index}`}>
						{line}
						{index < lines.length - 1 ? "\n" : ""}
					</Fragment>,
				);
			}
		});

		return nodes;
	};

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

	const shellStyle = {
		backgroundImage: "var(--home-page-background)",
		backgroundColor: "var(--home-page-background-color)",
	} as const;

	const renderShell = (content: ReactNode, maxWidth = "max-w-5xl") => (
		<div
			className="relative flex min-h-screen flex-col overflow-hidden"
			style={shellStyle}
		>
			<HomeBackdrop />
			<HomeHeader />
			<main className="flex flex-1 flex-col py-10 md:py-16">
				<div className={`mx-auto flex w-full ${maxWidth} flex-col gap-8 px-4 sm:px-6 lg:px-8`}>
					{content}
				</div>
			</main>
		</div>
	);

	const glassCardClassName =
		"relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)]";
	const softPanelClassName =
		"rounded-2xl border border-white/45 bg-white/75 p-6 text-sm text-slate-600 shadow-[0_18px_45px_-30px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/75 dark:text-slate-300";
	const tertiarySurfaceClassName =
		"rounded-2xl border border-white/35 bg-white/70 px-3 py-3 text-slate-700 shadow-[0_18px_45px_-32px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

	if (game === undefined) {
		return renderShell(
			<>
				<Link
					href="/spectate"
					className="inline-flex w-fit items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
				>
					<span aria-hidden>←</span>
					Back to live games
				</Link>
				<Card className={glassCardClassName}>
					<CardContent className="py-12 text-center text-sm text-slate-600 dark:text-slate-300">
						Loading game information…
					</CardContent>
				</Card>
			</>,
			"max-w-3xl",
		);
	}

	if (game === null) {
		return renderShell(
			<>
				<Link
					href="/spectate"
					className="inline-flex w-fit items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
				>
					<span aria-hidden>←</span>
					Back to live games
				</Link>
				<Card className={glassCardClassName}>
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-semibold text-slate-900 dark:text-white">
							Game not found
						</CardTitle>
						<CardDescription className="text-slate-600 dark:text-slate-300">
							We couldn&apos;t locate a game with ID{" "}
							<code className="font-mono text-slate-800 dark:text-slate-100">{slug}</code>.
						</CardDescription>
					</CardHeader>
				</Card>
			</>,
			"max-w-3xl",
		);
	}

	return renderShell(
	<>
		<Link
			href="/spectate"
			className="inline-flex w-fit items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
			<h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_6px_25px_rgba(12,45,126,0.55)] dark:text-white">
				Spectating {game.name ?? slug}
			</h1>
			<p className="text-base text-slate-100/90 dark:text-slate-200">
				Problem: <span className="text-white">{problemTitle}</span>
			</p>
	<div className="flex justify-center">
		<Button
			variant="outline"
			size="sm"
			onClick={async () => {
				if (typeof window === "undefined") return;
				const shareUrl = `${window.location.origin}/spectate/${slug}`;
				try {
					await navigator.clipboard.writeText(shareUrl);
					setShareCopied(true);
					setTimeout(() => setShareCopied(false), 2000);
				} catch (error) {
					console.error("Failed to copy spectator link", error);
				}
			}}
			className="w-auto rounded-full border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-white/80 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15"
		>
			{shareCopied ? "Copied!" : "Copy spectator link"}
		</Button>
	</div>
		</header>
		{countdownActive && (
			<Card className={`${glassCardClassName} border-primary/40 bg-primary/15`}
			>
				<CardContent className="py-6">
					<div className="space-y-3 text-center">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-amber-200">
							Countdown in progress
						</p>
						<p className="text-5xl font-bold text-slate-900 dark:text-white">
							{countdownSeconds}s
						</p>
						<p className="text-sm text-slate-600 dark:text-slate-300">
							Game starting soon
						</p>
					</div>
				</CardContent>
			</Card>
		)}
		<Card className={glassCardClassName}>
			<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
					Live code preview
				</CardTitle>
				<CardDescription className="text-slate-600 dark:text-slate-300">
					Click a player to open a detailed view with an enlarged code block.
				</CardDescription>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setFullscreenOpen(true)}
					className="mt-2 w-full rounded-full border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-white/80 hover:bg-white sm:mt-0 sm:w-auto dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15"
				>
					Enter fullscreen
				</Button>
			</CardHeader>
			<CardContent>
				{spectatorViews.length === 0 ? (
					<div className="rounded-2xl border border-white/40 bg-white/70 p-6 text-center text-sm text-slate-600 shadow-[0_18px_45px_-30px_rgba(10,24,64,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
						No live players to display yet.
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{spectatorViews.map((participant) => (
							<button
								type="button"
								key={participant.key}
								onClick={() => {
		setSelectedClientId(participant.clientId);
									setViewerOpen(true);
								}}
								className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/50 bg-white/75 p-4 text-left shadow-[0_18px_45px_-28px_rgba(10,24,64,0.45)] transition hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_26px_70px_-32px_rgba(10,24,64,0.65)] focus:outline-hidden focus:ring-2 focus:ring-amber-300/70 focus:ring-offset-2 dark:border-white/15 dark:bg-slate-950/75"
							>
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-base font-semibold text-slate-900 dark:text-white">
											{participant.label}
										</p>
										<span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
											{participant.isGuest ? "Guest" : "Registered"}
										</span>
									</div>
									<Badge variant="outline" className="font-mono text-[0.65rem]">
										{participant.clientId.slice(0, 6)}
									</Badge>
								</div>
								<pre className="mt-4 max-h-44 overflow-auto rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-xs text-slate-700 shadow-inner shadow-white/30 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100">
									<code>
										{renderCodeContent(participant, true)}
									</code>
								</pre>
								<div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
									<span>{participant.cursorLabel}</span>
									<span>
										{participant.lastCodeUpdated
											? `Code ${new Date(participant.lastCodeUpdated).toLocaleTimeString()}`
											: `Last seen ${new Date(participant.lastSeen).toLocaleTimeString()}`}
									</span>
								</div>
								{renderStatusOverlays(participant)}
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
			<Card className={`${glassCardClassName} self-start`}>
				<CardHeader>
					<CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
						Live participants ({presenceCount})
					</CardTitle>
					<CardDescription className="text-slate-600 dark:text-slate-300">
						Players currently connected to this match.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{orderedParticipants.length === 0 ? (
						<div className={softPanelClassName}>
							No active players detected right now.
						</div>
					) : (
						<div className="space-y-3">
							{orderedParticipants.map((player, index) => (
								<div
									key={player.key}
									className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/80 p-3 shadow-[0_18px_45px_-30px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/75"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200/60 text-sm font-semibold text-[#0d2f6f] shadow-inner dark:bg-amber-400/30 dark:text-[#f8e7a3]">
											{index + 1}
										</div>
										<div className="space-y-1">
											<p className="font-medium text-slate-900 dark:text-white">
												{player.label}
											</p>
											{player.isGuest ? (
												<span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
													Guest player
												</span>
											) : (
												<span className="text-xs text-slate-500 dark:text-slate-400">
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
				<Card className={glassCardClassName}>
					<CardHeader>
						<CardTitle className="text-lg text-slate-900 dark:text-white">Match overview</CardTitle>
						<CardDescription className="text-slate-600 dark:text-slate-300">
							Key details from the live lobby.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						<div className={tertiarySurfaceClassName}>
							<span className="text-slate-500 dark:text-slate-400">Status</span>
			<Badge
				variant={statusBadgeVariant}
				className="uppercase sm:ml-auto sm:self-end"
			>
								{statusLabel}
							</Badge>
						</div>
						<div className={tertiarySurfaceClassName}>
							<span className="text-slate-500 dark:text-slate-400">Live players</span>
			<span className="flex-1 text-left font-semibold text-slate-900 dark:text-white sm:text-right">
				{presenceCount}
			</span>
						</div>
						<div className={tertiarySurfaceClassName}>
							<span className="text-slate-500 dark:text-slate-400">Problem</span>
			<span className="flex-1 truncate text-left font-medium text-slate-900 dark:text-white sm:text-right">
								{problemTitle}
							</span>
						</div>
						<div className={tertiarySurfaceClassName}>
							<span className="text-slate-500 dark:text-slate-400">Created</span>
			<span className="flex-1 text-left font-medium text-slate-900 dark:text-white sm:text-right">
				{createdAtLabel}
			</span>
						</div>
					</CardContent>
				</Card>
				<SpectatorChat gameId={game._id} />
				<Card className={glassCardClassName}>
					<CardHeader>
						<CardTitle className="text-lg text-slate-900 dark:text-white">Jump into the action</CardTitle>
						<CardDescription className="text-slate-600 dark:text-slate-300">
							Move from spectator to player at any time.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
						{status === "lobby" && (
							<p>
								Players are gathering in the lobby. You can join to participate.
							</p>
						)}
						{status === "active" && (
							<p>
								The match is underway. Join the game view to follow every move.
							</p>
						)}
						{status === "countdown" && (
							<p>
								Countdown is live—join now to be ready when it begins.
							</p>
						)}
						<Link href={`/game/${game.slug}`} className="block">
							<Button className="w-full rounded-full bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] text-slate-900 shadow-[0_12px_25px_-12px_rgba(175,116,0,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-15px_rgba(175,116,0,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70">
								Open game view
							</Button>
						</Link>
					</CardContent>
				</Card>
				<Card className={glassCardClassName}>
					<CardHeader>
						<CardTitle className="text-lg text-slate-900 dark:text-white">Completed players</CardTitle>
						<CardDescription className="text-slate-600 dark:text-slate-300">
							Players who have successfully solved the problem.
						</CardDescription>
					</CardHeader>
				<CardContent>
					{normalizedScores.length === 0 ? (
						<p className="text-sm text-slate-600 dark:text-slate-300">
							No completed players yet.
						</p>
					) : (
						<div className="space-y-3">
							{normalizedScores.map((score, index) => (
								<div
									key={`completed-${score.clientId}`}
									className="flex items-center justify-between rounded-2xl border border-emerald-300/50 bg-emerald-100/60 p-3 shadow-[0_18px_45px_-28px_rgba(10,24,64,0.45)] backdrop-blur-xl dark:border-emerald-400/30 dark:bg-emerald-400/20"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
											{index + 1}
										</div>
										<div>
											<span className="text-sm font-medium text-slate-900 dark:text-white">
												{score.playerName}
											</span>
											<p className="text-xs text-slate-600 dark:text-slate-300">
												Completed at {new Date(score.submittedAt).toLocaleTimeString()}
											</p>
										</div>
									</div>
									<div className="text-right">
										<Badge variant="default" className="bg-emerald-500 text-white hover:bg-emerald-600">
											{score.score}s
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
			</div>
		</div>
		<Dialog
			open={viewerOpen}
			onOpenChange={(open) => {
				setViewerOpen(open);
				if (!open) {
					setSelectedClientId(null);
				}
			}}
		>
			<DialogContent className="sm:max-w-4xl border border-white/60 bg-white/90 shadow-[0_32px_64px_-40px_rgba(12,45,126,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_32px_64px_-36px_rgba(24,84,189,0.45)]">
				<DialogHeader>
					<DialogTitle>{selectedView?.label ?? "Participant"}</DialogTitle>
					<DialogDescription className="text-slate-600 dark:text-slate-300">
						Expanded view of the selected player&apos;s workspace.
					</DialogDescription>
				</DialogHeader>
				{selectedView ? (
					<div className="relative space-y-4">
						<div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
							<Badge variant="outline" className="font-mono text-xs">
								{selectedView.clientId.slice(0, 12)}
							</Badge>
							<span>{selectedView.isGuest ? "Guest player" : "Registered player"}</span>
							<span>{selectedView.cursorLabel}</span>
							<span>
								{selectedView.lastCodeUpdated
									? `Code updated ${new Date(selectedView.lastCodeUpdated).toLocaleTimeString()}`
									: `Last seen ${new Date(selectedView.lastSeen).toLocaleTimeString()}`}
							</span>
						</div>
						<pre className="max-h-[60vh] overflow-auto rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner shadow-white/30 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100">
							<code>{renderCodeContent(selectedView, true)}</code>
						</pre>
						{renderStatusOverlays(selectedView)}
					</div>
				) : (
					<p className="text-sm text-slate-600 dark:text-slate-300">
						Select a participant to view their workspace.
					</p>
				)}
			</DialogContent>
		</Dialog>
		<Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
			<DialogContent
				showCloseButton={false}
				fullScreen
				className="bg-[rgba(12,26,68,0.92)] p-3 sm:p-6 dark:bg-[rgba(4,15,47,0.95)]"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Spectator fullscreen grid</DialogTitle>
				</DialogHeader>
				<div className="flex h-full flex-col gap-3 overflow-hidden">
					<div className="flex justify-end">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setFullscreenOpen(false)}
							className="rounded-full border border-white/40 bg-white/40 px-3 text-slate-700 shadow-sm transition hover:border-white/60 hover:bg-white/70 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/15"
						>
							Exit fullscreen
						</Button>
					</div>
					<div className="flex-1 overflow-hidden rounded-2xl border border-white/40 bg-white/75 p-2 shadow-[0_22px_60px_-32px_rgba(12,26,68,0.55)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/80 sm:p-4">
						{spectatorViews.length === 0 ? (
							<div className="flex h-full items-center justify-center text-lg text-slate-600 dark:text-slate-300">
								No live participants available.
							</div>
						) : (
							<div className="grid h-full grid-cols-1 gap-3 overflow-auto md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
								{spectatorViews.map((participant) => (
									<button
										type="button"
										key={`fullscreen-${participant.key}`}
										onClick={() => {
											setSelectedClientId(participant.clientId);
											setViewerOpen(true);
										}}
										className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/50 bg-white/75 p-3 text-left shadow-[0_20px_55px_-30px_rgba(12,26,68,0.5)] transition hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_28px_80px_-34px_rgba(12,26,68,0.65)] focus:outline-hidden focus:ring-4 focus:ring-amber-300/70 sm:p-4 dark:border-white/15 dark:bg-slate-950/75"
									>
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-lg font-semibold text-slate-900 dark:text-white">
													{participant.label}
												</p>
												<span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
													{participant.isGuest ? "Guest" : "Registered"}
												</span>
											</div>
											<Badge variant={participant.isEliminated ? "destructive" : "outline"} className="font-mono text-[0.65rem]">
												{participant.clientId.slice(0, 8)}
											</Badge>
										</div>
										<pre className="mt-4 flex-1 overflow-auto rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-white/30 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100">
											<code>{renderCodeContent(participant, true)}</code>
										</pre>
										<div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
											<span>{participant.cursorLabel}</span>
											<span>
												{participant.lastCodeUpdated
													? `Code ${new Date(participant.lastCodeUpdated).toLocaleTimeString()}`
													: `Seen ${new Date(participant.lastSeen).toLocaleTimeString()}`}
											</span>
										</div>
						{renderStatusOverlays(participant)}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	</>
);
}
