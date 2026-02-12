"use client";

import { Button } from "@/components/ui/button";

export type AdminMenuKey = "members" | "movies" | "reviews";

export default function AdminSidebar({
	value,
	onChange,
}: {
	value: AdminMenuKey;
	onChange: (v: AdminMenuKey) => void;
}) {
	return (
		<>
			<div className="px-3 py-3">
				<div className="text-lg font-semibold text-zinc-300">Admin</div>
			</div>

			<nav className="mt-2 space-y-1 px-2 pb-2">
				<Button
					type="button"
					variant="ghost"
					onClick={() => onChange("members")}
					className={`w-full justify-start rounded-xl ${
						value === "members"
							? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800"
							: "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
					}`}
				>
					회원정보
				</Button>

				<Button
					type="button"
					variant="ghost"
					onClick={() => onChange("movies")}
					className={`w-full justify-start rounded-xl ${
						value === "movies"
							? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800"
							: "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
					}`}
				>
					영화 정보
				</Button>

				<Button
					type="button"
					variant="ghost"
					onClick={() => onChange("reviews")}
					className={`w-full justify-start rounded-xl ${
						value === "reviews"
							? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800"
							: "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
					}`}
				>
					리뷰 정보
				</Button>
			</nav>
		</>
	);
}
