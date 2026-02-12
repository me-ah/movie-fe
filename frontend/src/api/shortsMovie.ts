// 쇼츠
import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/tokenStorage";

// 1. 기본 설정 및 Base URL 적용
const API_BASE_URL = "http://43.200.175.200/api";

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
});

// 2. 인증 정보(인터셉터) 추가
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// 타입을 명시적으로 지정
		const token = getAccessToken(); // 로컬 스토리지 확인

		console.log("요청 경로:", config.url);
		console.log("토큰 확인:", token);

		if (token) {
			// config.headers는 Axios 1.x에서 필수 값이므로 바로 할당 가능합니다.
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

// 2. 개별 영화(results 안의 객체) 타입 정의
export interface ShortsMovie {
	movie_id: string; // JSON에서 문자열 "79771"로 들어오므로 string 정의
	title: string;
	youtube_key: string;
	embed_url: string;
	release_date: string;
	genres: MovieGenre[];
	vote_average: number;
	star_rating: number;
	ott_providers: string[]; // OTT 정보가 비어있으므로 임시 any, 상세 구조 알면 추후 수정 가능
	is_in_theaters: boolean;
	overview: string;
	poster_path: string;
	view_count: number;
	like_count: number;
	is_liked: boolean;
}

// 쇼츠 데이터 타입 정의
export interface ShortResponse {
	next_cursor: string | null;
	results: ShortsMovie[];
}

// 쇼츠 호출 함수 (cursor 파라미터 사용)
export const fetchShorts = async (
	cursor: string | null,
): Promise<ShortResponse> => {
	const { data } = await apiClient.get("/movies/shorts/", {
		params: { cursor }, // 서버에서 요구한 'cursor' 명칭 적용
	});
	return data;
};
