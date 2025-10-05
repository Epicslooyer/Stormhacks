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

export function normalizeProblem(problem: Record<string, unknown>): ProblemOption {
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

export function difficultyBadgeClassName(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100";
		case "Medium":
			return "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100";
		case "Hard":
			return "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100";
		default:
			return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-700/40 dark:text-slate-100";
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
