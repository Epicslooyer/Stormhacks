import GameSession from "./session";

export default async function GameSlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <GameSession slug={slug} />;
}
