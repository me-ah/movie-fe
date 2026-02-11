"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ShareDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	postId: string;
};

export default function ShareDialog({
	open,
	onOpenChange,
	postId,
}: ShareDialogProps) {
	const [shareUrl, setShareUrl] = useState("");

	useEffect(() => {
		if (!open) return;
		if (typeof window === "undefined") return;
		setShareUrl(`${window.location.origin}/community/${postId}`);
	}, [open, postId]);

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			onOpenChange(false);
		} catch (e) {
			console.error(e);
			alert("링크 복사에 실패했습니다. 주소를 직접 복사해 주세요.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">공유</DialogTitle>
					<DialogDescription className="text-zinc-400">
						링크를 복사해서 공유할 수 있어요.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-2 flex items-center gap-2">
					<Input
						value={shareUrl}
						readOnly
						className="border-zinc-800 bg-zinc-900/40 text-zinc-100"
					/>
					<Button
						type="button"
						onClick={handleCopyLink}
						className="bg-blue-500 hover:bg-blue-600"
						disabled={!shareUrl}
					>
						복사
					</Button>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => onOpenChange(false)}
						className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
					>
						닫기
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
