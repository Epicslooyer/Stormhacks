"use client";

import {
	Badge,
	Box,
	Button,
	DialogBackdrop,
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogPositioner,
	DialogRoot,
	Flex,
	Heading,
	HStack,
	Spinner,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useId, useMemo } from "react";
import { useProblemDetails } from "@/components/useProblemDetails";
import { useColorModeValue } from "@/components/ui/color-mode";
import type { ProblemOption } from "./types";
import {
	difficultyBadgePalette,
	sanitizeLeetCodeHtml,
} from "./problemUtils";

export function ProblemDetailModal({
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

	const helperColor = useColorModeValue("gray.600", "gray.400");
	const modalBodyText = useColorModeValue("gray.700", "gray.200");
	const tagBg = useColorModeValue("purple.50", "whiteAlpha.200");
	const tagColor = useColorModeValue("purple.700", "purple.200");
	const modalBg = useColorModeValue("white", "gray.900");

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
		data?.content ?? "<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);

	if (!problem) return null;

	return (
		<DialogRoot
			open={isOpen}
			onOpenChange={(details) => {
				if (!details.open) onClose();
			}}
		>
			<DialogBackdrop backdropFilter="blur(8px)" bg="blackAlpha.700" />
			<DialogPositioner px={4}>
				<DialogContent
					aria-labelledby={titleId}
					aria-describedby={contentId}
					maxW="3xl"
					w="full"
					maxH="85vh"
					borderRadius="2xl"
					bg={modalBg}
					shadow="2xl"
					p={{ base: 5, md: 6 }}
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
						<Stack gap={3}>
							<Stack gap={1}>
								<Heading id={titleId} size="lg" lineHeight="tight">
									{data?.title ?? problem.title}
								</Heading>
								<Text fontSize="sm" color={helperColor}>
									{problem.slug}
								</Text>
							</Stack>
							<HStack gap={2} flexWrap="wrap" fontSize="xs" color={helperColor}>
								<Badge
									variant="solid"
									colorPalette={difficultyBadgePalette(
										data?.difficulty ?? problem.difficulty,
									)}
									fontWeight="semibold"
									textTransform="uppercase"
									px={2.5}
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
						gap={4}
						color={modalBodyText}
						p={0}
					>
					{isPending && (
						<Flex align="center" gap={2} color={helperColor}>
								<Spinner size="sm" />
								<Text fontSize="sm">Loading problem details…</Text>
							</Flex>
						)}
						{isError && !isPending && (
							<Text fontSize="sm" color="red.500">
								Failed to load problem details: {modalError}
							</Text>
						)}
						{!isPending && !isError && (
							<Stack gap={4}>
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
					<DialogFooter
						display="flex"
						justifyContent="space-between"
						gap={3}
						p={0}
					>
					<Button
						as="a"
						href={`https://leetcode.com/problems/${problem.slug}/`}
						target="_blank"
						rel="noreferrer"
						variant="subtle"
						colorPalette="purple"
					>
							Open on LeetCode
						</Button>
						<Button onClick={onClose} colorPalette="gray" variant="subtle">
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
				"& > *:not(:last-child)": { marginBottom: 12 },
				"& h1, & h2, & h3": {
					fontWeight: "semibold",
					marginTop: 16,
				},
				"& ul, & ol": {
					paddingInlineStart: 20,
					marginBottom: 12,
				},
				"& pre": {
					padding: 12,
					borderRadius: 12,
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
