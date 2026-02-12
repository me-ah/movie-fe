"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { activeMovieAtom, isShareModalOpenAtom } from "@/atoms/setAtoms";

export default function ShareModal() {
	const [isOpen, setIsOpen] = useAtom(isShareModalOpenAtom);
	const [movie] = useAtom(activeMovieAtom);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [setIsOpen]);

	if (!isOpen || !mounted) return null;

	const moviePath = movie?.movie_id || "";
	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/short/${moviePath}`
			: "";

	const copyLink = async () => {
		if (!moviePath) {
			alert("영화 정보를 찾을 수 없습니다.");
			return;
		}

		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(shareUrl);
				alert("링크가 복사되었습니다!");
			} catch (_err) {
				fallbackCopyTextToClipboard(shareUrl);
			}
		} else {
			fallbackCopyTextToClipboard(shareUrl);
		}
	};

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
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						role="presentation"
						className="absolute inset-0 bg-black/70"
						onClick={() => setIsOpen(false)}
					/>

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
