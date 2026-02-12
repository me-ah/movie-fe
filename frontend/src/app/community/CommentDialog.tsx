"use client";

import { useCallback, useEffect, useState } from "react";
import {
	createReviewComment,
	getReviewComments,
	type ReviewComment,
} from "@/api/reviews";
import CommentsList from "@/app/community/CommentsList"; // ✅ 추가
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type CommentsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	postId: number;
	onCommentCreated?: () => void;
};

export default function CommentsDialog({
	open,
	onOpenChange,
	postId,
	onCommentCreated,
}: CommentsDialogProps) {
	const [commentText, setCommentText] = useState("");
	const [comments, setComments] = useState<ReviewComment[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const fetchComments = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getReviewComments(postId);
			setComments(data);
		} catch {
			setComments([]);
		} finally {
			setLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		if (!open) return;
		fetchComments();
	}, [open, fetchComments]);

	const handleSubmitComment = async () => {
		const content = commentText.trim();
		if (!content) return;

		setSubmitting(true);
		try {
			await createReviewComment(postId, content);
			setCommentText("");
			onCommentCreated?.();
			await fetchComments();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) {
					setCommentText("");
					setComments([]);
				}
			}}
		>
			<DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogTitle className="sr-only">댓글</DialogTitle>
				<DialogDescription className="sr-only">
					이 게시글에 대한 댓글 목록
				</DialogDescription>

				<div className="mt-2 space-y-4">
					{loading ? (
						<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
							불러오는 중...
						</div>
					) : comments.length === 0 ? (
						<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
							아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
						</div>
					) : (
						<CommentsList
							reviewId={postId}
							comments={comments}
							onChanged={fetchComments}
						/>
					)}

					<Separator className="bg-zinc-800" />

					<div className="flex items-center gap-2">
						<Input
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							placeholder="댓글을 입력하세요"
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
							disabled={submitting}
						/>
						<Button
							type="button"
							onClick={handleSubmitComment}
							disabled={submitting || !commentText.trim()}
							className="bg-blue-500 hover:bg-blue-600"
						>
							{submitting ? "등록 중..." : "등록"}
						</Button>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => onOpenChange(false)}
						className="border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
					>
						닫기
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
