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



export type CommentUser = {
  id: number | string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
};

export type GetCommentsParams = {
  page?: number;            
  order?: "asc" | "desc";  
};


export type ReviewComment = {
  id: number | string;
  content: string;
  user: CommentUser;
  review: number | string;
  created_at: string;
};

export type ReviewCommentListResponse = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: ReviewComment[];
};


export async function getReviewComments(reviewId: number | string) {
  const res = await api.get<ReviewCommentListResponse | ReviewComment[]>(
    `/community/review/${reviewId}/comment/list/`
  );

  const data: any = res.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
}

// ✅ 댓글 등록
export async function createReviewComment(reviewId: number | string, content: string) {
  const res = await api.post(
    `/community/review/${reviewId}/comment/create/`,
    { content }
  );
  return res.data;
}


export async function getReviewCommentCount(reviewId: number | string) {
  const res = await api.get<ReviewCommentListResponse | ReviewComment[]>(
    `/community/review/${reviewId}/comment/list/`
  );

  const data: any = res.data;

  // ✅ DRF pagination이면 count가 있음
  if (typeof data?.count === "number") return data.count;

  // ✅ 배열로 오면 길이가 count
  if (Array.isArray(data)) return data.length;

  return 0;
}


export type ToggleLikeResponse =
  | { is_liked?: boolean; like_users_count?: number; like_count?: number }
  | unknown;

export async function toggleReviewLike(reviewId: number | string) {
  const res = await api.post<ToggleLikeResponse>(`/community/review/${reviewId}/like/`);
  return res.data;
}
