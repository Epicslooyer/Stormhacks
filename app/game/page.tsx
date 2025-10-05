import Link from "next/link";
import CreateGameButton from "./CreateGameButton";

export default function GameHomePage() {
	return (
		<main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
			<h1 className="text-3xl font-bold text-center">Game Sessions</h1>
			<p className="text-center text-sm text-slate-600 dark:text-slate-400">
				Games are launched from lobbies. Create one below or join an existing
				lobby to coordinate before entering the live match.
			</p>
					<div className="flex justify-center gap-4">
						<CreateGameButton redirectBase="/lobby" label="Solo Game" mode="solo" />
						<CreateGameButton redirectBase="/lobby" label="Multiplayer Lobby" mode="multiplayer" />
					</div>
			<p className="text-center text-sm">
				Already have a game running? Visit{" "}
				<Link href="/lobby" className="underline hover:no-underline">
					/lobby
				</Link>{" "}
				to manage waiting rooms or head directly to{" "}
				<Link
					href="/game/your-game-id"
					className="underline hover:no-underline"
				>
					/game/your-game-id
				</Link>
				.
			</p>
		</main>
	);
}
