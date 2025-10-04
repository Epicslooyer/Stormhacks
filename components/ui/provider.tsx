"use client";

import { system } from "@/components/ui/theme";
import {
	ColorModeProvider,
	type ColorModeProviderProps,
} from "@/components/ui/color-mode";
import { ChakraProvider } from "@chakra-ui/react";

export function Provider(props: ColorModeProviderProps) {
	return (
		<ChakraProvider value={system}>
			<ColorModeProvider {...props} />
		</ChakraProvider>
	);
}
