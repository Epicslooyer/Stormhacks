
"use client";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGameConnection } from "@/components/useGameConnection";
import { useProblemDetails } from "@/components/useProblemDetails";
import { useTestCases } from "@/components/useTestCases";
import { CodeExecutor } from "@/components/CodeExecutor";
import SpectatorChat from "@/components/SpectatorChat";
import { useGameTimer } from "@/hooks/useGameTimer";
import { formatTime, formatScore, getScoreGrade } from "@/lib/scoring";
import type { CodeSnippet } from "leetcode-query";
import { api } from "@/convex/_generated/api";
// @ts-ignore - monaco-editor types not available
import type { editor as MonacoEditorNS, IDisposable } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
});

type TopicTag = {
	name?: string | null;
	slug?: string | null;
};

type Game = {
	_id: any;
	slug: string;
	name: string;
	status: "lobby" | "active" | "completed" | "countdown";
	createdAt: number;
	startedAt?: number;
	timeLimit?: number;
	mode?: "solo" | "multiplayer";
};

const REMOTE_CURSOR_STYLES = [
	{ suffix: "0", border: "#ef4444", background: "rgba(239, 68, 68, 0.25)" },
	{ suffix: "1", border: "#22c55e", background: "rgba(34, 197, 94, 0.25)" },
	{ suffix: "2", border: "#3b82f6", background: "rgba(59, 130, 246, 0.25)" },
	{ suffix: "3", border: "#f59e0b", background: "rgba(245, 158, 11, 0.25)" },
	{ suffix: "4", border: "#a855f7", background: "rgba(168, 85, 247, 0.25)" },
	{ suffix: "5", border: "#ec4899", background: "rgba(236, 72, 153, 0.25)" },
] as const;

const REMOTE_CURSOR_STYLE_ELEMENT_ID = "remote-cursor-styles";

export default function GameSession({ slug }: { slug: string }) {
	const router = useRouter();
	const [timeLeft, setTimeLeft] = useState<number | null>(null);
	const {
		game,
		clientId,
		presenceCount,
		slug: resolvedSlug,
		countdownMs,
		participants,
		cursorPositions,
		codeSnapshots,
	} = useGameConnection(slug, "/game");

	// Redirect to ending page when game is completed (solo or multiplayer)
	useEffect(() => {
		if (game?.status === "completed") {
			router.replace(`/game/${resolvedSlug}/ending`);
		}
	}, [game?.status, resolvedSlug, router]);
	const [copied, setCopied] = useState(false);
	const countdownSeconds =
		countdownMs === null ? null : Math.ceil(countdownMs / 1000);
	const problemSlug = game?.problemSlug ?? null;
	const {
		data: problem,
		isPending: problemPending,
		isError: problemError,
		error: problemErrorObject,
	} = useProblemDetails(problemSlug);
	
	// Test cases for code execution
	const { testCases } = useTestCases(problemSlug, problem?.title ?? undefined, problem?.difficulty ?? undefined);
	const [output, setOutput] = useState<string>(
		"Run results will appear here.",
	);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const [gameStarted, setGameStarted] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const userEditedRef = useRef(false);
	const languageSelectId = useId();
	
	// Game timer
	const gameTimer = useGameTimer();
	
	// Convex mutations and queries
	const updateCursorPosition = useMutation(api.games.updateCursorPosition);
	const updateCodeState = useMutation(api.games.updateCodeState);
	const submitScore = useMutation(api.games.submitScore);
	const checkEliminationThreshold = useMutation(api.games.checkEliminationThreshold);
	const scores = useQuery(api.games.getScoresForGame, { slug: resolvedSlug });
	const leaderboard = useQuery(api.games.getGameLeaderboard, { slug: resolvedSlug });
	const gameWinner = useQuery(api.games.getGameWinner, { slug: resolvedSlug });
	const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
	const cursorListenerRef = useRef<IDisposable | null>(null);
	const pendingCursorRef = useRef<{ lineNumber: number; column: number } | null>(
		null,
	);
	const lastSentCursorRef = useRef<{
		lineNumber: number;
		column: number;
	} | null>(null);
	const lastSentCursorAtRef = useRef(0);
	const remoteCursorDecorationsRef = useRef<string[]>([]);
	const lastPublishedRef = useRef<{ code: string; language: string | null }>({
		code: "",
		language: null,
	});

	// Guard to ensure timer only starts once per session
	const timerStartedRef = useRef(false);

	// Start game timer automatically with robust guards and logs
	useEffect(() => {

		// Prevent double-start
		if (timerStartedRef.current) return;

		// Solo detection: explicit solo mode OR inferred by presence/participants
		const inferredSolo = game?.mode === "solo" || presenceCount <= 1 || participants.length <= 1;
		if (inferredSolo) {
			timerStartedRef.current = true;
			setGameStarted(true);
			gameTimer.start();
			return;
		}

		// Multiplayer: start on countdown end and active status
		if (game?.status === "active" && countdownMs === 0) {
			timerStartedRef.current = true;
			setGameStarted(true);
			gameTimer.start();
		}
	}, [countdownMs, game?.mode, game?.status, gameStarted, gameTimer, presenceCount, participants.length]);

	// Timer logic
	useEffect(() => {
		const gameData = game as Game | undefined;
		const startTime = gameData?.startedAt;
		const limit = gameData?.timeLimit;
		
		if (!startTime || !limit) return;
		
		const updateTimer = () => {
			const now = Date.now();
			const endTime = startTime + limit;
			const remaining = Math.max(0, endTime - now);
			
			setTimeLeft(remaining);
			
			if (remaining <= 0 && !submitted) {
				// Time's up! Player will be eliminated
				router.replace(`/game/${resolvedSlug}/ending`);
			}
		};
		
		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [game, submitted, resolvedSlug, router]);

	const handleEditorMount = useCallback(
		(editorInstance: MonacoEditorNS.IStandaloneCodeEditor) => {
			editorRef.current = editorInstance;
			cursorListenerRef.current?.dispose();
			// editor mounted
			// Fallback: if solo and not started yet, start on editor mount
			if (game?.mode === "solo" && !timerStartedRef.current) {
				// fallback start on editor mount (solo)
				timerStartedRef.current = true;
				setGameStarted(true);
				gameTimer.start();
			}
			cursorListenerRef.current = editorInstance.onDidChangeCursorPosition(
				(event: any) => {
					pendingCursorRef.current = {
						lineNumber: event.position.lineNumber,
						column: event.position.column,
					};
				},
			);
			const initialPosition = editorInstance.getPosition();
			if (initialPosition) {
				pendingCursorRef.current = {
					lineNumber: initialPosition.lineNumber,
					column: initialPosition.column,
				};
			}
		},
		[],
	);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		if (document.getElementById(REMOTE_CURSOR_STYLE_ELEMENT_ID)) {
			return;
		}
		const style = document.createElement("style");
		style.id = REMOTE_CURSOR_STYLE_ELEMENT_ID;
		style.textContent = REMOTE_CURSOR_STYLES.map(({
			suffix,
			border,
			background,
		}) =>
			`.monaco-editor .remote-cursor-color-${suffix} {
				background-color: ${background};
			}
		.monaco-editor .remote-cursor-line-${suffix} {
				border-left: 2px solid ${border};
			}
		`
		).join("\n");
		document.head.appendChild(style);
	}, []);

	useEffect(() => {
		return () => {
			cursorListenerRef.current?.dispose();
			cursorListenerRef.current = null;
			editorRef.current = null;
		};
	}, []);

	useEffect(() => {
		void resolvedSlug;
		void clientId;
		pendingCursorRef.current = null;
		lastSentCursorRef.current = null;
		lastSentCursorAtRef.current = 0;
	}, [resolvedSlug, clientId]);

	useEffect(() => {
		const interval = setInterval(() => {
			// Periodically run elimination threshold while game is active
			if (game?.status === "active") {
				void checkEliminationThreshold({ slug: resolvedSlug }).catch(() => {});
			}
			const pending = pendingCursorRef.current;
			if (!pending) {
				return;
			}
			const previous = lastSentCursorRef.current;
			const now = Date.now();
			if (
				previous &&
				previous.lineNumber === pending.lineNumber &&
				previous.column === pending.column &&
				now - lastSentCursorAtRef.current < 5000
			) {
				return;
			}
			if (now - lastSentCursorAtRef.current < 250) {
				return;
			}
			lastSentCursorAtRef.current = now;
			const payload = {
				lineNumber: pending.lineNumber,
				column: pending.column,
			};
			lastSentCursorRef.current = payload;
			void updateCursorPosition({
				slug: resolvedSlug,
				clientId,
				lineNumber: payload.lineNumber,
				column: payload.column,
			})
				.catch(() => {
					lastSentCursorRef.current = previous;
					lastSentCursorAtRef.current = now - 5000;
				});
		}, 300);
		return () => clearInterval(interval);
	}, [clientId, resolvedSlug, updateCursorPosition]);

	useEffect(() => {
		if (problemSlug === undefined) return;
		userEditedRef.current = false;
		setCode("");
		setSelectedLanguage(null);
	}, [problemSlug]);

	const codeSnippets = useMemo(() => {
		if (!problem || !Array.isArray(problem.codeSnippets)) return [];
		return problem.codeSnippets.filter((snippet): snippet is CodeSnippet => {
			if (!snippet || typeof snippet !== "object") return false;
			return (
				typeof snippet.lang === "string" &&
				typeof snippet.langSlug === "string" &&
				typeof snippet.code === "string"
			);
		});
	}, [problem]);

	const participantLookup = useMemo(() => {
		const map = new Map<string, (typeof participants)[number]>();
		for (const participant of participants) {
			map.set(participant.clientId, participant);
		}
		return map;
	}, [participants]);

	const remoteCursorEntries = useMemo(() => {
		return cursorPositions
			.filter((cursor) => cursor.clientId !== clientId)
			.map((cursor) => {
				const participant = participantLookup.get(cursor.clientId);
				const labelSource = participant?.userId
					? String(participant.userId).slice(0, 8)
					: cursor.clientId.slice(0, 8);
				return {
					...cursor,
					label: labelSource,
				};
			});
	}, [cursorPositions, clientId, participantLookup]);

	const myCodeSnapshot = useMemo(() => {
		return codeSnapshots.find((snapshot) => snapshot.clientId === clientId) ?? null;
	}, [codeSnapshots, clientId]);

	useEffect(() => {
		if (codeSnippets.length === 0) {
			setSelectedLanguage(null);
			return;
		}
		const preferred =
			codeSnippets.find((snippet) => snippet.langSlug === "typescript") ??
			codeSnippets.find((snippet) => snippet.langSlug === "javascript") ??
			codeSnippets[0];
		setSelectedLanguage((current) => current ?? preferred.langSlug ?? null);
		if (!userEditedRef.current && preferred.code) {
			setCode(preferred.code);
		}
	}, [codeSnippets]);

	useEffect(() => {
		if (!selectedLanguage) return;
		const snippet = codeSnippets.find(
			(item) => item.langSlug === selectedLanguage,
		);
		if (!snippet) return;
		if (!userEditedRef.current && snippet.code) {
			setCode(snippet.code);
		}
	}, [codeSnippets, selectedLanguage]);

	useEffect(() => {
		if (!myCodeSnapshot) {
			return;
		}
		const snapshotLanguage = myCodeSnapshot.language ?? null;
		if (userEditedRef.current) {
			return;
		}
		userEditedRef.current = false;
		setCode(myCodeSnapshot.code);
		if (!selectedLanguage && snapshotLanguage) {
			setSelectedLanguage(snapshotLanguage);
		}
		lastPublishedRef.current = {
			code: myCodeSnapshot.code,
			language: snapshotLanguage,
		};
	}, [myCodeSnapshot, selectedLanguage]);

	useEffect(() => {
		if (!resolvedSlug || !clientId) {
			return;
		}
		const normalizedLanguage = selectedLanguage ?? null;
		if (!userEditedRef.current) {
			if (
				myCodeSnapshot &&
				myCodeSnapshot.code === code &&
				(myCodeSnapshot.language ?? null) === normalizedLanguage
			) {
				return;
			}
		}
		if (
			lastPublishedRef.current.code === code &&
			lastPublishedRef.current.language === normalizedLanguage
		) {
			return;
		}
		const timeout = setTimeout(() => {
			lastPublishedRef.current = { code, language: normalizedLanguage };
		void updateCodeState({
			slug: resolvedSlug,
			clientId,
			code,
			language: normalizedLanguage ?? undefined,
		})
			.then(() => {
				userEditedRef.current = false;
			})
			.catch((error) => {
				console.error("Failed to publish code state", error);
				lastPublishedRef.current = { code: "", language: null };
			});
		}, 600);
		return () => clearTimeout(timeout);
	}, [code, selectedLanguage, resolvedSlug, clientId, updateCodeState, myCodeSnapshot]);

	useEffect(() => {
		const editorInstance = editorRef.current;
		if (!editorInstance) {
			return;
		}
		const monacoGlobal = (window as typeof window & {
			monaco?: typeof import("monaco-editor");
		}).monaco;
		if (!monacoGlobal) {
			return;
		}
		const model = editorInstance.getModel();
		if (!model) {
			return;
		}
		if (remoteCursorEntries.length === 0) {
			remoteCursorDecorationsRef.current = editorInstance.deltaDecorations(
				remoteCursorDecorationsRef.current,
				[],
			);
			return;
		}
		const trackedRangeStickiness = monacoGlobal.editor?.TrackedRangeStickiness
			?.NeverGrowsWhenTypingAtEdges;
		const newDecorations = remoteCursorEntries.map((cursor, index) => {
			const colorTheme = REMOTE_CURSOR_STYLES[index % REMOTE_CURSOR_STYLES.length];
			const lineMaxColumn = model.getLineMaxColumn(cursor.lineNumber);
			const startColumn = Math.max(1, Math.min(cursor.column, lineMaxColumn));
			return {
			range: new monacoGlobal.Range(
				cursor.lineNumber,
				startColumn,
				cursor.lineNumber,
				startColumn,
			),
			options: {
				inlineClassName: `remote-cursor-color-${colorTheme.suffix}`,
				linesDecorationsClassName: `remote-cursor-line-${colorTheme.suffix}`,
				hoverMessage: [
					{
						value: `Player ${cursor.label}\\n(line ${cursor.lineNumber}, col ${cursor.column})`,
					},
				],
				stickiness: trackedRangeStickiness,
			},
		};
		});
		remoteCursorDecorationsRef.current = editorInstance.deltaDecorations(
			remoteCursorDecorationsRef.current,
			newDecorations,
		);
		return () => {
			remoteCursorDecorationsRef.current = editorInstance.deltaDecorations(
				remoteCursorDecorationsRef.current,
				[],
			);
		};
	}, [remoteCursorEntries]);

	const handleEditorChange = (value?: string) => {
		userEditedRef.current = true;
		setCode(value ?? "");
	};

	const handleLanguageChange = (value: string) => {
		userEditedRef.current = false;
		setSelectedLanguage(value);
	};

	const handleRun = async () => {
		if (!code.trim()) {
			setOutput("Please enter some code to execute.");
			return;
		}

		if (!testCases || testCases.testCases.length === 0) {
			setOutput("No test cases available. Please generate test cases first in the lobby.");
			return;
		}

		setOutput("AI is analyzing and executing your code...");

		try {
			const response = await fetch("/api/evaluate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					code,
					language: selectedLanguage || "python",
					testCases: testCases.testCases,
					problemTitle: problem?.title,
					problemDescription: problem?.content ?? undefined,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to evaluate code");
			}

			const data = await response.json();
			const results = data.results;
			const summary = data.summary;
			const feedback = data.feedback;
			const cleanedCode = data.cleanedCode;
			
			let outputText = `AI-Powered Code Evaluation Results\n`;
			outputText += `==================================\n`;
			outputText += `Summary: ${summary.passedTests}/${summary.totalTests} tests passed\n`;
			outputText += `Total time: ${summary.totalTime}ms\n\n`;
			
			results.forEach((result: any, index: number) => {
				const status = result.passed ? "PASSED" : "FAILED";
				
				outputText += `Test Case ${result.testCase}: ${status}\n`;
				outputText += `Input: ${result.input}\n`;
				outputText += `Expected: ${result.expectedOutput}\n`;
				outputText += `Actual: ${result.actualOutput}\n`;
				outputText += `Time: ${result.executionTime}ms\n`;
				
				if (result.description) {
					outputText += `Description: ${result.description}\n`;
				}
				
				outputText += `\n`;
			});
			
			// Add overall result
			if (summary.passedTests === summary.totalTests) {
				outputText += `🎉 All tests passed! Excellent work!`;
			} else if (summary.passedTests > 0) {
				outputText += `📊 ${summary.totalTests - summary.passedTests} test(s) failed. Keep improving!`;
			} else {
				outputText += `🔧 All tests failed. Review the results above!`;
			}
			
			setOutput(outputText);
		} catch (error) {
			setOutput(`Error: ${error instanceof Error ? error.message : "Failed to evaluate code"}`);
		}
	};

	const handleSubmit = async () => {
		if (!code.trim()) {
			setOutput("Please enter some code before submitting.");
			return;
		}
		
		if (!testCases || testCases.testCases.length === 0) {
			setOutput("No test cases available. Please generate test cases first in the lobby.");
			return;
		}
		
		setOutput("Submitting your solution for final evaluation...");
		
		try {
			const response = await fetch("/api/evaluate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					code,
					language: selectedLanguage || "python",
					testCases: testCases.testCases,
					problemTitle: problem?.title,
					problemDescription: problem?.content,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to submit solution");
			}

			const data = await response.json();
			const results = data.results;
			const summary = data.summary;
			const scoring = data.scoring;
			const feedback = data.feedback;
			
			// Stop the timer
			gameTimer.stop();
			console.log("Timer stopped. Elapsed time:", gameTimer.elapsedTime, "ms");
			
			let outputText = `🎯 FINAL SUBMISSION RESULTS\n`;
			outputText += `============================\n`;
			outputText += `Status: ${summary.passedTests === summary.totalTests ? "✅ ACCEPTED" : "❌ REJECTED"}\n`;
			outputText += `Score: ${summary.passedTests}/${summary.totalTests} tests passed\n`;
			outputText += `Total time: ${summary.totalTime}ms\n`;
			outputText += `Completion time: ${formatTime(gameTimer.elapsedTime)}\n`;
			outputText += `O Notation: ${scoring.oNotation || "Unknown"}\n`;
			outputText += `Final Score: ${formatScore(scoring.calculatedScore)} (${getScoreGrade(scoring.calculatedScore)})\n\n`;
			
			outputText += `📊 SCORE BREAKDOWN:\n`;
			outputText += `Time Score: ${formatScore(scoring.scoreBreakdown.timeScore)}\n`;
			outputText += `Efficiency Score: ${formatScore(scoring.scoreBreakdown.efficiencyScore)}\n`;
			outputText += `Correctness Score: ${formatScore(scoring.scoreBreakdown.correctnessScore)}\n\n`;
			
			results.forEach((result: any, index: number) => {
				const status = result.passed ? "✅ PASSED" : "❌ FAILED";
				
				outputText += `Test Case ${result.testCase}: ${status}\n`;
				outputText += `Input: ${result.input}\n`;
				outputText += `Expected: ${result.expectedOutput}\n`;
				outputText += `Actual: ${result.actualOutput}\n`;
				outputText += `Time: ${result.executionTime}ms\n`;
				
				if (result.description) {
					outputText += `Description: ${result.description}\n`;
				}
				
				outputText += `\n`;
			});
			
			// No feedback requested
			
			// Add final result
			if (summary.passedTests === summary.totalTests) {
				outputText += `🎉 CONGRATULATIONS! Your solution has been ACCEPTED!\n`;
				outputText += `All test cases passed successfully. Great job! 🚀\n\n`;
				outputText += `🏆 You have completed this problem! Your score has been recorded.`;
				
				// Submit comprehensive score
				try {
					await submitScore({
						slug: resolvedSlug,
						clientId,
						playerName: `Player ${clientId.slice(0, 8)}`,
						completionTime: gameTimer.elapsedTime,
						oNotation: scoring.oNotation,
						testCasesPassed: summary.passedTests,
						totalTestCases: summary.totalTests,
						calculatedScore: scoring.calculatedScore,
					});
					setSubmitted(true);
					outputText += `\n✅ Score submitted successfully!`;
					// Check for elimination threshold
					await checkEliminationThreshold({ slug: resolvedSlug });
					// Always redirect to ending page after submit
					router.replace(`/game/${resolvedSlug}/ending`);
				} catch (error) {
					console.error("Failed to submit score:", error);
					outputText += `\n⚠️ Score submission failed, but your solution is correct!`;
				}
			} else if (summary.passedTests > 0) {
				outputText += `📊 PARTIAL SUCCESS: ${summary.totalTests - summary.passedTests} test(s) failed.\n`;
				outputText += `Keep working on it - you're making progress! 💪`;
			} else {
				outputText += `🔧 SOLUTION REJECTED: All tests failed.\n`;
				outputText += `Don't give up! Review the results above and try again! 🔄`;
			}
			
			setOutput(outputText);
		} catch (error) {
			setOutput(`❌ Submission Error: ${error instanceof Error ? error.message : "Failed to submit solution"}`);
		}
	};

	const parsedStats = useMemo(() => {
		if (!problem?.stats) return null;
		try {
			return JSON.parse(problem.stats) as Record<string, unknown>;
		} catch (_error) {
			return null;
		}
	}, [problem?.stats]);

	const acceptance =
		typeof parsedStats?.acRate === "string" ? parsedStats.acRate : null;
	const totalAccepted =
		typeof parsedStats?.totalAccepted === "number"
			? parsedStats.totalAccepted
			: null;
	const totalSubmission =
		typeof parsedStats?.totalSubmission === "number"
			? parsedStats.totalSubmission
			: null;
	const topicTags: TopicTag[] = Array.isArray(problem?.topicTags)
		? (problem.topicTags as TopicTag[])
		: [];
	const contentHtml =
		problem?.content ??
		"<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);
	const sampleTestCase =
		typeof problem?.sampleTestCase === "string"
			? problem.sampleTestCase.trim()
			: null;
	const exampleTestcases =
		typeof problem?.exampleTestcases === "string"
			? problem.exampleTestcases.trim()
			: null;

	const difficultyLabel = problem?.difficulty ?? game?.problemDifficulty ?? "";
	const problemTitle =
		problem?.title ?? game?.problemTitle ?? game?.name ?? resolvedSlug;
	const problemErrorMessage =
		problemErrorObject instanceof Error
			? problemErrorObject.message
			: "Failed to load problem details";

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<header className="border-b border-border bg-card px-4 py-4 md:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="text-lg font-semibold">{game?.name ?? `Game ${resolvedSlug}`}</h1>
						<p className="text-sm text-muted-foreground">
							Status: {game?.status ?? "creating"}
						</p>
						<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
							<p>
								Problem:{" "}
								<span className="text-foreground">{problemTitle}</span>
							</p>
							{difficultyLabel && (
								<Badge
									className={cn(
										"px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
										difficultyBadgeClasses(difficultyLabel),
									)}
								>
									{difficultyLabel}
								</Badge>
							)}
							{testCases && testCases.testCases.length > 0 && (
								<Badge variant="outline" className="text-[0.65rem]">
									{testCases.testCases.length} Test Cases
								</Badge>
							)}
							{scores && scores.length > 0 && (
								<Badge variant="default" className="text-[0.65rem] bg-green-600 hover:bg-green-700">
									{scores.length} Completed
								</Badge>
							)}
						</div>
					</div>
					<div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<span className="font-semibold text-primary mr-3">
									Live participants: {presenceCount}
								</span>
								<span>You are connected as {clientId.slice(0, 8)}</span>
							</div>
							{timeLeft !== null && (
								<div className="flex flex-col items-end gap-1">
									<div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
										<span className="text-sm font-medium text-muted-foreground">Time Remaining:</span>
										<span className={`font-mono text-xl font-bold tabular-nums ${timeLeft < 30000 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
											{Math.floor(timeLeft / 60000)}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
										</span>
									</div>
									{timeLeft < 30000 && (
										<p className="text-sm text-red-500 font-medium animate-pulse">
											⚠️ Time is running out! Submit your solution now!
										</p>
									)}
								</div>
							)}
						</div>
						{game?.status === "countdown" && countdownSeconds !== null && (
							<p className="font-semibold text-foreground">
								Game starting in {countdownSeconds}s
							</p>
						)}
						{game?.status === "lobby" && game?.mode !== "solo" && (
							<p className="text-muted-foreground">
								Waiting for the host to begin the game…
							</p>
						)}
						{gameStarted && !submitted && (
							<div className="flex items-center gap-4">
								<div className="text-center">
									<p className="text-sm text-muted-foreground">Time</p>
									<p className="font-mono text-lg font-bold text-foreground">
										{gameTimer.getFormattedTime()}
									</p>
									<p className="text-xs text-muted-foreground">
										{gameTimer.isRunning ? "Running" : "Paused"}
									</p>
								</div>
								{gameWinner && !gameWinner.isGameOver && gameWinner.leader && (
									<div className="text-center">
										<p className="text-sm text-muted-foreground">Leader</p>
										<p className="font-semibold text-foreground">
											{gameWinner.leader.playerName}
										</p>
									</div>
								)}
							</div>
						)}
						{!gameStarted && game?.status === "active" && (
							<div className="text-center space-y-2">
								<Button 
									variant="outline" 
									size="sm" 
									onClick={() => {
										console.log("Manual timer start clicked");
										setGameStarted(true);
										gameTimer.start();
									}}
								>
									Start Timer
								</Button>
								<div className="text-xs text-muted-foreground">
									Timer should start automatically. If not, click above.
								</div>
								<div className="text-xs text-muted-foreground">
									Current timer state: {gameTimer.isRunning ? "Running" : "Stopped"} | 
									Elapsed: {gameTimer.elapsedTime}ms
								</div>
							</div>
						)}
						{submitted && (
							<div className="text-center">
								<p className="text-sm text-muted-foreground">Final Time</p>
								<p className="font-mono text-lg font-bold text-green-600">
									{gameTimer.getFormattedTime()}
								</p>
							</div>
						)}
						<Button
							variant="outline"
							size="sm"
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
						</Button>
					</div>
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row xl:gap-8">
				<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:max-h-[calc(100vh-200px)] lg:basis-[30%] lg:shrink-0">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Description
						</p>
						{problemSlug && (
							<Link
								href={`https://leetcode.com/problems/${problemSlug}/`}
								target="_blank"
								rel="noreferrer"
								className="text-xs text-primary underline-offset-4 hover:underline"
							>
								View on LeetCode
							</Link>
						)}
					</div>
					<div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
						{problemSlug === null && (
							<p className="text-muted-foreground">
								This lobby is not linked to a LeetCode problem yet.
							</p>
						)}
						{problemSlug !== null && problemPending && (
							<p className="text-muted-foreground">Loading problem details…</p>
						)}
						{problemSlug !== null && problemError && !problemPending && (
							<p className="text-destructive">
								Failed to load problem details: {problemErrorMessage}
							</p>
						)}
						{problemSlug !== null && !problemPending && !problemError && (
							<div className="flex flex-col gap-4">
								<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
									{acceptance && <span>Acceptance: {acceptance}</span>}
									{typeof problem?.likes === "number" && <span>Likes: {problem.likes}</span>}
									{typeof problem?.dislikes === "number" && <span>Dislikes: {problem.dislikes}</span>}
									{totalAccepted !== null && (
										<span>Accepted: {totalAccepted.toLocaleString()}</span>
									)}
									{totalSubmission !== null && (
										<span>Submissions: {totalSubmission.toLocaleString()}</span>
									)}
								</div>
								{topicTags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{topicTags.map((tag, index) => (
											<span
												key={`${tag.slug ?? tag.name ?? "tag"}-${index}`}
												className="rounded-full bg-muted px-2 py-1 text-xs"
											>
												{tag.name ?? tag.slug ?? "Unknown tag"}
											</span>
										))}
									</div>
								)}
								<div
									className="text-sm leading-7 [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:font-semibold [&_p]:mb-3 [&_ul]:ml-4 [&_ul]:mb-3 [&_ol]:ml-4 [&_ol]:mb-3 [&_li]:mb-1.5"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized LeetCode markup
									dangerouslySetInnerHTML={{ __html: sanitizedContent }}
								/>
								{(sampleTestCase || exampleTestcases) && (
									<div className="space-y-2">
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Sample Testcases
										</p>
										<div className="rounded-md bg-muted px-3 py-2 font-mono text-xs">
											{sampleTestCase ?? exampleTestcases}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
				<div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
					<div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-3 sm:items-center">
						<div className="flex min-w-[200px] flex-col gap-1">
							<Label
								htmlFor={languageSelectId}
								className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
							>
								Language
							</Label>
							{testCases && testCases.testCases.length > 0 && (
								<p className="text-xs text-muted-foreground">
									Write a function that takes the input and returns the expected output
								</p>
							)}
							<Select
								disabled={codeSnippets.length === 0}
								value={selectedLanguage ?? undefined}
								onValueChange={handleLanguageChange}
							>
								<SelectTrigger id={languageSelectId} className="w-48">
									<SelectValue placeholder="No snippets available" />
								</SelectTrigger>
								<SelectContent>
									{codeSnippets.map((snippet) => (
										<SelectItem key={snippet.langSlug} value={snippet.langSlug}>
											{snippet.lang ?? snippet.langSlug ?? "Language"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-3">
							<Button variant="outline" size="sm" onClick={handleRun}>
								Run
							</Button>
							<Button size="sm" onClick={handleSubmit} disabled={submitted}>
								Submit
							</Button>
						</div>
					</div>
					<div className="min-h-[320px] flex-1 md:min-h-[440px]">
						<MonacoEditor
							height="100%"
							language={mapLangSlugToMonaco(selectedLanguage)}
							value={code}
							onChange={handleEditorChange}
							onMount={handleEditorMount}
							options={{
								automaticLayout: true,
								fontSize: 14,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
								readOnly: submitted,
							}}
							theme="vs-dark"
							loading={
								<div className="p-4 text-sm text-muted-foreground">
									Editor loading…
								</div>
							}
						/>
					</div>
					<div className="border-t border-border px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Output
						</p>
						<div className="mt-2 h-40 max-h-40 overflow-y-auto rounded-md bg-muted px-3 py-2 font-mono text-xs whitespace-pre-wrap">
							{output}
						</div>
					</div>
				</div>
				{/* Only show sidebar content if game is not completed; otherwise, redirect will occur */}
				{game && game.status !== "completed" && (
					<div className="flex flex-col gap-4 lg:basis-[25%] lg:shrink-0">
		{leaderboard && leaderboard.leaderboard.length > 0 && (
							<div className="rounded-xl border border-border bg-card">
								<div className="border-b border-border px-4 py-3">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										Leaderboard
									</p>
								</div>
								<div className="max-h-64 overflow-y-auto">
					{leaderboard.leaderboard.slice(0, 10).map((player, index) => (
										<div
											key={player.clientId}
											className={cn(
												"flex items-center justify-between px-4 py-2",
												index === 0 && "bg-yellow-50 dark:bg-yellow-950/20",
												index === 1 && "bg-gray-50 dark:bg-gray-950/20",
												index === 2 && "bg-orange-50 dark:bg-orange-950/20",
											)}
										>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
												</span>
												<span className="text-sm font-medium truncate">
													{player.playerName}
												</span>
											</div>
											<div className="text-right">
												<div className="text-sm font-bold">
													{formatScore(player.calculatedScore ?? 0)}
												</div>
								<div className="text-xs text-muted-foreground">
									{/* If player hasn't finished, show LIVE; else show completion time */}
									{(player.testCasesPassed ?? 0) >= (player.totalTestCases ?? Infinity)
										? formatTime(player.completionTime ?? 0)
										: (player.clientId === clientId ? `${gameTimer.getFormattedTime()} (LIVE)` : `In progress`)}
								</div>
											</div>
										</div>
									))}
								</div>
								{leaderboard.eliminatedPlayers.length > 0 && (
									<div className="border-t border-border px-4 py-2">
										<p className="text-xs text-muted-foreground">
											{leaderboard.eliminatedCount} eliminated
										</p>
									</div>
								)}
							</div>
						)}
						{gameWinner && (
							<div className="rounded-xl border border-border bg-card p-4">
								{gameWinner.isGameOver ? (
									<div className="text-center">
										<h3 className="font-bold text-lg text-green-600">🏆 Game Over!</h3>
										<p className="text-sm text-muted-foreground mt-1">
											Winner: {gameWinner.winner?.playerName}
										</p>
										<p className="text-sm font-medium">
											Score: {formatScore(gameWinner.winner?.calculatedScore ?? 0)}
										</p>
									</div>
								) : gameWinner.leader ? (
									<div className="text-center">
										<h3 className="font-semibold">Current Leader</h3>
										<p className="text-sm text-muted-foreground">
											{gameWinner.leader.playerName}
										</p>
										<p className="text-sm font-medium">
											{formatScore(gameWinner.leader.calculatedScore ?? 0)}
										</p>
										<p className="text-xs text-muted-foreground">
											{gameWinner.activePlayersCount} players remaining
										</p>
									</div>
								) : null}
							</div>
						)}
						<SpectatorChat gameId={game._id} />
					</div>
				)}
			</div>
		</div>
	);
}

function difficultyBadgeClasses(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "border-transparent bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-200";
		case "Medium":
			return "border-transparent bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-200";
		case "Hard":
			return "border-transparent bg-rose-500/20 text-rose-600 dark:bg-rose-500/25 dark:text-rose-200";
		default:
			return "border-transparent bg-muted text-muted-foreground";
	}
}

function sanitizeLeetCodeHtml(html: string) {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/on[a-z]+="[^"]*"/gi, "")
		.replace(/on[a-z]+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}

function mapLangSlugToMonaco(langSlug: string | null) {
	switch (langSlug) {
		case "typescript":
			return "typescript";
		case "javascript":
			return "javascript";
		case "python":
		case "python3":
			return "python";
		case "cpp":
			return "cpp";
		case "c":
			return "c";
		case "java":
			return "java";
		case "csharp":
		case "c#":
			return "csharp";
		case "golang":
		case "go":
			return "go";
		case "swift":
			return "swift";
		case "rust":
			return "rust";
		case "kotlin":
			return "kotlin";
		default:
			return "javascript";
	}
}
