import Link from "next/link";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";


const SPECTATE_STATUSES = ["active", "countdown"] as const;

export default async function SpectateHomePage() {
  const preloaded = await preloadQuery(api.games.listGamesByStatus, {
    statuses: [...SPECTATE_STATUSES],
  });
  const games = preloadedQueryResult(preloaded);

	return (
		<div
			className="relative flex min-h-screen flex-col overflow-hidden"
			style={{
				backgroundImage: "var(--home-page-background)",
				backgroundColor: "var(--home-page-background-color)",
			}}
		>
			<HomeBackdrop />
			<HomeHeader />
			<main className="flex flex-1 flex-col gap-12 py-8 md:gap-20 md:py-16">
				<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
					<header className="space-y-3 text-center mb-8">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
							Spectate Live Games
						</h1>
						<p className="text-base text-muted-foreground sm:text-lg">
							Watch ongoing matches in real time. Pick a game below to jump into the action.
						</p>
					</header>
					{games.length === 0 ? (
						<Card className="mx-auto max-w-md text-center">
							<CardHeader>
								<CardTitle className="text-2xl font-semibold">
									No active games right now
								</CardTitle>
								<CardDescription>
									Check back soon to see matches you can spectate.
								</CardDescription>
							</CardHeader>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{games.map((game) => {
								const difficulty = game.problemDifficulty ?? undefined;
								const problemLabel =
									game.problemTitle ?? game.problemSlug ?? "Unrevealed challenge";
								return (
									<Link
										key={game._id}
										href={`/spectate/${game.slug}`}
										className="group"
									>
										<Card className="h-full transition duration-200 group-hover:border-primary">
											<CardHeader className="flex flex-col gap-3">
												<div className="flex items-center justify-between gap-3">
													<CardTitle className="text-2xl font-semibold">
														{game.name}
													</CardTitle>
													<Badge variant="outline" className="uppercase">
														{game.status}
													</Badge>
												</div>
												<CardDescription className="text-sm">
													Problem: {problemLabel}
												</CardDescription>
												{difficulty && (
													<CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
														Difficulty: {difficulty}
													</CardDescription>
												)}
											</CardHeader>
											<CardContent className="flex flex-col gap-2 text-sm">
												<p className="font-medium">
													Players online: {game.presenceCount}
												</p>
												{game.readyCount > 0 && (
													<p className="text-muted-foreground">
														Ready players: {game.readyCount}
													</p>
												)}
												<p className="text-muted-foreground">
													Created at: {new Date(game.createdAt).toLocaleTimeString()}
												</p>
											</CardContent>
										</Card>
									</Link>
								);
							})}
						</div>
					)}
					<p className="text-center text-sm text-muted-foreground mt-8">
						Looking for lobby coordination? Visit <Link href="/lobbies" className="underline underline-offset-2">/lobbies</Link>.
					</p>
				</div>
			</main>
		</div>
	);
}
