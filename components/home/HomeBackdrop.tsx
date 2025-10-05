"use client";

import { useColorModeValue } from "@/components/ui/color-mode";

export function HomeBackdrop() {
	const glowTop = useColorModeValue(
		"radial-gradient(650px at 5% 15%, rgba(128, 90, 213, 0.25), transparent 60%)",
		"radial-gradient(600px at 0% 10%, rgba(128, 90, 213, 0.35), transparent 65%)",
	);
	const glowBottom = useColorModeValue(
		"radial-gradient(750px at 80% 80%, rgba(236, 201, 255, 0.35), transparent 65%)",
		"radial-gradient(700px at 95% 85%, rgba(236, 201, 255, 0.32), transparent 70%)",
	);
	const glowCenter = useColorModeValue(
		"radial-gradient(500px at 50% 40%, rgba(129, 230, 217, 0.2), transparent 70%)",
		"radial-gradient(520px at 40% 50%, rgba(72, 187, 255, 0.18), transparent 72%)",
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
