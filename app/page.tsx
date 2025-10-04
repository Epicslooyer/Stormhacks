"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useProblemDetails } from "@/components/useProblemDetails";
import { api } from "@/convex/_generated/api";

type ProblemOption = {
	id: string;
	title: string;
	slug: string;
	difficulty: string;
};

const featuredProblems: ProblemOption[] = [
	{ id: "1", slug: "two-sum", title: "Two Sum", difficulty: "Easy" },
	{
		id: "2",
		slug: "valid-parentheses",
		title: "Valid Parentheses",
		difficulty: "Easy",
	},
	{
		id: "3",
		slug: "merge-intervals",
		title: "Merge Intervals",
		difficulty: "Medium",
	},
	{ id: "4", slug: "word-ladder", title: "Word Ladder", difficulty: "Hard" },
	{
		id: "5",
		slug: "longest-substring-without-repeating-characters",
		title: "Longest Substring Without Repeating Characters",
		difficulty: "Medium",
	},
];

export default function Home() {
	return (
		<>
			<header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
				<Link href="/" className="text-lg font-semibold">
					Leet Royale
				</Link>
				<SignOutButton />
			</header>
			<main className="p-8 flex flex-col gap-10 max-w-4xl mx-auto">
				<section className="flex flex-col gap-3 text-center">
					<h1 className="text-4xl font-bold">Pick a problem to battle on</h1>
					<p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
						Search the LeetCode problem set or start quickly with a featured
						pick. We will spin up a shared lobby and keep everyone synced once
						you start.
					</p>
					<div className="flex justify-center gap-4">
						<Link
							href="/problems"
							className="text-sm underline hover:no-underline text-foreground"
						>
							Browse all problems
						</Link>
						<Link
							href="/lobby"
							className="text-sm underline hover:no-underline text-foreground"
						>
							View open lobbies
						</Link>
					</div>
				</section>
				<ProblemPicker />
			</main>
		</>
	);
}

function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	const router = useRouter();
	return isAuthenticated ? (
		<button
			type="button"
			className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
			onClick={() =>
				void signOut().then(() => {
					router.push("/signin");
				})
			}
		>
			Sign out
		</button>
	) : null;
}

function ProblemPicker() {
	const router = useRouter();
	const getOrCreateGame = useMutation(api.games.getOrCreateGame);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ProblemOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingSlug, setPendingSlug] = useState<string | null>(null);
	const [previewProblem, setPreviewProblem] = useState<ProblemOption | null>(
		null,
	);
	const searchInputId = useId();

	const hasSearch = query.trim().length >= 2;
	const problems = useMemo(() => {
		return hasSearch ? results : featuredProblems;
	}, [hasSearch, results]);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < 2) {
			setResults([]);
			setError(null);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		void fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error("Search failed");
				}
				const data: { results: Array<Record<string, unknown>> } =
					await response.json();
				if (cancelled) return;
				const normalized = data.results.map(normalizeProblem);
				setResults(normalized);
			})
			.catch(() => {
				if (!cancelled) setError("Could not load search results");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [query]);

	const handleStart = async (problem: ProblemOption) => {
		if (pendingSlug) return;
		setPendingSlug(problem.slug);
		try {
			const slug = crypto.randomUUID().slice(0, 8);
			await getOrCreateGame({
				slug,
				name: problem.title,
				problemSlug: problem.slug,
				problemTitle: problem.title,
				problemDifficulty: problem.difficulty,
			});
			router.push(`/lobby/${slug}`);
		} finally {
			setPendingSlug(null);
		}
	};

	return (
		<>
			<section className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<label htmlFor={searchInputId} className="text-sm font-semibold">
						Search problems
					</label>
					<input
						id={searchInputId}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Type at least two characters to search the LeetCode catalog"
						className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
					/>
					{hasSearch ? (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Showing search results from the LeetCode dataset.
						</p>
					) : (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Need inspiration? Start with one of the featured problems below.
						</p>
					)}
					{error && <p className="text-xs text-red-500">{error}</p>}
				</div>
				<div className="flex flex-col gap-4">
					{loading && (
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Searching…
						</p>
					)}
					{!loading && hasSearch && problems.length === 0 && (
						<p className="text-sm text-slate-500 dark:text-slate-400">
							No problems match that query.
						</p>
					)}
					<ul className="grid gap-4 sm:grid-cols-2">
						{problems.map((problem) => (
							<li
								key={`${problem.slug}-${problem.id}`}
								className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-800/60 p-4"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex flex-col gap-1">
										<p className="text-base font-semibold leading-tight">
											{problem.title}
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											Slug: {problem.slug}
										</p>
									</div>
									<span className={difficultyBadgeClass(problem.difficulty)}>
										{problem.difficulty}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<button
										type="button"
										className="text-xs underline hover:no-underline text-foreground"
										onClick={() => setPreviewProblem(problem)}
									>
										Preview details
									</button>
									<button
										type="button"
										className="bg-foreground text-background text-xs sm:text-sm px-3 py-2 rounded-md disabled:opacity-50"
										disabled={pendingSlug !== null}
										onClick={() => handleStart(problem)}
									>
										{pendingSlug === problem.slug ? "Creating…" : "Start lobby"}
									</button>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>
			{previewProblem && (
				<ProblemDetailModal
					problem={previewProblem}
					onClose={() => setPreviewProblem(null)}
				/>
			)}
		</>
	);
}

function ProblemDetailModal({
	problem,
	onClose,
}: {
	problem: ProblemOption;
	onClose: () => void;
}) {
	const { data, isPending, isError, error } = useProblemDetails(problem.slug);
	const titleId = useId();
	const contentId = useId();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	let parsedStats: Record<string, unknown> | null = null;
	if (data?.stats) {
		try {
			parsedStats = JSON.parse(data.stats);
		} catch (_error) {
			parsedStats = null;
		}
	}

	const acceptance =
		typeof parsedStats?.acRate === "string" ? parsedStats.acRate : null;
	const totalSubmissions =
		typeof parsedStats?.totalSubmission === "number"
			? parsedStats.totalSubmission
			: null;
	const totalAccepted =
		typeof parsedStats?.totalAccepted === "number"
			? parsedStats.totalAccepted
			: null;
	const modalError = error instanceof Error ? error.message : "Unknown error";
	const topicTags = data?.topicTags ?? [];
	const contentHtml =
		data?.content ??
		"<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);

	const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.currentTarget === event.target) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={contentId}
			onMouseDown={handleBackdropMouseDown}
		>
			<div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-lg bg-background p-6 shadow-xl">
				<header className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h2 id={titleId} className="text-2xl font-semibold leading-tight">
							{data?.title ?? problem.title}
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{problem.slug}
						</p>
						<div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
							<span
								className={difficultyBadgeClass(
									data?.difficulty ?? problem.difficulty,
								)}
							>
								{data?.difficulty ?? problem.difficulty}
							</span>
							{acceptance && <span>Acceptance: {acceptance}</span>}
							{typeof data?.likes === "number" && (
								<span>Likes: {data.likes}</span>
							)}
							{typeof data?.dislikes === "number" && (
								<span>Dislikes: {data.dislikes}</span>
							)}
						</div>
					</div>
					<button
						type="button"
						className="text-sm underline hover:no-underline text-foreground"
						onClick={onClose}
					>
						Close
					</button>
				</header>
				<div
					className="mt-4 flex flex-col gap-3 overflow-y-auto pr-1"
					id={contentId}
				>
					{isPending && (
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Loading problem details…
						</p>
					)}
					{isError && !isPending && (
						<p className="text-sm text-red-500">
							Failed to load problem details: {modalError}
						</p>
					)}
					{!isPending && !isError && (
						<>
							{topicTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{topicTags.map((tag) => (
										<span
											key={String(tag?.slug ?? tag?.name)}
											className="rounded-full bg-slate-200/60 dark:bg-slate-800/60 px-2 py-1 text-xs"
										>
											{String(tag?.name ?? tag?.slug)}
										</span>
									))}
								</div>
							)}
							{(totalSubmissions !== null || totalAccepted !== null) && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{totalAccepted !== null &&
										`Accepted: ${totalAccepted.toLocaleString()} · `}
									{totalSubmissions !== null &&
										`Submissions: ${totalSubmissions.toLocaleString()}`}
								</p>
							)}
							<div
								className="prose prose-sm dark:prose-invert max-w-none"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized LeetCode problem markup
								dangerouslySetInnerHTML={{ __html: sanitizedContent }}
							/>
						</>
					)}
				</div>
				<footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
					<a
						href={`https://leetcode.com/problems/${problem.slug}/`}
						target="_blank"
						rel="noreferrer noopener"
						className="underline hover:no-underline text-foreground"
					>
						Open on LeetCode
					</a>
					<button
						type="button"
						className="bg-foreground text-background px-4 py-2 rounded-md"
						onClick={onClose}
					>
						Close
					</button>
				</footer>
			</div>
		</div>
	);
}

function normalizeProblem(problem: Record<string, unknown>): ProblemOption {
	const slug = String(problem.slug ?? "");
	const title = String(problem.title ?? problem.slug ?? "Untitled problem");
	const id = String(problem.frontend_id ?? problem.id ?? slug);
	const difficultyValue =
		typeof problem.difficulty === "number"
			? problem.difficulty
			: Number(problem.difficulty ?? 0);
	return {
		id,
		slug,
		title,
		difficulty: difficultyLabel(difficultyValue),
	};
}

function difficultyLabel(level: number) {
	switch (level) {
		case 1:
			return "Easy";
		case 2:
			return "Medium";
		case 3:
			return "Hard";
		default:
			return "Unknown";
	}
}

function difficultyBadgeClass(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "text-xs font-semibold uppercase tracking-wide bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 px-2 py-1 rounded";
		case "Medium":
			return "text-xs font-semibold uppercase tracking-wide bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 px-2 py-1 rounded";
		case "Hard":
			return "text-xs font-semibold uppercase tracking-wide bg-rose-200/60 dark:bg-rose-800/60 text-rose-900 dark:text-rose-100 px-2 py-1 rounded";
		default:
			return "text-xs font-semibold uppercase tracking-wide bg-slate-200/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 px-2 py-1 rounded";
	}
}

function sanitizeLeetCodeHtml(html: string) {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/on[a-z]+="[^"]*"/gi, "")
		.replace(/on[a-z]+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}
