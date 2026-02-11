"use client";

import { useAtom } from "jotai";
import Link from "next/link";
import { countAtom } from "@/atoms/setAtoms";
import { Button } from "@/components/ui/button";

export default function Home() {
	const [count, setCount] = useAtom(countAtom);

	return (
		<div className="flex flex-col items-center justify-center gap-6 p-10">
			<h1 className="text-5xl font-bold">여기는 홈화면</h1>

			<div className="text-3xl">
				Count: <span className="font-semibold">{count}</span>
			</div>

			<div className="flex gap-4">
				<button
					type="button"
					className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
					onClick={() => setCount((c) => c + 1)}
				>
					+1
				</button>

				<button
					type="button"
					className="rounded bg-red-500 px-6 py-2 text-white hover:bg-red-600"
					onClick={() => setCount((c) => c - 1)}
				>
					-1
				</button>

				<Button variant="outline">gdgd</Button>

				{/* ✅ 영화 상세로 이동 */}
				<Link href={`/movies/detail/`}>
					<Button className="bg-green-500 hover:bg-green-600">
						movieId 1로 이동
					</Button>
				</Link>
			</div>
		</div>
	);
}
