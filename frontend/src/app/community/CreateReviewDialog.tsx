"use client";

import { useState } from "react";
import { type CreateReviewPayload, createReview } from "@/api/reviews";
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
import { Textarea } from "@/components/ui/textarea";

type CreateReviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: () => void;
};

export default function CreateReviewDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateReviewDialogProps) {
	const [title, setTitle] = useState("");
	const [movieTitle, setMovieTitle] = useState("");
	const [rank, setRank] = useState<number>(9);
	const [content, setContent] = useState("");

	const [submitting, setSubmitting] = useState(false);

	const reset = () => {
		setTitle("");
		setMovieTitle("");
		setRank(9);
		setContent("");
	};

	const handleClose = () => {
		onOpenChange(false);
		// reset(); // 닫힐 때 초기화하고 싶으면 주석 해제
	};

	const handleSubmit = async () => {
		// 간단 검증 (메시지 없이 그냥 막기)
		if (!title.trim()) return;
		if (!movieTitle.trim()) return;
		if (!content.trim()) return;

		const numRank = Number(rank);
		if (Number.isNaN(numRank) || numRank < 0 || numRank > 10) return;

		const payload: CreateReviewPayload = {
			title: title.trim(),
			movie_title: movieTitle.trim(),
			rank: numRank,
			content: content.trim(),
		};

		setSubmitting(true);
		try {
			await createReview(payload);
			reset();
			onOpenChange(false);
			onCreated?.();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">게시글 생성</DialogTitle>
					<DialogDescription className="text-zinc-400">
						영화 리뷰를 작성해보세요.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="text-sm text-zinc-300">제목</div>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="예) 정말 재미있는 영화!"
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-zinc-300">영화 제목</div>
						<Input
							value={movieTitle}
							onChange={(e) => setMovieTitle(e.target.value)}
							placeholder="예) 어벤져스 1"
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-zinc-300">평점 (0~10)</div>
						<Input
							type="number"
							value={rank}
							onChange={(e) => setRank(Number(e.target.value))}
							min={0}
							max={10}
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
							disabled={submitting}
						/>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-zinc-300">내용</div>
						<Textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="감상평을 작성하세요..."
							className="min-h-[140px] border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
							disabled={submitting}
						/>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-3">
					<Button
						type="button"
						variant="secondary"
						onClick={handleClose}
						disabled={submitting}
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
					>
						닫기
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={submitting}
						className="bg-blue-500 hover:bg-blue-600"
					>
						{submitting ? "생성 중..." : "생성"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
