import Fuse from "fuse.js";
import data from "./problems.json";

type Problem = {
	id: number;
	title: string;
	slug: string;
	difficulty: number;
	frontend_id: number;
};

export const GET = (request: Request) => {
	// Get the search query from the URL
	const url = new URL(request.url);
	const query = url.searchParams.get("q") || "";

	// If no query, return empty results
	if (!query) {
		return new Response(JSON.stringify({ results: [] }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	// Filter out premium problems and map to searchable format
	const problems: Problem[] = data.stat_status_pairs
		.filter((item) => !item.paid_only)
		.map((item) => ({
			id: item.stat.question_id,
			title: item.stat.question__title,
			slug: item.stat.question__title_slug,
			difficulty: item.difficulty.level,
			frontend_id: item.stat.frontend_question_id,
		}));

	// Configure Fuse.js fuzzy search
	const fuse = new Fuse<Problem>(problems, {
		keys: ["title", "slug"],
		includeScore: true,
		threshold: 0.3,
		minMatchCharLength: 2,
	});

	// Perform search and limit results
	const results = fuse
		.search(query)
		.slice(0, 10)
		.map(({ item }) => item);

	// Return the results
	return new Response(JSON.stringify({ results }), {
		headers: { "Content-Type": "application/json" },
	});
};
