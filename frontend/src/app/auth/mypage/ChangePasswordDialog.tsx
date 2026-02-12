"use client";

import axios from "axios";
import { useState } from "react";
import { changePassword } from "@/api/auth";
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
import { Label } from "@/components/ui/label";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
	const [oldPw, setOldPw] = useState("");
	const [newPw, setNewPw] = useState("");
	const [newPw2, setNewPw2] = useState("");

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState<string | null>(null);

	const reset = () => {
		setOldPw("");
		setNewPw("");
		setNewPw2("");
		setSaving(false);
		setError(null);
		setOk(null);
	};

	const handleClose = (v: boolean) => {
		onOpenChange(v);
		if (!v) reset();
	};

	const onSubmit = async () => {
		setError(null);
		setOk(null);

		if (!oldPw || !newPw || !newPw2) {
			setError("모든 항목을 입력해 주세요.");
			return;
		}
		if (newPw !== newPw2) {
			setError("새 비밀번호 확인이 일치하지 않습니다.");
			return;
		}

		try {
			setSaving(true);
			await changePassword({
				old_password: oldPw,
				new_password: newPw,
				new_password_confirm: newPw2,
			});
			setOk("비밀번호가 변경되었습니다.");
			setTimeout(() => handleClose(false), 600);
		} catch (e: unknown) {
			let msg = "비밀번호 변경에 실패했습니다.";

			if (axios.isAxiosError(e)) {
				const data = e.response?.data;

				if (typeof data === "string") {
					msg = data;
				} else if (data && typeof data === "object") {
					const d = data as Record<string, unknown>;

					if (typeof d.detail === "string") msg = d.detail;
					else if (typeof d.message === "string") msg = d.message;
					else {
						const parts: string[] = [];
						for (const [k, v] of Object.entries(d)) {
							if (typeof v === "string") parts.push(`${k}: ${v}`);
							else if (Array.isArray(v)) {
								const first = v.find((x) => typeof x === "string");
								if (typeof first === "string") parts.push(`${k}: ${first}`);
							}
						}
						if (parts.length) msg = parts.join(" / ");
					}
				}
			} else if (e instanceof Error) {
				msg = e.message;
			}

			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	// ✅ return은 컴포넌트에서!
	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md border border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle>비밀번호 변경</DialogTitle>
					<DialogDescription className="text-zinc-400">
						현재 비밀번호와 새 비밀번호를 입력해 주세요.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="oldPw" className="text-zinc-300">
							현재 비밀번호
						</Label>
						<Input
							id="oldPw"
							type="password"
							value={oldPw}
							onChange={(e) => setOldPw(e.target.value)}
							className="border-zinc-800 bg-zinc-900/50 text-zinc-100"
							autoComplete="current-password"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="newPw" className="text-zinc-300">
							새 비밀번호
						</Label>
						<Input
							id="newPw"
							type="password"
							value={newPw}
							onChange={(e) => setNewPw(e.target.value)}
							className="border-zinc-800 bg-zinc-900/50 text-zinc-100"
							autoComplete="new-password"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="newPw2" className="text-zinc-300">
							새 비밀번호 확인
						</Label>
						<Input
							id="newPw2"
							type="password"
							value={newPw2}
							onChange={(e) => setNewPw2(e.target.value)}
							className="border-zinc-800 bg-zinc-900/50 text-zinc-100"
							autoComplete="new-password"
						/>
					</div>

					{error ? <p className="text-sm text-red-300">{error}</p> : null}
					{ok ? <p className="text-sm text-emerald-300">{ok}</p> : null}
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button
						type="button"
						variant="secondary"
						onClick={() => handleClose(false)}
						className="border text-zinc-300 border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
						disabled={saving}
					>
						취소
					</Button>
					<Button
						type="button"
						onClick={onSubmit}
						className="bg-blue-600 hover:bg-blue-500"
						disabled={saving}
					>
						{saving ? "변경 중..." : "변경하기"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
