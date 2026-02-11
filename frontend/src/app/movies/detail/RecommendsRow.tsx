"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export type RecommendItem = {
  id: string | number;
  title: string;
  poster: string;
};

export default function RecommendsRow({
  items,
  onSelect,
}: {
  items: RecommendItem[];
  onSelect: (movieId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <Button
          key={it.id}
          type="button"
          variant="ghost"
          onClick={() => onSelect(String(it.id))}
          className="group h-auto overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 p-0 text-left hover:bg-zinc-900/40"
        >
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={it.poster || "/images/profile.jpg"}
              alt={it.title}
              fill
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>
          <div className="px-3 py-3">
            <div className="truncate text-sm text-zinc-200">{it.title}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
