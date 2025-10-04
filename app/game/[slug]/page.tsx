import GameSession from "./session";

export default async function GameSlugPage({
	params,
}: {
	params: Promise<{ slug: string }> | { slug: string };
}) {
	const resolvedParams = await params;
	return <GameSession slug={resolvedParams.slug} />;
}
