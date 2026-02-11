"use client";

import { useEffect, useMemo, useState } from "react";
import PostCard from "@/app/community/PostCard";
import SortTabs, { type SortKey } from "@/app/community/SortTabs";
import type { CommunityPost } from "@/app/community/types";
import { Button } from "@/components/ui/button";
import CreateReviewDialog from "./CreateReviewDialog";

import { getReviewListNormalized, type ReviewDetail } from "@/api/reviews";

function toCommunityPost(r: ReviewDetail): CommunityPost {
	const fullName = `${r.user?.firstname ?? ""} ${r.user?.lastname ?? ""}`.trim();
	const displayName = fullName || r.user?.username || "Unknown";

	return {
		id: String(r.id),
		author: {
			id: r.user?.id ?? r.user?.username ?? "unknown",
			name: displayName,
			handle: r.user?.username ? `@${r.user.username}` : "@unknown",
			avatarUrl: null, // 백엔드에 avatar 없으면 null
		},
		movie: {
			title: r.movie_title ?? "Unknown",
			posterUrl: null, // 백엔드에 poster 없으면 null
		},
		rating: r.rank ?? 0, // 너 백엔드는 rank 사용
		content: r.content ?? "",
		createdAt: r.created_at,
		likeCount: 0, // 목록 응답에 없어서 0 처리
		commentCount: Array.isArray(r.comments) ? r.comments.length : 0,
	};
}

export default function CommunityPage() {
	const [sort, setSort] = useState<SortKey>("created_at");
	const [createOpen, setCreateOpen] = useState(false);

	const [items, setItems] = useState<ReviewDetail[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPosts = async () => {
		setLoading(true);
		setError(null);

		try {
			const order: "asc" | "desc" = sort === "created_at" ? "desc" : "asc";

			const data = await getReviewListNormalized({ order, page: 1 });
			setItems(data.results);
		} catch (e: any) {
			setError(e?.message ?? "리뷰 목록 조회 실패");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPosts();

	}, [sort]);

	const posts: CommunityPost[] = useMemo(() => {

		const mapped = items.map(toCommunityPost);

		if (sort === "rating") {
			const copy = [...mapped];
			copy.sort(
				(a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount),
			);
			return copy;
		}

		return mapped.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
	}, [items, sort]);

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<main className="mx-auto max-w-5xl px-6 pb-20 pt-14">
				<header className="text-center">
					<h1 className="text-5xl font-semibold tracking-tight">자유게시판</h1>
					<p className="mt-4 text-zinc-400">me:ahflix 에서 후기를 확인해보세요</p>
				</header>

				<div className="mt-8 flex items-center justify-between">
					<SortTabs value={sort} onChange={setSort} />

					<Button
						onClick={() => setCreateOpen(true)}
						className="bg-blue-500 hover:bg-blue-600"
					>
						게시글 생성
					</Button>
				</div>

				<section className="mt-10 space-y-6">
					{loading && <div className="text-zinc-400">불러오는 중...</div>}

					{!loading && !error && posts.map((p) => <PostCard key={p.id} post={p} />)}

					{!loading && !error && posts.length === 0 && (
						<div className="text-zinc-400">아직 게시글이 없습니다.</div>
					)}
				</section>

				<CreateReviewDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={() => {
						fetchPosts(); 
					}}
				/>
			</main>
		</div>
	);
}
