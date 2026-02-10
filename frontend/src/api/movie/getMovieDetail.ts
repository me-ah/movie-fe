import api from "@/lib/apiClient";

export async function getMovieDetail(movieId: string | number) {
  const res = await api.get(`/api/movie/${movieId}`);
  return res.data;
}
