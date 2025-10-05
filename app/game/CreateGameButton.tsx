"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

function generateSlug() {
	return crypto.randomUUID().slice(0, 8);
}

export default function CreateGameButton({
	redirectBase = "/game",
	label = "Create new game",
	mode = "multiplayer",
	className,
}: {
	redirectBase?: string;
	label?: string;
	mode?: "solo" | "multiplayer";
	className?: string;
}) {
	const router = useRouter();
	const getOrCreateGame = useMutation(api.games.getOrCreateGame);
	const [pending, setPending] = useState(false);

	return (
		<button
			type="button"
			className={cn(
				"group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] px-5 py-2 text-sm font-semibold text-slate-900 shadow-[0_12px_25px_-12px_rgba(175,116,0,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-15px_rgba(175,116,0,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 disabled:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-70",
				pending && "cursor-progress",
				className,
			)}
			disabled={pending}
			onClick={async () => {
				if (pending) return;
				setPending(true);
				try {
					const slug = generateSlug();
					await getOrCreateGame({
						slug,
						name: mode === "solo" ? "Solo Game" : "New Game",
						mode,
					});
					router.push(`${redirectBase}/${slug}`);
				} finally {
					setPending(false);
				}
			}}
		>
			{pending ? "Creating..." : label}
		</button>
	);
}
