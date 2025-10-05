"use client";

import {
	Box,
	Button,
	Container,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FiArrowRight, FiClock, FiUsers, FiZap } from "react-icons/fi";
import { useColorModeValue } from "@/components/ui/color-mode";

export function HeroSection({ explorerId }: { explorerId: string }) {
	const subtext = useColorModeValue("gray.600", "gray.300");
	const pillBg = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");
	const pillText = useColorModeValue("purple.600", "purple.100");
	const featureBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
	const featureBorder = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");
	const featureColor = useColorModeValue("gray.700", "gray.200");
	const secondaryButtonColor = useColorModeValue("gray.800", "gray.100");
	const secondaryButtonHover = useColorModeValue("gray.900", "white");

	const features = [
		{
			icon: FiUsers,
			title: "Shared sessions",
			description: "Spin up multiplayer rooms in seconds with real-time sync.",
		},
		{
			icon: FiZap,
			title: "Smart curation",
			description: "Search across LeetCode or jump straight into featured picks.",
		},
		{
			icon: FiClock,
			title: "Time-boxed matches",
			description: "Keep the pace with lobby timers and built-in scoring tools.",
		},
	];

	return (
		<Container maxW="6xl" py={{ base: 10, md: 18 }} position="relative">
			<Box
				position="relative"
				display="flex"
				flexDirection="column"
				alignItems="center"
				gap={{ base: 6, md: 10 }}
				overflow="hidden"
				borderRadius="4xl"
				px={{ base: 6, md: 12 }}
				py={{ base: 10, md: 16 }}
				bgGradient={useColorModeValue(
					"linear(to-br, rgba(255,255,255,0.9), rgba(236, 201, 255, 0.55))",
					"linear(to-br, rgba(48, 25, 52, 0.8), rgba(76, 29, 149, 0.65))",
				)}
				boxShadow="2xl"
			>
				<Box
					position="absolute"
					inset={0}
					bgImage="radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 55%)"
					opacity={0.6}
					pointerEvents="none"
				/>
				<Stack gap={4} textAlign="center" alignItems="center" maxW="3xl" position="relative">
					<Text
						fontSize="xs"
						fontWeight="medium"
						bg={pillBg}
						color={pillText}
						px={4}
						py={1.5}
						borderRadius="full"
						letterSpacing="wide"
						textTransform="uppercase"
					>
						Collaborative coding sessions made effortless
					</Text>
					<Heading size={{ base: "2xl", md: "3xl" }} lineHeight="tight">
						Pick a problem, gather your squad, and battle in real time.
					</Heading>
					<Text fontSize={{ base: "sm", md: "md" }} color={subtext} maxW="2xl">
						Search the LeetCode problem set or start quickly with a curated spotlight.
						We spin up a shared lobby and keep everyone in sync from countdown to victory.
					</Text>
					<HStack gap={{ base: 3, md: 5 }} justify="center" flexWrap="wrap">
						<Button
							as={NextLink}
							href={`#${explorerId}`}
							size={{ base: "md", md: "lg" }}
							colorPalette="purple"
							bgGradient="linear(to-r, purple.500, pink.400)"
							color="white"
							rightIcon={<FiArrowRight />}
							shadow="lg"
							_hover={{ bgGradient: "linear(to-r, purple.600, pink.500)" }}
						>
							Start a quick lobby
						</Button>
						<Button
							as={NextLink}
							href="/lobby"
							variant="ghost"
							color={secondaryButtonColor}
							_hover={{ color: secondaryButtonHover, bg: "transparent" }}
						>
							View open lobbies
						</Button>
					</HStack>
				</Stack>
				<SimpleGrid
					columns={{ base: 1, md: 3 }}
					gap={{ base: 4, md: 6 }}
					w="full"
					pt={{ base: 2, md: 4 }}
					position="relative"
				>
					{features.map((feature) => (
						<Stack
							key={feature.title}
							gap={2.5}
							bg={featureBg}
							borderWidth="1px"
							borderColor={featureBorder}
							borderRadius="2xl"
							p={{ base: 4, md: 5 }}
							shadow="lg"
						>
							<Box
								w={10}
								h={10}
								display="flex"
								alignItems="center"
								justifyContent="center"
								borderRadius="xl"
								bgGradient="linear(to-br, purple.500, pink.400)"
								color="white"
							>
								<Icon as={feature.icon} boxSize={5} />
							</Box>
							<Text fontWeight="semibold" color={featureColor}>
								{feature.title}
							</Text>
							<Text fontSize="sm" color={subtext}>
								{feature.description}
							</Text>
						</Stack>
					))}
				</SimpleGrid>
			</Box>
		</Container>
	);
}
