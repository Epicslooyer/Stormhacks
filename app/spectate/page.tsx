import Link from "next/link";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { FiArrowRight } from "react-icons/fi";

import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { HomeHeader } from "@/components/home/HomeHeader";

const SPECTATE_STATUSES = ["active", "countdown"] as const;

const hypeMoments = [
	{
		icon: "⚔️",
		title: "Royale clashes live",
		description: "Catch clutch solutions the moment crowns are on the line.",
	},
	{
		icon: "🎯",
		title: "Interview intel",
		description: "Spot patterns recruiters love without leaving the bleachers.",
	},
	{
		icon: "👑",
		title: "Crowd control",
		description: "Boost the hype squad that ships the cleanest strat tonight.",
	},
];

function statusBadgeClass(status: string) {
	switch (status) {
		case "active":
			return "border-emerald-300/60 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/20 dark:text-emerald-100";
		case "countdown":
			return "border-sky-300/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/20 dark:text-sky-100";
		default:
			return "border-amber-300/60 bg-amber-100/70 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-100";
	}
}

export default async function SpectateHomePage() {
	const preloaded = await preloadQuery(api.games.listGamesByStatus, {
		statuses: [...SPECTATE_STATUSES],
	});
	const games = preloadedQueryResult(preloaded);
	const matchCountLabel = `${games.length} ${
		games.length === 1 ? "match live" : "matches live"
	}`;

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
			<main className="flex flex-1 flex-col gap-14 py-10 md:gap-20 md:py-16">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
					<section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)] md:p-10">
						<div
							className="pointer-events-none absolute inset-0 opacity-60"
							style={{
								backgroundImage:
									"radial-gradient(680px at 12% 22%, rgba(247, 211, 84, 0.4), transparent 62%)",
							}}
						/>
						<div
							className="pointer-events-none absolute inset-0"
							style={{
								backgroundImage:
									"radial-gradient(circle, rgba(96, 165, 250, 0.22), transparent 72%)",
							}}
						/>
						<div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
							<div className="space-y-4 md:max-w-3xl">
								<span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
									Spectator stands
								</span>
								<h1 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
									Spectate live battles
								</h1>
								<p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
									Take your seat in the royale bleachers, call every clutch
									play, and crib interview tactics from the best squads before
									your next duel.
								</p>
							</div>
							<ul className="flex flex-col gap-3 text-xs font-semibold tracking-[0.14em] text-slate-400 dark:text-slate-500">
								{hypeMoments.map((moment) => (
									<li key={moment.title} className="flex items-start gap-2">
										<span className="text-base leading-none">
											{moment.icon}
										</span>
										<div className="space-y-1">
											<p className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
												{moment.title}
											</p>
											<p className="text-[0.7rem] normal-case tracking-normal text-slate-400 dark:text-slate-500">
												{moment.description}
											</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					</section>

					<section className="flex flex-col gap-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Badge className="rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d2f6f] dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-[#f8e7a3]">
								{matchCountLabel}
							</Badge>
							<p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
								Tap a match to hear the arena roar.
							</p>
						</div>
						{games.length === 0 ? (
							<div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-10 text-center shadow-[0_32px_64px_-42px_rgba(12,45,126,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_32px_64px_-38px_rgba(24,84,189,0.45)]">
								<div
									className="pointer-events-none absolute inset-0 opacity-60"
									style={{
										backgroundImage:
											"radial-gradient(520px at 20% 25%, rgba(247, 211, 84, 0.38), transparent 70%)",
									}}
								/>
								<div className="relative mx-auto flex max-w-md flex-col gap-4">
									<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
										The arena is quiet… for now
									</h2>
									<p className="text-sm text-slate-600 dark:text-slate-300">
										No crowns are on the line this second. Rally a crew in the
										lobby queue and we’ll save you front-row seats.
									</p>
									<div className="flex justify-center">
										<Link
											href="/lobbies"
											className="group inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/15 dark:hover:text-white"
										>
											Join a lobby
											<FiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
										</Link>
									</div>
								</div>
							</div>
						) : (
							<ul className="grid gap-5 sm:grid-cols-2">
								{games.map((game) => {
									const difficulty = game.problemDifficulty ?? undefined;
									const problemLabel =
										game.problemTitle ??
										game.problemSlug ??
										"Unrevealed challenge";
									return (
										<li key={game._id}>
											<Link
												href={`/spectate/${game.slug}`}
												className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-br from-white/95 via-white/85 to-white/70 p-6 shadow-[0_22px_55px_-28px_rgba(10,26,68,0.55)] backdrop-blur-xl transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_35px_80px_-30px_rgba(10,26,68,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 dark:border-amber-400/25 dark:from-slate-950/75 dark:via-slate-950/65 dark:to-slate-900/55"
											>
												<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
													<div className="absolute -top-1/2 -right-1/3 h-[130%] w-[65%] rotate-12 bg-gradient-to-br from-amber-200/20 via-transparent to-transparent blur-3xl" />
													<div className="absolute -bottom-1/2 -left-1/3 h-[120%] w-[55%] -rotate-6 bg-gradient-to-tr from-sky-300/15 via-transparent to-transparent blur-3xl" />
												</div>
												<div className="relative flex items-start justify-between gap-4">
													<div className="space-y-2">
														<h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-white dark:group-hover:text-white">
															{game.name}
														</h3>
														<p className="text-sm text-slate-600 dark:text-slate-300">
															Problem: {problemLabel}
														</p>
														{difficulty && (
															<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
																Difficulty: {difficulty}
															</p>
														)}
													</div>
													<Badge
														className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm ${statusBadgeClass(game.status)}`}
													>
														{game.status}
													</Badge>
												</div>
												<dl className="relative grid gap-2 text-sm text-slate-600 dark:text-slate-300">
													<div className="flex items-center justify-between">
														<dt className="font-medium text-slate-700 dark:text-white">
															Spectators
														</dt>
														<dd>{game.presenceCount}</dd>
													</div>
													{game.readyCount > 0 && (
														<div className="flex items-center justify-between">
															<dt className="font-medium text-slate-700 dark:text-white">
																Players ready
															</dt>
															<dd>{game.readyCount}</dd>
														</div>
													)}
													<div className="flex items-center justify-between">
														<dt className="font-medium text-slate-700 dark:text-white">
								Start
														</dt>
														<dd>
															{new Date(game.createdAt).toLocaleTimeString()}
														</dd>
													</div>
												</dl>
												<div className="relative flex items-center justify-between">
													<span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 transition-colors group-hover:text-amber-500 dark:text-amber-200">
														Enter match
														<FiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
													</span>
												</div>
											</Link>
										</li>
									);
								})}
							</ul>
						)}
						<p className="self-center text-xs text-slate-500 dark:text-slate-400">
							Need a lobby instead? Visit{" "}
							<Link
								href="/lobbies"
								className="font-semibold text-amber-600 underline-offset-4 transition hover:underline dark:text-amber-200"
							>
								/lobbies
							</Link>
							.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
