"use client";

import {
	ColorModeProvider,
	type ColorModeProviderProps,
} from "@/components/ui/color-mode";

export function Provider(props: ColorModeProviderProps) {
	return (
		<ColorModeProvider {...props} />
	);
}
