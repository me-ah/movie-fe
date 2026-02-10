import api from "@/lib/apiClient";

export async function getMovieReviews(movieId: string | number) {
  const res = await api.get(`/api/movie/${movieId}/reviews`);
  return res.data;
}
