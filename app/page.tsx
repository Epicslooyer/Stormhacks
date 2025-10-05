"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
	Badge,
	Box,
	Button,
	Container,
	DialogBackdrop,
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogPositioner,
	DialogRoot,
	FieldHelperText,
	FieldLabel,
	FieldRoot,
	Flex,
	Heading,
	HStack,
	Input,
	Link as ChakraLink,
	SimpleGrid,
	Spinner,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useConvexAuth, useMutation } from "convex/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useProblemDetails } from "@/components/useProblemDetails";
import { api } from "@/convex/_generated/api";
import { useColorModeValue } from "@/components/ui/color-mode";

type ProblemOption = {
	id: string;
	title: string;
	slug: string;
	difficulty: string;
};

const featuredProblems: ProblemOption[] = [
	{ id: "1", slug: "two-sum", title: "Two Sum", difficulty: "Easy" },
	{
		id: "2",
		slug: "valid-parentheses",
		title: "Valid Parentheses",
		difficulty: "Easy",
	},
	{
		id: "3",
		slug: "merge-intervals",
		title: "Merge Intervals",
		difficulty: "Medium",
	},
	{ id: "4", slug: "word-ladder", title: "Word Ladder", difficulty: "Hard" },
	{
		id: "5",
		slug: "longest-substring-without-repeating-characters",
		title: "Longest Substring Without Repeating Characters",
		difficulty: "Medium",
	},
];

export default function Home() {
	const headerBg = useColorModeValue("white", "gray.900");
	const headerBorder = useColorModeValue("gray.200", "gray.700");
	const secondaryText = useColorModeValue("gray.600", "gray.400");

	return (
		<Flex direction="column" minH="100dvh">
			<Box
				as="header"
				position="sticky"
				top={0}
				zIndex={10}
				bg={headerBg}
				borderBottomWidth="1px"
				borderColor={headerBorder}
			>
				<Container
					maxW="6xl"
					py={4}
					display="flex"
					alignItems="center"
					justifyContent="space-between"
				>
					<ChakraLink
						as={NextLink}
						href="/"
						fontWeight="semibold"
						fontSize="lg"
					>
						Leet Royale
					</ChakraLink>
					<SignOutButton />
				</Container>
			</Box>
			<Container
				as="main"
				maxW="4xl"
				py={{ base: 10, md: 16 }}
				display="flex"
				flexDirection="column"
				gap={10}
			>
				<Stack gap={3} textAlign="center" alignItems="center">
					<Heading size="2xl">Pick a problem to battle on</Heading>
					<Text fontSize="sm" maxW="2xl" color={secondaryText}>
						Search the LeetCode problem set or start quickly with a featured pick.
						We will spin up a shared lobby and keep everyone synced once you start.
					</Text>
					<HStack gap={4} justify="center">
						<ChakraLink
							as={NextLink}
							href="/problems"
							fontSize="sm"
							textDecoration="underline"
							_hover={{ textDecoration: "none" }}
						>
							Browse all problems
						</ChakraLink>
						<ChakraLink
							as={NextLink}
							href="/lobby"
							fontSize="sm"
							textDecoration="underline"
							_hover={{ textDecoration: "none" }}
						>
							View open lobbies
						</ChakraLink>
					</HStack>
				</Stack>
				<ProblemPicker />
			</Container>
		</Flex>
	);
}

function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	const router = useRouter();
	return isAuthenticated ? (
		<Button
			size="sm"
			variant="subtle"
			colorPalette="gray"
			onClick={() =>
				void signOut().then(() => {
					router.push("/signin");
				})
			}
		>
			Sign out
		</Button>
	) : null;
}

function ProblemPicker() {
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
				if (!response.ok) {
					throw new Error("Search failed");
				}
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
	const cardBg = useColorModeValue("gray.50", "whiteAlpha.100");
	const cardBorder = useColorModeValue("gray.200", "gray.700");

	return (
		<Box display="flex" flexDirection="column" gap={6}>
			<Stack gap={2}>
				<FieldRoot id={searchInputId} gap={2}>
					<FieldLabel htmlFor={searchInputId} fontSize="sm" fontWeight="semibold">
						Search problems
					</FieldLabel>
					<Input
						id={searchInputId}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Type at least two characters to search the LeetCode catalog"
						size="md"
						autoComplete="off"
					/>
					<FieldHelperText fontSize="xs" color={helperColor}>
						{hasSearch
							? "Showing search results from the LeetCode dataset."
							: "Need inspiration? Start with one of the featured problems below."}
					</FieldHelperText>
				</FieldRoot>
				{error && (
					<Text fontSize="xs" color="red.500">
						{error}
					</Text>
				)}
			</Stack>
			<Stack gap={4}>
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
					gap={4}
					listStyleType="none"
					m={0}
					p={0}
				>
					{problems.map((problem) => (
						<Box
							as="li"
							key={`${problem.slug}-${problem.id}`}
							display="flex"
							flexDirection="column"
							gap={3}
							p={4}
							borderWidth="1px"
							borderColor={cardBorder}
							bg={cardBg}
							borderRadius="lg"
						>
							<Flex align="flex-start" justify="space-between" gap={3}>
						<Stack gap={1}>
									<Text fontWeight="semibold" fontSize="md" lineHeight="short">
										{problem.title}
									</Text>
									<Text fontSize="xs" color={helperColor}>
										Slug: {problem.slug}
									</Text>
								</Stack>
								<Badge
									variant="subtle"
									colorPalette={difficultyBadgePalette(problem.difficulty)}
									fontSize="xs"
									fontWeight="semibold"
									textTransform="uppercase"
									px={2}
									py={1}
									borderRadius="md"
								>
									{problem.difficulty}
								</Badge>
							</Flex>
							<Flex align="center" justify="space-between" gap={3}>
								<Button
									variant="plain"
									size="xs"
									colorPalette="gray"
									onClick={() => setPreviewProblem(problem)}
								>
									Preview details
								</Button>
								<Button
									size={{ base: "sm", sm: "md" }}
									colorPalette="gray"
									fontWeight="semibold"
									disabled={
									pendingSlug !== null && pendingSlug !== problem.slug
									}
									loading={pendingSlug === problem.slug}
									onClick={() => handleStart(problem)}
								>
									Start lobby
								</Button>
							</Flex>
						</Box>
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

function ProblemDetailModal({
	isOpen,
	problem,
	onClose,
}: {
	isOpen: boolean;
	problem: ProblemOption | null;
	onClose: () => void;
}) {
	const { data, isPending, isError, error } = useProblemDetails(problem?.slug);
	const titleId = useId();
	const contentId = useId();

	let parsedStats: Record<string, unknown> | null = null;
	if (data?.stats) {
		try {
			parsedStats = JSON.parse(data.stats);
		} catch (_error) {
			parsedStats = null;
		}
	}

	const acceptance =
		typeof parsedStats?.acRate === "string" ? parsedStats.acRate : null;
	const totalSubmissions =
		typeof parsedStats?.totalSubmission === "number"
			? parsedStats.totalSubmission
			: null;
	const totalAccepted =
		typeof parsedStats?.totalAccepted === "number"
			? parsedStats.totalAccepted
			: null;
	const modalError = error instanceof Error ? error.message : "Unknown error";
	const topicTags = data?.topicTags ?? [];
	const contentHtml =
		data?.content ??
		"<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);
	const helperColor = useColorModeValue("gray.600", "gray.400");
	const modalBodyText = useColorModeValue("gray.700", "gray.200");
	const tagBg = useColorModeValue("gray.100", "whiteAlpha.200");
	const tagColor = useColorModeValue("gray.700", "gray.200");
	const modalBg = useColorModeValue("white", "gray.900");

	if (!problem) {
		return null;
	}

	return (
		<DialogRoot
			open={isOpen}
			onOpenChange={(details) => {
				if (!details.open) {
					onClose();
				}
			}}
		>
			<DialogBackdrop backdropFilter="blur(6px)" bg="blackAlpha.600" />
			<DialogPositioner px={4}>
				<DialogContent
					aria-labelledby={titleId}
					aria-describedby={contentId}
					maxW="3xl"
					w="full"
					maxH="85vh"
					overflow="hidden"
					borderRadius="lg"
					bg={modalBg}
					shadow="xl"
					p={6}
					display="flex"
					flexDirection="column"
					gap={6}
				>
					<DialogCloseTrigger
						aria-label="Close problem details"
						position="absolute"
						top={4}
						right={4}
					/>
					<DialogHeader p={0}>
						<Stack gap={2}>
							<Heading id={titleId} size="lg">
								{data?.title ?? problem.title}
							</Heading>
							<Text fontSize="sm" color={helperColor}>
								{problem.slug}
							</Text>
						<HStack gap={2} flexWrap="wrap" fontSize="xs" color={helperColor}>
								<Badge
									variant="subtle"
									colorPalette={difficultyBadgePalette(
										data?.difficulty ?? problem.difficulty,
									)}
									fontWeight="semibold"
									textTransform="uppercase"
									px={2}
									py={1}
									borderRadius="md"
								>
									{data?.difficulty ?? problem.difficulty}
								</Badge>
								{acceptance && <Text>Acceptance: {acceptance}</Text>}
								{typeof data?.likes === "number" && <Text>Likes: {data.likes}</Text>}
								{typeof data?.dislikes === "number" && (
									<Text>Dislikes: {data.dislikes}</Text>
								)}
							</HStack>
						</Stack>
					</DialogHeader>
					<DialogBody
						id={contentId}
						display="flex"
						flexDirection="column"
						gap={3}
						color={modalBodyText}
						p={0}
					>
					{isPending && (
						<HStack gap={2} color={helperColor}>
								<Spinner size="sm" />
								<Text fontSize="sm">Loading problem details…</Text>
							</HStack>
						)}
						{isError && !isPending && (
							<Text fontSize="sm" color="red.500">
								Failed to load problem details: {modalError}
							</Text>
						)}
						{!isPending && !isError && (
							<Stack gap={3}>
								{topicTags.length > 0 && (
									<HStack gap={2} flexWrap="wrap">
										{topicTags.map((tag) => (
											<Badge
												key={String(tag?.slug ?? tag?.name)}
												bg={tagBg}
												color={tagColor}
												fontSize="xs"
												borderRadius="full"
											>
												{String(tag?.name ?? tag?.slug)}
											</Badge>
										))}
									</HStack>
								)}
								{(totalSubmissions !== null || totalAccepted !== null) && (
									<Text fontSize="xs" color={helperColor}>
										{totalAccepted !== null &&
											`Accepted: ${totalAccepted.toLocaleString()} · `}
										{totalSubmissions !== null &&
											`Submissions: ${totalSubmissions.toLocaleString()}`}
									</Text>
								)}
								<ModalContentBody sanitizedContent={sanitizedContent} />
							</Stack>
						)}
					</DialogBody>
					<DialogFooter display="flex" justifyContent="space-between" gap={3} p={0}>
						<ChakraLink
							href={`https://leetcode.com/problems/${problem.slug}/`}
							target="_blank"
							rel="noreferrer"
							fontSize="sm"
							textDecoration="underline"
							_hover={{ textDecoration: "none" }}
						>
							Open on LeetCode
						</ChakraLink>
						<Button onClick={onClose} colorPalette="gray">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPositioner>
		</DialogRoot>
	);
}

function ModalContentBody({ sanitizedContent }: { sanitizedContent: string }) {
	const codeBlockBg = useColorModeValue("gray.100", "gray.800");

	return (
		<Box
			fontSize="sm"
			lineHeight="tall"
			css={{
				"& > *:not(:last-child)": {
					marginBottom: 3,
				},
				"& h1, & h2, & h3": {
					fontWeight: "semibold",
					marginTop: 4,
				},
				"& ul, & ol": {
					paddingInlineStart: 4,
					marginBottom: 3,
				},
				"& pre": {
					padding: 3,
					borderRadius: "md",
					overflowX: "auto",
					bg: codeBlockBg,
				},
				"& code": {
					fontFamily: "mono",
				},
			}}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized LeetCode problem markup
			dangerouslySetInnerHTML={{ __html: sanitizedContent }}
		/>
	);
}

function normalizeProblem(problem: Record<string, unknown>): ProblemOption {
	const slug = String(problem.slug ?? "");
	const title = String(problem.title ?? problem.slug ?? "Untitled problem");
	const id = String(problem.frontend_id ?? problem.id ?? slug);
	const difficultyValue =
		typeof problem.difficulty === "number"
			? problem.difficulty
			: Number(problem.difficulty ?? 0);
	return {
		id,
		slug,
		title,
		difficulty: difficultyLabel(difficultyValue),
	};
}

function difficultyLabel(level: number) {
	switch (level) {
		case 1:
			return "Easy";
		case 2:
			return "Medium";
		case 3:
			return "Hard";
		default:
			return "Unknown";
	}
}

function difficultyBadgePalette(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "teal";
		case "Medium":
			return "orange";
		case "Hard":
			return "red";
		default:
			return "gray";
	}
}

function sanitizeLeetCodeHtml(html: string) {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/on[a-z]+="[^"]*"/gi, "")
		.replace(/on[a-z]+='[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}
