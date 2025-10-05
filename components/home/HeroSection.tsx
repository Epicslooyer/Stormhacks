"use client";

import Link from "next/link";
import { FiArrowRight, FiClock, FiUsers, FiZap } from "react-icons/fi";
import { useColorModeValue } from "@/components/ui/color-mode";
import { Button } from "@/components/ui/button";

export function HeroSection({ explorerId }: { explorerId: string }) {
	const features = [
		{
			icon: FiUsers,
			title: "Shared sessions",
			description: "Spin up multiplayer rooms in seconds with real-time sync.",
		},
		{
			icon: FiZap,
			title: "Smart curation",
			description: "Search across LeetCode or jump straight into featured picks.",
		},
		{
			icon: FiClock,
			title: "Time-boxed matches",
			description: "Keep the pace with lobby timers and built-in scoring tools.",
		},
	];
	const heroGradient = useColorModeValue(
		"linear-gradient(to bottom right, rgba(255,255,255,0.94), rgba(198, 223, 255, 0.6))",
		"linear-gradient(to bottom right, rgba(10, 34, 82, 0.88), rgba(15, 58, 137, 0.7))",
	);

	return (
		<section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-18 lg:px-8">
			<div
				className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[2.5rem] px-6 py-10 shadow-2xl sm:gap-10 sm:px-10 sm:py-14 md:px-12 lg:px-16"
				style={{ backgroundImage: heroGradient }}
			>
				<div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(247, 211, 84, 0.35), transparent 60%)" }} />
				<div className="relative flex max-w-3xl flex-col items-center gap-4 text-center">
					<p className="inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#0d2f6f] dark:bg-white/15 dark:text-[#f8e7a3]">
						Collaborative coding sessions made effortless
					</p>
					<h2 className="text-3xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl">
						Pick a problem, gather your squad, and battle in real time.
					</h2>
					<p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
						Search the LeetCode problem set or start quickly with a curated spotlight. We spin up a shared lobby and keep everyone in sync from countdown to victory.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
						<Button
							asChild
							className="bg-gradient-to-r from-[#f7d354] via-[#f0b429] to-[#d98e2b] text-slate-900 shadow-lg hover:from-[#fbe08e] hover:via-[#f2c15a] hover:to-[#e0a040]"
							size="lg"
						>
							<Link href={`#${explorerId}`} className="inline-flex items-center gap-2">
								<span>Start a quick lobby</span>
								<FiArrowRight className="h-4 w-4" />
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							className="text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
						>
							<Link href="/lobby">View open lobbies</Link>
						</Button>
					</div>
				</div>
				<div className="relative mt-4 grid w-full grid-cols-1 gap-4 md:mt-6 md:grid-cols-3 md:gap-6">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="group relative flex flex-col gap-2.5 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/15 dark:bg-slate-900/70"
						>
							<div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f7d354] via-[#f0b429] to-[#d98e2b] text-slate-900">
								<feature.icon className="h-5 w-5" />
							</div>
							<h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
								{feature.title}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-300">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
