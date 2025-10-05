"use client";

import { useQuery } from "convex/react";
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
	lastCodeUpdated: number | null;
};

export default function SpectateSession({ slug }: { slug: string }) {
	const game = useQuery(api.games.getGame, { slug });
	const presence = useQuery(api.games.activePresence, { slug });
	const cursorPositions = useQuery(api.games.activeCursorPositions, { slug });
	const codeSnapshots = useQuery(api.games.activeCodeSnapshots, { slug });
	const scores = useQuery(api.games.getScoresForGame, { slug });
	const [countdownMs, setCountdownMs] = useState<number | null>(null);
	const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [fullscreenOpen, setFullscreenOpen] = useState(false);
	const [participantOrder, setParticipantOrder] = useState<string[]>([]);

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

	const eliminatedParticipants = useMemo<VisibleParticipant[]>(() => {
		if (!scores || scores.length === 0) return [];
		
		return scores.map((score) => ({
			key: `completed-${score.clientId}`,
			label: score.playerName,
			lastSeen: score.submittedAt,
			isGuest: score.userId === null,
			clientId: score.clientId,
		}));
	}, [scores]);

	const eliminatedSet = useMemo(() => {
		return new Set(eliminatedParticipants.map((participant) => participant.key));
	}, [eliminatedParticipants]);

	const spectatorViews = useMemo<SpectatorView[]>(() => {
		return orderedParticipants.map((participant) => {
			const snapshot = codeSnapshotMap.get(participant.clientId);
			const cursor = cursorMap.get(participant.clientId);
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
				isEliminated: eliminatedSet.has(participant.key),
				lastCodeUpdated,
			};
		});
	}, [cursorMap, eliminatedSet, codeSnapshotMap, orderedParticipants]);

	const selectedView = useMemo(() => {
		if (!selectedClientId) {
			return null;
		}
		return (
			spectatorViews.find((view) => view.clientId === selectedClientId) ?? null
		);
	}, [selectedClientId, spectatorViews]);

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
				<Card>
					<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="text-xl font-semibold">
							Live code preview
						</CardTitle>
						<CardDescription>
							Click a player to open a detailed view with an enlarged code block.
						</CardDescription>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setFullscreenOpen(true)}
							className="mt-2 w-full sm:mt-0 sm:w-auto"
						>
							Enter fullscreen
						</Button>
					</CardHeader>
					<CardContent>
						{spectatorViews.length === 0 ? (
							<div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
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
										className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card/80 p-4 text-left shadow-sm transition hover:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
									>
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-base font-semibold text-foreground">
													{participant.label}
												</p>
												<span className="text-xs uppercase tracking-wide text-muted-foreground">
													{participant.isGuest ? "Guest" : "Registered"}
												</span>
											</div>
											<Badge variant="outline" className="font-mono text-[0.65rem]">
												{participant.clientId.slice(0, 6)}
											</Badge>
										</div>
					<pre className="mt-4 max-h-44 overflow-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
						<code>
							{renderCodeContent(participant, true)}
						</code>
										</pre>
										<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
											<span>{participant.cursorLabel}</span>
						<span>
							{participant.lastCodeUpdated
								? `Code ${new Date(participant.lastCodeUpdated).toLocaleTimeString()}`
								: `Last seen ${new Date(participant.lastSeen).toLocaleTimeString()}`}
						</span>
										</div>
										{participant.isEliminated && (
											<span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/10">
												<span className="text-6xl font-black leading-none text-red-500 drop-shadow-lg">
													×
												</span>
											</span>
										)}
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>
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
					{orderedParticipants.length === 0 ? (
								<div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
									No active players detected right now.
								</div>
							) : (
								<div className="space-y-3">
							{orderedParticipants.map((player, index) => (
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
						<SpectatorChat gameId={game._id} />
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
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Completed players</CardTitle>
								<CardDescription>
									Players who have successfully solved the problem.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{scores && scores.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No completed players yet.
									</p>
								) : (
									<div className="space-y-3">
										{scores?.map((score, index) => (
											<div
												key={`completed-${score.clientId}`}
												className="flex items-center justify-between rounded-lg border border-border bg-green-50 dark:bg-green-950/20 p-3"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-sm font-semibold text-green-700 dark:text-green-300">
														{index + 1}
													</div>
													<div>
														<span className="text-sm font-medium text-foreground">
															{score.playerName}
														</span>
														<p className="text-xs text-muted-foreground">
															Completed at {new Date(score.submittedAt).toLocaleTimeString()}
														</p>
													</div>
												</div>
												<div className="text-right">
													<Badge variant="default" className="bg-green-600 hover:bg-green-700">
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
		<DialogContent className="sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>
							{selectedView?.label ?? "Participant"}
						</DialogTitle>
						<DialogDescription>
							Expanded view of the selected player&apos;s workspace.
						</DialogDescription>
					</DialogHeader>
					{selectedView ? (
						<div className="relative space-y-4">
							<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
				<pre className="max-h-[60vh] overflow-auto rounded-md bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
					<code>
						{renderCodeContent(selectedView, true)}
					</code>
							</pre>
							{selectedView.isEliminated && (
								<span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-red-500/10">
									<span className="text-[12rem] font-black leading-none text-red-500/80 drop-shadow-lg">
										×
									</span>
								</span>
							)}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Select a participant to view their workspace.
						</p>
					)}
				</DialogContent>
			</Dialog>
			<Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
				<DialogContent
					showCloseButton={false}
					fullScreen
				className="bg-background/95 p-3 sm:p-6"
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
						>
							Exit fullscreen
						</Button>
					</div>
					<div className="flex-1 overflow-hidden rounded-lg bg-background/80 p-2 sm:p-4">
						{spectatorViews.length === 0 ? (
							<div className="flex h-full items-center justify-center text-lg text-muted-foreground">
								No live participants available.
							</div>
						) : (
						<div className="grid h-full grid-cols-1 gap-2 overflow-auto md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
							{spectatorViews.map((participant) => (
								<button
									type="button"
									key={`fullscreen-${participant.key}`}
									onClick={() => {
										setSelectedClientId(participant.clientId);
										setViewerOpen(true);
									}}
									className="relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-background p-3 text-left transition focus:outline-hidden focus:ring-4 focus:ring-primary/40 sm:p-4"
								>
											<div className="flex items-center justify-between gap-3">
												<div>
													<p className="text-lg font-semibold text-foreground">
														{participant.label}
													</p>
													<span className="text-xs uppercase tracking-wide text-muted-foreground">
														{participant.isGuest ? "Guest" : "Registered"}
													</span>
												</div>
												<Badge variant={participant.isEliminated ? "destructive" : "outline"} className="font-mono text-[0.65rem]">
													{participant.clientId.slice(0, 8)}
												</Badge>
											</div>
									<pre className="mt-4 flex-1 overflow-auto rounded-md bg-muted px-3 py-2 text-sm text-slate-900 dark:text-slate-100">
							<code>
										{renderCodeContent(participant, true)}
							</code>
											</pre>
											<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
												<span>{participant.cursorLabel}</span>
							<span>
								{participant.lastCodeUpdated
									? `Code ${new Date(participant.lastCodeUpdated).toLocaleTimeString()}`
									: `Seen ${new Date(participant.lastSeen).toLocaleTimeString()}`}
							</span>
											</div>
											{participant.isEliminated && (
												<span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/15">
													<span className="text-[18vmin] font-black leading-none text-red-500 drop-shadow-2xl">
														×
													</span>
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</main>
	);
}
