import LeetCodeQuery from "leetcode-query";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leetCodeClient = new LeetCodeQuery();

type RouteContext = { params: Promise<{ slug?: string }> };

export async function GET(_request: Request, context: RouteContext) {
	const { slug } = await context.params;

	if (!slug) {
		return NextResponse.json(
			{ error: "Problem slug is required" },
			{ status: 400 },
		);
	}

	try {
		const problem = await leetCodeClient.problem(slug);

		return NextResponse.json(problem, {
			headers: {
				"Cache-Control": "s-maxage=300, stale-while-revalidate=300",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";

		return NextResponse.json({ error: message }, { status: 502 });
	}
}
