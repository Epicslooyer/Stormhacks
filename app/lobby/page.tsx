import Link from "next/link";
import CreateGameButton from "../game/CreateGameButton";

export default function LobbyHomePage() {
	return (
		<main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
			<h1 className="text-3xl font-bold text-center">Lobbies</h1>
			<p className="text-center text-sm text-slate-600 dark:text-slate-400">
				Create a lobby, share the lobby link with other players, and once
				everyone is ready move together into the live game at the matching game
				URL.
			</p>
			<div className="flex justify-center">
				<CreateGameButton redirectBase="/lobby" label="Create new lobby" />
			</div>
			<p className="text-center text-sm">
				Know the lobby ID? Enter it directly in the address bar as{" "}
				<Link href="/lobby/example" className="underline hover:no-underline">
					/lobby/your-lobby-id
				</Link>
				.
			</p>
		</main>
	);
}
