"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useGameConnection } from "@/components/useGameConnection";

export default function LobbySession({ slug }: { slug: string }) {
	const router = useRouter();
	const { game, presenceCount, clientId, slug: resolvedSlug } =
		useGameConnection(slug, "/lobby");
	const startGame = useMutation(api.games.startGame);
	const [pending, setPending] = useState(false);

	const status = game?.status ?? "lobby";
	const canStart = status !== "active" && status !== "completed";

	return (
		<main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
			<header className="flex flex-col gap-1 text-center">
				<h1 className="text-3xl font-bold">
					Lobby {game?.name ?? resolvedSlug}
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Status: {status}
				</p>
			</header>
			<section className="flex flex-col items-center gap-2">
				<span className="text-lg font-semibold">
					Connected users: {presenceCount}
				</span>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					You are connected as {clientId.slice(0, 8)}
				</p>
			</section>
			<section className="flex flex-col items-center gap-3">
				<button
					type="button"
					className="bg-foreground text-background px-4 py-2 rounded-md disabled:opacity-50"
					disabled={!canStart || pending}
					onClick={async () => {
						if (!canStart || pending) return;
						setPending(true);
						try {
							await startGame({ slug: resolvedSlug });
							router.push(`/game/${resolvedSlug}`);
						} finally {
							setPending(false);
						}
					}}
				>
					{pending ? "Starting..." : "Enter game"}
				</button>
				<Link
					href={`/game/${resolvedSlug}`}
					className="text-sm underline hover:no-underline text-foreground"
				>
					Open game page
				</Link>
			</section>
		</main>
	);
}
