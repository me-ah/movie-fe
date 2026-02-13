"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateReviewPayload = {
	rating?: number;
	content: string;
};

export default function MovieReviewCreateDialog({
	open,
	onOpenChange,
	onSubmit,
	submitting,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (payload: CreateReviewPayload) => Promise<void> | void;
	submitting?: boolean;
}) {
	const [rating, setRating] = useState<string>("");
	const [content, setContent] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	const resetForm = useCallback(() => {
		setRating("");
		setContent("");
		setFormError(null);
	}, []);

	useEffect(() => {
		if (!open) resetForm();
	}, [open, resetForm]);

	const handleSubmit = async () => {
		setFormError(null);

		const trimmed = content.trim();
		if (!trimmed) {
			setFormError("리뷰 내용을 입력해줘.");
			return;
		}

		let parsedRating: number | undefined;
		if (rating.trim() !== "") {
			const n = Number(rating);
			if (!Number.isFinite(n) || n < 0 || n > 10) {
				setFormError("평점은 0 ~ 10 사이 숫자로 입력해줘.");
				return;
			}
			parsedRating = n;
		}

		try {
			await onSubmit({
				content: trimmed,
				...(parsedRating != null ? { rating: parsedRating } : {}),
			});
		} catch (err: unknown) {
			let message = "리뷰 작성 실패";

			if (err instanceof Error) {
				message = err.message;
			} else if (typeof err === "string") {
				message = err;
			}

			setFormError(message);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-base">리뷰 작성</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<div className="text-xs text-zinc-400">평점 (0~10)</div>
						<Input
							inputMode="decimal"
							placeholder="예: 4.5"
							value={rating}
							onChange={(e) => setRating(e.target.value)}
							className="border-zinc-800 bg-zinc-900"
						/>
					</div>

					<div className="space-y-1">
						<div className="text-xs text-zinc-400">내용</div>
						<Textarea
							placeholder="재밌었는지, 어떤 점이 좋았는지 적어줘"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="min-h-[120px] border-zinc-800 bg-zinc-900"
						/>
					</div>

					{formError && <div className="text-sm text-red-400">{formError}</div>}
				</div>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="secondary"
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
						onClick={() => {
							onOpenChange(false);
							resetForm();
						}}
						disabled={!!submitting}
					>
						취소
					</Button>
					<Button
						type="button"
						className="bg-blue-500 hover:bg-blue-600"
						onClick={handleSubmit}
						disabled={!!submitting}
					>
						{submitting ? "등록 중..." : "등록"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
