"use client";

export function HomeBackdrop() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
		>
			<div
				className="absolute inset-0"
				style={{ backgroundImage: "var(--home-backdrop-top)", filter: "blur(0px)" }}
			/>
			<div
				className="absolute inset-0"
				style={{ backgroundImage: "var(--home-backdrop-bottom)", filter: "blur(2px)" }}
			/>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: "var(--home-backdrop-center)",
					filter: "blur(0px)",
					opacity: "var(--home-backdrop-center-opacity)",
				}}
			/>
		</div>
	);
}
