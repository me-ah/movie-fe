"use client";

import { useMemo, useState } from "react";
import PostCard from "@/app/community/PostCard";
import SortTabs, { SortKey } from "@/app/community/SortTabs";
import type { CommunityPost } from "@/app/community/types";

const MOCK: CommunityPost[] = [
  {
    id: "1",
    author: { name: "Alex Johnson", handle: "@alexj_movies", avatarUrl: null },
    movie: { title: "Neon Dreams", posterUrl: null },
    rating: 5,
    content:
      "Absolutely mind-blowing! The cinematography is stunning and the story keeps you on the edge of your seat.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likeCount: 234,
    commentCount: 45,
  },
];

export default function CommunityPage() {
  const [sort, setSort] = useState<SortKey>("latest");

  const posts = useMemo(() => {
    const copy = [...MOCK];
    if (sort === "popular") {
      copy.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount));
    } else {
      copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return copy;
  }, [sort]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-14">
        {/* 헤더 */}
        <header className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight">자유게시판</h1>
          <p className="mt-4 text-zinc-400">
            SSAFLIX 에서 후기를 확인해보세요
          </p>
        </header>

        {/* 탭 */}
        <SortTabs value={sort} onChange={setSort} />

        {/* 리스트 */}
        <section className="mt-10 space-y-6">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      </main>
    </div>
  );
}
