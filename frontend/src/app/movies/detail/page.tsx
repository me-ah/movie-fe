"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Play } from "lucide-react";

import RecommendsRow, { RecommendItem as RecommendRowItem } from "./RecommendsRow";
import MovieInfoTab from "./MovieInfoTab";
import MovieReviewsTab, { ReviewItem } from "./MovieReviewsTab";

import { movieApi } from "@/api/movie";

// 탭용 상세
type MovieDetail = {
  overview?: string;
  director?: string;
  genres?: string[];
  year?: number | string;
};

// ✅ 백엔드에서 "한 번에" 내려주는 상세페이지 응답 형태
type MoviePageData = {
  trailer?: string;
  title: string;
  rank?: string | number;
  year?: string | number;
  poster?: string;
  runtime?: string | number;
  ott_list?: string[];

  MovieDetail?: MovieDetail;
  ReviewItem?: ReviewItem | ReviewItem[];

  recommend_list?: RecommendRowItem[];
};

type TabKey = "info" | "reviews";

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeMoviePageData(data: any) {
  const page: MoviePageData = {
    trailer: data?.trailer ?? data?.trailerUrl ?? data?.trailer_url,
    title: data?.title ?? "",
    rank: data?.rank ?? data?.vote_average,
    year:
      data?.year ??
      (typeof data?.release_date === "string" ? data.release_date.slice(0, 4) : undefined),
    poster: data?.poster ?? data?.posterUrl ?? data?.poster_path ?? undefined,
    runtime: data?.runtime,
    ott_list: Array.isArray(data?.ott_list) ? data.ott_list : undefined,

    MovieDetail: data?.MovieDetail ?? data?.movieDetail ?? data?.detail,
    ReviewItem: data?.ReviewItem ?? data?.reviews ?? data?.review,

    recommend_list: Array.isArray(data?.recommend_list) ? data.recommend_list : [],
  };

  return {
    page,
    movieDetail: (page.MovieDetail ?? {}) as MovieDetail,
    reviews: asArray<ReviewItem>(page.ReviewItem),
    recommends: asArray<RecommendRowItem>(page.recommend_list),
  };
}

export default function MovieDetailClient({ movieId }: { movieId: string }) {
  const [tab, setTab] = useState<TabKey>("info");
  const [liked, setLiked] = useState(false);

  const [pageData, setPageData] = useState<MoviePageData | null>(null);
  const [movieDetail, setMovieDetail] = useState<MovieDetail>({});
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [recommends, setRecommends] = useState<RecommendRowItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchOnce() {
      setLoading(true);
      setErr(null);

      try {
        // ✅ 여기서 "한 번"만 호출하는게 맞음 (UI 컴포넌트는 apiClient를 직접 몰라도 됨)
        const res = await movieApi.getMoviePage(movieId);
        if (!mounted) return;

        const final = normalizeMoviePageData(res);

        setPageData(final.page);
        setMovieDetail(final.movieDetail);
        setReviews(final.reviews);
        setRecommends(final.recommends);
      } catch (e) {
        if (!mounted) return;
        setErr("영화 정보를 불러오지 못했습니다.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchOnce();
    return () => {
      mounted = false;
    };
  }, [movieId]);

  const metaText = useMemo(() => {
    if (!pageData) return "";
    const rating = pageData.rank != null ? `${pageData.rank}` : "-";
    const year = pageData.year ?? "-";

    const runtimeText =
      pageData.runtime == null
        ? "-"
        : typeof pageData.runtime === "number"
          ? `${Math.floor(pageData.runtime / 60)}시간 ${pageData.runtime % 60}분`
          : /^\d+$/.test(String(pageData.runtime))
            ? (() => {
                const n = Number(pageData.runtime);
                return `${Math.floor(n / 60)}시간 ${n % 60}분`;
              })()
            : String(pageData.runtime);

    return `⭐ ${rating}  •  ${year}  •  ${runtimeText}`;
  }, [pageData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-zinc-400">불러오는 중...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-rose-300">{err}</div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-zinc-400">
          영화 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  // ✅ 이제 백엔드 poster 쓰기
  const heroImage = pageData.poster ?? "/images/profile.jpg";
  const title = pageData.title;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <div className="relative aspect-video w-full">
              <Image src={heroImage} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="border border-white/15 bg-white/10 hover:bg-white/20">
                  <Play className="mr-2 h-4 w-4" />
                  Trailer
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <div className="mt-2 text-sm text-zinc-400">{metaText}</div>

            <div className="mt-5 flex items-center gap-2">
               {(pageData.ott_list ?? []).length ? (
                    pageData.ott_list!.map((ott) => (
                    <Button
                        key={ott}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        {ott.toUpperCase()}
                    </Button>
                    ))
                ) : (
                    <span className="text-sm text-zinc-400">제공 OTT 정보 없음</span>
                )}

              <Button
                variant="secondary"
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                onClick={() => setLiked((v) => !v)}
              >
                <Heart className={liked ? "h-4 w-4 text-red-400" : "h-4 w-4"} />
              </Button>

              <Button variant="secondary" className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 border-b border-zinc-800">
              <div className="flex gap-6 text-sm">
                <button
                  className={[
                    "pb-3 transition",
                    tab === "info" ? "text-zinc-100 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setTab("info")}
                >
                  영화 정보
                </button>

                <button
                  className={[
                    "pb-3 transition",
                    tab === "reviews" ? "text-zinc-100 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setTab("reviews")}
                >
                  시청자 리뷰
                </button>
              </div>
            </div>

            {tab === "info" && <MovieInfoTab movie={movieDetail} />}
            {tab === "reviews" && <MovieReviewsTab reviews={reviews} loading={false} />}
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">"{title}"가 재밌다면?</h2>
          <div className="mt-4">
            {/* ✅ 이제 타입 정확히 맞음 */}
            <RecommendsRow items={recommends} />
          </div>
        </section>
      </main>
    </div>
  );
}
