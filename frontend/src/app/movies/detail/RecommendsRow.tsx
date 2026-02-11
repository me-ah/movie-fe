"use client";

import Image from "next/image";

export type RecommendItem = {
  id: string | number;
  title: string;
  poster: string; // 백엔드에서 내려주는 poster
};

export default function RecommendsRow({
  items,
}: {
  items: RecommendItem[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 text-left"
        >
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={it.poster}
              alt={it.title}
              fill
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>
          <div className="px-3 py-3">
            <div className="truncate text-sm text-zinc-200">
              {it.title}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
