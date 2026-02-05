"use client";

import { useAtom } from "jotai";
import { countAtom } from "@/atoms/setAtoms";

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
					className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
					onClick={() => setCount((c) => c + 1)}
				>
					+1
				</button>

				<button
					className="rounded bg-red-500 px-6 py-2 text-white hover:bg-red-600"
					onClick={() => setCount((c) => c - 1)}
				>
					-1
				</button>
			</div>
		</div>
	);
}
