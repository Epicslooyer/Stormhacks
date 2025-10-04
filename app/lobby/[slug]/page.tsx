import LobbySession from "./session";

export default async function LobbySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <LobbySession slug={slug} />;
}
