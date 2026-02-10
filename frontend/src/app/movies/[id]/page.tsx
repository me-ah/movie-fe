import MovieDetailClient from "./MovieDetailClient";

export default function MovieDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <MovieDetailClient movieId={params.id} />;
}
