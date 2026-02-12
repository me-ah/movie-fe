import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/tokenStorage";

const API_BASE_URL = "http://43.200.175.200/api";

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getAccessToken();

		console.log("요청 경로:", config.url);
		console.log("토큰 확인:", token);

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
			console.log("Authorization 헤더 추가 완료");
		} else {
			console.warn("⚠️ 토큰이 없어 인증 헤더가 누락되었습니다.");
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
		params: { cursor },
	});
	return data;
};
