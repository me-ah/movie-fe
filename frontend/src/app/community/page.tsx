"use client";

import { useEffect, useMemo, useState } from "react";
import { getCommunityReviewList } from "@/api/reviews";
import PostCard from "@/app/community/PostCard";
import SortTabs, { type SortKey } from "@/app/community/SortTabs";
import type { CommunityPost } from "@/app/community/types";
import { Button } from "@/components/ui/button";
import CreateReviewDialog from "./CreateReviewDialog";

export type BackendReviewUser = {
	id: number | string;
	username: string;
};

export type BackendReviewItem = {
	id: number | string;
	user?: BackendReviewUser;
	movie_title?: string;
	rank?: number;
	content?: string;
	created_at: string;
	like_users_count?: number;
};

function mapReviewToPost(r: BackendReviewItem): CommunityPost {
	return {
		id: String(r.id),

		author: {
			id: String(r.user?.id ?? r.id), // 리뷰 id 말고 유저 id 쓰는 게 맞음
			name: r.user?.username ?? "Unknown",
			handle: r.user?.username ? `@${r.user.username}` : "@user",
			avatarUrl: null,
		},

		movie: {
			title: r.movie_title ?? "Unknown",
			posterUrl: null,
		},

		rating: Number(r.rank ?? 0),
		content: r.content ?? "",
		createdAt: r.created_at,
		likeCount: Number(r.like_users_count ?? 0),
		commentCount: 0,
	};
}

export default function CommunityPage() {
	const [sort, setSort] = useState<SortKey>("created_at");
	const [createOpen, setCreateOpen] = useState(false);

	const [posts, setPosts] = useState<CommunityPost[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPosts = async () => {
		setLoading(true);
		setError(null);

		try {
			// SortTabs의 sort 값을 API 파라미터로 매핑
			const params =
				sort === "popular"
					? { type: "created_at" as const, order: "desc" as const, page: 1 } // 인기정렬이 서버에 없으면 일단 최신으로 받고 클라에서 처리
					: { type: "created_at" as const, order: "desc" as const, page: 1 };

			const data = await getCommunityReviewList(params);

			const list = Array.isArray(data)
				? data
				: (data.results ?? data.items ?? []);

			setPosts(list.map(mapReviewToPost));
		} catch {
			setError("게시글을 불러오지 못했습니다.");
			setPosts([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPosts();
	}, [sort]);

	const visiblePosts = useMemo(() => {
		const copy = [...posts];
		if (sort === "popular") {
			copy.sort(
				(a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount),
			);
		} else {
			copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
		}
		return copy;
	}, [posts, sort]);

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<main className="mx-auto max-w-5xl px-6 pb-20 pt-14">
				<header className="text-center">
					<h1 className="text-5xl font-semibold tracking-tight">자유게시판</h1>
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
					{error && <div className="text-red-400">{error}</div>}
					{!loading && !error && visiblePosts.length === 0 && (
						<div className="text-zinc-400">게시글이 없습니다.</div>
					)}

					{visiblePosts.map((p) => (
						<PostCard key={p.id} post={p} />
					))}
				</section>

				<CreateReviewDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={() => {
						setCreateOpen(false);
						fetchPosts(); // ✅ 생성 후 재조회
					}}
				/>
			</main>
		</div>
	);
}
