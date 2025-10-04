import Link from "next/link";

const problems = [
  { id: "two-sum", title: "Two Sum", difficulty: "Easy" },
  { id: "valid-parentheses", title: "Valid Parentheses", difficulty: "Easy" },
  { id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium" },
  { id: "word-ladder", title: "Word Ladder", difficulty: "Hard" },
];

export default function ProblemsPage() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-2xl font-semibold">Problems</h1>
        <Link
          href="/"
          className="text-sm underline hover:no-underline text-foreground"
        >
          Back to home
        </Link>
      </header>
      <main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Browse a curated list of practice problems and keep track of the ones
          you want to try next.
        </p>
        <ul className="grid gap-4">
          {problems.map((problem) => (
            <li
              key={problem.id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-200/50 dark:bg-slate-800/50"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{problem.title}</span>
                  <span className="text-xs uppercase tracking-wide">
                    {problem.difficulty}
                  </span>
                </div>
                <Link
                  href={`/problems/${problem.id}`}
                  className="text-sm underline hover:no-underline"
                >
                  View problem
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
