"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { CommunityPost } from "./types";

function Stars({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "text-yellow-400" : "text-zinc-700"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function PostCard({ post }: { post: CommunityPost }) {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-100 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
      {/* 상단: 작성자 */}
      <div className="flex items-start gap-4">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950/40">
          <Image
            src={post.author.avatarUrl ?? "/images/profile.jpg"}
            alt={post.author.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-zinc-100">{post.author.name}</div>
              <div className="text-sm text-zinc-400">{post.author.handle}</div>
            </div>
            <div className="text-sm text-zinc-500">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>

          {/* 영화 영역 */}
          {post.movie && (
            <div className="mt-4 flex items-start gap-4">
              <div className="relative h-20 w-16 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
                <Image
                  src={post.movie.posterUrl ?? "/images/poster-placeholder.jpg"}
                  alt={post.movie.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              <div className="min-w-0">
                <div className="text-xl font-semibold text-zinc-100">
                  {post.movie.title}
                </div>
                <div className="mt-1">
                  <Stars value={post.rating} />
                </div>
              </div>
            </div>
          )}

          {/* 본문 */}
          <p className="mt-4 text-zinc-300 leading-relaxed">
            {post.content}
          </p>

          {/* 하단 액션 */}
          <div className="mt-6 flex items-center gap-6 text-sm text-zinc-400">
            <button className="inline-flex items-center gap-2 hover:text-zinc-200">
              <Heart className="h-4 w-4" />
              {post.likeCount}
            </button>
            <button className="inline-flex items-center gap-2 hover:text-zinc-200">
              <MessageCircle className="h-4 w-4" />
              {post.commentCount}
            </button>
            <button className="inline-flex items-center gap-2 hover:text-zinc-200">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
