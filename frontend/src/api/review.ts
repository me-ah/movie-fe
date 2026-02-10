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

export async function getReviewById(reviewId: number | string) {
  const res = await api.get<ReviewDetail>(`/api/review/${reviewId}/`);
  return res.data;
}

export async function getReviewByIdNormalized(reviewId: number | string) {
  const data = await getReviewById(reviewId);
  return {
    ...data,
    content: typeof data.content === "string" ? data.content.replaceAll("\r", "") : data.content,
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
  const res = await api.post<ReviewDetail>("/api/review/create", payload);
  return res.data;
}


export async function createReviewNormalized(payload: CreateReviewPayload) {
  const data = await createReview(payload);
  return {
    ...data,
    content: typeof data.content === "string" ? data.content.replaceAll("\r", "") : data.content,
    comments: Array.isArray(data.comments) ? data.comments : [],
  };
}


export async function updateReview(reviewId: number | string, payload: UpdateReviewPayload) {
  const res = await api.put(`/api/review/${reviewId}/`, payload);
  return res.data;
}

export async function deleteReview(reviewId: number | string) {
  await api.delete(`/api/review/${reviewId}/`);
}