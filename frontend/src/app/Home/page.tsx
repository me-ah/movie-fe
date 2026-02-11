"use client";

import { Info, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	getHomeMain,
	getHomeSub,
	type MainMovie,
	type SubCategory,
} from "@/api/home";
import { HomeCarouselSection } from "./_components";

function embedUrlWithParams(embedUrl: string): string {
	try {
		const url = new URL(embedUrl);
		const pathMatch = url.pathname.match(/\/embed\/([^/]+)/);
		const videoId = pathMatch?.[1] ?? "";
		url.searchParams.set("autoplay", "1");
		url.searchParams.set("mute", "1");
		url.searchParams.set("loop", "1");
		url.searchParams.set("controls", "0");
		url.searchParams.set("playlist", videoId);
		return url.toString();
	} catch {
		return embedUrl;
	}
}

export default function Home() {
	const router = useRouter();
	const [main, setMain] = useState<MainMovie[]>([]);
	const [sub, setSub] = useState<SubCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);

	const featuredMovie = main[0];

	useEffect(() => {
		getHomeMain()
			.then((data) => setMain(data.main ?? []))
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		getHomeSub()
			.then((data) => setSub(data.sub ?? []))
			.catch(() => setSub([]));
	}, []);

	const heroVideoUrl = useMemo(
		() =>
			featuredMovie?.movie_video
				? embedUrlWithParams(featuredMovie.movie_video)
				: null,
		[featuredMovie?.movie_video],
	);

	return (
		<div>
			<main className="md:ml-20 pb-20 md:pb-0">
				<div className="relative h-[70vh] overflow-hidden">
					{loading && (
						<div className="absolute inset-0 bg-[#0A0B10]" aria-hidden />
					)}
					{!loading && featuredMovie && (
						<>
							{featuredMovie.movie_poster && (
								<div className="absolute inset-0">
									<Image
										width={1000}
										height={1000}
										src={featuredMovie.movie_poster}
										alt=""
										className="w-full h-full object-cover"
										unoptimized
									/>
								</div>
							)}
							{heroVideoUrl && (
								<div className="absolute inset-0 overflow-hidden">
									<iframe
										className="absolute border-0 pointer-events-none"
										style={{
											width: "100vw",
											height: "56.25vw",
											minHeight: "100%",
											minWidth: "177.78vh",
											left: "50%",
											top: "50%",
											transform: "translate(-50%, -50%)",
										}}
										src={heroVideoUrl}
										title={featuredMovie.movie_title}
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
								</div>
							)}
						</>
					)}
					{!loading && error && (
						<div className="absolute inset-0 bg-[#0A0B10] flex items-center justify-center text-gray-400">
							콘텐츠를 불러올 수 없습니다.
						</div>
					)}

					<div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10] via-[#0A0B10]/60 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-r from-[#0A0B10] via-transparent to-transparent" />

					{featuredMovie && (
						<div className="absolute bottom-0 left-0 right-0 p-8 pb-12">
							<div className="max-w-2xl">
								<h1 className="text-white text-5xl mb-4">
									{featuredMovie.movie_title}
								</h1>
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => {
											if (featuredMovie.movie_video)
												window.open(featuredMovie.movie_video, "_blank");
										}}
										className="flex items-center gap-2 px-8 py-3 bg-[#3B66FF] text-white rounded-lg hover:bg-[#2A55EE] transition-colors"
									>
										<Play className="w-5 h-5" fill="white" />
										재생
									</button>
									<button
										type="button"
										onClick={() =>
											router.push(`/movies/${featuredMovie.movie_id}`)
										}
										className="flex items-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors"
									>
										<Info className="w-5 h-5" />
										상세 정보
									</button>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="py-8">
					{sub.map((category) => (
						<HomeCarouselSection
							key={`sub-${category.category_title}`}
							category={category}
							onMovieClick={() => router.push("/shorts")}
						/>
					))}
				</div>
			</main>
		</div>
	);
}
