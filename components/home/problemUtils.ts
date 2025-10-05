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

export function difficultyBadgePalette(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "teal";
		case "Medium":
			return "orange";
		case "Hard":
			return "red";
		default:
			return "gray";
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
