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
	rating: number;
	content: string;
}>;

export type ReviewListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReviewDetail[];
};

export async function getReviewById(reviewId: number | string) {
	const res = await api.get<ReviewDetail>(`/review/${reviewId}/`);
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
	rating: number;
	content: string;
};

export async function createReview(payload: CreateReviewPayload) {
	const res = await api.post<ReviewDetail>("/community/review/create", payload);
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
	const res = await api.put(`/review/${reviewId}/`, payload);
	return res.data;
}

export async function deleteReview(reviewId: number | string) {
	await api.delete(`/review/${reviewId}/`);
}
export async function getReviewList(params?: {
  type?: "rating" | "title" | "movie_title" | "created_at";
  order?: "asc" | "desc";
  page?: number;
  rating?: number;  
  search?: string;  
}) {
  const res = await api.get<ReviewListResponse>("/community/review/list/", {
    params: {
      type: "created_at",  
      order: "desc",        
      page: 1,              
      ...params,           
    },
  });

  return res.data;
}

export async function getReviewListNormalized(params?: {
  type?: "rating" | "title" | "movie_title" | "created_at";
  order?: "asc" | "desc";
  page?: number;
  rating?: number;
  search?: string;
}) {
  const data = await getReviewList(params);

  return {
    ...data,
    results: data.results.map((r) => ({
      ...r,
      content: typeof r.content === "string" ? r.content.replaceAll("\r", "") : r.content,
      comments: Array.isArray(r.comments) ? r.comments : [],
    })),
  };
}
