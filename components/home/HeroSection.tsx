"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
export function HeroSection() {
	const heroGradient = useColorModeValue(
		"linear-gradient(to bottom right, rgba(255,255,255,0.94), rgba(198, 223, 255, 0.6))",
		"linear-gradient(to bottom right, rgba(10, 34, 82, 0.88), rgba(15, 58, 137, 0.7))",
	);

	return (
		<section className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
			<div
				className="h-px w-full rounded-full"
				style={{ backgroundImage: heroGradient }}
			/>
		</section>
	);
}
