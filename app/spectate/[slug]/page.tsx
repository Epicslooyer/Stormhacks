import SpectateSession from "./session";

export default async function SpectateSlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return <SpectateSession slug={slug} />;
}
