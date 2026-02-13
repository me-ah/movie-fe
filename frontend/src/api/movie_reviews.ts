import axios from "axios";
import api from "@/lib/apiClient";

export type ReviewItem = {
	id: string | number;
	author: string;
	rating?: number;
	content: string;
	createdAt?: string;
};

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

function toReviewItem(r: BackendReview): ReviewItem {
	return {
		id: r.id ?? crypto.randomUUID(),
		author: r.author ?? r.username ?? r.user ?? "익명",
		rating: r.rating ?? undefined,
		content: (r.content ?? "").toString(),
		createdAt: r.created_at ?? r.createdAt ?? undefined,
	};
}

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
	try {
		const res = await api.post<BackendReview>("/home/review/", {
			id: Number(movieId),
			...payload,
		});

		return toReviewItem(res.data);
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw error.response?.data;
		}

		throw error;
	}
}
