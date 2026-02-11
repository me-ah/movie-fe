// src/api/movie_reviews.ts
import api from "@/lib/apiClient";

export type ReviewItem = {
	id: string | number;
	author: string;
	rating?: number;
	content: string;
	createdAt?: string;
};

// 백엔드 원본 타입(너희 응답에 맞게 필드명만 매핑)
export type BackendReview = {
	id?: string | number;
	author?: string;
	username?: string;
	user?: string;
	rating?: number;
	content?: string;
	created_at?: string;
	createdAt?: string;
};

// 백엔드 -> 프론트 타입 변환
function toReviewItem(r: BackendReview): ReviewItem {
	return {
		id: r.id ?? crypto.randomUUID(),
		author: r.author ?? r.username ?? r.user ?? "익명",
		rating: r.rating ?? undefined,
		content: (r.content ?? "").toString(),
		createdAt: r.created_at ?? r.createdAt ?? undefined,
	};
}

/** 리뷰 목록 조회 (네가 쓰던 GET 그대로) */
export async function getMovieReviews(
	movieId: string | number,
): Promise<ReviewItem[]> {
	const res = await api.get<BackendReview[] | { results?: BackendReview[] }>(
		"/home/review/",
		{
			params: {
				id: movieId,
			},
		},
	);

	const raw = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);

	return raw.map(toReviewItem).filter((x) => x.content.trim().length > 0);
}

export type CreateReviewPayload = {
	rating?: number;
	content: string;
};

export async function createMovieReview(
	movieId: string | number,
	payload: CreateReviewPayload,
): Promise<ReviewItem> {
	const res = await api.post<BackendReview>("/home/review/", {
		id: Number(movieId), // 🔥 영화 PK를 body에 포함
		...payload,
	});

	return toReviewItem(res.data);
}
