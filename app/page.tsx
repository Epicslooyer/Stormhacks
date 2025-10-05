"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ProblemExplorer } from "@/components/home/ProblemExplorer";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { useId } from "react";

export default function HomePage() {
	const pageBackground = useColorModeValue(
		[
			"radial-gradient(900px at 85% 0%, rgba(249, 211, 99, 0.35), transparent 60%)",
			"radial-gradient(700px at 15% 95%, rgba(59, 130, 246, 0.25), transparent 65%)",
			"linear-gradient(to bottom, rgba(226, 238, 255, 0.92), #ffffff)",
		].join(", "),
		[
			"radial-gradient(820px at 85% 0%, rgba(250, 198, 70, 0.3), transparent 58%)",
			"radial-gradient(640px at 18% 85%, rgba(37, 99, 235, 0.22), transparent 65%)",
			"linear-gradient(to bottom, rgba(10, 27, 70, 0.95), rgba(6, 21, 58, 0.9))",
		].join(", "),
	);
	const pageBackgroundColor = useColorModeValue("#0a2d76", "#040f2f");
	const explorerId = useId();

	return (
		<div
			className="relative flex min-h-screen flex-col overflow-hidden"
			style={{ backgroundImage: pageBackground, backgroundColor: pageBackgroundColor }}
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
