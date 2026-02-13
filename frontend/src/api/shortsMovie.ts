// 쇼츠
import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/tokenStorage";

// 1. 기본 설정 및 Base URL 적용
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getAccessToken(); // 로컬 스토리지 확인

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		} else {
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export interface MovieGenre {
	id: number;
	name: string;
}

export interface ShortsMovie {
	movie_id: string;
	title: string;
	youtube_key: string;
	embed_url: string;
	release_date: string;
	genres: MovieGenre[];
	vote_average: number;
	star_rating: number;
	ott_providers: string[];
	is_in_theaters: boolean;
	overview: string;
	poster_path: string;
	view_count: number;
	comment_count: number;
	like_count: number;
	is_liked: boolean;
}

export interface ShortResponse {
	next_cursor: string | null;
	results: ShortsMovie[];
}

export const fetchShorts = async (
	cursor: string | null,
): Promise<ShortResponse> => {
	const { data } = await apiClient.get("/movies/shorts/", {
		params: { cursor }, // 서버에서 요구한 'cursor' 명칭 적용
	});
	return data;
};

export const postLike = async (movieId: string | number) => {
	const { data } = await apiClient.post(`/movies/shorts/${movieId}/like/`);
	return data;
};
