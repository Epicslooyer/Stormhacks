import Link from "next/link";
import CreateGameButton from "../game/CreateGameButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";

export default function LobbyPage() {
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
							Game Lobbies
						</h1>
						<p className="text-base text-muted-foreground sm:text-lg">
							Create a lobby, invite your friends, and start coding together!
						</p>
					</header>
					<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{/* Create Lobby Card */}
						<Card className="h-fit">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									Create New Lobby
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground">
									Start a new coding session and invite friends to join. Both players need to be ready before the game can begin.
								</p>
								<div className="flex justify-center">
									<CreateGameButton redirectBase="/lobby" label="Create Lobby" />
								</div>
							</CardContent>
						</Card>
						{/* Join Lobby Card */}
						<Card className="h-fit">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									Join Existing Lobby
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground">
									Have a lobby code? Enter it directly in the address bar or use the link shared by your friend.
								</p>
								<div className="space-y-2">
									<code className="block px-3 py-2 bg-muted rounded-md font-mono text-sm">
										/lobby/your-lobby-id
									</code>
									<Link href="/lobby/example">
										<Button variant="outline" className="w-full">
											Try Example Lobby
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>
					{/* Features */}
					<Card className="max-w-4xl mx-auto mt-12">
						<CardHeader>
							<CardTitle className="text-center">How It Works</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid md:grid-cols-3 gap-6 text-center">
								<div className="space-y-2">
									<div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
										<span className="text-2xl">1</span>
									</div>
									<h3 className="font-semibold">Create or Join</h3>
									<p className="text-sm text-muted-foreground">
										Create a new lobby or join an existing one using the lobby code
									</p>
								</div>
								<div className="space-y-2">
									<div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
										<span className="text-2xl">2</span>
									</div>
									<h3 className="font-semibold">Get Ready</h3>
									<p className="text-sm text-muted-foreground">
										All players must click "Ready Up" before the game can start
									</p>
								</div>
								<div className="space-y-2">
									<div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
										<span className="text-2xl">3</span>
									</div>
									<h3 className="font-semibold">Start Coding</h3>
									<p className="text-sm text-muted-foreground">
										Once all players are ready, the host can start the game
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					{/* Footer */}
					<div className="text-center text-sm text-muted-foreground pb-8 mt-8">
						<p>Ready to start coding together? Create your first lobby!</p>
					</div>
				</div>
			</main>
		</div>
	);
}
