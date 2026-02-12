// src/api/reviews.ts
import api from "@/lib/apiClient";

export type ReviewUser = {
	id?: number | string;
	username?: string;
	useremail?: string;
	firstname?: string;
	lastname?: string;
	[key: string]: unknown;
};

export type ReviewComment = {
	id: number;
	content: string;
	user: ReviewUser;
	review: number;
	created_at?: string;
	updated_at?: string;
};

export type ReviewDetail = {
	id: number;
	title: string;
	movie_title: string;
	rank: number;
	content: string;
	created_at: string;
	updated_at: string;
	user: ReviewUser;
	comments: ReviewComment[];
};

export type UpdateReviewPayload = Partial<{
	title: string;
	movie_title: string;
	rank: number;
	content: string;
}>;

export async function getReviewById(reviewId: number | string) {
	const res = await api.get<ReviewDetail>(`/api/review/${reviewId}/`);
	return res.data;
}

export async function getReviewByIdNormalized(reviewId: number | string) {
	const data = await getReviewById(reviewId);
	return {
		...data,
		content:
			typeof data.content === "string"
				? data.content.replaceAll("\r", "")
				: data.content,
		comments: Array.isArray(data.comments) ? data.comments : [],
	};
}

export type CreateReviewPayload = {
	title: string;
	movie_title: string;
	rank: number;
	content: string;
};

export async function createReview(payload: CreateReviewPayload) {
	const res = await api.post<ReviewDetail>(
		"/community/review/create/",
		payload,
	);
	return res.data;
}

export async function createReviewNormalized(payload: CreateReviewPayload) {
	const data = await createReview(payload);
	return {
		...data,
		content:
			typeof data.content === "string"
				? data.content.replaceAll("\r", "")
				: data.content,
		comments: Array.isArray(data.comments) ? data.comments : [],
	};
}

export async function updateReview(
	reviewId: number | string,
	payload: UpdateReviewPayload,
) {
	const res = await api.patch(`/community/review/${reviewId}/update/`, payload);
	return res.data;
}

export async function deleteReview(reviewId: number | string) {
	await api.delete(`/community/review/${reviewId}/delete/`);
}

export type ReviewListSortType =
	| "rating"
	| "title"
	| "movie_title"
	| "created_at";
export type ReviewListOrder = "asc" | "desc";

export type ReviewListItem = {
	id: number;
	title: string;
	movie_title: string;
	rating: number;
	content?: string;
	created_at: string;
	user?: {
		id?: number | string;
		username?: string;
	};
};

export type ReviewListParams = Partial<{
	type: ReviewListSortType;
	order: ReviewListOrder;
	page: number;
	rating: number; // 1~10
	search: string; // 영화 제목 검색
}>;


export async function getCommunityReviewList(params: ReviewListParams = {}) {
	const res = await api.get("/community/review/list/", { params });
	console.log(res.data)
	return res.data;
}


