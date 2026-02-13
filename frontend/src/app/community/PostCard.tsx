// src/app/community/PostCard.tsx
"use client";

import axios from "axios";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
	deleteReview,
	getReviewCommentCount,
	toggleReviewLike,
} from "@/api/reviews";
import CommentsDialog from "@/app/community/CommentDialog";
import EditReviewDialog, {
	type BackendReviewItem,
} from "@/app/community/EditReviewDialog";
import ShareDialog from "@/app/community/ShareDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/userStorage";

function Stars({ value = 0 }: { value?: number }) {
	const v = Math.max(0, Math.min(5, value));
	const keys = ["s1", "s2", "s3", "s4", "s5"] as const;

	return (
		<div className="flex items-center gap-1">
			{keys.map((k, idx) => (
				<span key={k} className={idx < v ? "text-yellow-400" : "text-zinc-700"}>
					★
				</span>
			))}
		</div>
	);
}

// ✅ toggleReviewLike 응답 타입(백엔드가 내려주는 키들만 optional로 안전하게)
type ToggleLikeResponse = {
	is_liked?: boolean;
	like_users_count?: number;
	like_count?: number;
};

export default function PostCard({ post }: { post: BackendReviewItem }) {
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [commentCount, setCommentCount] = useState<number>(0);

	const [localPost, setLocalPost] = useState<BackendReviewItem>(post);

	const [liked, setLiked] = useState(Boolean(post.is_liked));
	const [likeCount, setLikeCount] = useState(
		Number(post.like_users_count ?? 0),
	);

	const me = getUser?.();
	const isMine =
		me?.user_id != null && String(me.user_id) === String(localPost.user.id);

	const handleToggleLike = async () => {
		const prevLiked = liked;
		const prevCount = likeCount;

		const nextLiked = !prevLiked;
		setLiked(nextLiked);
		setLikeCount(Math.max(0, prevCount + (nextLiked ? 1 : -1)));

		try {
			const data = (await toggleReviewLike(localPost.id)) as ToggleLikeResponse;

			const serverLiked = data?.is_liked;
			const serverCount = data?.like_users_count ?? data?.like_count;

			if (typeof serverLiked === "boolean") setLiked(serverLiked);
			if (typeof serverCount === "number") setLikeCount(serverCount);
		} catch {
			setLiked(prevLiked);
			setLikeCount(prevCount);
			alert("좋아요 처리에 실패했습니다.");
		}
	};

	const handleDelete = async () => {
		const ok = confirm("정말 삭제할까요?");
		if (!ok) return;

		try {
			await deleteReview(localPost.id);
			window.location.reload();
		} catch (e: unknown) {
			if (axios.isAxiosError(e) && e.response?.status === 403) {
				alert("본인 게시글만 삭제할 수 있습니다.");
				return;
			}
			alert("삭제에 실패했습니다.");
		}
	};

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const cnt = await getReviewCommentCount(localPost.id);
				if (!cancelled) setCommentCount(cnt);
			} catch {
				if (!cancelled) setCommentCount(0);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [localPost.id]);

	return (
		<>
			<Card className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
				<div className="flex items-start gap-4">
					<div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950/40">
						<Image
							src={"/images/profile.jpg"}
							alt={localPost.user.username}
							fill
							className="object-cover"
							sizes="40px"
						/>
					</div>

					<div className="flex-1">
						<div className="flex items-center justify-between gap-4">
							<div>
								<div className="font-semibold">{localPost.user.last_name}{localPost.user.first_name}</div>
							</div>
							<div className="text-sm text-zinc-500">
								{new Date(localPost.created_at).toLocaleString("ko-KR", {
									timeZone: "Asia/Seoul",
								})}
							</div>
						</div>

						<div className="mt-4 flex items-start gap-4">
							<div>
								<div className="text-xl font-semibold">{localPost.title}</div>
								<Stars value={Math.round((localPost.rank ?? 0) / 2)} />
							</div>
						</div>

						<p className="mt-4 leading-relaxed text-zinc-300">
							{localPost.content}
						</p>

						<div className="mt-6 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleToggleLike}
									className={`gap-2 ${
										liked
											? "text-red-500 hover:text-red-500"
											: "text-zinc-400 hover:text-zinc-200"
									}`}
								>
									<Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
									{likeCount}
								</Button>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setCommentsOpen(true)}
									className="gap-2 text-zinc-400 hover:text-zinc-200"
								>
									<MessageCircle className="h-4 w-4" />
									{commentCount}
								</Button>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShareOpen(true)}
									className="gap-2 text-zinc-400 hover:text-zinc-200"
								>
									<Share2 className="h-4 w-4" />
									Share
								</Button>
							</div>

							{isMine && (
								<div className="flex items-center gap-3">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setEditOpen(true)}
									>
										수정
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleDelete}
										className="text-red-400 hover:text-red-300"
									>
										삭제
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</Card>

			<CommentsDialog
				open={commentsOpen}
				onOpenChange={setCommentsOpen}
				postId={localPost.id}
				onCommentCreated={() => setCommentCount((c) => c + 1)}
			/>

			<ShareDialog
				open={shareOpen}
				onOpenChange={setShareOpen}
				postId={localPost.id}
			/>

			<EditReviewDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				post={localPost}
				onSaved={(next) => setLocalPost(next)}
			/>
		</>
	);
}
