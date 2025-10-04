"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

const HEARTBEAT_INTERVAL = 10_000;

export function useGameConnection(initialSlug: string, basePath: string) {
	const router = useRouter();
	const [slug, setSlug] = useState(initialSlug);
	const slugRef = useRef(initialSlug);
	const clientId = useMemo(() => crypto.randomUUID(), []);
	const getOrCreateGame = useMutation(api.games.getOrCreateGame);
	const heartbeat = useMutation(api.games.heartbeatPresence);
	const leaveGame = useMutation(api.games.leaveGame);
	const presence = useQuery(api.games.activePresence, { slug });
	const game = useQuery(api.games.getGame, { slug });

	useEffect(() => {
		slugRef.current = slug;
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		let interval: ReturnType<typeof setInterval> | undefined;

		void (async () => {
			const result = await getOrCreateGame({ slug });
			if (cancelled) return;
			if (result.slug !== slug) {
				setSlug(result.slug);
				router.replace(`${basePath}/${result.slug}`);
			}
			await heartbeat({ slug: result.slug, clientId });
			if (cancelled) return;
			interval = setInterval(() => {
				void heartbeat({ slug: result.slug, clientId }).catch(() => {
					// best-effort heartbeat
				});
			}, HEARTBEAT_INTERVAL);
		})();

		return () => {
			cancelled = true;
			if (interval) clearInterval(interval);
			const currentSlug = slugRef.current;
			void leaveGame({ slug: currentSlug, clientId });
		};
	}, [basePath, clientId, getOrCreateGame, heartbeat, leaveGame, router, slug]);

	return {
		slug,
		clientId,
		presenceCount: presence?.count ?? 0,
		game,
	};
}
