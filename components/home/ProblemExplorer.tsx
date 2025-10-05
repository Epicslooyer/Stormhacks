"use client";

import {
	Badge,
	Box,
	Button,
	FieldHelperText,
	FieldLabel,
	FieldRoot,
	Flex,
	Heading,
	HStack,
	Icon,
	Input,
	SimpleGrid,
	Spinner,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { api } from "@/convex/_generated/api";
import type { ProblemOption } from "./types";
import {
	difficultyBadgePalette,
	featuredProblems,
	normalizeProblem,
} from "./problemUtils";
import { ProblemDetailModal } from "./ProblemDetailModal";
import { FiArrowRight, FiBookOpen, FiSearch } from "react-icons/fi";

export function ProblemExplorer({ sectionId }: { sectionId: string }) {
	const router = useRouter();
	const getOrCreateGame = useMutation(api.games.getOrCreateGame);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ProblemOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingSlug, setPendingSlug] = useState<string | null>(null);
	const [previewProblem, setPreviewProblem] = useState<ProblemOption | null>(
		null,
	);
	const searchInputId = useId();

	const hasSearch = query.trim().length >= 2;
	const problems = useMemo(() => {
		return hasSearch ? results : featuredProblems;
	}, [hasSearch, results]);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < 2) {
			setResults([]);
			setError(null);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		void fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
			.then(async (response) => {
				if (!response.ok) throw new Error("Search failed");
				const data: { results: Array<Record<string, unknown>> } =
					await response.json();
				if (cancelled) return;
				const normalized = data.results.map(normalizeProblem);
				setResults(normalized);
			})
			.catch(() => {
				if (!cancelled) setError("Could not load search results");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [query]);

	const handleStart = async (problem: ProblemOption) => {
		if (pendingSlug) return;
		setPendingSlug(problem.slug);
		try {
			const slug = crypto.randomUUID().slice(0, 8);
			await getOrCreateGame({
				slug,
				name: problem.title,
				problemSlug: problem.slug,
				problemTitle: problem.title,
				problemDifficulty: problem.difficulty,
			});
			router.push(`/lobby/${slug}`);
		} finally {
			setPendingSlug(null);
		}
	};

	const helperColor = useColorModeValue("gray.600", "gray.400");
	const titleColor = useColorModeValue("gray.900", "white");
	const surfaceBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(25, 25, 44, 0.8)");
	const surfaceBorder = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");
	const surfaceShadow = useColorModeValue(
		"0 32px 64px -40px rgba(76, 29, 149, 0.6)",
		"0 32px 64px -38px rgba(129, 140, 248, 0.4)",
	);
	const cardBg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(35, 35, 56, 0.85)");
	const cardBorder = useColorModeValue("rgba(213, 197, 255, 0.6)", "rgba(148, 163, 255, 0.28)");
	const cardHoverShadow = useColorModeValue(
		"0 18px 45px -26px rgba(112, 63, 247, 0.65)",
		"0 18px 45px -26px rgba(129, 140, 248, 0.55)",
	);
	const inputBg = useColorModeValue("white", "whiteAlpha.100");
	const inputFocusRing = useColorModeValue("purple.400", "purple.300");
	const badgeBg = useColorModeValue("purple.100", "whiteAlpha.200");
	const badgeColor = useColorModeValue("purple.700", "purple.100");

	const resultLabel = hasSearch
		? `${problems.length} ${problems.length === 1 ? "match" : "matches"}`
		: `${featuredProblems.length} featured picks`;

	return (
		<Box
			id={sectionId}
			as="section"
			display="flex"
			flexDirection="column"
			gap={{ base: 8, md: 10 }}
		>
			<Stack
				position="relative"
				gap={{ base: 6, md: 8 }}
				bg={surfaceBg}
				borderRadius="3xl"
				borderWidth="1px"
				borderColor={surfaceBorder}
				boxShadow={surfaceShadow}
				p={{ base: 6, md: 10 }}
				overflow="hidden"
			>
				<Box
					position="absolute"
					inset={0}
					bgImage="radial-gradient(700px at 10% 20%, rgba(214, 188, 250, 0.45), transparent 60%)"
					opacity={0.45}
					pointerEvents="none"
				/>
				<Box
					position="absolute"
					top="-30%"
					right="-10%"
					w={{ base: "60%", md: "45%" }}
					h="120%"
					bgImage="radial-gradient(circle, rgba(129, 230, 217, 0.18), transparent 70%)"
					filter="blur(2px)"
					pointerEvents="none"
				/>
				<Stack gap={{ base: 3, md: 4 }} maxW="3xl" position="relative">
					<Badge
						alignSelf="flex-start"
						px={3}
						py={1}
						borderRadius="full"
						fontSize="xs"
						fontWeight="medium"
						bg={badgeBg}
						color={badgeColor}
						textTransform="uppercase"
						letterSpacing="wide"
					>
						Problem library
					</Badge>
					<Heading size={{ base: "lg", md: "xl" }} color={titleColor}>
						Choose your battleground
					</Heading>
					<Text fontSize={{ base: "sm", md: "md" }} color={helperColor} maxW="2xl">
						Search anything in the LeetCode dataset or jump into a curated set of crowd-pleasing problems.
						Preview details before you launch to keep teammates on the same page.
					</Text>
				</Stack>
				<Stack gap={4} position="relative">
					<FieldRoot id={searchInputId} gap={3}>
						<FieldLabel htmlFor={searchInputId} fontSize="sm" fontWeight="semibold">
							Search problems
						</FieldLabel>
						<Box position="relative">
							<Icon
								as={FiSearch}
								color={helperColor}
								boxSize={4}
								position="absolute"
								top="50%"
								left={4}
								transform="translateY(-50%)"
								pointerEvents="none"
							/>
							<Input
								id={searchInputId}
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Type at least two characters to search the LeetCode catalog"
								variant="filled"
								bg={inputBg}
								pl={12}
								shadow="sm"
								_focusVisible={{ ring: "2px", ringColor: inputFocusRing }}
							/>
						</Box>
						<FieldHelperText fontSize="xs" color={helperColor}>
							{hasSearch
								? "Showing search results from the LeetCode dataset."
								: "Need inspiration? Start with one of the featured problems below."}
						</FieldHelperText>
					</FieldRoot>
					<HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
						<Text fontSize="sm" color={helperColor}>
							{loading ? "Hang tight while we search…" : "Pick a problem to start a synchronized lobby."}
						</Text>
						<Badge px={3} py={1} borderRadius="full" bg={badgeBg} color={badgeColor} fontSize="xs">
							{resultLabel}
						</Badge>
					</HStack>
					{error && (
						<Text fontSize="xs" color="red.500">
							{error}
						</Text>
					)}
				</Stack>
			</Stack>
			<Stack gap={5}>
				{loading && (
					<HStack gap={2} color={helperColor}>
						<Spinner size="sm" />
						<Text fontSize="sm">Searching…</Text>
					</HStack>
				)}
				{!loading && hasSearch && problems.length === 0 && (
					<Text fontSize="sm" color={helperColor}>
						No problems match that query.
					</Text>
				)}
				<SimpleGrid
					as="ul"
					columns={{ base: 1, sm: 2 }}
					gap={{ base: 5, md: 6 }}
					listStyleType="none"
					m={0}
					p={0}
				>
					{problems.map((problem) => (
						<ProblemCard
							key={`${problem.slug}-${problem.id}`}
							problem={problem}
							helperColor={helperColor}
							cardBg={cardBg}
							cardBorder={cardBorder}
							cardHoverShadow={cardHoverShadow}
							onPreview={() => setPreviewProblem(problem)}
							onStart={() => handleStart(problem)}
							isLoading={pendingSlug === problem.slug}
							isDisabled={
								pendingSlug !== null && pendingSlug !== problem.slug
							}
						/>
					))}
				</SimpleGrid>
			</Stack>
			<ProblemDetailModal
				isOpen={previewProblem !== null}
				problem={previewProblem}
				onClose={() => setPreviewProblem(null)}
			/>
		</Box>
	);
}

function ProblemCard({
	problem,
	helperColor,
	cardBg,
	cardBorder,
	cardHoverShadow,
	onPreview,
	onStart,
	isLoading,
	isDisabled,
}: {
	problem: ProblemOption;
	helperColor: string;
	cardBg: string;
	cardBorder: string;
	cardHoverShadow: string;
	onPreview: () => void;
	onStart: () => void;
	isLoading: boolean;
	isDisabled: boolean;
}) {
	return (
		<Box
			as="li"
			display="flex"
			flexDirection="column"
			gap={4}
			p={{ base: 5, md: 6 }}
			borderWidth="1px"
			borderColor={cardBorder}
			bg={cardBg}
			borderRadius="2xl"
			position="relative"
			shadow="md"
			overflow="hidden"
			transition="all 0.25s ease"
			_hover={{ transform: "translateY(-6px)", boxShadow: cardHoverShadow }}
		>
			<Box
				position="absolute"
				top="-40%"
				right="-20%"
				w="60%"
				h="90%"
				bgGradient="linear(to-br, rgba(128, 90, 213, 0.25), transparent)"
				pointerEvents="none"
				filter="blur(6px)"
			/>
			<Flex align="flex-start" justify="space-between" gap={3} position="relative">
				<Stack gap={2}>
					<Text fontWeight="semibold" fontSize="md" lineHeight="short">
						{problem.title}
					</Text>
					<Text fontSize="xs" color={helperColor}>
						Slug: {problem.slug}
					</Text>
				</Stack>
				<Badge
					variant="solid"
					colorPalette={difficultyBadgePalette(problem.difficulty)}
					fontSize="xs"
					fontWeight="semibold"
					textTransform="uppercase"
					px={2.5}
					py={1}
					borderRadius="md"
				>
					{problem.difficulty}
				</Badge>
			</Flex>
			<Flex align="center" justify="space-between" flexWrap="wrap" gap={3} position="relative">
				<Button
					variant="ghost"
					size="sm"
					colorPalette="purple"
					onClick={onPreview}
					leftIcon={<Icon as={FiBookOpen} />}
					title="Preview description and stats"
				>
					Preview
				</Button>
				<Button
					size="sm"
					colorPalette="purple"
					bgGradient="linear(to-r, purple.500, pink.400)"
					color="white"
					_hover={{ bgGradient: "linear(to-r, purple.600, pink.500)" }}
					onClick={onStart}
					loading={isLoading}
					disabled={isDisabled}
					rightIcon={<Icon as={FiArrowRight} />}
				>
					Start lobby
				</Button>
			</Flex>
		</Box>
	);
}
