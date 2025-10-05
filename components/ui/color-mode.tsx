"use client"

import * as React from "react"
import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { LuMoon, LuSun } from "react-icons/lu"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			{...props}
		/>
	)
}

export type ColorMode = "light" | "dark"

export interface UseColorModeReturn {
	colorMode: ColorMode
	setColorMode: (colorMode: ColorMode) => void
	toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
	const { resolvedTheme, setTheme, forcedTheme } = useTheme()
	const colorMode = forcedTheme || resolvedTheme || "light"
	const toggleColorMode = () => {
		setTheme(colorMode === "dark" ? "light" : "dark")
	}
	return {
		colorMode: colorMode as ColorMode,
		setColorMode: setTheme,
		toggleColorMode,
	}
}

export function useColorModeValue<T>(light: T, dark: T) {
	const { colorMode } = useColorMode()
	return colorMode === "dark" ? dark : light
}

export function ColorModeIcon({ className }: { className?: string }) {
	const { colorMode } = useColorMode()
	const Icon = colorMode === "dark" ? LuMoon : LuSun
	return <Icon className={className} />
}

type ColorModeButtonProps = React.ComponentProps<typeof Button>

export const ColorModeButton = React.forwardRef<HTMLButtonElement, ColorModeButtonProps>(
	function ColorModeButton({ className, ...props }, ref) {
		const { toggleColorMode } = useColorMode()
		const [mounted, setMounted] = React.useState(false)

		React.useEffect(() => {
			setMounted(true)
		}, [])

		if (!mounted) {
			return <Skeleton className="h-9 w-9 rounded-md" />
		}

		return (
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label="Toggle color mode"
				onClick={toggleColorMode}
				ref={ref}
				className={className}
				{...props}
			>
				<ColorModeIcon className="size-5" />
			</Button>
		)
	}
)

export const LightMode = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
	function LightMode({ className, ...props }, ref) {
		return <span ref={ref} className={cn("inline dark:hidden", className)} {...props} />
	},
)

export const DarkMode = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
	function DarkMode({ className, ...props }, ref) {
		return <span ref={ref} className={cn("hidden dark:inline", className)} {...props} />
	},
)
