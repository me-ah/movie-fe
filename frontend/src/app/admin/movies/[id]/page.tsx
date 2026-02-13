"use client";

import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AdminMovieDetail, getAdminMovieDetail } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MovieDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params.id);

	const [movie, setMovie] = useState<AdminMovieDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;

		async function fetchMovie() {
			setLoading(true);
			try {
				const data = await getAdminMovieDetail(id);
				setMovie(data);
			} catch (error) {
				console.error(error);
				setErr("영화 정보를 불러오지 못했습니다.");
			} finally {
				setLoading(false);
			}
		}

		fetchMovie();
	}, [id]);

	if (loading) {
		return <div className="p-8 text-zinc-400">로딩 중...</div>;
	}

	if (err || !movie) {
		return (
			<div className="p-8">
				<div className="text-rose-400 mb-4">
					{err || "영화를 찾을 수 없습니다."}
				</div>
				<Button onClick={() => router.back()} variant="outline">
					뒤로 가기
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}
					className="text-zinc-400"
				>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<h1 className="text-2xl font-bold text-zinc-100">{movie.title}</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Poster & Basic Info */}
				<Card className="p-6 border-zinc-800 bg-zinc-900/50 md:col-span-1">
					{movie.poster_path ? (
						<Image
							src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
							alt={movie.title}
							className="w-full rounded-lg shadow-lg mb-4"
						/>
					) : (
						<div className="w-full aspect-[2/3] bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 mb-4">
							No Poster
						</div>
					)}
					<div className="space-y-2 text-sm text-zinc-300">
						<div className="flex justify-between">
							<span className="text-zinc-500">개봉일</span>
							<span>{movie.release_date}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-zinc-500">상태</span>
							<span>{movie.is_in_theaters ? "상영 중" : "상영 종료"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-zinc-500">장르 ID</span>
							<span>{movie.genres.join(", ")}</span>
						</div>
					</div>
				</Card>

				{/* Detail Info */}
				<Card className="p-6 border-zinc-800 bg-zinc-900/50 md:col-span-2 space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-zinc-200 mb-2">줄거리</h3>
						<p className="text-zinc-400 leading-relaxed">
							{movie.overview || "줄거리가 없습니다."}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
							<div className="text-sm text-zinc-500 mb-1">
								평점 (Vote Average)
							</div>
							<div className="text-xl font-bold text-zinc-200">
								{movie.vote_average.toFixed(1)}
							</div>
						</div>
						<div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
							<div className="text-sm text-zinc-500 mb-1">조회수</div>
							<div className="text-xl font-bold text-zinc-200">
								{movie.view_count.toLocaleString()}
							</div>
						</div>
						<div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
							<div className="text-sm text-zinc-500 mb-1">좋아요</div>
							<div className="text-xl font-bold text-zinc-200">
								{movie.like_count.toLocaleString()}
							</div>
						</div>
						<div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800">
							<div className="text-sm text-zinc-500 mb-1">리뷰 평점</div>
							<div className="text-xl font-bold text-zinc-200">
								{movie.review_average.toFixed(1)}
							</div>
						</div>
					</div>

					{movie.youtube_key && (
						<div>
							<h3 className="text-lg font-semibold text-zinc-200 mb-2">
								예고편
							</h3>
							<div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
								<iframe
									width="100%"
									height="100%"
									src={`https://www.youtube.com/embed/${movie.youtube_key}`}
									title="YouTube video player"
									frameBorder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
								/>
							</div>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
