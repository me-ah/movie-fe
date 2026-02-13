"use client";

import { useEffect, useMemo, useState } from "react";
import { type AdminMovieItem, getAdminMovieList } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MoviesPanel() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");

	const [movies, setMovies] = useState<AdminMovieItem[]>([]);
	const [count, setCount] = useState(0);
	const [next, setNext] = useState<string | null>(null);
	const [previous, setPrevious] = useState<string | null>(null);

	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function fetchMovies() {
			setLoading(true);
			setErr(null);
			try {
				const data = await getAdminMovieList({
					page,
					page_size: pageSize,
					search,
				});
				if (!mounted) return;

				setMovies(Array.isArray(data.results) ? data.results : []);
				setCount(typeof data.count === "number" ? data.count : 0);
				setNext(data.next ?? null);
				setPrevious(data.previous ?? null);
			} catch {
				if (!mounted) return;
				setErr("영화 목록을 불러오지 못했습니다.");
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		fetchMovies();
		return () => {
			mounted = false;
		};
	}, [page, pageSize, search]);

	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(count / pageSize));
	}, [count, pageSize]);

	const formatDate = (iso?: string) => {
		if (!iso) return "-";
		return iso.slice(0, 10);
	};

	const formatGenre = (m: AdminMovieItem) => {
		if (typeof m.genre === "string" && m.genre.trim()) return m.genre;
		if (Array.isArray(m.genres) && m.genres.length > 0)
			return String(m.genres.join(", "));
		return "-";
	};

	const voteAvg = (m: AdminMovieItem) =>
		typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "-";

	const popularity = (m: AdminMovieItem) =>
		typeof m.popularity === "number" ? m.popularity.toFixed(1) : "-";

	const titleOf = (m: AdminMovieItem) => m.title ?? m.original_title ?? "-";

	return (
		<>
			<header className="mb-5">
				<h1 className="text-3xl font-semibold tracking-tight">영화정보 관리</h1>
				<p className="mt-2 text-sm text-zinc-400">
					영화 데이터를 조회/관리합니다.
				</p>
			</header>

			<Card className="border border-zinc-800 bg-zinc-900/30">
				{/* header row */}
				<div className="border-b border-zinc-800 px-5 py-4">
					<div className="flex items-center justify-between">
						<div className="text-sm font-medium text-zinc-200">
							영화 목록{" "}
							<span className="ml-2 text-xs text-zinc-500">총 {count}개</span>
						</div>

						<div className="flex items-center gap-2">
							<select
								className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
								value={pageSize}
								onChange={(e) => {
									setPageSize(Number(e.target.value));
									setPage(1);
								}}
							>
								<option value={10}>10개씩</option>
								<option value={20}>20개씩</option>
								<option value={50}>50개씩</option>
							</select>
							<div className="flex items-center gap-1">
								<Input
									placeholder="영화 제목 검색..."
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											setPage(1);
											setSearch(searchInput);
										}
									}}
									className="h-9 w-48 bg-zinc-950 text-sm text-zinc-200"
								/>
								<Button
									variant="secondary"
									className="h-9 border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
									onClick={() => {
										setPage(1);
										setSearch(searchInput);
									}}
								>
									검색
								</Button>
							</div>
							<Button className="h-9 bg-blue-500 hover:bg-blue-600">
								영화 추가
							</Button>
						</div>
					</div>
				</div>

				{err && <div className="px-6 py-4 text-sm text-rose-300">{err}</div>}

				{/* table */}
				<div className="overflow-x-auto">
					<table className="w-full min-w-[900px]">
						<thead>
							<tr className="bg-zinc-950/40">
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									번호
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									영화명
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									개봉일
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									평점
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									인기도
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-zinc-400">
									장르
								</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-10 text-center text-sm text-zinc-400"
									>
										불러오는 중...
									</td>
								</tr>
							) : movies.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-10 text-center text-sm text-zinc-400"
									>
										영화가 없습니다.
									</td>
								</tr>
							) : (
								movies.map((m, idx) => (
									<tr
										key={String(m.id)}
										className="border-t border-zinc-800/80 hover:bg-zinc-950/30"
									>
										<td className="px-6 py-4 text-sm text-zinc-200">
											{(page - 1) * movies.length + idx + 1}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-200">
											<div className="max-w-[260px] truncate">{titleOf(m)}</div>
										</td>
										<td className="px-6 py-4 text-sm text-zinc-300">
											{formatDate(m.release_date)}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-200">
											{voteAvg(m)}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-300">
											{popularity(m)}
										</td>
										<td className="px-6 py-4 text-sm text-zinc-300">
											{formatGenre(m)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* pagination */}
				<div className="flex items-center justify-center gap-2 border-t border-zinc-800 px-5 py-4">
					<Button
						variant="secondary"
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={!previous || loading || page <= 1}
					>
						이전
					</Button>

					<Button
						type="button"
						variant="secondary"
						className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200"
						disabled
					>
						{page} / {totalPages}
					</Button>

					<Button
						variant="secondary"
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
						onClick={() => setPage((p) => p + 1)}
						disabled={!next || loading}
					>
						다음
					</Button>
				</div>
			</Card>
		</>
	);
}
