"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom, useSetAtom, type WritableAtom } from "jotai";
import { Heart, MessageCircle, Play, Share2 } from "lucide-react"; // Play 아이콘 추가
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import YouTube, { type YouTubePlayer, type YouTubeProps } from "react-youtube";
import type { ShortsMovie } from "@/api/shortsMovie";
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
	const [videoStarted, setVideoStarted] = useState(false); // [추가] 실제 영상 재생 시작 여부 (유튜브 티 안 내기용)
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	// [감지 1] 실제 시청 여부 (80% 이상 보일 때 재생/정지)
	const { ref: playRef, inView: isVisible } = useInView({ threshold: 0.8 });

	// [감지 2] 렌더링 유지 (체감 로딩 0초를 위한 핵심)
	// triggerOnce: true를 사용하여 한 번 마진에 들어온 영상은 멀어져도 파괴하지 않고 유지합니다.
	const { ref: renderRef, inView: hasEntered } = useInView({
		rootMargin: "100% 0px 200% 0px",
		threshold: 0,
		triggerOnce: true,
	});

	const setRefs = (node: HTMLDivElement) => {
		playRef(node);
		renderRef(node);
	};

	// [중요] 유튜브 플레이어의 실제 상태와 리액트 상태를 동기화
	const onStateChange = (event: { data: number }) => {
		// 1: 재생 중 (PLAYING)
		if (event.data === 1) {
			setIsPlaying(true);
			setVideoStarted(true); // [추가] 실제 첫 프레임이 보이면 포스터를 치우기 위한 신호
		}
		// 2: 일시정지 (PAUSED)
		else if (event.data === 2) {
			setIsPlaying(false);
		}
	};

	const _onReady: YouTubeProps["onReady"] = (event) => {
		playerRef.current = event.target;
		setIsReady(true);
	};

	useEffect(() => {
		const player = playerRef.current;

		// [안전장치] 플레이어가 확실히 있을 때만 실행 (TypeError 방어)
		if (!player || !isReady || typeof player.playVideo !== "function") return;

		try {
			if (isVisible) {
				// 1. 활성 영화 설정: 이제 CommentPanel에서 댓글을 불러올 수 있습니다.
				setActiveMovie(movie);
				// 2. 시청 기록 측정 시작
				startTracking();

				// 3. 실제 영상 재생
				player.playVideo();
			} else {
				// 4. 화면을 벗어나면 기록 전송 및 재생 중지
				stopTracking();
				player.pauseVideo();
				player.seekTo(0, true);
			}
		} catch (error) {
			// 'src' reading null 등 예외 상황 방어
			console.warn("YouTube Player Interaction Error:", error);
		}

		return () => stopTracking(); // 컴포넌트 이탈 시 기록 누락 방지
	}, [isVisible, isReady, movie, startTracking, stopTracking, setActiveMovie]);
	// 3. 재생바 실시간 업데이트
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

	// 2. 영상 클릭 시 일시정지 및 음소거 해제
	const handleVideoClick = () => {
		const player = playerRef.current;
		if (!player || !isReady) return;

		// 사용자가 클릭하는 순간 음소거 해제 (브라우저 정책 대응)
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

	// [수정] 유튜브 '티'를 없애기 위한 설정값 최적화
	const opts: YouTubeProps["opts"] = {
		height: "100%",
		width: "100%",
		playerVars: {
			autoplay: 1,
			mute: 1,
			controls: 0,
			modestbranding: 1, // 유튜브 로고 숨기기
			rel: 0, // 관련 영상 숨기기
			iv_load_policy: 3, // 비디오 주석 숨기기
			disablekb: 1, // 키보드 제어 차단
			origin: typeof window !== "undefined" ? window.location.origin : "",
		},
	};

	const toggleLike = () => {
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
	};

	return (
		<div
			ref={setRefs}
			className="flex items-center justify-center h-screen snap-start bg-black"
		>
			{/* [구조 변경] 영상과 우측 버튼 바를 가로로 나란히 배치하는 컨테이너 */}
			<div className="flex items-end gap-4 relative">
				{/* 1. 영상 컨테이너 (relative + overflow-hidden) */}
				<div className="relative h-[85vh] aspect-[9/16] max-h-[800px] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
					{/* [수정] 유튜브 UI를 가리기 위해 iframe을 20% 확대함 */}
					<div className="absolute inset-0 w-full h-full scale-[1.20] transform">
						{movie?.youtube_key && hasEntered ? (
							<button
								type="button" // 명시적으로 버튼 타입 지정
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
					{/* [수정] 일시정지 시에만 중앙 재생 아이콘 노출 */}
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

				{/* 포스터 및 로딩 오버레이 */}
				<AnimatePresence>
					{(!videoStarted || !isVisible) && movie?.youtube_key && (
						<motion.div
							initial={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.6 }} // [수정] 영상 로딩 완료 시 부드럽게 사라짐
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
							{/* [수정] 로딩 로고(스피너)를 제거하고 포스터만 유지하여 깔끔함 강조 */}
						</motion.div>
					)}
				</AnimatePresence>

				{/* 하단 재생바 */}
				<div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
					<div
						className="h-full bg-red-600 transition-all duration-300"
						style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
					/>
				</div>

				{/* 하단 텍스트 정보 */}
				<div className="absolute bottom-0 left-0 w-full p-5 pb-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20">
					<div className="flex items-center gap-2 mb-3 pointer-events-auto">
						<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white text-[10px]">
							M
						</div>
						<span className="font-bold text-white text-sm">{movie.title}</span>
						<button
							type="button"
							className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold ml-2"
						>
							구독
						</button>
					</div>
					<p className="text-xs text-white/90 line-clamp-2 pr-4 pointer-events-auto">
						{movie.overview}
					</p>
				</div>
			</div>

			{/* 2. 우측 버튼 바 (영상 컨테이너 바깥쪽에 위치) */}
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
						{movie.view_count}
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

			{/* [추가] 유튜브 스타일 슬라이딩 댓글창 영역 */}

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
