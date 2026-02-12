"use client";
import { useAtom } from "jotai";
import { ArrowUpIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createComment, deleteComment, fetchComments } from "@/api/comment";
import {
	activeMovieAtom,
	commentsAtom,
	isCommentOpenAtom,
} from "@/atoms/setAtoms";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/tokenStorage";

export default function CommentPanel() {
	const [isOpen, setIsOpen] = useAtom(isCommentOpenAtom);
	const [movie] = useAtom(activeMovieAtom);
	const [comments, setComments] = useAtom(commentsAtom);
	const [newComment, setNewComment] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	const loadComments = useCallback(async () => {
		if (!movie?.movie_id) {
			return;
		}
		setIsLoading(true);
		try {
			console.log("댓글 API 요청 시작...");
			const data = await fetchComments(movie.movie_id);
			setComments(data.comments);
		} catch (error) {
			console.error("댓글 로드 실패:", error);
		} finally {
			setIsLoading(false);
			console.log("댓글 로딩 완료");
		}
	}, [movie?.movie_id, setComments]);

	useEffect(() => {
		if (isOpen) {
			const token = getAccessToken();
			setIsLoggedIn(!!token);
			if (movie?.movie_id) {
				loadComments();
			}
		}
	}, [isOpen, movie?.movie_id, loadComments]);

	const handleAddComment = async () => {
		console.log("등록 시도 데이터:", {
			isLoggedIn,
			text: !!newComment.trim(),
			movieId: movie?.movie_id,
		});

		if (!isLoggedIn || !newComment.trim() || !movie?.movie_id) {
			console.warn("필수 정보가 부족하여 등록을 취소합니다.");
			return;
		}
		if (!isLoggedIn || !newComment.trim() || !movie?.movie_id) return;

		try {
			const response = await createComment(movie.movie_id, newComment);
			const { message, ...newCommentData } = response;
			setComments((prev) => [newCommentData, ...prev]);
			setNewComment("");
			listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
		} catch (_error) {
			alert("댓글 등록에 실패했습니다.");
		}
	};

	const handleDeleteComment = async (commentId: number) => {
		if (!confirm("댓글을 삭제하시겠습니까?")) return;
		if (!movie?.movie_id) return;
		try {
			await deleteComment(movie.movie_id, commentId);
			setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
		} catch (_error) {
			alert("삭제 실패");
		}
	};

	if (!isOpen) return null;

	return (
		<aside className="w-full h-full flex flex-col bg-[#121212] text-white">
			<div className="p-4 flex justify-between items-center border-b border-white/10">
				<h2 className="text-lg font-bold">
					댓글{" "}
					<span className="text-sm font-normal text-gray-400 ml-2">
						{comments.length}
					</span>
				</h2>
				<button
					type="button"
					onClick={() => setIsOpen(false)}
					className="text-gray-400 hover:text-white text-2xl"
				>
					✕
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
				{isLoading ? (
					<div className="flex justify-center py-10 text-gray-500 text-sm italic">
						댓글을 불러오는 중...
					</div>
				) : (
					comments.map((comment) => (
						<div key={comment.comment_id} className="flex gap-3 group">
							<div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden relative">
								<Image
									src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_name}`}
									alt="avatar"
									width={40}
									height={40}
									unoptimized
								/>
							</div>
							<div className="flex-1">
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold">
											{comment.user_name}
										</span>
										<span className="text-xs text-gray-500">
											{new Date(comment.created_at).toLocaleDateString()}
										</span>
									</div>
									<button
										type="button"
										onClick={() => handleDeleteComment(comment.comment_id)}
										className="text-xs text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										삭제
									</button>
								</div>
								<p className="text-sm text-gray-300 leading-relaxed">
									{comment.content}
								</p>
							</div>
						</div>
					))
				)}
				{!isLoading && comments.length === 0 && (
					<div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
						<p>아직 댓글이 없습니다.</p>
						<p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
					</div>
				)}
			</div>

			<div className="p-4 bg-[#121221] border-t border-white/10">
				<div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
					<input
						type="text"
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
						disabled={!isLoggedIn}
						placeholder={
							isLoggedIn
								? `${movie?.title || "영상"}에 댓글 추가...`
								: "로그인 후 이용가능합니다"
						}
						className={`flex-1 bg-transparent outline-none text-sm py-1 ${
							!isLoggedIn ? "cursor-not-allowed" : "cursor-text"
						}`}
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={handleAddComment}
						disabled={!isLoggedIn || !newComment.trim()}
						className={`rounded-full shrink-0 h-8 w-8 transition-colors ${
							isLoggedIn && newComment.trim()
								? "border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
								: "border-zinc-600 bg-transparent text-zinc-500"
						}`}
					>
						<ArrowUpIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</aside>
	);
}
