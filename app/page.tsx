"use client";

import { HomeHeader } from "@/components/home/HomeHeader";
import { ProblemExplorer } from "@/components/home/ProblemExplorer";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { useId } from "react";

export default function HomePage() {
	const explorerId = useId();

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
					<ProblemExplorer sectionId={explorerId} />
				</div>
			</main>
		</div>
	);
}
