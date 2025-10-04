import { TestCasesDisplay } from "@/components/TestCasesDisplay";
import { ProblemDetails } from "@/components/ProblemDetails";
import Link from "next/link";

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;

  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-2xl font-semibold">Problem Details</h1>
        <Link
          href="/problems"
          className="text-sm underline hover:no-underline text-foreground"
        >
          Back to problems
        </Link>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <ProblemDetails slug={slug} />
          <TestCasesDisplay problemSlug={slug} />
        </div>
      </main>
    </>
  );
}
