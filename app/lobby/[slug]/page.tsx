import LobbySession from "./session";

export default function LobbySlugPage({
	params,
}: {
	params: { slug: string };
}) {
	return <LobbySession slug={params.slug} />;
}
