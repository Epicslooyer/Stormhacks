"use client";

import { useColorModeValue } from "@/components/ui/color-mode";

export function HomeBackdrop() {
	const glowTop = useColorModeValue(
		"radial-gradient(650px at 5% 15%, rgba(59, 130, 246, 0.25), transparent 60%)",
		"radial-gradient(600px at 0% 10%, rgba(37, 99, 235, 0.35), transparent 65%)",
	);
	const glowBottom = useColorModeValue(
		"radial-gradient(750px at 80% 80%, rgba(96, 165, 250, 0.32), transparent 65%)",
		"radial-gradient(700px at 95% 85%, rgba(56, 189, 248, 0.28), transparent 70%)",
	);
	const glowCenter = useColorModeValue(
		"radial-gradient(500px at 50% 40%, rgba(255, 198, 92, 0.22), transparent 70%)",
		"radial-gradient(520px at 40% 50%, rgba(56, 189, 248, 0.2), transparent 72%)",
	);

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
		>
			<div className="absolute inset-0" style={{ backgroundImage: glowTop, filter: "blur(0px)" }} />
			<div className="absolute inset-0" style={{ backgroundImage: glowBottom, filter: "blur(2px)" }} />
			<div className="absolute inset-0" style={{ backgroundImage: glowCenter, filter: "blur(0px)", opacity: 0.9 }} />
		</div>
	);
}
