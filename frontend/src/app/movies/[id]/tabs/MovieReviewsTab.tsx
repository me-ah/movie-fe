// src/app/movie/[movieId]/_components/tabs/MovieReviewsTab.tsx
import React from "react";

export type ReviewItem = {
  id: string | number;
  author: string;
  rating?: number; // 0~5 or 0~10 (프로젝트에 맞춰 통일)
  content: string;
  createdAt?: string;
};

export default function MovieReviewsTab({
  reviews,
  loading,
}: {
  reviews?: ReviewItem[];
  loading?: boolean;
}) {
  if (loading) {
    return <div className="mt-6 text-sm text-zinc-400">리뷰 불러오는 중...</div>;
  }

  if (!reviews?.length) {
    return (
      <div className="mt-6 text-sm text-zinc-400">
        리뷰 영역 (커뮤니티 리뷰/댓글 연결 가능)
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-100">{r.author}</div>
            <div className="text-xs text-zinc-400">
              {r.createdAt ? r.createdAt : ""}
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{r.content}</p>

          {r.rating != null && (
            <div className="mt-2 text-xs text-zinc-400">평점: {r.rating}</div>
          )}
        </div>
      ))}
    </div>
  );
}
