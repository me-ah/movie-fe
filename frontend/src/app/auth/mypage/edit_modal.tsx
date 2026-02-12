"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/api/auth";
import {
	type BackendMyPageResponse,
	getMyPage,
	patchMe,
	withdrawMe,
} from "@/api/user";
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
import { getUser } from "@/lib/userStorage";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: (data: BackendMyPageResponse) => void;
	onWithdraw?: () => void;
};

export default function EditModal({ open, onOpenChange, onSaved }: Props) {
	const [editFirstname, setEditFirstname] = useState("");
	const [editLastname, setEditLastname] = useState("");
	const [editEmail, setEditEmail] = useState("");

	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const userId = useMemo(() => getUser()?.user_id, []);

	useEffect(() => {
		if (!open) return;

		let cancelled = false;

		const load = async () => {
			try {
				setLoading(true);
				setSaveError(null);

				if (!userId) {
					setSaveError("로그인 정보가 없습니다. 다시 로그인해주세요.");
					return;
				}

				const data = await getMyPage({ userid: userId });
				if (cancelled) return;

				setEditFirstname(data.userdata?.firstname ?? "");
				setEditLastname(data.userdata?.lastname ?? "");
				setEditEmail(data.userdata?.useremail ?? "");
			} catch {
				if (!cancelled) setSaveError("유저 정보를 불러오지 못했습니다.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [open, userId]);

	const onCancel = () => onOpenChange(false);

	const onSave = async () => {
		if (!editFirstname.trim() || !editLastname.trim() || !editEmail.trim()) {
			setSaveError("이름/성과 이메일은 필수입니다.");
			return;
		}
		if (!userId) {
			setSaveError("로그인 정보가 없습니다. 다시 로그인해주세요.");
			return;
		}

		try {
			setSaving(true);
			setSaveError(null);

			await patchMe({
				first_name: editFirstname.trim(),
				last_name: editLastname.trim(),
				email: editEmail.trim(),
			});

			const data = await getMyPage({ userid: userId });
			onSaved(data);
			onOpenChange(false);
		} catch {
			setSaveError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
		} finally {
			setSaving(false);
		}
	};

	const onWithdrawClick = async () => {
		if (!userId) {
			setSaveError("로그인 정보가 없습니다. 다시 로그인해주세요.");
			return;
		}

		try {
			setSaving(true);
			setSaveError(null);

			await withdrawMe();
			await logout(router);
			onOpenChange(false);
		} catch {
			setSaveError("회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
		} finally {
			setSaving(false);
		}
	};

	const disabled = saving || loading;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[520px] rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100">
				<DialogHeader>
					<DialogTitle className="text-xl">프로필 수정</DialogTitle>
					<DialogDescription className="text-zinc-400">
						이름/성과 이메일을 수정할 수 있습니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="text-sm text-zinc-300">이름</div>
						<Input
							value={editFirstname}
							onChange={(e) => setEditFirstname(e.target.value)}
							disabled={disabled}
							className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
							placeholder="이름"
						/>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-zinc-300">성</div>
						<Input
							value={editLastname}
							onChange={(e) => setEditLastname(e.target.value)}
							disabled={disabled}
							className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
							placeholder="성"
						/>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-zinc-300">이메일</div>
						<Input
							value={editEmail}
							onChange={(e) => setEditEmail(e.target.value)}
							disabled={disabled}
							className="h-11 rounded-xl bg-zinc-900/60 border-zinc-800"
							placeholder="email@example.com"
							type="email"
						/>
					</div>

					{saveError && <p className="text-sm text-red-400">{saveError}</p>}
				</div>

				<DialogFooter className="flex items-center justify-between mt-5">
					<Button
						type="button"
						variant="secondary"
						onClick={onWithdrawClick}
						disabled={disabled}
						className="rounded-xl bg-red-500 text-white border border-red-600 hover:bg-red-600"
					>
						회원탈퇴
					</Button>

					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="secondary"
							onClick={onCancel}
							disabled={disabled}
							className="rounded-xl bg-white text-black border border-zinc-300 hover:bg-gray-200"
						>
							취소
						</Button>

						<Button
							type="button"
							onClick={onSave}
							disabled={disabled}
							className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
						>
							{saving ? "저장 중..." : loading ? "불러오는 중..." : "저장"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
