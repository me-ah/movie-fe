"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { CommunityPost } from "./types";
import ShareDialog from "@/app/community/ShareDialog";
import CommentsDialog from "@/app/community/CommentDialog";

import { getUser } from "@/lib/userStorage";
import { deleteReview } from "@/api/review";

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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ❤️ 좋아요 상태 (임시: API 붙이면 서버 값으로 초기화)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const me = getUser?.();
  const isMine =
    me?.user_id != null &&
    String(me.user_id) === String((post as any)?.author?.id);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/community/${post.id}`;
  }, [post.id]);

  const handleToggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    // TODO: API 연결
    // await api.post(`/api/review/${post.id}/like/`)
  };

  const handleDelete = async () => {
    const ok = confirm("정말 삭제할까요?");
    if (!ok) return;

    try {
      await deleteReview(post.id);
      window.location.reload();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        alert("본인 게시글만 삭제할 수 있습니다.");
      } else {
        alert("삭제에 실패했습니다.");
      }
    }
  };

  return (
    <>
      <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-100 shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
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
                <div className="font-semibold">{post.author.name}</div>
                <div className="text-sm text-zinc-400">{post.author.handle}</div>
              </div>
              <div className="text-sm text-zinc-500">
                {new Date(post.createdAt).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </div>
            </div>

            {post.movie && (
              <div className="mt-4 flex items-start gap-4">
                <div className="relative h-20 w-16 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
                  <Image
                    src={post.movie.posterUrl ?? "/images/profile.jpg"}
                    alt={post.movie.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    {post.movie.title}
                  </div>
                  <Stars value={post.rating} />
                </div>
              </div>
            )}

            <p className="mt-4 leading-relaxed text-zinc-300">{post.content}</p>

            {/* ✅ 액션 바 */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleLike}
                  className={`gap-2 ${
                    liked
                      ? "text-red-500 hover:text-red-500"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      liked ? "fill-red-500" : ""
                    }`}
                  />
                  {likeCount}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentsOpen(true)}
                  className="gap-2 text-zinc-400 hover:text-zinc-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount}
                </Button>

                <Button
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
                  <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                    수정
                  </Button>
                  <Button
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

      <CommentsDialog open={commentsOpen} onOpenChange={setCommentsOpen} postId={post.id} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} postId={post.id} />
    </>
  );
}
