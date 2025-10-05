import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Provider } from "@/components/ui/provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Code Royale",
	description: "LeetCode Battle Royale",
	icons: {
		icon: "/convex.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ConvexAuthNextjsServerProvider>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					<Provider>
						<ConvexClientProvider>
							<div className="min-h-screen">
								<div className="pointer-events-none fixed bottom-4 right-4 z-40">
									<ColorModeButton className="pointer-events-auto" />
								</div>
								{children}
							</div>
						</ConvexClientProvider>
					</Provider>
				</body>
			</html>
		</ConvexAuthNextjsServerProvider>
	);
}
