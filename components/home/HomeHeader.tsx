"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Container, Flex, Heading, HStack, Link as ChakraLink } from "@chakra-ui/react";
import { useConvexAuth } from "convex/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@/components/ui/color-mode";

export function HomeHeader() {
	const headerBg = useColorModeValue("rgba(255, 255, 255, 0.92)", "rgba(17, 17, 25, 0.8)");
	const headerBorder = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
	const navColor = useColorModeValue("gray.600", "gray.300");
	const navHover = useColorModeValue("gray.900", "white");

	return (
		<Flex
			as="header"
			position="sticky"
			top={0}
			zIndex={10}
			bg={headerBg}
			backdropFilter="saturate(180%) blur(14px)"
			borderBottomWidth="1px"
			borderColor={headerBorder}
			boxShadow="sm"
		>
			<Container
				maxW="6xl"
				py={{ base: 3, md: 4 }}
				display="flex"
				alignItems="center"
				justifyContent="space-between"
				gap={6}
			>
					<Heading
						as={NextLink}
						href="/"
						size="md"
						fontWeight="semibold"
						letterSpacing="tight"
						bgGradient="linear(to-r, purple.500, pink.400)"
						bgClip="text"
					>
						Leet Royale
					</Heading>
					<HStack
						as="nav"
						aria-label="Primary"
						gap={{ base: 4, md: 6 }}
						display={{ base: "none", sm: "flex" }}
					>
						<ChakraLink
							as={NextLink}
							href="/problems"
							fontSize="sm"
							fontWeight="medium"
							color={navColor}
							_hover={{ color: navHover }}
						>
							Problems
						</ChakraLink>
						<ChakraLink
							as={NextLink}
							href="/lobby"
							fontSize="sm"
							fontWeight="medium"
							color={navColor}
							_hover={{ color: navHover }}
						>
							Lobbies
						</ChakraLink>
						<ChakraLink
							as={NextLink}
							href="/spectate"
							fontSize="sm"
							fontWeight="medium"
							color={navColor}
							_hover={{ color: navHover }}
						>
							Spectate
						</ChakraLink>
					</HStack>
				<SignOutButton />
			</Container>
		</Flex>
	);
}

function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	const router = useRouter();

	if (!isAuthenticated) return null;

	return (
		<Button
			size="sm"
			variant="subtle"
			colorPalette="purple"
			fontWeight="semibold"
			bgGradient="linear(to-r, purple.500, pink.400)"
			color="white"
			_hover={{ bgGradient: "linear(to-r, purple.600, pink.500)" }}
			onClick={() =>
				void signOut().then(() => {
					router.push("/signin");
				})
			}
		>
			Sign out
		</Button>
	);
}
