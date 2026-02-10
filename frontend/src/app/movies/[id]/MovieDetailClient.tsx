"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Play } from "lucide-react";
import TrailerRow from "./TrailerRow";

import MovieInfoTab from "./tabs/MovieInfoTab";
import MovieActorsTab, { ActorItem } from "./tabs/MovieActorsTab";
import MovieReviewsTab, { ReviewItem } from "./tabs/MovieReviewsTab";

// ✅ src/api/movie/index.ts 에서 `export const movieApi = { ... }` 해둔 경우
import { movieApi } from "@/api/movie";

type MovieDetail = {
  id: number | string;
  title: string;
  overview?: string;
  director?: string;
  genres?: string[];
  year?: number | string;
  runtime?: number;
  vote_average?: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
};

type TabKey = "info" | "actors" | "reviews";

// ✅ 백엔드 응답 -> 프론트 MovieDetail 매핑 (필드명 다르면 여기만 고치면 됨)
function mapToMovieDetail(data: any): MovieDetail {
  // 이미 프론트 타입과 같은 형태로 오는 경우
  if (data?.posterUrl !== undefined || data?.backdropUrl !== undefined) {
    return data as MovieDetail;
  }

  // TMDB/백엔드에서 자주 쓰는 snake_case 대응
  const genres =
    Array.isArray(data?.genres)
      ? data.genres.map((g: any) => (typeof g === "string" ? g : g?.name)).filter(Boolean)
      : undefined;

  const year =
    data?.year ??
    (typeof data?.release_date === "string" ? data.release_date.slice(0, 4) : undefined);

  return {
    id: data?.id ?? data?.movie_id ?? "",
    title: data?.title ?? data?.movie_title ?? "",
    overview: data?.overview,
    director: data?.director,
    genres,
    year,
    runtime: data?.runtime,
    vote_average: data?.vote_average,
    posterUrl: data?.posterUrl ?? data?.poster_path ?? data?.poster,
    backdropUrl: data?.backdropUrl ?? data?.backdrop_path ?? data?.backdrop,
    trailerUrl: data?.trailerUrl ?? data?.trailer_url,
  };
}

export default function MovieDetailClient({ movieId }: { movieId: string }) {
  const [tab, setTab] = useState<TabKey>("info");
  const [liked, setLiked] = useState(false);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [actors, setActors] = useState<ActorItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [actorsLoading, setActorsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      setLoading(true);
      setErr(null);
      setActorsLoading(true);
      setReviewsLoading(true);

      try {
        const [detail, actorData, reviewData] = await Promise.all([
          movieApi.getMovieDetail(movieId),
          movieApi.getMovieActors(movieId),
          movieApi.getMovieReviews(movieId),
        ]);

        if (!mounted) return;

        setMovie(mapToMovieDetail(detail));
        setActors((actorData ?? []) as ActorItem[]);
        setReviews((reviewData ?? []) as ReviewItem[]);
      } catch (e) {
        if (!mounted) return;
        setErr("영화 정보를 불러오지 못했습니다.");
      } finally {
        if (!mounted) return;
        setLoading(false);
        setActorsLoading(false);
        setReviewsLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [movieId]);

  const metaText = useMemo(() => {
    if (!movie) return "";
    const rating = movie.vote_average != null ? `${Number(movie.vote_average).toFixed(1)}` : "-";
    const year = movie.year ?? "-";
    const runtime =
      typeof movie.runtime === "number"
        ? `${Math.floor(movie.runtime / 60)}시간 ${movie.runtime % 60}분`
        : "-";
    return `⭐ ${rating}  •  ${year}  •  ${runtime}`;
  }, [movie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-zinc-400">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-rose-300">
          {err}
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-zinc-400">
          영화 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <div className="relative aspect-video w-full">
              <Image
                src={movie.backdropUrl ?? movie.posterUrl ?? "/images/profile.jpg"}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/30 to-transparent" />

              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="border border-white/15 bg-white/10 hover:bg-white/20">
                  <Play className="mr-2 h-4 w-4" />
                  Trailer
                </Button>
              </div>

              <div className="absolute bottom-4 left-4 text-sm text-zinc-200">
                Main Trailer
              </div>
            </div>
          </Card>

          {/* Right */}
          <Card className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6">
            <h1 className="text-3xl font-semibold tracking-tight">{movie.title}</h1>
            <div className="mt-2 text-sm text-zinc-400">{metaText}</div>

            <div className="mt-5 flex items-center gap-2">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Play className="mr-2 h-4 w-4" />
                재생
              </Button>

              <Button
                variant="secondary"
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                onClick={() => setLiked((v) => !v)}
              >
                <Heart className={liked ? "h-4 w-4 text-red-400" : "h-4 w-4"} />
              </Button>

              <Button
                variant="secondary"
                className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-zinc-800">
              <div className="flex gap-6 text-sm">
                <button
                  className={[
                    "pb-3 transition",
                    tab === "info"
                      ? "text-zinc-100 border-b-2 border-blue-500"
                      : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setTab("info")}
                >
                  영화 정보
                </button>

                <button
                  className={[
                    "pb-3 transition",
                    tab === "actors"
                      ? "text-zinc-100 border-b-2 border-blue-500"
                      : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setTab("actors")}
                >
                  출연진
                </button>

                <button
                  className={[
                    "pb-3 transition",
                    tab === "reviews"
                      ? "text-zinc-100 border-b-2 border-blue-500"
                      : "text-zinc-400 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setTab("reviews")}
                >
                  시청자 리뷰
                </button>
              </div>
            </div>

            {/* Tab content */}
            {tab === "info" && <MovieInfoTab movie={movie} />}
            {tab === "actors" && <MovieActorsTab actors={actors} loading={actorsLoading} />}
            {tab === "reviews" && <MovieReviewsTab reviews={reviews} loading={reviewsLoading} />}
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">"{movie.title}"가 재밌다면?</h2>
          <div className="mt-4">
            <TrailerRow items={[]} />
          </div>
        </section>
      </main>
    </div>
  );
}
