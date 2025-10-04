import GameSession from "./session";

export default function GameSlugPage({
	params,
}: {
	params: { slug: string };
}) {
	return <GameSession slug={params.slug} />;
}
