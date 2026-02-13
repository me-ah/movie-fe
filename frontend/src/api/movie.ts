import api from "@/lib/apiClient";
import { apiClient } from "./shortsMovie";

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
	movie_id?: string | number;
	runtime?: string | number;
	ott_list?: string[];

	MovieDetail?: MovieDetail;
	ActorItem?: ActorItem | ActorItem[];
	ReviewItem?: ReviewItem | ReviewItem[];
	recommend_list?: RecommendItem[];
};

function asArray<T>(v: T | T[] | undefined | null): T[] {
	if (!v) return [];
	return Array.isArray(v) ? v : [v];
}

function parseMovieId(movieId: string): string | number {
	const n = Number(movieId);
	return Number.isFinite(n) ? n : movieId;
}

export async function getMoviePage(
	movieId: string,
): Promise<MoviePageResponse & { actors: ActorItem[]; reviews: ReviewItem[] }> {
	const res = await api.get<MoviePageResponse>("/home/detail/", {
		params: {
			id: parseMovieId(movieId),
		},
	});

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


export async function toggleShortLike(
  movie_id: string | number
): Promise<void> {
  await api.post(`/movies/shorts/${movie_id}/like/`);
}
