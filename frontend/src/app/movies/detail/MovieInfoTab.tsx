// src/app/movie/[movieId]/_components/tabs/MovieInfoTab.tsx
import React from "react";

type MovieDetail = {
  overview?: string;
  director?: string;
  genres?: string[];
  year?: number | string;
};

export default function MovieInfoTab({ movie }: { movie: MovieDetail }) {
  return (
    <div className="mt-5 space-y-5">
      <div>
        <div className="text-xs text-zinc-400">설명</div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
          {movie.overview ?? "-"}
        </p>
      </div>

      <div>
        <div className="text-xs text-zinc-400">감독</div>
        <div className="mt-2 text-sm text-zinc-200">{movie.director ?? "-"}</div>
      </div>

      <div>
        <div className="text-xs text-zinc-400">장르</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(movie.genres ?? []).length ? (
            movie.genres!.map((g) => (
              <span
                key={g}
                className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200"
              >
                {g}
              </span>
            ))
          ) : (
            <span className="text-sm text-zinc-200">-</span>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs text-zinc-400">출시일</div>
        <div className="mt-2 text-sm text-zinc-200">{movie.year ?? "-"}</div>
      </div>
    </div>
  );
}
