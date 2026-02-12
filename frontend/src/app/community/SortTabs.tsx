"use client";

type SortKey = "created_at" | "popular";

export default function SortTabs({
	value,
	onChange,
}: {
	value: SortKey;
	onChange: (v: SortKey) => void;
}) {
	return (
		<div className="mt-8 border-b border-zinc-800">
			<div className="flex gap-10 text-sm">
				<button
					type="button"
					onClick={() => onChange("created_at")}
					className={`pb-3 transition ${
						value === "created_at"
							? "text-zinc-100 border-b-2 border-blue-500"
							: "text-zinc-500 hover:text-zinc-300"
					}`}
				>
					최신순
				</button>
				<button
					type="button"
					onClick={() => onChange("popular")}
					className={`pb-3 transition ${
						value === "popular"
							? "text-zinc-100 border-b-2 border-blue-500"
							: "text-zinc-500 hover:text-zinc-300"
					}`}
				>
					인기순
				</button>
			</div>
		</div>
	);
}

export type { SortKey };
