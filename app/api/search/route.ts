import Fuse from "fuse.js";
import LeetCodeQuery from "leetcode-query";

import data from "./problems.json";

export const runtime = "nodejs";

const leetCodeClient = new LeetCodeQuery();
const tagCache = new Map<string, { tags: string[]; fetchedAt: number }>();
const TAG_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

type Problem = {
	id: number;
	title: string;
	slug: string;
	difficulty: number;
	frontend_id: number;
	tags?: string[];
};

async function getTagsForProblem(slug: string): Promise<string[] | undefined> {
	if (!slug) return undefined;
	const cached = tagCache.get(slug);
	const now = Date.now();
	if (cached && now - cached.fetchedAt < TAG_CACHE_TTL_MS) {
		return cached.tags;
	}

	try {
		const response = await leetCodeClient.problem(slug);
		const tags = Array.isArray(response.topicTags)
			? response.topicTags
				.map((tag) =>
					typeof tag?.name === "string" && tag.name.trim().length > 0
						? tag.name.trim()
						: typeof tag?.slug === "string"
							? tag.slug.trim()
							: null,
				)
				.filter((tag): tag is string => Boolean(tag))
			: [];
		tagCache.set(slug, { tags, fetchedAt: now });
		return tags.length > 0 ? tags : undefined;
	} catch (error) {
		console.error(`Failed to load tags for ${slug}:`, error);
		return undefined;
	}
}

export const GET = async (request: Request) => {
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

	const withTags = await Promise.all(
		results.map(async (problem) => ({
			...problem,
			tags: await getTagsForProblem(problem.slug),
		})),
	);

	// Return the results
	return new Response(JSON.stringify({ results: withTags }), {
		headers: { "Content-Type": "application/json" },
	});
};
