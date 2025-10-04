"use client";

import {
	Badge,
	Box,
	Button,
	Flex,
	Heading,
	HStack,
	Link,
	NativeSelect,
	Stack,
	Text,
	VStack,
	Wrap,
	WrapItem,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import type { ChangeEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useGameConnection } from "@/components/useGameConnection";
import { useProblemDetails } from "@/components/useProblemDetails";
import { useColorModeValue } from "@/components/ui/color-mode";
import type { CodeSnippet } from "leetcode-query";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
});

type TopicTag = {
	name?: string | null;
	slug?: string | null;
};

export default function GameSession({ slug }: { slug: string }) {
	const {
		game,
		clientId,
		presenceCount,
		slug: resolvedSlug,
		countdownMs,
	} = useGameConnection(slug, "/game");
	const [copied, setCopied] = useState(false);
	const countdownSeconds =
		countdownMs === null ? null : Math.ceil(countdownMs / 1000);
	const problemSlug = game?.problemSlug ?? null;
	const {
		data: problem,
		isPending: problemPending,
		isError: problemError,
		error: problemErrorObject,
	} = useProblemDetails(problemSlug);
	const [output, setOutput] = useState<string>(
		"Run results will appear here.",
	);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const userEditedRef = useRef(false);
	const languageSelectId = useId();

	useEffect(() => {
		if (problemSlug === undefined) return;
		userEditedRef.current = false;
		setCode("");
		setSelectedLanguage(null);
	}, [problemSlug]);

	const codeSnippets = useMemo(() => {
		if (!problem || !Array.isArray(problem.codeSnippets)) return [];
		return problem.codeSnippets.filter((snippet): snippet is CodeSnippet => {
			if (!snippet || typeof snippet !== "object") return false;
			return (
				typeof snippet.lang === "string" &&
				typeof snippet.langSlug === "string" &&
				typeof snippet.code === "string"
			);
		});
	}, [problem]);

	useEffect(() => {
		if (codeSnippets.length === 0) {
			setSelectedLanguage(null);
			return;
		}
		const preferred =
			codeSnippets.find((snippet) => snippet.langSlug === "typescript") ??
			codeSnippets.find((snippet) => snippet.langSlug === "javascript") ??
			codeSnippets[0];
		setSelectedLanguage((current) => current ?? preferred.langSlug ?? null);
		if (!userEditedRef.current && preferred.code) {
			setCode(preferred.code);
		}
	}, [codeSnippets]);

	useEffect(() => {
		if (!selectedLanguage) return;
		const snippet = codeSnippets.find(
			(item) => item.langSlug === selectedLanguage,
		);
		if (!snippet) return;
		if (!userEditedRef.current && snippet.code) {
			setCode(snippet.code);
		}
	}, [codeSnippets, selectedLanguage]);

	const handleEditorChange = (value?: string) => {
		userEditedRef.current = true;
		setCode(value ?? "");
	};

	const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
		userEditedRef.current = false;
		setSelectedLanguage(event.target.value);
	};

	const handleRun = () => {
		setOutput(
			"Code execution is not available in this preview environment. Coordinate with your team to verify solutions.",
		);
	};

	const handleSubmit = () => {
		setOutput(
			"Submission is not yet implemented. Share your final answer with the host when ready.",
		);
	};

	const parsedStats = useMemo(() => {
		if (!problem?.stats) return null;
		try {
			return JSON.parse(problem.stats) as Record<string, unknown>;
		} catch (_error) {
			return null;
		}
	}, [problem?.stats]);

	const acceptance =
		typeof parsedStats?.acRate === "string" ? parsedStats.acRate : null;
	const totalAccepted =
		typeof parsedStats?.totalAccepted === "number"
			? parsedStats.totalAccepted
			: null;
	const totalSubmission =
		typeof parsedStats?.totalSubmission === "number"
			? parsedStats.totalSubmission
			: null;
	const topicTags: TopicTag[] = Array.isArray(problem?.topicTags)
		? (problem.topicTags as TopicTag[])
		: [];
	const contentHtml =
		problem?.content ??
		"<p>This problem does not include a published description.</p>";
	const sanitizedContent = useMemo(
		() => sanitizeLeetCodeHtml(contentHtml),
		[contentHtml],
	);
	const sampleTestCase =
		typeof problem?.sampleTestCase === "string"
			? problem.sampleTestCase.trim()
			: null;
	const exampleTestcases =
		typeof problem?.exampleTestcases === "string"
			? problem.exampleTestcases.trim()
			: null;

	const difficultyLabel = problem?.difficulty ?? game?.problemDifficulty ?? "";
	const problemTitle =
		problem?.title ?? game?.problemTitle ?? game?.name ?? resolvedSlug;
	const problemErrorMessage =
		problemErrorObject instanceof Error
			? problemErrorObject.message
			: "Failed to load problem details";

	const appBg = useColorModeValue("gray.50", "gray.950");
	const headerBg = useColorModeValue("white", "gray.900");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const surfaceBg = useColorModeValue("white", "gray.900");
	const mutedText = useColorModeValue("gray.600", "gray.400");
	const chipBg = useColorModeValue("gray.100", "gray.800");
	const outputBg = useColorModeValue("gray.100", "gray.800");

	return (
		<Flex direction="column" minH="100vh" bg={appBg}>
			<Box
				as="header"
				borderBottomWidth="1px"
				borderColor={borderColor}
				bg={headerBg}
				px={{ base: 4, md: 8 }}
				py={4}
			>
				<Flex
					direction={{ base: "column", md: "row" }}
					gap={4}
					justify="space-between"
					align={{ base: "flex-start", md: "center" }}
				>
				<Stack gap={2} align="flex-start">
						<Heading size="lg">{game?.name ?? `Game ${resolvedSlug}`}</Heading>
						<Text fontSize="sm" color={mutedText}>
							Status: {game?.status ?? "creating"}
						</Text>
					<HStack gap={3} wrap="wrap">
							<Text fontSize="sm" color={mutedText}>
								Problem: <Text as="span" color="inherit">{problemTitle}</Text>
							</Text>
							{difficultyLabel && (
								<Badge
									colorScheme={difficultyColorScheme(difficultyLabel)}
									variant="subtle"
									fontSize="0.65rem"
									textTransform="uppercase"
									px={2}
									py={1}
								>
									{difficultyLabel}
								</Badge>
							)}
						</HStack>
					</Stack>
				<Stack gap={2} align="flex-end">
					<HStack gap={3} fontSize="sm" color={mutedText}>
							<Text fontWeight="semibold" color="blue.500">
								Live participants: {presenceCount}
							</Text>
							<Text>You are connected as {clientId.slice(0, 8)}</Text>
						</HStack>
						{game?.status === "countdown" && countdownSeconds !== null && (
							<Text fontWeight="semibold">
								Game starting in {countdownSeconds}s
							</Text>
						)}
						{game?.status === "lobby" && (
							<Text fontSize="sm" color={mutedText}>
								Waiting for the host to begin the game…
							</Text>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={async () => {
								if (typeof window === "undefined") return;
								const shareUrl = `${window.location.origin}/game/${resolvedSlug}`;
								try {
									await navigator.clipboard.writeText(shareUrl);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								} catch (error) {
									console.error("Failed to copy game link", error);
								}
							}}
						>
							{copied ? "Copied!" : "Share game link"}
						</Button>
					</Stack>
				</Flex>
			</Box>
			<Flex
				flex="1"
				direction={{ base: "column", lg: "row" }}
				gap={{ base: 6, xl: 8 }}
				px={{ base: 4, md: 8 }}
				py={{ base: 6, md: 8 }}
			>
				<Box
					borderWidth="1px"
					borderColor={borderColor}
					bg={surfaceBg}
					rounded="lg"
					overflow="hidden"
					maxH={{ base: "auto", lg: "calc(100vh - 200px)" }}
					flex={{ base: "none", lg: "0 0 38%" }}
					display="flex"
					flexDirection="column"
				>
					<Flex
						align="center"
						justify="space-between"
						px={4}
						py={3}
						borderBottomWidth="1px"
						borderColor={borderColor}
					>
						<Text fontSize="sm" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
							Description
						</Text>
						{problemSlug && (
						<Link
							href={`https://leetcode.com/problems/${problemSlug}/`}
							target="_blank"
							rel="noreferrer"
							fontSize="xs"
							textDecoration="underline"
						>
								View on LeetCode
							</Link>
						)}
					</Flex>
					<Box flex="1" overflowY="auto" px={4} py={4} fontSize="sm">
						{problemSlug === null && (
							<Text color={mutedText}>
								This lobby is not linked to a LeetCode problem yet.
							</Text>
						)}
						{problemSlug !== null && problemPending && (
							<Text color={mutedText}>Loading problem details…</Text>
						)}
						{problemSlug !== null && problemError && !problemPending && (
							<Text color="red.400">
								Failed to load problem details: {problemErrorMessage}
							</Text>
						)}
						{problemSlug !== null && !problemPending && !problemError && (
							<VStack align="stretch" gap={4}>
							<HStack gap={3} wrap="wrap" fontSize="xs" color={mutedText}>
									{acceptance && <Text>Acceptance: {acceptance}</Text>}
									{typeof problem?.likes === "number" && <Text>Likes: {problem.likes}</Text>}
									{typeof problem?.dislikes === "number" && <Text>Dislikes: {problem.dislikes}</Text>}
									{totalAccepted !== null && (
										<Text>Accepted: {totalAccepted.toLocaleString()}</Text>
									)}
									{totalSubmission !== null && (
										<Text>Submissions: {totalSubmission.toLocaleString()}</Text>
									)}
								</HStack>
								{topicTags.length > 0 && (
								<Wrap gap={2}>
										{topicTags.map((tag, index) => (
											<WrapItem key={`${tag.slug ?? tag.name ?? "tag"}-${index}`}>
												<Box
													bg={chipBg}
													px={2}
													py={1}
													rounded="full"
													fontSize="xs"
												>
													{tag.name ?? tag.slug ?? "Unknown tag"}
												</Box>
											</WrapItem>
										))}
									</Wrap>
								)}
							<Box
								css={{
										"& h1, & h2, & h3, & h4": {
											fontWeight: "semibold",
											mt: 4,
											mb: 2,
										},
										"& p": { mb: 3, lineHeight: 1.7 },
										"& ul, & ol": { pl: 4, mb: 3 },
										"& li": { mb: 1.5 },
								}}
									// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized LeetCode markup
									dangerouslySetInnerHTML={{ __html: sanitizedContent }}
								/>
								{(sampleTestCase || exampleTestcases) && (
									<Box>
										<Text
											fontSize="xs"
											fontWeight="semibold"
											textTransform="uppercase"
											letterSpacing="wide"
											mb={2}
											color={mutedText}
										>
											Sample Testcases
										</Text>
										<Box
											bg={chipBg}
											rounded="md"
											px={3}
											py={2}
											fontSize="xs"
											fontFamily="mono"
											whiteSpace="pre-wrap"
										>
											{sampleTestCase ?? exampleTestcases}
										</Box>
									</Box>
								)}
							</VStack>
						)}
					</Box>
				</Box>
				<Flex
					flex="1"
					direction="column"
					borderWidth="1px"
					borderColor={borderColor}
					bg={surfaceBg}
					rounded="lg"
					overflow="hidden"
					minH={{ base: "520px", lg: "auto" }}
				>
					<Flex
						align={{ base: "flex-start", sm: "center" }}
						justify="space-between"
						gap={4}
						px={4}
						py={3}
						borderBottomWidth="1px"
						borderColor={borderColor}
						flexWrap="wrap"
					>
						<Stack gap={1} minW="200px">
							<Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
								Language
							</Text>
							<NativeSelect.Root
								size="sm"
								disabled={codeSnippets.length === 0}
							>
								<NativeSelect.Field
									id={languageSelectId}
									value={selectedLanguage ?? ""}
									onChange={handleLanguageChange}
								>
									{codeSnippets.length === 0 && (
										<option value="">No snippets available</option>
									)}
									{codeSnippets.map((snippet) => (
										<option
											key={`${snippet.langSlug ?? snippet.lang ?? "language"}`}
											value={snippet.langSlug ?? ""}
										>
											{snippet.lang ?? snippet.langSlug ?? "Language"}
										</option>
									))}
								</NativeSelect.Field>
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</Stack>
						<HStack gap={3}>
							<Button variant="outline" size="sm" onClick={handleRun}>
								Run
							</Button>
							<Button colorScheme="blue" size="sm" onClick={handleSubmit}>
								Submit
							</Button>
						</HStack>
					</Flex>
					<Box flex="1" minH={{ base: "320px", md: "440px" }}>
						<MonacoEditor
							height="100%"
							language={mapLangSlugToMonaco(selectedLanguage)}
							value={code}
							onChange={handleEditorChange}
							options={{
								automaticLayout: true,
								fontSize: 14,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
						}}
							theme="vs-dark"
							loading={
								<Box p={4} fontSize="sm" color={mutedText}>
									Editor loading…
								</Box>
							}
						/>
					</Box>
					<Box borderTopWidth="1px" borderColor={borderColor} bg={surfaceBg} px={4} py={3}>
						<Text
							fontSize="xs"
							fontWeight="semibold"
							textTransform="uppercase"
							letterSpacing="wide"
							color={mutedText}
						>
							Output
						</Text>
						<Box
							mt={2}
							height={28}
							overflowY="auto"
							bg={outputBg}
							px={3}
							py={2}
							rounded="md"
							fontSize="xs"
							fontFamily="mono"
							whiteSpace="pre-wrap"
						>
							{output}
						</Box>
					</Box>
				</Flex>
			</Flex>
		</Flex>
	);
}

function difficultyColorScheme(difficulty: string) {
	switch (difficulty) {
		case "Easy":
			return "green";
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

function mapLangSlugToMonaco(langSlug: string | null) {
	switch (langSlug) {
		case "typescript":
			return "typescript";
		case "javascript":
			return "javascript";
		case "python":
		case "python3":
			return "python";
		case "cpp":
			return "cpp";
		case "c":
			return "c";
		case "java":
			return "java";
		case "csharp":
		case "c#":
			return "csharp";
		case "golang":
		case "go":
			return "go";
		case "swift":
			return "swift";
		case "rust":
			return "rust";
		case "kotlin":
			return "kotlin";
		default:
			return "javascript";
	}
}
