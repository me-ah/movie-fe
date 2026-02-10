"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { createReview, type CreateReviewPayload } from "@/api/review";

type CreateReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void; // 생성 후 리스트 재조회/갱신용(선택)
};

export default function CreateReviewDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateReviewDialogProps) {
  const [title, setTitle] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [rating, setRating] = useState<number>(9);
  const [content, setContent] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setMovieTitle("");
    setRating(9);
    setContent("");
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // 닫힐 때 폼 초기화하고 싶으면 주석 해제
    // reset();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) return setError("제목을 입력하세요.");
    if (!movieTitle.trim()) return setError("영화 제목을 입력하세요.");
    if (!content.trim()) return setError("내용을 입력하세요.");
    if (Number.isNaN(rating) || rating < 0 || rating > 10)
      return setError("평점은 0~10 사이로 입력하세요.");

    const payload: CreateReviewPayload = {
      title: title.trim(),
      movie_title: movieTitle.trim(),
      rating,
      content: content.trim(),
    };

    setSubmitting(true);
    try {
      await createReview(payload);
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      setError("리뷰 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">게시글 생성</DialogTitle>
          <DialogDescription className="text-zinc-400">
            영화 리뷰를 작성해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm text-zinc-300">제목</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 정말 재미있는 영화!"
              className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-zinc-300">영화 제목</div>
            <Input
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="예) 어벤져스 1"
              className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-zinc-300">평점 (0~10)</div>
            <Input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min={0}
              max={10}
              className="border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-zinc-300">내용</div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="감상평을 작성하세요..."
              className="min-h-[140px] border-zinc-800 bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {submitting ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
