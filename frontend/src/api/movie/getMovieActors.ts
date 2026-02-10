import api from "@/lib/apiClient";

export async function getMovieActors(movieId: string | number) {
  const res = await api.get(`/api/movie/${movieId}/actors`);
  return res.data;
}
