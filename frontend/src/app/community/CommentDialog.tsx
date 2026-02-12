"use client";

import { useEffect, useMemo, useState } from "react";
import { getReviewByIdNormalized, type ReviewDetail } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type CommentsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	postId: number;
};

type CommentUser = {
	username?: string;
	name?: string;
	firstname?: string;
	lastname?: string;
};

function formatTime(iso?: string) {
	if (!iso) return "";
	return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function pickUserName(user?: CommentUser) {
	const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ");
	return user?.username ?? user?.name ?? (fullName || "anonymous");
}

export default function CommentsDialog({
	open,
	onOpenChange,
	postId,
}: CommentsDialogProps) {
	const reviewId = postId;

	const [commentText, setCommentText] = useState("");

	const [review, setReview] = useState<ReviewDetail | null>(null);
	const [loading, setLoading] = useState(false); // ✅ 추가
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const comments = useMemo(() => review?.comments ?? [], [review]);

	useEffect(() => {
		if (!open) return;

		const fetchReview = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await getReviewByIdNormalized(reviewId);
				setReview(data);
			} catch {
				setError("댓글을 불러오지 못했습니다.");
				setReview(null);
			} finally {
				setLoading(false);
			}
		};

		fetchReview();
	}, [open, reviewId]);

	const handleSubmitComment = async () => {
		if (!commentText.trim()) return;

		setSubmitting(true);
		setError(null);
		try {
			// TODO: 댓글 POST 엔드포인트 확정되면 연결
			// await api.post(`/api/review/${reviewId}/comments/`, { content: commentText.trim() });

			setCommentText("");

			// ✅ 등록 후 최신화: 여기서도 동일 로직으로 다시 fetch
			setLoading(true);
			try {
				const data = await getReviewByIdNormalized(reviewId);
				setReview(data);
			} finally {
				setLoading(false);
			}
		} catch {
			setError("댓글 등록에 실패했습니다.");
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
					setError(null);
				}
			}}
		>
			<DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">댓글</DialogTitle>
					<DialogDescription className="text-zinc-400">
						이 게시글에 대한 의견을 남겨보세요.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-2 space-y-4">
					{/* 에러 */}
					{error && (
						<div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
							{error}
						</div>
					)}

					{/* ✅ 로딩/빈상태/리스트 렌더링 문법 수정 */}
					{loading ? (
						<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
							불러오는 중...
						</div>
					) : comments.length === 0 ? (
						<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
							아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
						</div>
					) : (
						<div className="space-y-3">
							{comments.map((c) => (
								<div
									key={String(c.id)}
									className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
								>
									<div className="flex items-center justify-between">
										<div className="font-medium text-zinc-100">
											{pickUserName(c.user)}
										</div>
										<div className="text-xs text-zinc-500">
											{formatTime(c.created_at)}
										</div>
									</div>
									<p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
										{c.content}
									</p>
								</div>
							))}
						</div>
					)}

					<Separator className="bg-zinc-800" />

					{/* 댓글 입력 */}
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
