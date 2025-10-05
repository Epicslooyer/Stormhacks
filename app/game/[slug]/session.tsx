"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMutation } from "convex/react";
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

export default function GameSession({ slug }: { slug: string }) {
	const {
		game,
		clientId,
		presenceCount,
		slug: resolvedSlug,
		countdownMs,
	} = useGameConnection(slug, "/game");
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
	const { testCases } = useTestCases(problemSlug);
	const [output, setOutput] = useState<string>(
		"Run results will appear here.",
	);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const userEditedRef = useRef(false);
	const languageSelectId = useId();
	const updateCursorPosition = useMutation(api.games.updateCursorPosition);
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

	const handleEditorMount = useCallback(
		(editorInstance: MonacoEditorNS.IStandaloneCodeEditor) => {
			editorRef.current = editorInstance;
			cursorListenerRef.current?.dispose();
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
					problemDescription: problem?.content,
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
			
			// Add AI feedback
			if (feedback) {
				outputText += `AI Feedback:\n`;
				outputText += `============\n`;
				outputText += `${feedback}\n\n`;
			}
			
			// Note: AI no longer modifies user code, only evaluates it
			
			// Add overall result
			if (summary.passedTests === summary.totalTests) {
				outputText += `🎉 All tests passed! Excellent work!`;
			} else if (summary.passedTests > 0) {
				outputText += `📊 ${summary.totalTests - summary.passedTests} test(s) failed. Keep improving!`;
			} else {
				outputText += `🔧 All tests failed. Review the AI feedback above!`;
			}
			
			setOutput(outputText);
		} catch (error) {
			setOutput(`Error: ${error instanceof Error ? error.message : "Failed to evaluate code"}`);
		}
	};

	const handleSubmit = () => {
		if (!code.trim()) {
			setOutput("Please enter some code before submitting.");
			return;
		}
		
		if (!testCases || testCases.testCases.length === 0) {
			setOutput("No test cases available. Please generate test cases first in the lobby.");
			return;
		}
		
		// For now, just run the tests and show results
		// In the future, this could submit to a leaderboard or scoring system
		handleRun();
		setOutput(prev => prev + "\n\nSubmission: Code has been submitted for evaluation!");
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
						</div>
					</div>
					<div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
						<div className="flex flex-wrap items-center gap-3">
							<span className="font-semibold text-primary">
								Live participants: {presenceCount}
							</span>
							<span>You are connected as {clientId.slice(0, 8)}</span>
						</div>
						{game?.status === "countdown" && countdownSeconds !== null && (
							<p className="font-semibold text-foreground">
								Game starting in {countdownSeconds}s
							</p>
						)}
						{game?.status === "lobby" && (
							<p className="text-muted-foreground">
								Waiting for the host to begin the game…
							</p>
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
				<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:max-h-[calc(100vh-200px)] lg:basis-[38%] lg:shrink-0">
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
							<Button size="sm" onClick={handleSubmit}>
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
						<div className="mt-2 h-28 overflow-y-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">
							{output}
						</div>
					</div>
				</div>
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
