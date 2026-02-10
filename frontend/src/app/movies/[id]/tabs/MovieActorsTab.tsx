// src/app/movie/[movieId]/_components/tabs/MovieActorsTab.tsx
import Image from "next/image";
import React from "react";

export type ActorItem = {
  id: string | number;
  name: string;
  character?: string;
  profileUrl?: string | null;
};

export default function MovieActorsTab({
  actors,
  loading,
}: {
  actors?: ActorItem[];
  loading?: boolean;
}) {
  if (loading) {
    return <div className="mt-6 text-sm text-zinc-400">출연진 불러오는 중...</div>;
  }

  if (!actors?.length) {
    return <div className="mt-6 text-sm text-zinc-400">출연진 영역 (API 붙이면 렌더)</div>;
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {actors.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-zinc-800">
            <Image
              src={a.profileUrl ?? "/images/profile.jpg"}
              alt={a.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 33vw, 20vw"
            />
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium text-zinc-100">{a.name}</div>
            <div className="mt-1 text-xs text-zinc-400">{a.character ?? ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
