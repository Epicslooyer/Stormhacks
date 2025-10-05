import Link from "next/link";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import CreateGameButton from "../game/CreateGameButton";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const LOBBY_STATUSES = ["lobby"] as const;

export default async function LobbiesPage() {
	const preloaded = await preloadQuery(api.games.listGamesByStatus, {
		statuses: [...LOBBY_STATUSES],
	});
	const lobbies = preloadedQueryResult(preloaded);

	return (
		<main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 px-4 py-16">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
				<header className="space-y-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
						Open Lobbies
					</h1>
					<p className="text-base text-muted-foreground sm:text-lg">
						Join a lobby to coordinate with other players or create your own to
						start a fresh match.
					</p>
					<div className="flex justify-center">
						<CreateGameButton redirectBase="/lobby" label="Create a lobby" />
					</div>
				</header>
				{lobbies.length === 0 ? (
					<Card className="mx-auto max-w-md text-center">
						<CardHeader>
							<CardTitle className="text-2xl font-semibold">
								No open lobbies yet
							</CardTitle>
							<CardDescription>
								Be the first to create a lobby and invite friends to play.
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{lobbies.map((lobby) => {
							const problemLabel =
								lobby.problemTitle ?? lobby.problemSlug ?? "Problem to be decided";
							return (
								<Link
									key={lobby._id}
									href={`/lobby/${lobby.slug}`}
									className="group"
								>
									<Card className="h-full transition duration-200 group-hover:border-primary">
										<CardHeader className="flex flex-col gap-3">
											<div className="flex items-center justify-between gap-3">
												<CardTitle className="text-2xl font-semibold">
													{lobby.name}
												</CardTitle>
												<Badge variant="outline" className="uppercase">
													Lobby
												</Badge>
											</div>
											<CardDescription className="text-sm">
												Problem: {problemLabel}
											</CardDescription>
										</CardHeader>
										<CardContent className="flex flex-col gap-2 text-sm">
											<p className="font-medium">
												Players in lobby: {lobby.presenceCount}
											</p>
											<p className="text-muted-foreground">
												Ready players: {lobby.readyCount}
											</p>
											<p className="text-muted-foreground">
												Created at: {new Date(lobby.createdAt).toLocaleTimeString()}
											</p>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				)}
				<p className="text-center text-sm text-muted-foreground">
					Want to watch live matches instead? Visit <Link href="/spectate" className="underline underline-offset-2">/spectate</Link>.
				</p>
			</div>
		</main>
	);
}
