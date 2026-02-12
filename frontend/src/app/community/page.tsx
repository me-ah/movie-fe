"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCommunityReviewList } from "@/api/reviews";
import PostCard from "@/app/community/PostCard";
import SortTabs, { type SortKey } from "@/app/community/SortTabs";
import { Button } from "@/components/ui/button";
import CreateReviewDialog from "./CreateReviewDialog";
import type { BackendReviewItem } from "./EditReviewDialog";

export default function CommunityPage() {
	const [sort, setSort] = useState<SortKey>("created_at");
	const [createOpen, setCreateOpen] = useState(false);

	const [posts, setPosts] = useState<BackendReviewItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPosts = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const params =
				sort === "popular"
					? ({ type: "rating", order: "desc", page: 1 } as const)
					: ({ type: "created_at", order: "desc", page: 1 } as const);

			const data = await getCommunityReviewList(params);

			const list: BackendReviewItem[] = Array.isArray(data)
				? data
				: (data.results ?? data.items ?? []);

			setPosts(list);
		} catch {
			setError("게시글을 불러오지 못했습니다.");
			setPosts([]);
		} finally {
			setLoading(false);
		}
	}, [sort]);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	const visiblePosts = useMemo(() => {
		const copy = [...posts];

		if (sort === "popular") {
			copy.sort(
				(a, b) => Number(b.like_users_count) - Number(a.like_users_count),
			);
		} else {
			copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
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
						fetchPosts();
					}}
				/>
			</main>
		</div>
	);
}
