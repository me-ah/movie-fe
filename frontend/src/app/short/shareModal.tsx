"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { activeMovieAtom, isShareModalOpenAtom } from "@/atoms/setAtoms";

export default function ShareModal() {
	const [isOpen, setIsOpen] = useAtom(isShareModalOpenAtom);
	const [movie] = useAtom(activeMovieAtom);
	const [mounted, setMounted] = useState(false);

	// 클라이언트 사이드 렌더링 확인 (window 객체 사용 때문)
	useEffect(() => {
		setMounted(true);

		// [추가] ESC 키를 눌러 모달을 닫는 접근성 기능
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [setIsOpen]);

	// 모달이 닫혀있거나 아직 마운트 전이면 아무것도 렌더링하지 않음
	if (!isOpen || !mounted) return null;

	// [수정/추가] undefined 방어 코드
	// movie.movie_id가 없을 경우를 대비해 빈 문자열 처리를 합니다.
	const moviePath = movie?.movie_id || "";
	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/short/${moviePath}`
			: "";

	// [수정/추가] 복사 로직 강화 (Clipboard API 에러 해결)
	const copyLink = async () => {
		if (!moviePath) {
			alert("영화 정보를 찾을 수 없습니다.");
			return;
		}

		// [수정] navigator.clipboard 가용성 및 보안 컨텍스트 체크
		// https가 아니거나 특정 브라우저에서 writeText가 없는 경우를 대비합니다.
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(shareUrl);
				alert("링크가 복사되었습니다!");
			} catch (_err) {
				// [추가] API 호출 실패 시 구형 방식(fallback)으로 전환
				fallbackCopyTextToClipboard(shareUrl);
			}
		} else {
			// [추가] API 자체가 없는 환경(HTTP 등)에서 실행되는 대체 로직
			fallbackCopyTextToClipboard(shareUrl);
		}
	};

	// [추가] 구형 브라우저 및 비보안 환경용 복사 함수
	// 텍스트 영역을 임시로 만들어 강제로 복사 명령을 내립니다.
	const fallbackCopyTextToClipboard = (text: string) => {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand("copy");
			alert("링크가 복사되었습니다!");
		} catch (_err) {
			alert("복사에 실패했습니다. 주소를 직접 복사해주세요.");
		}
		document.body.removeChild(textArea);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
					{/* [수정] 애니메이션이 적용된 배경 레이어 */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						role="presentation"
						className="absolute inset-0 bg-black/70"
						onClick={() => setIsOpen(false)}
					/>

					{/* [수정] 애니메이션이 적용된 모달 본체 */}
					<motion.div
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0, y: 20 }}
						className="relative bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-sm text-white shadow-2xl border border-white/10"
					>
						<h3 className="text-xl font-bold mb-6 text-center">공유하기</h3>

						<div className="bg-black/50 p-4 rounded-xl mb-6 text-sm break-all border border-white/5 text-gray-300 select-all">
							{shareUrl}
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={copyLink}
								className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-colors active:scale-95"
							>
								복사
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded-xl font-bold transition-colors active:scale-95"
							>
								닫기
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
