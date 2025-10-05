import type { ProblemOption } from "./types";

export const featuredProblems: ProblemOption[] = [
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
	{
		id: "6",
		slug: "product-of-array-except-self",
		title: "Product of Array Except Self",
		difficulty: "Medium",
	},
	{
		id: "7",
		slug: "lru-cache",
		title: "LRU Cache",
		difficulty: "Hard",
	},
	{
		id: "8",
		slug: "number-of-islands",
		title: "Number of Islands",
		difficulty: "Medium",
	},
];

export function normalizeProblem(
	problem: Record<string, unknown>,
): ProblemOption {
	const slug = String(problem.slug ?? "");
	const title = String(problem.title ?? problem.slug ?? "Untitled problem");
	const id = String(problem.frontend_id ?? problem.id ?? slug);
	const difficultyValue =
		typeof problem.difficulty === "number"
			? problem.difficulty
			: Number(problem.difficulty ?? 0);
	const tags = extractTagLabels(problem);
	return {
		id,
		slug,
		title,
		difficulty: difficultyLabel(difficultyValue),
		tags,
	};
}

function extractTagLabels(problem: Record<string, unknown>): string[] | undefined {
	const candidate =
		(Array.isArray(problem.tags) && problem.tags) ||
		(Array.isArray(problem.topicTags) && problem.topicTags);

	if (!candidate) return undefined;

	const seen = new Set<string>();
	const labels: string[] = [];

	for (const entry of candidate as Array<unknown>) {
		if (!entry) continue;
		if (typeof entry === "string") {
			const trimmed = entry.trim();
			if (!trimmed || seen.has(trimmed)) continue;
			seen.add(trimmed);
			labels.push(trimmed);
			continue;
		}
		if (typeof entry === "object") {
			const name =
				typeof (entry as { name?: unknown }).name === "string"
					? ((entry as { name?: string }).name ?? "").trim()
					: "";
			const slug =
				typeof (entry as { slug?: unknown }).slug === "string"
					? ((entry as { slug?: string }).slug ?? "").trim()
					: "";
			const label = name || slug;
			if (!label || seen.has(label)) continue;
			seen.add(label);
			labels.push(label);
		}
	}

	return labels.length > 0 ? labels : undefined;
}

export function difficultyBadgeClassName(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "border-emerald-500/25 bg-emerald-400/15 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/20 dark:text-emerald-100";
		case "Medium":
			return "border-amber-500/30 bg-amber-400/15 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-100";
		case "Hard":
			return "border-rose-500/35 bg-rose-500/15 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-100";
		default:
			return "border-slate-500/25 bg-slate-400/15 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-100";
	}
}

export function sanitizeLeetCodeHtml(html: string) {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/on[a-z]+="[^"]*"/gi, "")
		.replace(/on[a-z]+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
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
