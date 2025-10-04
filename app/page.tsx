"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import UserProfile from "../components/UserProfile";
import { useEffect, useMemo, useState, useId } from "react";
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
                        Search the LeetCode problem set or start quickly with a featured pick. We
                        will spin up a shared lobby and keep everyone synced once you start.
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Searching…</p>
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
                            <div className="flex items-center justify-between">
                                <Link
                                    href={`/problems/${problem.slug}`}
                                    className="text-xs underline hover:no-underline"
                                >
                                    View problem details
                                </Link>
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
    );
}

function normalizeProblem(problem: Record<string, unknown>): ProblemOption {
    const slug = String(problem.slug ?? "");
    const title = String(problem.title ?? problem.slug ?? "Untitled problem");
    const id = String(problem.frontend_id ?? problem.id ?? slug);
    const difficultyValue = typeof problem.difficulty === "number"
        ? problem.difficulty
        : Number(problem.difficulty ?? 0);
    return {
        id,
        slug,
        title,
        difficulty: difficultyLabel(difficultyValue),
    };
}

	return (
		<div className="flex flex-col gap-8 max-w-lg mx-auto">
			<p>Welcome {viewer ?? "Anonymous"}!</p>
			
			<UserProfile />
			
			<p>
				Click the button below and open this page in another window - this data
				is persisted in the Convex cloud database!
			</p>
			<p>
				<button
					className="bg-foreground text-background text-sm px-4 py-2 rounded-md"
					onClick={() => {
						void addNumber({ value: Math.floor(Math.random() * 10) });
					}}
				>
					Add a random number
				</button>
			</p>
			<p>
				Numbers:{" "}
				{numbers?.length === 0
					? "Click the button!"
					: (numbers?.join(", ") ?? "...")}
			</p>
			<p>
				Edit{" "}
				<code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
					convex/myFunctions.ts
				</code>{" "}
				to change your backend
			</p>
			<p>
				Edit{" "}
				<code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
					app/page.tsx
				</code>{" "}
				to change your frontend
			</p>
			<p>
				See the{" "}
				<Link href="/server" className="underline hover:no-underline">
					/server route
				</Link>{" "}
				for an example of loading data in a server component
			</p>
			<div className="flex flex-col">
				<p className="text-lg font-bold">Useful resources:</p>
				<div className="flex gap-2">
					<div className="flex flex-col gap-2 w-1/2">
						<ResourceCard
							title="Convex docs"
							description="Read comprehensive documentation for all Convex features."
							href="https://docs.convex.dev/home"
						/>
						<ResourceCard
							title="Stack articles"
							description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
							href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
						/>
					</div>
					<div className="flex flex-col gap-2 w-1/2">
						<ResourceCard
							title="Templates"
							description="Browse our collection of templates to get started quickly."
							href="https://www.convex.dev/templates"
						/>
						<ResourceCard
							title="Discord"
							description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
							href="https://www.convex.dev/community"
						/>
					</div>
				</div>
			</div>
		</div>
	);
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
