"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom, useSetAtom, type WritableAtom } from "jotai";
import { Heart, MessageCircle, Play, Share2 } from "lucide-react"; // Play 아이콘 추가
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import YouTube, { type YouTubePlayer, type YouTubeProps } from "react-youtube";
import type { ShortsMovie } from "@/api/shortsMovie";
import { postLike } from "@/api/shortsMovie";
import {
	activeMovieAtom,
	isCommentOpenAtom,
	isShareModalOpenAtom,
	shortsListAtom,
} from "@/atoms/setAtoms";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import CommentPanel from "./commentPanel";

export default function ShortsItem({ movie }: { movie: ShortsMovie }) {
	const { startTracking, stopTracking } = useWatchHistory(movie.movie_id);
	const [_shortsList, setShortsList] = useAtom(shortsListAtom);
	const [isCommentOpen, setIsCommentOpen] = useAtom(isCommentOpenAtom);
	const setIsShareModalOpen = useSetAtom(isShareModalOpenAtom);
	const setActiveMovie = useSetAtom(
		activeMovieAtom as WritableAtom<
			ShortsMovie | null,
			[ShortsMovie | null],
			void
		>,
	);
	const playerRef = useRef<YouTubePlayer | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [videoStarted, setVideoStarted] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const { ref: playRef, inView: isVisible } = useInView({ threshold: 0.8 });

	const { ref: renderRef, inView: hasEntered } = useInView({
		rootMargin: "100% 0px 200% 0px",
		threshold: 0,
		triggerOnce: true,
	});

	const setRefs = (node: HTMLDivElement) => {
		playRef(node);
		renderRef(node);
	};

	const onStateChange = (event: { data: number }) => {
		if (event.data === 1) {
			setIsPlaying(true);
			setVideoStarted(true);
		} else if (event.data === 2) {
			setIsPlaying(false);
		}
	};

	const _onReady: YouTubeProps["onReady"] = (event) => {
		playerRef.current = event.target;
		setIsReady(true);
	};

	useEffect(() => {
		const player = playerRef.current;

		if (!player || !isReady || typeof player.playVideo !== "function") return;

		const handleVisibility = async () => {
			try {
				if (isVisible) {
					setActiveMovie(movie);
					startTracking();
					player.playVideo();
				} else {
					await stopTracking();
					if (typeof player.pauseVideo === "function") {
						player.pauseVideo();
						player.seekTo(0, true);
					}
				}
			} catch (error) {
				console.warn("YouTube Player Interaction Error:", error);
			}
		};

		handleVisibility();

		return () => {
			stopTracking();
		};
	}, [isVisible, isReady, movie, startTracking, stopTracking, setActiveMovie]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		const player = playerRef.current;
		if (
			isPlaying &&
			player &&
			isReady &&
			typeof player.getCurrentTime === "function"
		) {
			interval = setInterval(() => {
				try {
					setCurrentTime(player.getCurrentTime());
					if (duration === 0) setDuration(player.getDuration());
				} catch (_e) {}
			}, 500);
		}
		return () => clearInterval(interval);
	}, [isPlaying, isReady, duration]);

	const handleVideoClick = () => {
		const player = playerRef.current;
		if (!player || !isReady) return;
		if (player.isMuted()) player.unMute();

		if (isPlaying) {
			player.pauseVideo();
		} else {
			player.playVideo();
		}
	};

	const _handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const time = parseFloat(e.target.value);
		setCurrentTime(time);
		if (playerRef.current && isReady) {
			playerRef.current.seekTo(time, true);
		}
	};

	const opts: YouTubeProps["opts"] = {
		height: "100%",
		width: "100%",
		playerVars: {
			autoplay: 1,
			mute: 1,
			controls: 0,
			modestbranding: 1,
			rel: 0,
			iv_load_policy: 3,
			disablekb: 1,
			origin: typeof window !== "undefined" ? window.location.origin : "",
		},
	};

	const toggleLike = async () => {
		setShortsList((prevList) =>
			prevList.map((item) =>
				item.movie_id === movie.movie_id
					? {
							...item,
							is_liked: !item.is_liked,
							like_count: item.is_liked
								? item.like_count - 1
								: item.like_count + 1,
						}
					: item,
			),
		);
		try {
			await postLike(movie.movie_id);
		} catch (error) {
			console.error("좋아요 전송 실패:", error);
		}
	};

	return (
		<div
			ref={setRefs}
			className="flex items-center justify-center h-screen snap-start bg-black"
		>
			<div className="flex items-end gap-4 relative">
				<div className="relative h-[85vh] aspect-[9/16] max-h-[800px] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
					<div className="absolute inset-0 w-full h-full scale-[1.20] transform">
						{movie?.youtube_key && hasEntered ? (
							<button
								type="button"
								className="w-full h-full cursor-pointer relative block p-0 border-none bg-transparent outline-none"
								onClick={handleVideoClick}
							>
								<YouTube
									videoId={movie.youtube_key}
									opts={opts}
									onReady={(e) => {
										playerRef.current = e.target;
										setIsReady(true);
									}}
									onStateChange={onStateChange}
									id={`yt-player-${movie.movie_id}`}
									className={`w-full h-full pointer-events-none transition-opacity duration-700 ${videoStarted && isVisible ? "opacity-100" : "opacity-0"}`}
								/>
							</button>
						) : (
							<div className="w-full h-full bg-zinc-950 flex items-center justify-center text-gray-500">
								영상을 준비 중...
							</div>
						)}
					</div>
					{!isPlaying && videoStarted && isVisible && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-20">
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
							>
								<Play
									fill="white"
									size={64}
									className="text-white opacity-80"
								/>
							</motion.div>
						</div>
					)}
				</div>

				<AnimatePresence>
					{(!videoStarted || !isVisible) && movie?.youtube_key && (
						<motion.div
							initial={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.6 }}
							className="absolute inset-0 w-full h-full z-10 pointer-events-none bg-black"
						>
							<Image
								src={movie.poster_path}
								className="w-full h-full object-cover brightness-[0.5]"
								alt="poster"
								width={40}
								height={40}
								unoptimized
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<div className="absolute bottom-0 left-0 w-full h-[3px] group/bar z-30 transition-all hover:h-[4px]">
					{/* 실제 조작을 담당하는 투명한 input */}
					<input
						type="range"
						min="0"
						max={duration}
						step="0.1"
						value={currentTime}
						onChange={_handleSeek}
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 accent-red-600"
					/>

					{/* 배경 바 */}
					<div className="absolute inset-0 bg-white/15" />

					{/* 붉은색 진행 바 */}
					<div
						className="absolute inset-y-0 left-0 bg-red-600 pointer-events-none transition-all duration-100"
						style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
					>
						{/* 마우스 호버 시 나타나는 동그란 조절 점(선택 사항) */}
						<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/bar:scale-100 transition-transform shadow-lg" />
					</div>
				</div>

				<div className="absolute bottom-0 left-0 w-full p-5 pb-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20">
					<div className="flex items-center gap-2 mb-3 pointer-events-auto">
						<span className="font-bold text-white text-sm">{movie.title}</span>
						<Link
							href={`/movies/detail/${movie.movie_id}`}
							className="pointer-events-auto bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold ml-2 hover:bg-gray-200 transition-colors inline-block"
						>
							상세보기
						</Link>
					</div>
					<p className="text-xs text-white/90 line-clamp-2 pr-4 pointer-events-auto">
						{movie.overview}
					</p>
				</div>
			</div>

			<div className="bottom-4 flex flex-col gap-5 z-20 mb-10">
				<button
					type="button"
					onClick={toggleLike}
					className="flex flex-col items-center group"
				>
					<div
						className={`p-3 rounded-full transition-all ${movie.is_liked ? "bg-red-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
					>
						<Heart
							fill={movie.is_liked ? "white" : "none"}
							color="white"
							size={24}
						/>
					</div>

					<span className="text-xs mt-1 text-white font-medium">
						{movie.like_count}
					</span>
				</button>

				<button
					type="button"
					onClick={() => {
						setIsCommentOpen(!isCommentOpen);
					}}
					className="flex flex-col items-center"
				>
					<div className="bg-zinc-800 p-3 rounded-full hover:bg-zinc-700 transition-all text-white">
						<MessageCircle size={24} />
					</div>
					<span className="text-xs mt-1 text-white font-medium">
						{movie.comment_count}
					</span>
				</button>

				<button
					type="button"
					onClick={() => {
						setIsShareModalOpen(true);
					}}
					className="bg-zinc-800 p-3 rounded-full hover:bg-zinc-700 text-white"
				>
					<Share2 size={24} />
				</button>
			</div>

			<AnimatePresence>
				{isCommentOpen && (
					<motion.div
						initial={{ width: 0, opacity: 0, marginLeft: 0 }}
						animate={{ width: 380, opacity: 1, marginLeft: 80 }}
						exit={{ width: 0, opacity: 0, marginLeft: 0 }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="h-[85vh]"
					>
						<div className="w-full h-full bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
							<CommentPanel />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
