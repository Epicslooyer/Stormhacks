"use client";

export function HeroSection() {
	return (
		<section className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
			<div
				className="h-px w-full rounded-full"
				style={{ backgroundImage: "var(--home-hero-gradient)" }}
			/>
		</section>
	);
}
