import api from "@/lib/apiClient";

export interface ShortsComment {
	comment_id: number;
	content: string;
	user_name: string;
	created_at: string;
}

export interface CommentListResponse {
	movie_id: number;
	comments: ShortsComment[];
}
export interface CommentCreateResponse extends ShortsComment {
	message: string;
}

export interface CommentDeleteResponse {
	comment_id: number;
	message: string;
}

export const fetchComments = async (
	movie_id: string | number,
): Promise<CommentListResponse> => {
	const { data } = await api.get(`/movies/shorts/${movie_id}/comments/`);
	return data;
};

export const createComment = async (
	movie_id: string | number,
	content: string,
): Promise<CommentCreateResponse> => {
	const { data } = await api.post(`/movies/shorts/${movie_id}/comments/`, {
		content,
	});
	return data;
};

export const deleteComment = async (
	movie_id: string | number,
	comment_id: string | number,
): Promise<CommentDeleteResponse> => {
	const { data } = await api.delete(
		`/movies/shorts/${movie_id}/comments/${comment_id}/`,
	);
	return data;
};
