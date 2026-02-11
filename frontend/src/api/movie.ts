// src/api/movie/index.ts
import api from "@/lib/apiClient"; // ✅ 인터셉터 적용된 api 사용

/** 탭용 상세 */
export type MovieDetail = {
  overview?: string;
  director?: string;
  genres?: string[];
  year?: number | string;
};

export type ActorItem = {
  id?: string | number;
  name: string;
  character?: string;
  profileUrl?: string | null;
};

export type ReviewItem = {
  id: string | number;
  author: string;
  rating?: number;
  content: string;
  createdAt?: string;
};

export type RecommendItem = {
  id: string | number;
  video?: string;
  title: string;
};

export type MoviePageResponse = {
  trailer?: string;
  title: string;
  rank?: string | number;
  year?: string | number;
  runtime?: string | number;
  ott_list?: string[];

  MovieDetail?: MovieDetail;
  ActorItem?: ActorItem | ActorItem[];
  ReviewItem?: ReviewItem | ReviewItem[];
  recommend_list?: RecommendItem[];
};

/** 배열 정규화 */
function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function getMoviePage(movieId: string): Promise<
  MoviePageResponse & {
    actors: ActorItem[];
    reviews: ReviewItem[];
  }
> {
    const res = await api.post<MoviePageResponse>(
    "/home/detail/",
    { movieId }   // 👈 body
    );
  const data = res.data;

  return {
    ...data,
    actors: asArray<ActorItem>(data.ActorItem),
    reviews: asArray<ReviewItem>(data.ReviewItem),
  };
}

export const movieApi = {
  getMoviePage,
};
