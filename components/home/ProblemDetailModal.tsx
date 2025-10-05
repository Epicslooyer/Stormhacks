"use client";

import Link from "next/link";
import { useId, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProblemDetails } from "@/components/useProblemDetails";
import {
	difficultyBadgeClassName,
	sanitizeLeetCodeHtml,
} from "./problemUtils";
import type { ProblemOption } from "./types";
import { Loader2 } from "lucide-react";

export function ProblemDetailModal({
	isOpen,
	problem,
	onClose,
}: {
	isOpen: boolean;
	problem: ProblemOption | null;
	onClose: () => void;
}) {
	const { data, isPending, isError, error } = useProblemDetails(problem?.slug);
	const titleId = useId();
	const contentId = useId();

	let parsedStats: Record<string, unknown> | null = null;
	if (data?.stats) {
		try {
			parsedStats = JSON.parse(data.stats);
		} catch (_error) {
			parsedStats = null;
		}
	}

	const acceptance = typeof parsedStats?.acRate === "string" ? parsedStats.acRate : null;
	const totalSubmissions =
		typeof parsedStats?.totalSubmission === "number" ? parsedStats.totalSubmission : null;
	const totalAccepted =
		typeof parsedStats?.totalAccepted === "number" ? parsedStats.totalAccepted : null;
	const modalError = error instanceof Error ? error.message : "Unknown error";
	const topicTags = data?.topicTags ?? [];
	const contentHtml =
		data?.content ?? "<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);

	if (!problem) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				aria-labelledby={titleId}
				aria-describedby={contentId}
				className="max-h-[85vh] w-full max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[80vw] md:max-w-[80vw] lg:w-[80vw] lg:max-w-[80vw] gap-6 overflow-hidden rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur dark:bg-slate-950/95"
			>
				<DialogHeader className="gap-3">
					<div className="space-y-2">
						<DialogTitle id={titleId} className="text-2xl font-semibold text-slate-900 dark:text-white">
							{data?.title ?? problem.title}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
							{problem.slug}
						</DialogDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
						<Badge className={cn("rounded-md border px-2.5 py-1 font-semibold uppercase", difficultyBadgeClassName(data?.difficulty ?? problem.difficulty))}>
							{data?.difficulty ?? problem.difficulty}
						</Badge>
						{acceptance && <span>Acceptance: {acceptance}</span>}
						{typeof data?.likes === "number" && <span>Likes: {data.likes}</span>}
				{typeof data?.dislikes === "number" && <span>Dislikes: {data.dislikes}</span>}
			</div>
		</DialogHeader>
			<div
				id={contentId}
				className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 text-sm text-slate-700 break-words dark:text-slate-200"
			>
				{isPending && (
					<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>Loading problem details…</span>
					</div>
				)}
				{isError && !isPending && (
					<p className="text-sm text-rose-500">
						Failed to load problem details: {modalError}
					</p>
				)}
				{!isPending && !isError && (
					<div className="space-y-4">
						{topicTags.length > 0 && (
							<div className="flex flex-wrap items-center gap-2">
								{topicTags.map((tag) => (
									<Badge
										key={String(tag?.slug ?? tag?.name)}
										variant="secondary"
										className="rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-medium text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]"
									>
										{String(tag?.name ?? tag?.slug)}
									</Badge>
								))}
							</div>
						)}
						{(totalSubmissions !== null || totalAccepted !== null) && (
							<p className="text-xs text-slate-500 dark:text-slate-400">
								{totalAccepted !== null && `Accepted: ${totalAccepted.toLocaleString()} · `}
								{totalSubmissions !== null && `Submissions: ${totalSubmissions.toLocaleString()}`}
							</p>
						)}
						<ModalContentBody sanitizedContent={sanitizedContent} />
					</div>
				)}
				</div>
				<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button asChild variant="outline" className="order-2 sm:order-1">
						<Link href={`https://leetcode.com/problems/${problem.slug}/`} target="_blank" rel="noreferrer">
							Open on LeetCode
						</Link>
					</Button>
					<Button onClick={onClose} className="order-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ModalContentBody({ sanitizedContent }: { sanitizedContent: string }) {
	return (
		<div
			className="text-sm leading-7 text-slate-700 break-words dark:text-slate-200 space-y-4 [&_a]:break-words [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:text-sm [&_h4]:font-semibold [&_li]:break-words [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4 [&_p]:break-words [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900/85 [&_pre]:p-4 [&_pre]:text-slate-100 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_code]:break-words [&_code]:font-mono"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized LeetCode problem markup
			dangerouslySetInnerHTML={{ __html: sanitizedContent }}
		/>
	);
}
