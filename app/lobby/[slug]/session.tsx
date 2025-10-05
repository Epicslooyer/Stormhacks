"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useGameConnection } from "@/components/useGameConnection";
import { useTestCases } from "@/components/useTestCases";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
		isGenerating: testCasesGenerating 
	} = useTestCases(problemSlug);

	const status = game?.status ?? "lobby";
	const countdownSeconds =
		countdownMs === null ? null : Math.ceil(countdownMs / 1000);
	const isOwner =
		game?.createdBy !== undefined &&
		viewerId !== null &&
		game.createdBy === viewerId;
	const canStart = status === "lobby" && isOwner && presenceCount >= 2 && readyCount >= 2;
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

	const currentPlayer = visibleParticipants.find(p => p.clientId === clientId);
	const isCurrentPlayerReady = currentPlayer?.isReady ?? false;

	useEffect(() => {
		if (status === "active") {
			router.push(`/game/${resolvedSlug}`);
		}
	}, [resolvedSlug, router, status]);

	return (
		<main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<header className="text-center space-y-4 pt-8">
					<div className="space-y-2">
						<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
							{game?.name ?? `Lobby ${resolvedSlug}`}
						</h1>
						<div className="flex items-center justify-center gap-2">
							<Badge variant={status === "lobby" ? "secondary" : status === "countdown" ? "default" : "outline"}>
								{status === "lobby" ? "Waiting for players" : 
								 status === "countdown" ? "Starting soon" : 
								 status === "active" ? "Game in progress" : "Completed"}
							</Badge>
							{problemDifficulty && (
								<Badge variant="outline" className="capitalize">
									{problemDifficulty}
								</Badge>
							)}
						</div>
					</div>
					<p className="text-muted-foreground max-w-2xl mx-auto">
						{problemTitle}
					</p>
				</header>

				{/* Countdown */}
				{countdownActive && countdownSeconds !== null && (
					<Card className="border-primary/20 bg-primary/5">
						<CardContent className="pt-6">
							<div className="text-center space-y-2">
								<div className="text-6xl font-bold text-primary animate-pulse">
									{countdownSeconds}
								</div>
								<p className="text-lg font-medium">Game starting in...</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Main Content */}
				<div className="grid md:grid-cols-2 gap-6">
					{/* Players Section */}
					<Card className="h-fit">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
								Players ({presenceCount}/2) - Ready ({readyCount}/2)
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{visibleParticipants.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
										<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
										</svg>
									</div>
									<p>Waiting for players to join...</p>
								</div>
							) : (
								<div className="space-y-3">
									{visibleParticipants.map((player, index) => (
										<div
											key={player.key}
											className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
										>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
													{index + 1}
												</div>
												<div>
													<p className="font-medium">{player.label}</p>
													{player.isGuest && (
														<Badge variant="outline" className="text-xs">
															Guest
														</Badge>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												{player.isReady ? (
													<>
														<div className="w-2 h-2 bg-green-500 rounded-full"></div>
														<span className="text-sm text-green-600 dark:text-green-400">Ready</span>
													</>
												) : (
													<>
														<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
														<span className="text-sm text-orange-600 dark:text-orange-400">Not Ready</span>
													</>
												)}
											</div>
										</div>
									))}
									
									{/* Empty slots for remaining players */}
									{Array.from({ length: 2 - visibleParticipants.length }).map((_, index) => (
										<div
											key={`empty-${index}`}
											className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-muted-foreground/30"
										>
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
													{visibleParticipants.length + index + 1}
												</div>
												<div>
													<p className="font-medium text-muted-foreground">Waiting for player...</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
												<span className="text-sm text-muted-foreground">Not ready</span>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Game Info & Actions */}
					<Card className="h-fit">
						<CardHeader>
							<CardTitle>Game Settings</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<h3 className="font-medium">Lobby Code</h3>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
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
									>
										{copied ? "Copied!" : "Copy Link"}
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<h3 className="font-medium">Your Connection</h3>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									Connected as {clientId.slice(0, 8)}
								</div>
							</div>

							<div className="pt-4 space-y-3">
								{/* Ready Button */}
								<Button
									className="w-full"
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
									{readyPending ? "Updating..." : 
									 isCurrentPlayerReady ? "Unready" : "Ready Up"}
								</Button>

								{/* Start Game Button */}
								{isOwner ? (
									<Button
										className="w-full"
										size="lg"
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
										{pending ? "Starting..." : 
										 presenceCount < 2 ? "Waiting for players..." : 
										 readyCount < 2 ? "Waiting for ready..." :
										 "Start Game"}
									</Button>
								) : (
									<div className="text-center space-y-2">
										<Button variant="outline" className="w-full" disabled>
											Waiting for host to start...
										</Button>
										<p className="text-sm text-muted-foreground">
											Only the lobby creator can start the game
										</p>
									</div>
								)}

								<Link href={`/game/${resolvedSlug}`}>
									<Button variant="ghost" className="w-full">
										View Game Page
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Test Cases Section */}
				{problemSlug && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Test Cases</span>
								{!testCases && !testCasesLoading && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => generateTestCases()}
										disabled={testCasesGenerating}
									>
										{testCasesGenerating ? "Generating..." : "Generate Test Cases"}
									</Button>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{testCasesLoading ? (
								<div className="text-center py-4 text-muted-foreground">
									Loading test cases...
								</div>
							) : testCasesGenerating ? (
								<div className="text-center py-4 text-muted-foreground">
									Generating test cases...
								</div>
							) : testCases && testCases.testCases.length > 0 ? (
								<div className="space-y-3">
									<div className="text-sm text-muted-foreground">
										{testCases.testCases.length} test case{testCases.testCases.length !== 1 ? 's' : ''} available
									</div>
									<div className="grid gap-2">
										{testCases.testCases.slice(0, 3).map((testCase, index) => (
											<div key={index} className="p-3 rounded-lg bg-muted/50 border text-sm">
												<div className="font-medium mb-1">
													Test Case {index + 1}
													{testCase.description && (
														<span className="text-muted-foreground ml-2">
															- {testCase.description}
														</span>
													)}
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
													<div>
														<span className="font-medium">Input:</span>
														<div className="font-mono bg-background p-1 rounded mt-1">
															{testCase.input}
														</div>
													</div>
													<div>
														<span className="font-medium">Expected:</span>
														<div className="font-mono bg-background p-1 rounded mt-1">
															{testCase.expectedOutput}
														</div>
													</div>
												</div>
											</div>
										))}
										{testCases.testCases.length > 3 && (
											<div className="text-center text-sm text-muted-foreground">
												... and {testCases.testCases.length - 3} more test cases
											</div>
										)}
									</div>
								</div>
							) : (
								<div className="text-center py-4 text-muted-foreground">
									No test cases available. Click "Generate Test Cases" to create them.
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Footer */}
				<div className="text-center text-sm text-muted-foreground pb-8">
					<p>Share the lobby link with your friend to start playing together!</p>
				</div>
			</div>
		</main>
	);
}
