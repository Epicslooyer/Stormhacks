"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { ProblemExplorer } from "@/components/home/ProblemExplorer";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { useId } from "react";

export default function HomePage() {
	const pageGradient = useColorModeValue(
		"linear-gradient(to bottom, rgba(237, 233, 254, 0.9), #ffffff)",
		"linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(76, 29, 149, 0.85))",
	);
	const explorerId = useId();

	return (
		<div
			className="relative flex min-h-screen flex-col overflow-hidden"
			style={{ backgroundImage: pageGradient }}
		>
			<HomeBackdrop />
			<HomeHeader />
			<main className="flex flex-1 flex-col gap-12 py-8 md:gap-20 md:py-16">
				<HeroSection explorerId={explorerId} />
				<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
					<ProblemExplorer sectionId={explorerId} />
				</div>
			</main>
		</div>
	);
}
