"use client";

import { Box, Container, Flex } from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { ProblemExplorer } from "@/components/home/ProblemExplorer";
import { HomeBackdrop } from "@/components/home/HomeBackdrop";
import { useId } from "react";

export default function HomePage() {
	const pageGradient = useColorModeValue(
		"linear(to-b, purple.50, white)",
		"linear(to-b, gray.900, purple.900)",
	);
	const explorerId = useId();

	return (
		<Flex
			direction="column"
			minH="100dvh"
			position="relative"
			overflow="hidden"
			bgGradient={pageGradient}
		>
			<HomeBackdrop />
			<HomeHeader />
			<Box
				as="main"
				flex="1"
				py={{ base: 8, md: 16 }}
				display="flex"
				flexDirection="column"
				gap={{ base: 12, md: 20 }}
			>
				<HeroSection explorerId={explorerId} />
				<Container maxW="6xl">
					<ProblemExplorer sectionId={explorerId} />
				</Container>
			</Box>
		</Flex>
	);
}
