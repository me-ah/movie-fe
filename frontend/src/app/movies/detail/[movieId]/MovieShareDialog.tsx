"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	movieId: string;
};

export default function MovieShareDialog({
	open,
	onOpenChange,
	movieId,
}: Props) {
	const shareUrl = useMemo(() => {
		if (typeof window === "undefined") return "";
		// ✅ 영화 상세 라우트에 맞게 수정 (네가 실제 쓰는 라우트로)
		// 예: /movies/[id] 라면 `/movies/${movieId}`
		return `${window.location.origin}/movies/${movieId}`;
	}, [movieId]);

	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!open) setCopied(false);
	}, [open]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
		} catch {
			// clipboard가 막힌 환경 fallback
			const ta = document.createElement("textarea");
			ta.value = shareUrl;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopied(true);
		}
	};

	const handleNativeShare = async () => {
		try {
			if (!navigator.share) return;
			await navigator.share({
				title: "영화 공유",
				url: shareUrl,
			});
		} catch {
			// 사용자가 취소한 경우 등은 무시
		}
	};

	const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle>공유하기</DialogTitle>
					<DialogDescription className="text-zinc-400">
						링크를 복사해서 공유할 수 있어요.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 break-all">
					{shareUrl}
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					{canNativeShare && (
						<Button
							variant="secondary"
							onClick={handleNativeShare}
							className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
						>
							시스템 공유
						</Button>
					)}

					<Button
						onClick={handleCopy}
						className="bg-blue-500 hover:bg-blue-600"
					>
						{copied ? "복사됨" : "링크 복사"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
