// src/app/community/EditReviewDialog.tsx
"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { updateReview } from "@/api/reviews";
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

export type BackendReviewItem = {
	id: number;
	title: string;
	movie_title: string;
	rank: number;
	content: string;
	user: {
		id: number;
		username: string;
		email: string;
		first_name: string;
		last_name: string;
		date_joined: string;
	};
	like_users_count: number;
	is_liked: boolean;
	created_at: string;
	updated_at: string;
};

type EditableFields = Partial<
	Pick<BackendReviewItem, "title" | "movie_title" | "rank" | "content">
>;

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	post: BackendReviewItem;
	onSaved: (next: BackendReviewItem) => void; // 저장 성공 시 부모에 반영
};

export default function EditReviewDialog({
	open,
	onOpenChange,
	post,
	onSaved,
}: Props) {
	const initial = useMemo(
		() => ({
			title: post.title ?? "",
			movie_title: post.movie_title ?? "",
			rank: Number(post.rank ?? 0),
			content: post.content ?? "",
		}),
		[post],
	);

	const [editTitle, setEditTitle] = useState(initial.title);
	const [editMovieTitle, setEditMovieTitle] = useState(initial.movie_title);
	const [editRank, setEditRank] = useState<number>(initial.rank);
	const [editContent, setEditContent] = useState(initial.content);

	const [saving, setSaving] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setEditTitle(initial.title);
		setEditMovieTitle(initial.movie_title);
		setEditRank(initial.rank);
		setEditContent(initial.content);
		setEditError(null);
	}, [open, initial]);

	const canSave =
		editTitle.trim().length > 0 &&
		editMovieTitle.trim().length > 0 &&
		editContent.trim().length > 0 &&
		Number.isFinite(editRank);

	const buildPayload = (): EditableFields => {
		const payload: EditableFields = {};

		if (editTitle.trim() !== initial.title) payload.title = editTitle.trim();
		if (editMovieTitle.trim() !== initial.movie_title)
			payload.movie_title = editMovieTitle.trim();
		if (editRank !== initial.rank) payload.rank = editRank;
		if (editContent.trim() !== initial.content)
			payload.content = editContent.trim();

		return payload;
	};

	const handleSave = async () => {
		setSaving(true);
		setEditError(null);

		try {
			const payload = buildPayload();

			if (Object.keys(payload).length === 0) {
				onOpenChange(false);
				return;
			}

			const updated = await updateReview(post.id, payload);

			const next: BackendReviewItem = {
				...post,
				...(updated ?? {}),
				...payload, // 서버가 echo 안 해주면 폼 값으로 반영
			};

			onSaved(next);
			onOpenChange(false);
		} catch (e: unknown) {
			if (axios.isAxiosError(e)) {
				const status = e.response?.status;
				if (status === 403) setEditError("본인 게시글만 수정할 수 있습니다.");
				else setEditError("수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
			} else {
				setEditError("수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
			<DialogContent className="max-w-lg border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">리뷰 수정</DialogTitle>
					<DialogDescription className="text-zinc-400">
						내용을 수정한 뒤 저장할 수 있어요.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<div className="text-sm text-zinc-300">제목</div>
						<Input
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100"
							placeholder="리뷰 제목"
							disabled={saving}
						/>
					</div>

					<div className="space-y-1">
						<div className="text-sm text-zinc-300">영화 제목</div>
						<Input
							value={editMovieTitle}
							onChange={(e) => setEditMovieTitle(e.target.value)}
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100"
							placeholder="movie_title"
							disabled={saving}
						/>
					</div>

					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="text-sm text-zinc-300">평점 (0~10)</div>
							<div className="text-sm text-zinc-400">{editRank}</div>
						</div>

						<Input
							type="number"
							min={0}
							max={10}
							step={1}
							value={Number.isFinite(editRank) ? editRank : 0}
							onChange={(e) => {
								const n = Number(e.target.value);
								const clamped = Number.isFinite(n)
									? Math.max(0, Math.min(10, n))
									: 0;
								setEditRank(clamped);
							}}
							className="border-zinc-800 bg-zinc-900/40 text-zinc-100"
							disabled={saving}
						/>
					</div>

					<div className="space-y-1">
						<div className="text-sm text-zinc-300">내용</div>
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="min-h-[140px] border-zinc-800 bg-zinc-900/40 text-zinc-100"
							placeholder="리뷰 내용"
							disabled={saving}
						/>
					</div>

					{editError && <div className="text-sm text-red-400">{editError}</div>}
				</div>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="secondary"
						onClick={() => onOpenChange(false)}
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
						disabled={saving}
					>
						취소
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						className="bg-blue-500 hover:bg-blue-600"
						disabled={saving || !canSave}
					>
						{saving ? "저장 중..." : "저장"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
