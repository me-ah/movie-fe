"use client";

import { useMemo, useState } from "react";
import type { ReviewComment } from "@/api/reviews";
import { deleteReviewComment, updateReviewComment } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUser } from "@/lib/userStorage";

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function pickUserName(user?: ReviewComment["user"]) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  return user?.username ?? (fullName || "anonymous");
}

export default function CommentsList({
  reviewId,
  comments,
  onChanged,
}: {
  reviewId: number | string;
  comments: ReviewComment[];
  onChanged: () => void; // 수정/삭제 후 부모에서 fetchComments 다시 호출
}) {
  const me = getUser?.();
  const myId = me?.user_id != null ? String(me.user_id) : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isMine = (c: ReviewComment) =>
    myId != null && String(c.user?.id) === myId;

  const startEdit = (c: ReviewComment) => {
    setEditingId(String(c.id));
    setEditText(c.content ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const submitEdit = async (commentId: number | string) => {
    const content = editText.trim();
    if (!content) return;

    const idStr = String(commentId);
    setBusyId(idStr);
    try {
      await updateReviewComment(reviewId, commentId, content);
      cancelEdit();
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (commentId: number | string) => {
    const ok = confirm("댓글을 삭제할까요?");
    if (!ok) return;

    const idStr = String(commentId);
    setBusyId(idStr);
    try {
      await deleteReviewComment(reviewId, commentId);
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {comments.map((c) => {
        const mine = isMine(c);
        const isEditing = editingId === String(c.id);
        const busy = busyId === String(c.id);

        return (
          <div
            key={String(c.id)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-zinc-100">
                  {pickUserName(c.user)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {formatTime(c.created_at)}
                </div>
              </div>

              {mine && !isEditing && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(c)}
                    className="text-zinc-300 hover:text-zinc-100"
                    disabled={busy}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={busy}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                {c.content}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="border-zinc-800 bg-zinc-950/40 text-zinc-100"
                  disabled={busy}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelEdit}
                    className="border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    disabled={busy}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={() => submitEdit(c.id)}
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={busy || !editText.trim()}
                  >
                    {busy ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
