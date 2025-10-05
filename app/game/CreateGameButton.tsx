"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

function generateSlug() {
	return crypto.randomUUID().slice(0, 8);
}

export default function CreateGameButton({
	redirectBase = "/game",
	label = "Create new game",
	mode = "multiplayer",
}: {
	redirectBase?: string;
	label?: string;
	mode?: "solo" | "multiplayer";
}) {
	const router = useRouter();
	const getOrCreateGame = useMutation(api.games.getOrCreateGame);
	const [pending, setPending] = useState(false);

	return (
		<button
			type="button"
			className="bg-foreground text-background px-4 py-2 rounded-md"
			disabled={pending}
			onClick={async () => {
				if (pending) return;
				setPending(true);
				try {
						const slug = generateSlug();
						await getOrCreateGame({ slug, name: mode === "solo" ? "Solo Game" : "New Game", mode });
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
