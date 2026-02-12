import api from "@/lib/apiClient";

export interface ShortsComment {
	comment_id: number;
	content: string;
	user_name: string;
	created_at: string;
}

<<<<<<< HEAD
// 댓글 목록 조회 응답
=======
>>>>>>> fe_dev
export interface CommentListResponse {
	movie_id: number;
	comments: ShortsComment[];
}
<<<<<<< HEAD

// 댓글 작성 응답
=======
>>>>>>> fe_dev
export interface CommentCreateResponse extends ShortsComment {
	message: string;
}

<<<<<<< HEAD
// 댓글 삭제 응답
=======
>>>>>>> fe_dev
export interface CommentDeleteResponse {
	comment_id: number;
	message: string;
}

<<<<<<< HEAD
// 1. 댓글 목록 조회
=======
>>>>>>> fe_dev
export const fetchComments = async (
	movie_id: string | number,
): Promise<CommentListResponse> => {
	const { data } = await api.get(`/movies/shorts/${movie_id}/comments/`);
	return data;
};

<<<<<<< HEAD
// 2. 댓글 작성
=======
>>>>>>> fe_dev
export const createComment = async (
	movie_id: string | number,
	content: string,
): Promise<CommentCreateResponse> => {
	const { data } = await api.post(`/movies/shorts/${movie_id}/comments/`, {
		content,
	});
	return data;
};

<<<<<<< HEAD
// 3. 댓글 삭제
=======
>>>>>>> fe_dev
export const deleteComment = async (
	movie_id: string | number,
	comment_id: string | number,
): Promise<CommentDeleteResponse> => {
	const { data } = await api.delete(
		`/movies/shorts/${movie_id}/comments/${comment_id}/`,
	);
	return data;
};
