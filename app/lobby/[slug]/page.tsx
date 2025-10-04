import LobbySession from "./session";

export default async function LobbySlugPage({
	params,
}: {
	params: Promise<{ slug: string }> | { slug: string };
}) {
	const resolvedParams = await params;
	return <LobbySession slug={resolvedParams.slug} />;
}
