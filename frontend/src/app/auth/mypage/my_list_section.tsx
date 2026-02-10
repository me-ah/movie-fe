"use client";

import Image from "next/image";

export type PosterItem = {
	id: string;
	title: string;
	posterUrl?: string | null;
};

type Props = {
	title: string;
	items: PosterItem[];
	emptyText?: string;
};

export default function MyListSection({
	title,
	items,
	emptyText = "표시할 항목이 없습니다.",
}: Props) {
	return (
		<section className="mt-14">
			<h2 className="text-3xl font-semibold tracking-tight">{title}</h2>

			<div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
				{items.length === 0 ? (
					<p className="text-zinc-400">{emptyText}</p>
				) : (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{items.map((it) => (
							<div key={it.id} className="group">
								<div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
									<Image
										src={it.posterUrl ?? "/images/poster-placeholder.jpg"}
										alt={it.title}
										fill
										className="object-cover transition-transform group-hover:scale-[1.03]"
										sizes="(max-width: 768px) 50vw, 25vw"
									/>
								</div>
								<div className="mt-2 line-clamp-2 text-sm text-zinc-200">
									{it.title}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
