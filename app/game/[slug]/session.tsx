"use client";

import { useGameConnection } from "@/components/useGameConnection";

export default function GameSession({ slug }: { slug: string }) {
	const { game, clientId, presenceCount, slug: resolvedSlug } =
		useGameConnection(slug, "/game");

	return (
		<main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="text-3xl font-bold">
					{game?.name ?? `Game ${resolvedSlug}`}
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Status: {game?.status ?? "creating"}
				</p>
			</header>
			<section className="flex flex-col items-center gap-2">
				<span className="text-lg font-semibold">
					Live participants: {presenceCount}
				</span>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					You are connected as {clientId.slice(0, 8)}
				</p>
			</section>
		</main>
	);
}
