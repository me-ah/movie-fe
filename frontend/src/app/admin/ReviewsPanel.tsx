"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  getAdminReviewList,
  type AdminReviewItem,
  type AdminStats,
} from "@/api/admin";

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="border border-zinc-800 bg-zinc-900/30 px-5 py-4">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-100">{value}</div>
    </Card>
  );
}

export default function ReviewsPanel() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

  useEffect(() => {
    let mounted = true;

    async function fetchReviews() {
      setLoading(true);
      setErr(null);
      try {
        const data = await getAdminReviewList({ page, page_size: pageSize });
        if (!mounted) return;

        setItems(Array.isArray(data.results) ? data.results : []);
        setCount(typeof data.count === "number" ? data.count : 0);
        setStats(data.admin_stats ?? null);
      } catch (e) {
        if (!mounted) return;
        setErr("리뷰 목록을 불러오지 못했습니다.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchReviews();
    return () => {
      mounted = false;
    };
  }, [page]);

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    // "2025-07-26T14:44:02.762177Z" -> "2025-07-26"
    return iso.slice(0, 10);
  };

  return (
    <>
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">리뷰정보 관리</h1>
        <p className="mt-2 text-sm text-zinc-400">리뷰 데이터를 조회/관리합니다.</p>
      </header>

      {/* admin_stats 요약 */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard title="총 리뷰" value={stats.total_posts} />
          <StatCard title="총 유저" value={stats.total_users} />
          <StatCard title="총 댓글" value={stats.total_comments} />
          <StatCard title="현재 페이지 size" value={stats.current_page_size} />
        </div>
      )}

      <Card className="border border-zinc-800 bg-zinc-900/30">
        {/* header row */}
        <div className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-200">
              리뷰 목록 <span className="ml-2 text-xs text-zinc-500">총 {count}개</span>
            </div>

            <div className="flex items-center gap-2">
              <Button className="bg-blue-500 hover:bg-blue-600">리뷰 추가</Button>
            </div>
          </div>
        </div>

        {err && (
          <div className="px-6 py-4 text-sm text-rose-300">{err}</div>
        )}

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-zinc-950/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  리뷰 제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  영화 제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  평점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  리뷰 작성자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
                  리뷰 작성일
                </th>
              </tr>
            </thead>

           <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-400">
                불러오는 중...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-400">
                리뷰가 없습니다.
              </td>
            </tr>
          ) : (
            items.map((r, idx) => {
              const no = (page - 1) * pageSize + (idx + 1);
              return (
                <tr
                  key={r.id}
                  className="border-t border-zinc-800/80 hover:bg-zinc-950/30"
                >
                  <td className="px-6 py-4 text-sm text-zinc-200">{no}</td>

                  <td className="px-6 py-4 text-sm text-zinc-200">
                    <div className="max-w-[320px] truncate">{r.title}</div>
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-300">
                    <div className="max-w-[220px] truncate">{r.movie_title}</div>
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-200">{r.rank}</td>

                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {r.user?.username ?? "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-zinc-300">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-center gap-2 border-t border-zinc-800 px-5 py-4">
          <Button
            variant="secondary"
            className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            이전
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 hover:bg-zinc-800"
            disabled
          >
            {page} / {totalPages}
          </Button>

          <Button
            variant="secondary"
            className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            다음
          </Button>
        </div>
      </Card>
    </>
  );
}
