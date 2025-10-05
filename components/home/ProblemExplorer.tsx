"use client";

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

const difficultyTaglines: Record<string, string> = {
	Easy: "Warm up with a quick win and build momentum.",
	Medium: "Plot the strategy together and keep the pace steady.",
	Hard: "Rally the crew for a high-intensity challenge.",
	default: "Sharpen your skills and sync up with teammates in seconds.",
};

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

	const hasSearch = query.trim().length >= 2;
	const problems = useMemo(
		() => (hasSearch ? results : featuredProblems),
		[hasSearch, results],
	);

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
								Choose your battleground
							</h2>
							<p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
								Search anything in the LeetCode dataset or jump into a curated
								set of crowd-pleasing problems. Preview details before you
								launch to keep teammates on the same page.
							</p>
						</div>
					</div>
					<div className="space-y-4">
						<div className="space-y-3">
							<label
								htmlFor={searchInputId}
								className="text-sm font-semibold text-slate-800 dark:text-slate-100"
							>
								Search problems
							</label>
							<div className="relative">
								<FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
								<Input
									id={searchInputId}
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Type at least two characters to search the LeetCode catalog"
									className="bg-white/70 pl-10 shadow-sm backdrop-blur dark:bg-slate-900/50"
								/>
							</div>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{hasSearch
									? "Showing search results from the LeetCode dataset."
									: "Need inspiration? Start with one of the featured problems below."}
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3">
							{loading && (
								<p className="text-sm text-slate-600 dark:text-slate-400">
									Hang tight while we search…
								</p>
							)}
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
	const tagline =
		difficultyTaglines[problem.difficulty] ?? difficultyTaglines.default;

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
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{tagline}
					</p>
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
