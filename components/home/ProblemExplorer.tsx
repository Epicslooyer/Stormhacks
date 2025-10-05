"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { FiArrowRight, FiBookOpen, FiSearch } from "react-icons/fi";

import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ProblemDetailModal } from "./ProblemDetailModal";
import {
	difficultyBadgeClassName,
	featuredProblems,
	normalizeProblem,
} from "./problemUtils";
import type { ProblemOption } from "./types";
import {
	prefetchProblemDetails,
	useProblemDetails,
} from "@/components/useProblemDetails";

export function ProblemExplorer({ sectionId }: { sectionId: string }) {
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
	const queryClient = useQueryClient();

	const hasSearch = query.trim().length >= 2;
	const problems = useMemo(
		() => (hasSearch ? results : featuredProblems),
		[hasSearch, results],
	);

	useEffect(() => {
		const problemsNeedingTags = featuredProblems.filter(
			(problem) => !Array.isArray(problem.tags) || problem.tags.length === 0,
		);
		if (problemsNeedingTags.length === 0) return;
		void Promise.all(
			problemsNeedingTags.map((problem) =>
				prefetchProblemDetails(queryClient, problem.slug),
			),
		);
	}, [queryClient]);

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
				if (!response.ok) throw new Error("Search failed");
				const data: { results: Array<Record<string, unknown>> } =
					await response.json();
				if (cancelled) return;
				setResults(data.results.map(normalizeProblem));
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

	const resultLabel = hasSearch
		? `${problems.length} ${problems.length === 1 ? "match" : "matches"}`
		: `${featuredProblems.length} featured picks`;

	return (
		<section id={sectionId} className="flex flex-col gap-8 md:gap-10">
			<div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)] md:p-10">
				<div
					className="pointer-events-none absolute inset-0 opacity-50"
					style={{
						backgroundImage:
							"radial-gradient(700px at 12% 22%, rgba(247, 211, 84, 0.4), transparent 62%)",
					}}
				/>
				<div
					className="pointer-events-none absolute -top-[30%] -right-[10%] h-[120%] w-[60%] blur-sm md:w-[45%]"
					style={{
						backgroundImage:
							"radial-gradient(circle, rgba(64, 142, 255, 0.22), transparent 72%)",
					}}
				/>
				<div className="relative flex flex-col gap-6">
					<div className="flex flex-col gap-3 md:gap-4">
						<Badge className="w-fit rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
							Problem library
						</Badge>
						<div className="max-w-3xl space-y-3">
							<h2 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
								100 people enter the arena.
							</h2>
							<p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
								Only one will advance to the next round of technical interviews.
					</p>
						</div>
					</div>
					<div className="space-y-4">
						<div className="space-y-4">
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								<label
									htmlFor={searchInputId}
									className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-700 dark:text-slate-200"
								>
									Search problems
								</label>
								<span className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
									Explore instantly
								</span>
							</div>
							<div className="group relative">
								<div className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-300/45 opacity-60 transition duration-300 group-hover:opacity-90 group-focus-within:opacity-100" />
								<div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-200/30 via-transparent to-sky-300/30 opacity-0 transition duration-500 group-hover:opacity-60 group-focus-within:opacity-80" />
								<div className="relative flex items-center gap-4 rounded-2xl border border-white/60 bg-white/85 px-5 py-4 shadow-[0_28px_70px_-32px_rgba(10,24,64,0.55)] backdrop-blur-lg dark:border-white/10 dark:bg-slate-950/70">
									<span className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/60 bg-amber-200/20 text-amber-600 shadow-inner dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-100">
										<FiSearch className="h-5 w-5" />
									</span>
									<Input
										id={searchInputId}
										type="search"
										value={query}
										onChange={(event) => setQuery(event.target.value)}
										placeholder="Search the LeetCode catalog by name, topic, or difficulty"
										className="h-12 flex-1 rounded-xl border border-white/40 bg-white/60 px-4 py-2 text-base font-medium text-slate-800 shadow-inner shadow-white/30 transition focus-visible:ring-2 focus-visible:ring-amber-300/50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:focus-visible:ring-amber-400/40"
									/>

									{query.length > 0 && (
										<button
											type="button"
											onClick={() => setQuery("")}
											className="inline-flex items-center rounded-full border border-transparent bg-slate-900/5 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/60 hover:bg-white hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
										>
											Clear
										</button>
									)}
								</div>
							</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{hasSearch
									? "Showing search results from the LeetCode dataset."
									: "Need inspiration? Start with one of the featured problems below."}
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Badge className="rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
								{resultLabel}
							</Badge>
						</div>
						{error && <p className="text-xs text-rose-500">{error}</p>}
					</div>
				</div>
			</div>
			<div className="space-y-5">
				{loading && (
					<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>Searching…</span>
					</div>
				)}
				{!loading && hasSearch && problems.length === 0 && (
					<p className="text-sm text-slate-500 dark:text-slate-400">
						No problems match that query.
					</p>
				)}
				<ul className="grid gap-5 sm:grid-cols-2 md:gap-6">
					{problems.map((problem) => (
						<ProblemCard
							key={`${problem.slug}-${problem.id}`}
							problem={problem}
							onPreview={() => setPreviewProblem(problem)}
							onStart={() => handleStart(problem)}
							isLoading={pendingSlug === problem.slug}
							isDisabled={pendingSlug !== null && pendingSlug !== problem.slug}
						/>
					))}
				</ul>
			</div>
			<ProblemDetailModal
				isOpen={previewProblem !== null}
				problem={previewProblem}
				onClose={() => setPreviewProblem(null)}
			/>
		</section>
	);
}

function ProblemCard({
	problem,
	onPreview,
	onStart,
	isLoading,
	isDisabled,
}: {
 	problem: ProblemOption;
 	onPreview: () => void;
 	onStart: () => void;
 	isLoading: boolean;
 	isDisabled: boolean;
}) {
	const presetTags = Array.isArray(problem.tags) ? problem.tags : undefined;
	const shouldFetchDetails = !presetTags || presetTags.length === 0;
	const { data: details, isPending: tagsPending } = useProblemDetails(
		shouldFetchDetails ? problem.slug : null,
	);
	const topicTags = useMemo(() => {
		const fromProblem = (presetTags ?? []).map((tag) => tag.trim()).filter(Boolean);
		if (fromProblem.length > 0) {
			return dedupeTags(fromProblem).slice(0, 3);
		}
		const rawTags = Array.isArray(details?.topicTags)
			? (details?.topicTags as Array<
					| { name?: string | null; slug?: string | null }
					| null
					| undefined
			>)
			: [];
		const labels: string[] = [];
		const seen = new Set<string>();
		for (const tag of rawTags) {
			if (!tag) continue;
			const name =
				typeof tag.name === "string" && tag.name.trim().length > 0
					? tag.name.trim()
					: typeof tag.slug === "string" && tag.slug.trim().length > 0
						? tag.slug.trim()
						: "";
			if (!name || seen.has(name)) continue;
			seen.add(name);
			labels.push(name);
			if (labels.length === 3) break;
		}
		return labels;
	}, [presetTags, details?.topicTags]);
	const showTagsLoading = shouldFetchDetails && tagsPending && topicTags.length === 0;

	return (
		<li className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-br from-white/95 via-white/85 to-white/70 p-6 shadow-[0_22px_55px_-28px_rgba(10,26,68,0.55)] backdrop-blur-xl transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_35px_80px_-30px_rgba(10,26,68,0.75)] focus-within:-translate-y-1 focus-within:shadow-[0_35px_80px_-30px_rgba(10,26,68,0.75)] dark:border-amber-400/25 dark:from-slate-950/75 dark:via-slate-950/65 dark:to-slate-900/55">
			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
				<div className="absolute -top-1/2 -right-1/3 h-[130%] w-[65%] rotate-12 bg-gradient-to-br from-amber-200/20 via-transparent to-transparent blur-3xl" />
				<div className="absolute -bottom-1/2 -left-1/3 h-[120%] w-[55%] -rotate-6 bg-gradient-to-tr from-sky-300/15 via-transparent to-transparent blur-3xl" />
			</div>
			<div className="relative flex items-start justify-between gap-4">
				<div className="space-y-3">
					<h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-white dark:group-hover:text-white">
						{problem.title}
					</h3>
					{showTagsLoading ? (
						<p className="text-xs text-slate-400 dark:text-slate-500">
							Loading topics…
						</p>
					) : topicTags.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{topicTags.map((tag) => (
								<Badge
									key={tag}
									className="rounded-full border border-amber-300/60 bg-amber-100/80 px-2.5 py-1 text-xs font-medium text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]"
								>
									{tag}
								</Badge>
							))}
						</div>
					) : null}
				</div>

				<Badge
					className={cn(
						"rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm",
						difficultyBadgeClassName(problem.difficulty),
					)}
				>
					{problem.difficulty}
				</Badge>
			</div>
			<div className="relative flex flex-wrap items-center justify-between gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={onPreview}
					className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-white/40 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/70 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white"
				>
					<FiBookOpen className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
					<span className="transition-transform duration-200 group-hover:translate-x-0.5">
						Preview
					</span>
				</Button>
				<Button
					size="sm"
					onClick={onStart}
					disabled={isDisabled}
					className={cn(
						"group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-[0_12px_25px_-12px_rgba(175,116,0,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-15px_rgba(175,116,0,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 disabled:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none",
						isDisabled && "opacity-70",
					)}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
					)}
					<span>Start lobby</span>
				</Button>
			</div>
		</li>
	);
}

function dedupeTags(tags: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const tag of tags) {
		const trimmed = tag.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		result.push(trimmed);
	}
	return result;
}
