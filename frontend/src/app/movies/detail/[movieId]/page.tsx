import MovieDetailClient from "./MovieDetailClient";

export default async function Page({
	params,
}: {
	params: Promise<{ movieId: string }>;
}) {
	const { movieId } = await params;

	return <MovieDetailClient movieId={movieId} key={movieId} />;
}
