"use client";

import Image from "next/image";

type TrailerItem = {
  id: string;
  title: string;
  duration: string;
  thumb: string;
};

export default function TrailerRow({ items }: { items: TrailerItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 text-left"
        >
          <div className="relative aspect-video w-full">
            <Image
              src={it.thumb}
              alt={it.title}
              fill
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-zinc-200">
              {it.duration}
            </div>
          </div>
          <div className="px-3 py-3">
            <div className="truncate text-sm text-zinc-200">{it.title}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
