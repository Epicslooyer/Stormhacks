"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: 1,
						staleTime: 60 * 1000,
					},
				},
			}),
	);
	return (
		<ConvexAuthNextjsProvider client={convex}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</ConvexAuthNextjsProvider>
	);
}
